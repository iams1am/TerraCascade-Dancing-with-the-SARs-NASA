import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";

export default function NotFound() {
  return (
    <div className="page">
      <div className="shell">
        <SiteHeader />
        <main className="page-main" id="main-content">
          <div className="route-state route-error" role="status">
            <span className="data-state-mark">?</span>
            <div>
              <div className="kicker">PAGE NOT FOUND</div>
              <h1>We could not find that page.</h1>
              <p>Use the links below to return to the project.</p>
              <div className="actions">
                <Link className="button button-primary" href="/explore">Open the explorer</Link>
                <Link className="button" href="/">Return to home</Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
