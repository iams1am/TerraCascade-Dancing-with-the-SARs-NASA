"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const TEXTURE_URL =
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";

export function GlobeScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [paused, setPaused] = useState(false);
  const [textureStatus, setTextureStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    camera.position.set(0, 0.08, 3.15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive contextual Earth. Use arrow keys to rotate and plus or minus to zoom."
    );
    mount.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    scene.add(globe);

    const fallback = new THREE.MeshBasicMaterial({ color: 0x19516a });
    const earth = new THREE.Mesh<
      THREE.SphereGeometry,
      THREE.MeshBasicMaterial | THREE.MeshPhongMaterial
    >(new THREE.SphereGeometry(1, 96, 96), fallback);
    globe.add(earth);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    let disposed = false;
    let loadedTexture: THREE.Texture | null = null;
    let loadedMaterial: THREE.MeshPhongMaterial | null = null;
    textureLoader.load(
      TEXTURE_URL,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        loadedTexture = texture;
        loadedMaterial = new THREE.MeshPhongMaterial({
          map: texture,
          shininess: 8,
          specular: new THREE.Color(0x123344)
        });
        earth.material = loadedMaterial;
        setTextureStatus("ready");
      },
      undefined,
      () => {
        if (!disposed) setTextureStatus("fallback");
      }
    );

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.045, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x65d7ed,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide
      })
    );
    globe.add(atmosphere);

    const locator = new THREE.Group();
    locator.visible = false;
    const locatorDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xc6ed9d })
    );
    const locatorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.052, 0.006, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x8ae8ee, transparent: true, opacity: 0.9 })
    );
    locatorRing.rotation.x = Math.PI / 2;
    locator.add(locatorDot, locatorRing);
    globe.add(locator);

    fetch("/data/event.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((event: { center?: { latitude: number; longitude: number } } | null) => {
        if (!event?.center) return;
        const latitude = THREE.MathUtils.degToRad(event.center.latitude);
        const longitude = THREE.MathUtils.degToRad(event.center.longitude);
        locator.position.set(
          Math.cos(latitude) * Math.cos(longitude),
          Math.sin(latitude),
          Math.cos(latitude) * Math.sin(longitude)
        ).multiplyScalar(1.065);
        const locatorX = Math.cos(latitude) * Math.cos(longitude);
        const locatorZ = Math.cos(latitude) * Math.sin(longitude);
        globe.rotation.y = Math.atan2(-locatorX, locatorZ);
        locator.visible = true;
      })
      .catch(() => undefined);

    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0x8ae8ee,
      transparent: true,
      opacity: 0.2
    });
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 100 }, (_, index) => {
          const angle = (index / 100) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(angle) * 1.25, Math.sin(angle) * 1.25, 0);
        })
      ),
      ringMaterial
    );
    ring.rotation.set(0.9, 0.15, -0.35);
    globe.add(ring);

    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(700 * 3);
    for (let index = 0; index < starPositions.length; index += 3) {
      const radius = 5 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[index] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[index + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[index + 2] = radius * Math.cos(phi);
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({ color: 0x9adbe2, size: 0.012, transparent: true, opacity: 0.7 })
    );
    scene.add(stars);

    scene.add(new THREE.AmbientLight(0x9fd4df, 1.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 2, 4);
    scene.add(keyLight);

    let width = 0;
    let height = 0;
    const resize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      globe.rotation.y += (event.clientX - previousX) * 0.006;
      globe.rotation.x = THREE.MathUtils.clamp(
        globe.rotation.x + (event.clientY - previousY) * 0.004,
        -0.55,
        0.55
      );
      previousX = event.clientX;
      previousY = event.clientY;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(
        camera.position.z + event.deltaY * 0.0015,
        2.25,
        4.4
      );
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        globe.rotation.y += event.key === "ArrowLeft" ? -0.08 : 0.08;
        event.preventDefault();
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        globe.rotation.x = THREE.MathUtils.clamp(
          globe.rotation.x + (event.key === "ArrowUp" ? -0.06 : 0.06),
          -0.55,
          0.55
        );
        event.preventDefault();
      } else if (event.key === "+" || event.key === "=" || event.key === "-" || event.key === "_") {
        camera.position.z = THREE.MathUtils.clamp(
          camera.position.z + (event.key === "-" || event.key === "_" ? 0.18 : -0.18),
          2.25,
          4.4
        );
        event.preventDefault();
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("keydown", onKeyDown);
    resetRef.current = () => {
      globe.rotation.set(0, 0, 0);
      camera.position.set(0, 0.08, 3.15);
    };

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!pausedRef.current && !dragging) globe.rotation.y += 0.0019;
      stars.rotation.y -= 0.00012;
      if (locator.visible) {
        const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.12;
        locatorRing.scale.setScalar(pulse);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("keydown", onKeyDown);
      resetRef.current = null;
      renderer.dispose();
      earth.geometry.dispose();
      (earth.material as THREE.Material).dispose();
      if (earth.material !== fallback) fallback.dispose();
      loadedTexture?.dispose();
      atmosphere.geometry.dispose();
      (atmosphere.material as THREE.Material).dispose();
      locatorDot.geometry.dispose();
      (locatorDot.material as THREE.Material).dispose();
      locatorRing.geometry.dispose();
      (locatorRing.material as THREE.Material).dispose();
      ring.geometry.dispose();
      ringMaterial.dispose();
      starsGeometry.dispose();
      (stars.material as THREE.Material).dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="globe-canvas" ref={mountRef} aria-label="Interactive contextual 3D Earth">
      <span className={`globe-data-status globe-data-${textureStatus}`} role="status" aria-live="polite">
          {textureStatus === "loading" ? "Loading the Earth view" : textureStatus === "ready" ? "Earth view ready" : "Earth imagery unavailable · showing fallback"}
      </span>
      <div className="globe-actions" role="group" aria-label="Earth view controls">
        <button className="icon-button" type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume rotation" : "Pause rotation"}>
          {paused ? "▶" : "Ⅱ"}
        </button>
        <button className="icon-button" type="button" onClick={() => resetRef.current?.()} aria-label="Reset globe view">
          ↺
        </button>
      </div>
    </div>
  );
}
