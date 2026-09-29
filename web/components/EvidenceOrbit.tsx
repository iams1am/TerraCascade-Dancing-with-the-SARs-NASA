"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const nodes = [
  { id: "observed", label: "OBSERVED", color: 0x8ae8ee, detail: "Values read directly from the GUNW phase and coherence layers." },
  { id: "derived", label: "DERIVED", color: 0x5db4ff, detail: "Results calculated from the source data, such as quality coverage." },
  { id: "contextual", label: "CONTEXTUAL", color: 0xf2c67b, detail: "Location and map information used to orient the sample." },
  { id: "potential", label: "POTENTIAL", color: 0xc6ed9d, detail: "A question that needs more data before it can be answered." }
];

export function EvidenceOrbit() {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef("observed");
  const [active, setActive] = useState("observed");

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 5.2;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.68, 3),
      new THREE.MeshBasicMaterial({ color: 0x153f53, wireframe: true, transparent: true, opacity: 0.8 }),
    );
    group.add(core);

    const orbit = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 96 }, (_, index) => {
          const angle = (index / 96) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(angle) * 1.75, Math.sin(angle) * 0.68, 0);
        }),
      ),
      new THREE.LineBasicMaterial({ color: 0x6b9aa8, transparent: true, opacity: 0.35 }),
    );
    orbit.rotation.x = 0.35;
    group.add(orbit);

    const nodeMeshes = nodes.map((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 20, 20),
        new THREE.MeshBasicMaterial({ color: node.color }),
      );
      mesh.position.set(Math.cos(angle) * 1.75, Math.sin(angle) * 0.68, 0);
      group.add(mesh);
      return mesh;
    });

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
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
      group.rotation.y += (event.clientX - previousX) * 0.007;
      group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + (event.clientY - previousY) * 0.004, -0.7, 0.7);
      previousX = event.clientX;
      previousY = event.clientY;
    };
    const onPointerUp = () => { dragging = false; };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!dragging) group.rotation.z += 0.0015;
      nodeMeshes.forEach((mesh, index) => {
        const scale = nodes[index].id === activeRef.current ? 1.45 : 1;
        mesh.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.08);
      });
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      core.geometry.dispose();
      (core.material as THREE.Material).dispose();
      orbit.geometry.dispose();
      (orbit.material as THREE.Material).dispose();
      nodeMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  const selected = nodes.find((node) => node.id === active) ?? nodes[0];
  return (
    <div className="evidence-orbit">
      <div className="orbit-canvas" ref={mountRef} aria-label="Interactive 3D evidence orbit" />
      <div className="orbit-copy">
        <div className={`evidence-tag tag-${selected.id}`}>{selected.label}</div>
        <h3>What this label means.</h3>
        <p>{selected.detail}</p>
        <div className="orbit-controls" role="group" aria-label="Evidence classes">
          {nodes.map((node) => (
            <button
              className={active === node.id ? "active" : ""}
              aria-pressed={active === node.id}
              key={node.id}
              type="button"
              onClick={() => setActive(node.id)}
            >
              {node.label}
            </button>
          ))}
        </div>
        <span className="orbit-hint">Drag to rotate · select a label to read its definition</span>
      </div>
    </div>
  );
}
