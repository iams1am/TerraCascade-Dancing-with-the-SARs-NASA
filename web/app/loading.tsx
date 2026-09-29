import { SiteHeader } from "../components/SiteHeader";

export default function Loading() {
  return (
    <div className="page">
      <div className="shell">
        <SiteHeader />
        <main className="page-main" id="main-content" aria-busy="true">
          <div className="route-state route-loading" role="status" aria-live="polite">
            <span className="data-state-spinner" />
            <div>
              <div className="kicker">TERRACASCADE</div>
              <h1>Loading the project data.</h1>
              <p>This should only take a moment.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
