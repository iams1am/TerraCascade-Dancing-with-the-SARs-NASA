"use client";

import { useEffect, useState } from "react";

type SnapshotData = {
  event: {
    location: string;
    projection: string;
  };
  observations: {
    measurement: {
      name: string;
      units: string;
      statistics: {
        valid_pixel_count: number;
      };
    };
    quality: {
      valid_pixel_ratio: number;
    };
    observation_pair: {
      temporal_baseline_days: number;
    };
  };
};

export function HomeSnapshot() {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
      load("/data/observations.json")
    ]).then(([event, observations]) => {
      if (cancelled) return;
      setData({ event, observations });
    }).catch((reason: unknown) => {
      if (cancelled) return;
      setError(reason instanceof Error ? reason.message : "Unable to load project snapshot.");
    });
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  if (error) {
    return (
      <div className="data-state data-state-error snapshot-state" role="alert">
        <span className="data-state-mark">!</span>
        <div>
          <strong>The sample summary could not be loaded</strong>
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
      <div className="data-state data-state-loading snapshot-state" role="status" aria-live="polite">
        <span className="data-state-spinner" />
        <div>
          <strong>Loading the sample summary</strong>
          <p>Reading the prepared project files.</p>
        </div>
      </div>
    );
  }

  const { event, observations } = data;
  const cards = [
    {
      label: "OBSERVED LAYER",
      value: observations.measurement.name,
      detail: `${observations.measurement.units} · ${event.projection}`,
      className: "snapshot-cyan"
    },
    {
      label: "TEMPORAL PAIR",
      value: `${observations.observation_pair.temporal_baseline_days} days`,
      detail: "Time between the reference and secondary acquisitions",
      className: "snapshot-blue"
    },
    {
      label: "QUALITY COVERAGE",
      value: `${(observations.quality.valid_pixel_ratio * 100).toFixed(1)}%`,
      detail: "Pixels kept after quality screening",
      className: "snapshot-lime"
    },
    {
      label: "VALID PIXELS",
      value: observations.measurement.statistics.valid_pixel_count.toLocaleString(),
      detail: event.location,
      className: "snapshot-amber"
    }
  ];

  return (
    <section className="signal-overview" aria-label="Verified project snapshot">
      <div className="section-heading snapshot-heading">
        <div>
          <div className="kicker">CURRENT SAMPLE / TC001</div>
          <h2>A quick look at the data in this demo.</h2>
        </div>
        <p>
          These values all come from the same prepared sample record. Open the
          Explorer to see the imagery, quality checks, and source details.
        </p>
      </div>
      <div className="snapshot-grid">
        {cards.map((card) => (
          <article className={`snapshot-card ${card.className}`} key={card.label}>
            <div className="snapshot-label">{card.label}</div>
            <strong>{card.value}</strong>
            <span>{card.detail}</span>
          </article>
        ))}
      </div>
      <div className="snapshot-foot">
        <span><i className="status-dot" /> Historical NASA/ASF sample GUNW product</span>
        <span>Values are shown in their original scientific units</span>
      </div>
    </section>
  );
}
