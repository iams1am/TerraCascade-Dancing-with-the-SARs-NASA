"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type SurfaceData = {
  rows: number;
  columns: number;
  phase: Array<number | null>;
  coherence: Array<number | null>;
  phase_min: number;
  phase_max: number;
  phase_units: string;
};

type DisplayMode = "phase" | "coherence";

function colorFor(value: number, mode: DisplayMode) {
  if (mode === "coherence") {
    return new THREE.Color().setHSL(0.08 + value * 0.11, 0.78, 0.38 + value * 0.28);
  }
  return new THREE.Color().setHSL(0.7 - value * 0.7, 0.75, 0.42 + value * 0.18);
}

export function SarSurface() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<DisplayMode>("phase");
  const [surface, setSurface] = useState<SurfaceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/surface.json")
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load SAR surface (${response.status})`);
        return response.json() as Promise<SurfaceData>;
      })
      .then((value) => {
        if (!cancelled) setSurface(value);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Unable to load SAR surface.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !surface) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 1.35, 3.65);
    camera.lookAt(0, 0.28, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D SAR surface. Use arrow keys to rotate and plus or minus to zoom."
    );
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    for (let index = 0; index < surface.phase.length; index += 1) {
      const row = Math.floor(index / surface.columns);
      const column = index % surface.columns;
      const value = mode === "phase" ? surface.phase[index] : surface.coherence[index];
      if (value === null) continue;
      const normalized = mode === "phase"
        ? (value - surface.phase_min) / Math.max(surface.phase_max - surface.phase_min, 0.0001)
        : value;
      positions.push(
        (column / Math.max(surface.columns - 1, 1) - 0.5) * 3.15,
        0.04 + normalized * 0.95,
        (row / Math.max(surface.rows - 1, 1) - 0.5) * 2.35,
      );
      const color = colorFor(normalized, mode);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ size: 0.085, vertexColors: true, transparent: true, opacity: 0.96 }),
    );
    scene.add(points);

    const grid = new THREE.GridHelper(3.2, 12, 0x6daeb8, 0x234553);
    grid.position.y = 0;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.45;
    scene.add(grid);
    scene.add(new THREE.AmbientLight(0xa8e9ee, 2));

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
      points.rotation.y += (event.clientX - previousX) * 0.008;
      points.rotation.x = THREE.MathUtils.clamp(
        points.rotation.x + (event.clientY - previousY) * 0.005,
        -0.65,
        0.65,
      );
      previousX = event.clientX;
      previousY = event.clientY;
    };
    const onPointerUp = () => { dragging = false; };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.0015, 2.35, 5);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        points.rotation.y += event.key === "ArrowLeft" ? -0.08 : 0.08;
        event.preventDefault();
      } else if (event.key === "+" || event.key === "=" || event.key === "-" || event.key === "_") {
        camera.position.z = THREE.MathUtils.clamp(
          camera.position.z + (event.key === "-" || event.key === "_" ? 0.2 : -0.2),
          2.35,
          5
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

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!dragging) points.rotation.y += 0.0012;
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
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("keydown", onKeyDown);
      geometry.dispose();
      (points.material as THREE.Material).dispose();
      (grid.material as THREE.Material).dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [surface, mode]);

  if (error) {
    return (
      <div className="data-state data-state-error surface-state" role="alert">
        <span className="data-state-mark">!</span>
        <div>
          <strong>The 3D view could not be loaded</strong>
          <p>{error}</p>
          <button type="button" className="state-retry" onClick={() => {
            setError(null);
            setSurface(null);
            setRetryCount((value) => value + 1);
          }}>Try again</button>
        </div>
      </div>
    );
  }
  if (!surface) {
    return (
      <div className="data-state data-state-loading surface-state" role="status" aria-live="polite">
        <span className="data-state-spinner" />
        <div>
          <strong>Loading the 3D data view</strong>
          <p>Preparing the sampled phase and coherence values.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sar-surface-shell">
      <div className="surface-toolbar">
        <div>
          <div className="kicker">3D VIEW / PHASE AND COHERENCE</div>
          <strong>{mode === "phase" ? "Relative unwrapped phase surface" : "Coherence quality surface"}</strong>
        </div>
        <div className="surface-switcher" role="group" aria-label="3D surface layer">
          <button className={mode === "phase" ? "active" : ""} aria-pressed={mode === "phase"} type="button" onClick={() => setMode("phase")}>PHASE</button>
          <button className={mode === "coherence" ? "active" : ""} aria-pressed={mode === "coherence"} type="button" onClick={() => setMode("coherence")}>COHERENCE</button>
        </div>
      </div>
      <div className="sar-surface-canvas" ref={mountRef} aria-label="Interactive 3D SAR surface visualization" />
      <div className="surface-legend">
        <span>Drag or use arrow keys to rotate · scroll or + / − to zoom</span>
        <span>{mode === "phase" ? `${surface.phase_min.toFixed(2)} to ${surface.phase_max.toFixed(2)} ${surface.phase_units}` : "0.00 to 1.00 unitless"}</span>
      </div>
      <p className="surface-note">
        Height is used only to make the values easier to inspect. It does not
        represent displacement or terrain.
      </p>
    </div>
  );
}
