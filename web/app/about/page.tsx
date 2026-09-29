import { SiteHeader } from "../../components/SiteHeader";
import { EvidenceOrbit } from "../../components/EvidenceOrbit";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="page">
      <div className="shell">
        <SiteHeader active="about" />
        <main className="page-main" id="main-content">
          <div className="kicker">ABOUT THE PROJECT</div>
          <h1 className="page-title">Why we built TerraCascade.</h1>
          <p className="page-copy">TerraCascade is our entry for the NASA Space Apps Challenge 2026, built for the Dancing with the SARs challenge. We started with one documented radar sample and focused on making it easier to explore without overstating what it shows.</p>
          <div className="workspace" style={{ marginTop: 54 }}>
            <section className="workspace-panel">
              <div className="kicker">MISSION</div>
              <h2>Make radar data easier to understand.</h2>
              <p>We want people to see the radar layer, check its quality, and understand the difference between a measured value and an interpretation.</p>
              <div className="about-visual mission-visual" aria-hidden="true">
                <svg viewBox="0 0 560 220" role="presentation">
                  <defs>
                    <linearGradient id="radarSweep" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="var(--cyan)" stopOpacity="0.62" />
                      <stop offset="1" stopColor="var(--cyan)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g className="radar-grid" transform="translate(112 110)">
                    <circle r="82" />
                    <circle r="55" />
                    <circle r="28" />
                    <path d="M0 0 L76 -31 A82 82 0 0 1 79 21 Z" fill="url(#radarSweep)" />
                    <line x1="-82" y1="0" x2="82" y2="0" />
                    <line x1="0" y1="-82" x2="0" y2="82" />
                    <circle className="radar-blip" cx="38" cy="-29" r="4" />
                    <circle className="radar-blip radar-blip-soft" cx="-45" cy="32" r="3" />
                  </g>
                  <path className="visual-flow" d="M207 110 H284" />
                  <path className="visual-flow-head" d="M276 102 L286 110 L276 118" />
                  <g className="signal-readout">
                    <path d="M316 159 V118 H346 V159" />
                    <path d="M363 159 V82 H393 V159" />
                    <path d="M410 159 V103 H440 V159" />
                    <path d="M457 159 V55 H487 V159" />
                    <line x1="306" y1="159" x2="500" y2="159" />
                  </g>
                  <text x="72" y="207">RADAR ECHO</text>
                  <text x="357" y="207">READABLE SIGNAL</text>
                </svg>
              </div>
            </section>
            <section className="workspace-panel">
              <div className="kicker">CHALLENGE</div>
              <h2>Dancing with the SARs</h2>
              <p>Our challenge is to help more people work with synthetic aperture radar data. TerraCascade presents the sample, its processing, and its limits in one place.</p>
              <div className="about-visual challenge-visual" aria-hidden="true">
                <svg viewBox="0 0 420 220" role="presentation">
                  <path className="orbit orbit-a" d="M26 65 C120 8 298 8 394 65" />
                  <path className="orbit orbit-b" d="M26 92 C128 36 294 36 394 92" />
                  <g className="satellite satellite-a" transform="translate(118 27)">
                    <rect x="-10" y="-7" width="20" height="14" rx="2" />
                    <path d="M-34 -5 H-13 V5 H-34 Z M13 -5 H34 V5 H13 Z" />
                  </g>
                  <g className="satellite satellite-b" transform="translate(295 54)">
                    <rect x="-10" y="-7" width="20" height="14" rx="2" />
                    <path d="M-34 -5 H-13 V5 H-34 Z M13 -5 H34 V5 H13 Z" />
                  </g>
                  <path className="sar-beam beam-a" d="M118 38 L154 164 L223 164 Z" />
                  <path className="sar-beam beam-b" d="M295 65 L207 164 L276 164 Z" />
                  <path className="earth-arc" d="M34 178 Q210 129 386 178" />
                  <g className="phase-lines">
                    <path d="M69 183 Q90 168 111 183 T153 183 T195 183 T237 183 T279 183 T321 183 T363 183" />
                    <path d="M82 196 Q103 181 124 196 T166 196 T208 196 T250 196 T292 196 T334 196" />
                  </g>
                  <text x="82" y="19">PASS A</text>
                  <text x="302" y="47">PASS B</text>
                  <text x="165" y="216">INTERFEROMETRIC PAIR</text>
                </svg>
              </div>
            </section>
          </div>
          <section className="scope-grid" aria-label="Project scope">
            <article className="scope-card">
              <span className="evidence-tag tag-observed">CURRENT RECORD</span>
              <strong>One GUNW sample pair</strong>
              <p>A selected Southern California region with phase, coherence, masks, and projected coordinates.</p>
            </article>
            <article className="scope-card">
              <span className="evidence-tag tag-derived">WHAT IS DERIVED</span>
              <strong>Quality and location summaries</strong>
              <p>We calculate coverage and coherence summaries, show the acquisition gap, and add a map for orientation.</p>
            </article>
            <article className="scope-card">
              <span className="evidence-tag tag-potential">NEXT STEP</span>
              <strong>Additional compatible products</strong>
              <p>We need more acquisitions and documented conversion parameters before studying persistence or displacement.</p>
            </article>
          </section>
          <section className="section orbit-section" aria-label="Project design principles">
            <div className="section-heading">
              <div><div className="kicker">WHY SOURCES MATTER</div><h2>Every result should be easy to trace.</h2></div>
              <p>The product identifier, dates, units, processing steps, and known limitations stay available as you explore.</p>
            </div>
            <EvidenceOrbit />
          </section>
          <div className="page-cta">
            <div>
              <div className="kicker">TRY THE DEMO</div>
              <strong>Open the sample in the Explorer.</strong>
            </div>
            <Link className="button button-primary" href="/explore">Open the explorer <span aria-hidden>↗</span></Link>
          </div>
        </main>
        <footer className="footer"><div className="footer-inner"><span>TerraCascade / 2026</span><span>Built for the NASA Space Apps Challenge.</span></div></footer>
      </div>
    </div>
  );
}
