"use client";

/* NASA GIBS imagery is intentionally rendered as a regular image so the map
 * has no third-party initialization or teardown lifecycle. */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Bounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

type MapPanelProps = {
  center: { latitude: number; longitude: number };
  location: string;
  projection: string;
  imagery: string;
  geographicBounds: Bounds;
  contextBounds: Bounds;
};

type ViewportSize = {
  width: number;
  height: number;
};

const WORLD_BOUNDS: Bounds = { south: -85, west: -180, north: 85, east: 180 };
const MIN_ZOOM = 0.45;

function percentagePosition(bounds: Bounds, longitude: number, latitude: number) {
  return {
    left: `${((longitude - bounds.west) / (bounds.east - bounds.west)) * 100}%`,
    top: `${(1 - (latitude - bounds.south) / (bounds.north - bounds.south)) * 100}%`,
  };
}

function fitImage(bounds: Bounds, viewport: ViewportSize) {
  const aspect = (bounds.east - bounds.west) / Math.max(bounds.north - bounds.south, 0.001);
  const width = Math.max(viewport.width, viewport.height * aspect);
  const height = Math.max(viewport.height, viewport.width / aspect);
  return {
    aspect,
    width,
    height,
    left: (viewport.width - width) / 2,
    top: (viewport.height - height) / 2,
  };
}

function buildMapUrl(bounds: Bounds, aspect: number) {
  const query = new URLSearchParams({
    SERVICE: "WMS",
    REQUEST: "GetMap",
    VERSION: "1.3.0",
    LAYERS: "BlueMarble_ShadedRelief",
    STYLES: "",
    CRS: "EPSG:4326",
    BBOX: `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`,
    WIDTH: "2200",
    HEIGHT: Math.max(800, Math.round(2200 / aspect)).toString(),
    FORMAT: "image/jpeg",
    TIME: "2004-01-01",
  });
  return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?${query.toString()}`;
}

export default function MapPanel({
  center,
  location,
  projection,
  imagery,
  geographicBounds,
  contextBounds,
}: MapPanelProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scienceVisible, setScienceVisible] = useState(false);
  const [opacity, setOpacity] = useState(0.72);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState<ViewportSize>({ width: 1600, height: 440 });
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [worldReady, setWorldReady] = useState(false);
  const [detailReady, setDetailReady] = useState(false);
  const [worldError, setWorldError] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [assetAttempt, setAssetAttempt] = useState(0);
  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const didDragRef = useRef(false);

  useEffect(() => {
    zoomRef.current = zoom;
    offsetRef.current = offset;
  }, [offset, zoom]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const updateSize = () => setViewport({ width: element.clientWidth, height: element.clientHeight });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const worldImage = fitImage(WORLD_BOUNDS, viewport);
  const detailImage = fitImage(contextBounds, viewport);
  const worldUrl = useMemo(() => buildMapUrl(WORLD_BOUNDS, worldImage.aspect), [worldImage.aspect]);
  const detailUrl = useMemo(() => buildMapUrl(contextBounds, detailImage.aspect), [contextBounds, detailImage.aspect]);
  const detailScale = Math.max(1, zoom);
  const detailOpacity = zoom >= 1 ? 1 : 0;
  const worldMode = zoom < 1;

  useEffect(() => {
    setWorldReady(false);
    setDetailReady(false);
    setWorldError(false);
    setDetailError(false);
  }, [worldUrl, detailUrl, assetAttempt]);

  const marker = percentagePosition(contextBounds, center.longitude, center.latitude);
  const overlayTopLeft = percentagePosition(contextBounds, geographicBounds.west, geographicBounds.north);
  const overlayStyle = {
    ...overlayTopLeft,
    width: `${((geographicBounds.east - geographicBounds.west) / (contextBounds.east - contextBounds.west)) * 100}%`,
    height: `${((geographicBounds.north - geographicBounds.south) / (contextBounds.north - contextBounds.south)) * 100}%`,
  };
  const worldMarker = percentagePosition(WORLD_BOUNDS, center.longitude, center.latitude);
  const worldOverlayTopLeft = percentagePosition(WORLD_BOUNDS, geographicBounds.west, geographicBounds.north);
  const worldOverlayStyle = {
    ...worldOverlayTopLeft,
    width: `${((geographicBounds.east - geographicBounds.west) / (WORLD_BOUNDS.east - WORLD_BOUNDS.west)) * 100}%`,
    height: `${((geographicBounds.north - geographicBounds.south) / (WORLD_BOUNDS.north - WORLD_BOUNDS.south)) * 100}%`,
  };
  const selectedDetailMarker = selectedLocation
    ? percentagePosition(contextBounds, selectedLocation.longitude, selectedLocation.latitude)
    : null;
  const selectedWorldMarker = selectedLocation
    ? percentagePosition(WORLD_BOUNDS, selectedLocation.longitude, selectedLocation.latitude)
    : null;

  const clampOffset = useCallback((x: number, y: number, nextZoom: number) => {
    const isWorldView = nextZoom < 1;
    const coverageWidth = isWorldView ? worldImage.width : detailImage.width * nextZoom;
    const coverageHeight = isWorldView ? worldImage.height : detailImage.height * nextZoom;
    const maxX = Math.max(0, (coverageWidth - viewport.width) / 2);
    const maxY = Math.max(0, (coverageHeight - viewport.height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, [
    detailImage.height,
    detailImage.width,
    viewport.height,
    viewport.width,
    worldImage.height,
    worldImage.width,
  ]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const currentZoom = zoomRef.current;
      const nextZoom = Math.min(2.4, Math.max(MIN_ZOOM, currentZoom - event.deltaY * 0.001));
      const bounds = element.getBoundingClientRect();
      const cursorX = event.clientX - bounds.left - viewport.width / 2;
      const cursorY = event.clientY - bounds.top - viewport.height / 2;
      const currentScale = currentZoom < 1 ? 1 : currentZoom;
      const nextScale = nextZoom < 1 ? 1 : nextZoom;
      const ratio = nextScale / currentScale;
      const currentOffset = offsetRef.current;
      const nextOffset = clampOffset(
        nextZoom < 1 ? 0 : currentOffset.x - cursorX * (ratio - 1),
        nextZoom < 1 ? 0 : currentOffset.y - cursorY * (ratio - 1),
        nextZoom,
      );
      zoomRef.current = nextZoom;
      offsetRef.current = nextOffset;
      setZoom(nextZoom);
      setOffset(nextOffset);
    };
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [clampOffset, viewport.height, viewport.width]);

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) didDragRef.current = true;
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    const nextOffset = clampOffset(offsetRef.current.x + deltaX, offsetRef.current.y + deltaY, zoomRef.current);
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  };
  const endDrag = () => {
    dragRef.current.active = false;
  };
  const resetView = () => {
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSelectedLocation(null);
  };
  const selectLocation = (event: React.MouseEvent<HTMLDivElement>) => {
    if (didDragRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (worldMode) {
      const longitude = WORLD_BOUNDS.west + (x - worldImage.left) / worldImage.width * (WORLD_BOUNDS.east - WORLD_BOUNDS.west);
      const latitude = WORLD_BOUNDS.north - (y - worldImage.top) / worldImage.height * (WORLD_BOUNDS.north - WORLD_BOUNDS.south);
      if (longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90) {
        setSelectedLocation({ latitude, longitude });
      }
      return;
    }
    const imageX = (x - viewport.width / 2 - offset.x) / detailScale + viewport.width / 2;
    const imageY = (y - viewport.height / 2 - offset.y) / detailScale + viewport.height / 2;
    const longitude = contextBounds.west + (imageX - detailImage.left) / detailImage.width * (contextBounds.east - contextBounds.west);
    const latitude = contextBounds.north - (imageY - detailImage.top) / detailImage.height * (contextBounds.north - contextBounds.south);
    if (longitude >= contextBounds.west && longitude <= contextBounds.east && latitude >= contextBounds.south && latitude <= contextBounds.north) {
      setSelectedLocation({ latitude, longitude });
    }
  };
  const adjustZoom = (delta: number) => {
    const currentZoom = zoomRef.current;
    const nextZoom = Math.min(2.4, Math.max(MIN_ZOOM, currentZoom + delta));
    const nextOffset = nextZoom < 1
      ? { x: 0, y: 0 }
      : clampOffset(offsetRef.current.x, offsetRef.current.y, nextZoom);
    zoomRef.current = nextZoom;
    offsetRef.current = nextOffset;
    setZoom(nextZoom);
    setOffset(nextOffset);
  };
  const handleMapKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const panStep = 42;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      adjustZoom(0.15);
      return;
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      adjustZoom(-0.15);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      resetView();
      return;
    }
    const pan = {
      ArrowLeft: { x: panStep, y: 0 },
      ArrowRight: { x: -panStep, y: 0 },
      ArrowUp: { x: 0, y: panStep },
      ArrowDown: { x: 0, y: -panStep }
    }[event.key];
    if (!pan || zoomRef.current < 1) return;
    event.preventDefault();
    const nextOffset = clampOffset(
      offsetRef.current.x + pan.x,
      offsetRef.current.y + pan.y,
      zoomRef.current
    );
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  };
  const retryImagery = () => {
    setWorldReady(false);
    setDetailReady(false);
    setWorldError(false);
    setDetailError(false);
    setAssetAttempt((value) => value + 1);
  };
  const mapAssetError = worldError || (!worldMode && detailError);
  const mapAssetLoading = !mapAssetError && (!worldReady || (!worldMode && !detailReady));

  return (
    <div className="map-panel-shell">
      <div className="map-panel-toolbar">
        <div>
          <div className="kicker">MAP CONTEXT / NASA GIBS</div>
          <strong>{location}</strong>
        </div>
        <div className="map-controls">
          <div className="map-zoom-controls" role="group" aria-label="Map zoom controls">
            <button
              className="map-zoom-button"
              type="button"
              aria-label="Zoom out"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => adjustZoom(-0.15)}
            >
              −
            </button>
            <span aria-live="polite">{zoom.toFixed(2)}×</span>
            <button
              className="map-zoom-button"
              type="button"
              aria-label="Zoom in"
              disabled={zoom >= 2.4}
              onClick={() => adjustZoom(0.15)}
            >
              +
            </button>
          </div>
          <button type="button" aria-pressed={scienceVisible} onClick={() => setScienceVisible((current) => !current)}>
            {scienceVisible ? "HIDE RADAR LAYER" : "SHOW RADAR LAYER"}
          </button>
          <button type="button" onClick={resetView}>RESET VIEW</button>
        </div>
      </div>
      <div
        className="map-viewport"
        ref={viewportRef}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={selectLocation}
        onKeyDown={handleMapKeyDown}
        role="group"
        aria-label={`Interactive NASA geographic context map of ${location}. Drag to pan, scroll or use plus and minus to zoom, use arrow keys to pan, and click to select a contextual coordinate. Press Home to reset.`}
        aria-busy={mapAssetLoading}
        tabIndex={0}
      >
        <div className="map-world-surface" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
          <img
            className="map-world-image"
            src={worldUrl}
            alt="NASA Blue Marble full world overview"
            style={{ left: worldImage.left, top: worldImage.top, width: worldImage.width, height: worldImage.height }}
            key={`world-${assetAttempt}`}
            onLoad={() => setWorldReady(true)}
            onError={() => setWorldError(true)}
            draggable={false}
          />
          <div
            className="map-footprint map-world-footprint"
            style={{
              left: worldImage.left + worldImage.width * parseFloat(worldOverlayStyle.left) / 100,
              top: worldImage.top + worldImage.height * parseFloat(worldOverlayStyle.top) / 100,
              width: worldImage.width * parseFloat(worldOverlayStyle.width) / 100,
              height: worldImage.height * parseFloat(worldOverlayStyle.height) / 100,
            }}
          />
          <span className="map-marker map-world-marker" style={{ left: worldImage.left + worldImage.width * parseFloat(worldMarker.left) / 100, top: worldImage.top + worldImage.height * parseFloat(worldMarker.top) / 100 }}>
            <span /><b>TC001</b>
          </span>
          {selectedWorldMarker && (
            <span className="map-selected-marker" style={{ left: worldImage.left + worldImage.width * parseFloat(selectedWorldMarker.left) / 100, top: worldImage.top + worldImage.height * parseFloat(selectedWorldMarker.top) / 100 }}>
              <span /><b>SELECTED</b>
            </span>
          )}
        </div>
        <div
          className="map-surface"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${detailScale})`, opacity: detailOpacity }}
        >
          <img className="map-basemap" src={detailUrl} alt="NASA Blue Marble detailed basemap" style={{ left: detailImage.left, top: detailImage.top, width: detailImage.width, height: detailImage.height }} key={`detail-${assetAttempt}`} onLoad={() => setDetailReady(true)} onError={() => setDetailError(true)} draggable={false} />
          {scienceVisible && <img className="map-scientific-raster" src={imagery} alt="Source-derived GUNW phase overlay" style={{ ...overlayStyle, opacity }} draggable={false} />}
          <div className="map-footprint" style={overlayStyle} aria-hidden />
          <span className="map-marker" style={marker}><span /><b>TC001</b></span>
          {selectedDetailMarker && <span className="map-selected-marker" style={{ left: detailImage.width * parseFloat(selectedDetailMarker.left) / 100, top: detailImage.height * parseFloat(selectedDetailMarker.top) / 100 }}><span /><b>SELECTED</b></span>}
        </div>
        <div className="map-scale-label">
          <span>{worldMode ? "NASA BLUE MARBLE / WORLD OVERVIEW" : "NASA BLUE MARBLE / 2004"}</span>
          <span>{worldMode ? "FULL EARTH MAP · ZOOM IN FOR AOI" : `${projection} CONTEXT + AOI BOUNDS`}</span>
        </div>
        {mapAssetError ? (
          <div className="map-asset-state map-asset-error" role="alert">
            <strong>NASA basemap unavailable</strong>
            <span>The map could not be loaded. The sample data is still available below.</span>
            <button type="button" onClick={retryImagery}>Try the map again</button>
          </div>
        ) : mapAssetLoading ? (
          <div className="map-asset-state" role="status" aria-live="polite">
            <span className="data-state-spinner" />
            <span>Loading the NASA basemap…</span>
          </div>
        ) : null}
      </div>
      <div className="map-panel-footer">
        <span><i className="status-dot" /> Sample footprint and center point</span>
        <a className="map-attribution" href="https://gibs.earthdata.nasa.gov/" target="_blank" rel="noreferrer">NASA GIBS imagery ↗</a>
        <label className="map-opacity">
          <span>RASTER {Math.round(opacity * 100)}%</span>
          <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} aria-label="Scientific raster opacity" />
        </label>
        <span aria-live="polite">{selectedLocation ? `Selected ${selectedLocation.latitude.toFixed(3)}° · ${selectedLocation.longitude.toFixed(3)}°` : "Click to choose a location · drag to pan · scroll or + / − to zoom"}</span>
      </div>
    </div>
  );
}
