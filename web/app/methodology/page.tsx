import { SiteHeader } from "../../components/SiteHeader";
import { EvidenceOrbit } from "../../components/EvidenceOrbit";

const steps = [
  ["01", "Inspect the source", "List the product groups, variables, units, coordinates, fill values, and quality layers before interpreting anything."],
  ["02", "Check the data", "Build and review a scientific preview before connecting the product to the website."],
  ["03", "Prepare the website", "Export small files for the browser while keeping their source metadata and evidence labels attached."]
];

const sections = [
  ["01", "What is SAR?", "Synthetic Aperture Radar sends microwave energy toward Earth and measures the returned signal. Unlike optical imagery, radar can operate through cloud and darkness."],
  ["02", "What is NISAR?", "NISAR is a NASA-ISRO mission designed to observe Earth-system change using L-band and S-band radar. TerraCascade uses the mission’s GUNW product format for this verified sample record."],
  ["03", "What is GUNW?", "A Geocoded Unwrapped Interferogram compares radar phase from two acquisitions. This record contains unwrapped phase, coherence, masks, and projected coordinates."],
  ["04", "What measurement is shown?", "The explorer shows unwrapped interferometric phase in radians. It does not label phase as millimetres or displacement because no documented conversion has been applied."],
  ["05", "How was it processed?", "Python reads verified HDF5 paths, applies the product water/subswath mask and a 0.3 coherence threshold, preserves EPSG:32611 coordinates, and exports static assets with metadata."],
  ["06", "How is time represented?", "The reference and secondary acquisitions are shown in order with their 46-day baseline. One pair is not enough to establish persistence, so no values are interpolated."],
  ["07", "What is Change DNA?", "Change DNA contains explainable indicators—quality coverage, coherence, and temporal separation. There is no opaque combined risk score."],
  ["08", "What is Cascade Mode?", "Cascade Mode separates OBSERVED, DERIVED, CONTEXTUAL, and POTENTIAL steps. Each node states its source and limitation so interpretation cannot masquerade as measurement."],
  ["09", "What can TerraCascade not conclude?", "This product alone cannot prove a deformation cause, groundwater extraction, infrastructure damage, future flooding, or an upcoming disaster."],
  ["10", "Where are the sources?", "The explorer’s provenance panel exposes the NASA/ASF product identifier, source link, dates, units, processing steps, quality rule, and known limitations."]
];

export default function MethodologyPage() {
  return (
    <div className="page">
      <div className="shell">
        <SiteHeader active="methodology" />
        <main className="page-main" id="main-content">
          <div className="kicker">HOW THE DEMO WAS BUILT</div>
          <h1 className="page-title">From the source file to the browser.</h1>
          <p className="page-copy">This page explains which product fields we used, how we screened the data, what we exported for the website, and where the current interpretation stops.</p>
          <div className="evidence-grid" style={{ marginTop: 48 }}>
            {steps.map(([number, title, copy]) => (
              <article className="evidence-card" key={number}>
                <div className="evidence-tag tag-observed">{number}</div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
            <article className="evidence-card">
              <div className="evidence-tag tag-potential">BOUNDARY</div>
              <h3>State the limit</h3>
              <p>Radar can show a signal, but this sample alone cannot prove its cause or predict a hazard.</p>
            </article>
          </div>
          <section className="method-grid" aria-label="Methodology sections">
            {sections.map(([number, title, copy]) => (
              <article className="method-card" key={number}>
                <div className="evidence-tag tag-observed">{number}</div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </section>
          <section className="section orbit-section" aria-label="Evidence model">
            <div className="section-heading">
              <div><div className="kicker">EVIDENCE LABELS</div><h2>Four labels used throughout the project.</h2></div>
              <p>Select a label to see whether a value comes from the product, from our processing, from map context, or from a question that still needs evidence.</p>
            </div>
            <EvidenceOrbit />
          </section>
          <section className="section" style={{ marginTop: 72 }}>
            <div className="section-heading">
              <div><div className="kicker">CURRENT DEMO</div><h2>What is ready now.</h2></div>
              <p>We have prepared one NASA/ASF GUNW sample pair for the browser. Displacement and long-term change analysis need additional documented inputs.</p>
            </div>
            <div className="gate">
              <div className="gate-mark">✓</div>
              <div><strong>The sample GUNW layer is ready</strong><span>The Explorer shows unwrapped phase in radians, applies the documented quality mask, and links back to the source product and limitations.</span></div>
            </div>
          </section>
        </main>
        <footer className="footer"><div className="footer-inner"><span>Methodology / TerraCascade</span><span>Observed · Derived · Contextual · Potential</span></div></footer>
      </div>
    </div>
  );
}
