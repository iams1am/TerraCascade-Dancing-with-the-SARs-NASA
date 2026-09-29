"use client";

import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { GlobeScene } from "./GlobeScene";
import { ProvenancePanel } from "./ProvenancePanel";
import { SarSurface } from "./SarSurface";

const MapPanel = dynamic(() => import("./MapPanel"), { ssr: false });

type EventData = {
  title: string;
  location: string;
  source_product: string;
  projection: string;
  bounds: { x_min: number; y_min: number; x_max: number; y_max: number };
  center: { latitude: number; longitude: number };
  geographic_bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  context_bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  imagery: string;
  map_overlay: string;
};

type ObservationsData = {
  measurement: {
    name: string;
    units: string;
    statistics: {
      valid_pixel_count: number;
      minimum: number;
      maximum: number;
      median: number;
    };
  };
  quality: {
    coherence: { median: number };
    valid_pixel_ratio: number;
    threshold: number;
  };
  observation_pair: {
    reference: string;
    secondary: string;
    temporal_baseline_days: number;
  };
  imagery: string;
  limitations: string[];
};

type ChangeDna = {
  indicators: Array<{
    name: string;
    value: number;
    display_percent: number | null;
    units: string;
    evidence_level: string;
    calculation: string;
  }>;
  omitted: string[];
};

type Cascade = {
  nodes: Array<{
    id: string;
    label: string;
    evidence: string;
    explanation: string;
    limitation: string;
  }>;
};
type Provenance = ComponentProps<typeof ProvenancePanel>["provenance"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(value));
}

export function ExplorerDashboard() {
  const [data, setData] = useState<{
    event: EventData;
    observations: ObservationsData;
    dna: ChangeDna;
    cascade: Cascade;
    provenance: Provenance;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<"reference" | "secondary">("secondary");

  useEffect(() => {
    let cancelled = false;
    const load = (path: string) =>
      fetch(path).then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load ${path} (${response.status})`);
        }
        return response.json();
      });
    Promise.all([
      load("/data/event.json"),
      load("/data/observations.json"),
      load("/data/change-dna.json"),
      load("/data/cascade.json"),
      load("/data/provenance.json")
    ]).then(([event, observations, dna, cascade, provenance]) => {
      if (cancelled) return;
      setData({ event, observations, dna, cascade, provenance });
      setActiveNode(cascade.nodes[0]?.id ?? null);
    }).catch((reason: unknown) => {
      if (cancelled) return;
      setError(reason instanceof Error ? reason.message : "Unable to load observation assets.");
    });
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  if (error) {
    return (
      <div className="data-state data-state-error" role="alert">
        <span className="data-state-mark">!</span>
        <div>
          <strong>The sample data could not be loaded</strong>
          <p>{error}</p>
          <button type="button" className="state-retry" onClick={() => {
            setError(null);
            setData(null);
            setRetryCount((value) => value + 1);
          }}>Try again</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="data-state data-state-loading" role="status" aria-live="polite">
        <span className="data-state-spinner" />
        <div>
          <strong>Loading the sample data</strong>
          <p>Reading the prepared files and source information.</p>
        </div>
      </div>
    );
  }

  const { event, observations, dna, cascade, provenance } = data;
  const activeCascadeNode = cascade.nodes.find((node) => node.id === activeNode);
  const phaseStats = observations.measurement.statistics;
  const quality = observations.quality;
  const selectedDate = selectedObservation === "reference"
    ? observations.observation_pair.reference
    : observations.observation_pair.secondary;

  return (
    <div className="explorer-content">
      <div className="explorer-record-bar">
        <div>
          <span className="record-pulse" />
          <strong>TC001 / SAMPLE RECORD</strong>
        </div>
        <span>Historical NASA/ASF sample · prepared for this demo</span>
      </div>
      <div className="record-context" aria-label="Observation record context">
        <div>
          <span>ACQUISITION WINDOW</span>
          <strong>{formatDate(observations.observation_pair.reference)} <small>→</small> {formatDate(observations.observation_pair.secondary)}</strong>
        </div>
        <div>
          <span>TEMPORAL BASELINE</span>
          <strong>{observations.observation_pair.temporal_baseline_days} days</strong>
        </div>
        <div>
          <span>QUALITY GATE</span>
          <strong>Coherence ≥ {quality.threshold.toFixed(2)}</strong>
        </div>
        <div>
          <span>DISPLAY UNITS</span>
          <strong>{observations.measurement.units} · {event.projection}</strong>
        </div>
      </div>
      <MapPanel
        center={event.center}
        location={event.location}
        projection={event.projection}
        imagery={event.map_overlay}
        geographicBounds={event.geographic_bounds}
        contextBounds={event.context_bounds}
      />
      <section className="scientific-grid">
        <div className="scientific-visual">
          <div className="visual-header">
            <div>
              <div className="kicker">OBSERVED / GUNW PHASE + COHERENCE</div>
              <h2>{event.title}</h2>
            </div>
            <span className="evidence-tag tag-observed">OBSERVED</span>
          </div>
          <figure className="scientific-figure">
            <div className="image-frame">
            <Image
              src={observations.imagery}
              alt={`Filtered ${observations.measurement.name} and coherence preview for ${event.location}`}
              width={1200}
              height={620}
              unoptimized
            />
            </div>
            <div className="visual-key" aria-label="Scientific preview reading key">
              <span><b className="key-index">01</b> Unwrapped phase · radians</span>
              <span><b className="key-index">02</b> Coherence · unitless</span>
              <span className="key-muted">Masked pixels omitted</span>
            </div>
            <figcaption className="visual-caption">
              <span>NASA/ASF GUNW sample · {event.projection}</span>
              <span>AOI: projected coordinates in metres</span>
            </figcaption>
          </figure>
        </div>
        <aside className="scientific-side">
          <div className="kicker">SAMPLE REGION</div>
          <h2>{event.location}</h2>
          <div className="metric-list">
            <div className="metric-row"><span>Observed layer</span><strong>{observations.measurement.name}</strong></div>
            <div className="metric-row"><span>Median value</span><strong>{observations.measurement.statistics.median.toFixed(3)} {observations.measurement.units}</strong></div>
            <div className="metric-row"><span>Valid pixels</span><strong>{observations.measurement.statistics.valid_pixel_count.toLocaleString()}</strong></div>
            <div className="metric-row"><span>Temporal pair</span><strong>{observations.observation_pair.temporal_baseline_days} days</strong></div>
            <div className="metric-row"><span>Footprint center</span><strong>{event.center.latitude.toFixed(3)}°, {event.center.longitude.toFixed(3)}°</strong></div>
          </div>
          <div className="notice">
            <span className="notice-mark">i</span>
            <p>This layer shows unwrapped phase in radians. It has not been converted to displacement.</p>
          </div>
          <details className="source-details">
            <summary>Show source product</summary>
            <code>{event.source_product}</code>
          </details>
        </aside>
      </section>

      <section className="readout-grid" aria-label="Scientific readout">
        <article className="readout-card">
          <span className="readout-label">PHASE RANGE / OBSERVED</span>
          <strong>{phaseStats.minimum.toFixed(2)} <small>to</small> {phaseStats.maximum.toFixed(2)}</strong>
          <p>{observations.measurement.units} across quality-screened pixels</p>
        </article>
        <article className="readout-card">
          <span className="readout-label">COHERENCE / OBSERVED</span>
          <strong>{quality.coherence.median.toFixed(3)}</strong>
          <p>Median coherence magnitude · threshold {quality.threshold.toFixed(2)}</p>
        </article>
        <article className="readout-card">
          <span className="readout-label">COVERAGE / DERIVED</span>
          <strong>{(quality.valid_pixel_ratio * 100).toFixed(1)}<small>%</small></strong>
          <p>Valid pixels retained after the documented mask</p>
        </article>
        <article className="readout-card">
          <span className="readout-label">NEXT EVIDENCE / POTENTIAL</span>
          <strong>More pairs</strong>
          <p>More compatible interferograms are needed to study change over time.</p>
        </article>
      </section>

      <section className="context-view explorer-section">
        <div className="context-copy">
          <div className="kicker">MAP CONTEXT</div>
          <h2>See where the sample is located.</h2>
          <p>
            The globe helps you find the sample on Earth. It is a navigation
            view, not a NISAR measurement surface.
          </p>
          <div className="context-facts">
            <div><span>FOOTPRINT CENTER</span><strong>{event.center.latitude.toFixed(3)}° N / {Math.abs(event.center.longitude).toFixed(3)}° W</strong></div>
            <div><span>PROJECTED GRID</span><strong>{event.projection}</strong></div>
            <div><span>ROLE IN THIS PRODUCT</span><strong>Contextual navigation only</strong></div>
          </div>
        </div>
        <div className="context-globe">
          <div className="context-globe-label">INTERACTIVE EARTH / DRAG TO ROTATE</div>
          <GlobeScene />
        </div>
      </section>

      <section className="explorer-section sar-surface-section">
        <div className="section-heading compact">
          <div><div className="kicker">3D DATA VIEW</div><h2>Explore phase and coherence from another angle.</h2></div>
          <p>Rotate the sample and switch between phase and coherence. Height is used only to make patterns easier to inspect.</p>
        </div>
        <SarSurface />
      </section>

      <section className="explorer-section">
        <div className="section-heading compact">
          <div><div className="kicker">ACQUISITION DATES</div><h2>Two dates, one interferogram.</h2></div>
          <p>The dates show when the two source acquisitions occurred. One pair does not show a long-term trend.</p>
        </div>
        <div className="timeline">
          <div className="timeline-line" />
          {[
            ["reference", observations.observation_pair.reference, "Reference acquisition"],
            ["secondary", observations.observation_pair.secondary, "Secondary acquisition"]
          ].map(([id, date, role]) => (
            <button
              className={`timeline-item ${selectedObservation === id ? "selected" : ""}`}
              aria-pressed={selectedObservation === id}
              key={id}
              type="button"
              onClick={() => setSelectedObservation(id as "reference" | "secondary")}
            >
              <span className="timeline-dot" />
              <span className="timeline-date">{formatDate(date)}</span>
              <strong>{role}</strong>
            </button>
          ))}
        </div>
        <div className="timeline-selection">
          <span className="evidence-tag tag-observed">PAIR FOCUS</span>
          <strong>{formatDate(selectedDate)} / {selectedObservation === "reference" ? "reference acquisition" : "secondary acquisition"}</strong>
          <p>The raster represents the pair. Choosing a date only changes which acquisition is highlighted.</p>
        </div>
      </section>

      <section className="explorer-section">
        <div className="section-heading compact">
          <div><div className="kicker">SAMPLE SUMMARY</div><h2>Simple indicators, shown separately.</h2></div>
          <p>Each indicator has its own meaning and source. We do not combine them into a risk score.</p>
        </div>
        <div className="dna-grid">
          {dna.indicators.map((indicator) => (
            <article className="dna-card" key={indicator.name}>
              <div className="dna-card-head"><span>{indicator.name}</span><b>{indicator.display_percent === null ? `${indicator.value} ${indicator.units}` : `${indicator.display_percent}%`}</b></div>
              {indicator.display_percent !== null && <div className="signal-track"><span style={{ width: `${indicator.display_percent}%` }} /></div>}
              <p>{indicator.calculation}</p>
              <span className="evidence-tag tag-derived">{indicator.evidence_level}</span>
            </article>
          ))}
        </div>
        <div className="omitted-note"><strong>Intentionally omitted:</strong> {dna.omitted.join(" ")}</div>
      </section>

      <section className="explorer-section">
        <div className="section-heading compact">
          <div><div className="kicker">EVIDENCE GRAPH</div><h2>How the evidence connects.</h2></div>
          <p>Select a step to see what supports it and what remains uncertain.</p>
        </div>
        <div className="cascade-layout">
          <div className="cascade-rail">
            {cascade.nodes.map((node, index) => (
              <button className={`cascade-node ${activeNode === node.id ? "active" : ""}`} aria-pressed={activeNode === node.id} key={node.id} type="button" onClick={() => setActiveNode(node.id)}>
                <span className={`cascade-number cascade-${node.evidence.toLowerCase()}`}>{String(index + 1).padStart(2, "0")}</span>
                <span><b>{node.label}</b><small>{node.evidence}</small></span>
              </button>
            ))}
          </div>
          <div className="cascade-detail">
            {activeCascadeNode ? (
              <>
                <div className={`evidence-tag tag-${activeCascadeNode.evidence.toLowerCase()}`}>{activeCascadeNode.evidence}</div>
                <h3>{activeCascadeNode.label}</h3>
                <p>{activeCascadeNode.explanation}</p>
                <div className="detail-line"><span>Limitation</span><strong>{activeCascadeNode.limitation}</strong></div>
              </>
            ) : (
              <><div className="evidence-tag tag-contextual">EVIDENCE GRAPH</div><h3>Select a step</h3><p>You will see its source, explanation, and limitation here.</p></>
            )}
          </div>
        </div>
      </section>
      <ProvenancePanel provenance={provenance} />
    </div>
  );
}
