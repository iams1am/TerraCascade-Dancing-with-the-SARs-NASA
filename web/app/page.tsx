import Link from "next/link";
import { GlobeScene } from "../components/GlobeScene";
import { HomeSnapshot } from "../components/HomeSnapshot";
import { SiteHeader } from "../components/SiteHeader";

const evidence = [
  ["OBSERVED", "From the source product", "Values read directly from the documented satellite product.", "tag-observed"],
  ["DERIVED", "Calculated in this project", "Results produced from the source values using a stated method.", "tag-derived"],
  ["CONTEXTUAL", "Used for orientation", "Maps and location information that help place the radar data.", "tag-contextual"],
  ["POTENTIAL", "Needs more evidence", "Questions that cannot be answered from this sample alone.", "tag-potential"]
];

export default function HomePage() {
  return (
    <div className="page">
      <div className="shell">
        <SiteHeader />
        <main id="main-content">
          <section className="hero">
            <div>
              <div className="eyebrow">NASA SPACE APPS CHALLENGE 2026 · DANCING WITH THE SARS</div>
              <h1>Explore radar data.<br /><span>Keep the science clear.</span></h1>
              <p className="lede">
                TerraCascade helps people explore a documented radar sample
                without losing sight of where the data came from, how it was
                processed, or what it cannot prove.
              </p>
              <div className="actions">
                <Link className="button button-primary" href="/explore">Open the explorer <span aria-hidden>↗</span></Link>
                <Link className="button" href="/methodology">How it works</Link>
              </div>
              <div className="proof-row">
                <span className="proof"><span className="proof-dot" /> Built around NISAR data</span>
                <span className="proof"><span className="proof-dot" /> Sources and limits included</span>
              </div>
            </div>
            <div className="globe-card">
              <div className="globe-meta">
                <span className="globe-label">CONTEXTUAL EARTH VIEW</span>
                <span className="live-pill">INTERACTIVE</span>
              </div>
              <GlobeScene />
              <div className="globe-footer">
                <div>
                  <h2 className="globe-foot-title">Start with the location.</h2>
                  <p className="globe-foot-copy">Drag to rotate · scroll to zoom · pause to inspect. This globe provides context; it is not a NISAR measurement.</p>
                </div>
                <div className="globe-control" aria-hidden>
                  <span className="icon-button">↕</span>
                  <span className="icon-button">⌕</span>
                </div>
              </div>
            </div>
          </section>

          <HomeSnapshot />

          <section className="section">
            <div className="section-heading">
              <div>
                <div className="kicker">HOW TO READ THE PROJECT</div>
                <h2>Know what each part of the display means.</h2>
              </div>
              <p>We separate source values, project calculations, map context, and questions that need more data.</p>
            </div>
            <div className="evidence-grid">
              {evidence.map(([tag, title, copy, className]) => (
                <article className="evidence-card" key={tag}>
                  <div className={`evidence-tag ${className}`}>{tag}</div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section product-section">
            <div className="section-heading">
              <div>
                <div className="kicker">EXPLORE THE PROJECT</div>
                <h2>See the data, the method, and the limits.</h2>
              </div>
              <p>
                Open the sample, review its quality, and check how every
                browser-ready asset was produced.
              </p>
            </div>
            <div className="product-grid">
              <article className="product-card product-card-featured">
                <span className="product-index">01</span>
                <div>
                  <div className="evidence-tag tag-observed">OBSERVED</div>
                  <h3>View the radar layer</h3>
                  <p>Explore phase and coherence from the selected GUNW sample region.</p>
                </div>
                <Link href="/explore" className="text-link">Open the explorer ↗</Link>
              </article>
              <article className="product-card">
                <span className="product-index">02</span>
                <div>
                  <div className="evidence-tag tag-derived">DERIVED</div>
                  <h3>Check the processing</h3>
                  <p>Review the masks, units, coordinates, and time information used to prepare the demo.</p>
                </div>
                <Link href="/methodology" className="text-link">Read methodology ↗</Link>
              </article>
              <article className="product-card">
                <span className="product-index">03</span>
                <div>
                  <div className="evidence-tag tag-potential">POTENTIAL</div>
                  <h3>See what is still missing</h3>
                  <p>Follow the evidence graph to see which questions need additional products or validation.</p>
                </div>
                <Link href="/about" className="text-link">See the project ↗</Link>
              </article>
            </div>
          </section>
        </main>
        <footer className="footer">
          <div className="footer-inner">
            <span>TerraCascade / NASA Space Apps Challenge 2026</span>
            <span>Sample radar data · processing notes · source links</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
