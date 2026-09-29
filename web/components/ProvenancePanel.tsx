type Provenance = {
  mission: string;
  product: string;
  processing_level: string;
  observation: {
    reference: string;
    secondary: string;
    temporal_baseline_days: number;
  };
  source_product: string;
  source_url: string;
  download_date: string;
  processing: string[];
  units: {
    measurement: string;
    coordinates: string;
    coherence: string;
  };
  limitations: string[];
};

export function ProvenancePanel({ provenance }: { provenance: Provenance }) {
  return (
    <section className="explorer-section provenance-section">
      <div className="section-heading compact">
        <div>
          <div className="kicker">SOURCE AND PROCESSING DETAILS</div>
          <h2>Where these numbers came from.</h2>
        </div>
        <p>Use this section to check the product, dates, units, processing steps, and known limitations.</p>
      </div>
      <div className="provenance-grid">
        <div className="provenance-card">
          <div className="provenance-label">MISSION</div>
          <strong>{provenance.mission}</strong>
          <div className="provenance-label">PRODUCT</div>
          <strong>{provenance.product} · {provenance.processing_level}</strong>
          <div className="provenance-label">OBSERVATION</div>
          <strong>{provenance.observation.reference.slice(0, 10)} → {provenance.observation.secondary.slice(0, 10)}</strong>
          <span>{provenance.observation.temporal_baseline_days} day temporal baseline</span>
        </div>
        <div className="provenance-card">
          <div className="provenance-label">WHAT TERRACASCADE DID</div>
          <ol className="processing-list">
            {provenance.processing.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
        <div className="provenance-card">
          <div className="provenance-label">UNITS</div>
          <div className="unit-row"><span>Measurement</span><strong>{provenance.units.measurement}</strong></div>
          <div className="unit-row"><span>Coordinates</span><strong>{provenance.units.coordinates}</strong></div>
          <div className="unit-row"><span>Coherence</span><strong>{provenance.units.coherence}</strong></div>
          <div className="provenance-label source-label">SOURCE</div>
          <a className="source-link" href={provenance.source_url} target="_blank" rel="noreferrer" aria-label="Open the NASA/ASF source product in a new tab">Open NASA/ASF product ↗</a>
          <span>Downloaded {provenance.download_date}</span>
        </div>
      </div>
      <div className="limitation-strip">
        <div className="provenance-label">LIMITATIONS</div>
        <ul>{provenance.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
      </div>
      <div className="provenance-actions" aria-label="Record assets">
        <div>
          <div className="provenance-label">DOWNLOAD THE PREPARED FILES</div>
          <strong>Open the data used by this page.</strong>
        </div>
        <div className="provenance-links">
          <a href="/data/observations.json" target="_blank" rel="noreferrer">Observation JSON ↗</a>
          <a href="/data/footprint.geojson" target="_blank" rel="noreferrer">Footprint GeoJSON ↗</a>
          <a href="/data/provenance.json" target="_blank" rel="noreferrer">Processing metadata ↗</a>
        </div>
      </div>
      <details className="source-details provenance-file">
        <summary>Show source product identifier</summary>
        <code>{provenance.source_product}</code>
      </details>
    </section>
  );
}
