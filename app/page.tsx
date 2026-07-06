"use client";

/*
 * Phase 0 bare page: loads all four manifests, validates them, and lists the
 * loaded domains plus any validation errors. No real UI yet -- this exists to
 * prove the data layer (schema + loader + fixtures) is sound end to end.
 */

import { useEffect, useState } from "react";
import { loadManifests, type LoadResult } from "@/lib/load";

export default function Home() {
  const [results, setResults] = useState<LoadResult[] | null>(null);

  useEffect(() => {
    loadManifests().then(setResults);
  }, []);

  return (
    <main className="wrap">
      <h1 className="display">GenLayer RL Demo Suite</h1>
      <p style={{ color: "var(--ink-soft)" }}>
        Four reinforcement-learning agents that learn human-like judgment from an on-chain LLM
        committee. This page is a data-layer smoke test.
      </p>

      {results === null && <p className="mono">Loading manifests...</p>}

      {results && (
        <>
          <h2>Loaded domains</h2>
          <ul>
            {results
              .filter((r): r is Extract<LoadResult, { ok: true }> => r.ok)
              .map((r) => (
                <li key={r.id} className="panel" style={{ marginBottom: 10 }}>
                  <strong className="display">{r.manifest.domain.plain_name}</strong>{" "}
                  <span style={{ color: "var(--ink-soft)" }}>
                    ({r.manifest.domain.name}) &mdash; {r.manifest.domain.plain_blurb}
                  </span>
                  <div className="mono" style={{ fontSize: 13, marginTop: 6 }}>
                    contract {r.manifest.contract.address.slice(0, 10)}&hellip; on{" "}
                    {r.manifest.contract.chain} &middot; {r.manifest.learning.episodes.length}{" "}
                    training episodes &middot; {r.manifest.runs.length} run(s)
                  </div>
                </li>
              ))}
          </ul>

          {results.some((r) => !r.ok) && (
            <>
              <h2 style={{ color: "var(--red)" }}>Validation errors</h2>
              {results
                .filter((r): r is Extract<LoadResult, { ok: false }> => !r.ok)
                .map((r) => (
                  <div key={r.id} className="error-card mono" style={{ marginBottom: 8 }}>
                    <strong>{r.id}</strong>: {r.error}
                  </div>
                ))}
            </>
          )}
        </>
      )}
    </main>
  );
}
