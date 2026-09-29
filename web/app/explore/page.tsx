import Link from "next/link";
import { ExplorerDashboard } from "../../components/ExplorerDashboard";
import { SiteHeader } from "../../components/SiteHeader";

export default function ExplorePage() {
  return (
    <div className="page">
      <div className="shell">
        <SiteHeader active="explore" />
        <main className="page-main" id="main-content">
          <div className="kicker">NISAR SAMPLE DATA EXPLORER</div>
          <h1 className="page-title">Explore the sample record.</h1>
          <p className="page-copy">
            This page brings the sample imagery, quality information,
            acquisition dates, processing notes, and source links together.
          </p>
          <ExplorerDashboard />
          <Link className="back-link" href="/methodology">Review the processing method ↗</Link>
        </main>
        <footer className="footer"><div className="footer-inner"><span>TerraCascade Explorer</span><span>All displayed values come from prepared project assets.</span></div></footer>
      </div>
    </div>
  );
}
