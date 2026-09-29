"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page">
      <div className="shell">
        <SiteHeader />
        <main className="page-main" id="main-content">
          <div className="route-state route-error" role="alert">
            <span className="data-state-mark">!</span>
            <div>
              <div className="kicker">TERRACASCADE</div>
              <h1>Something went wrong.</h1>
              <p>
                This page could not be loaded. You can try again or return to
                the home page.
              </p>
              <div className="actions">
                <button className="button button-primary" type="button" onClick={() => reset()}>
                  Try again
                </button>
                <Link className="button" href="/">Return to home</Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
