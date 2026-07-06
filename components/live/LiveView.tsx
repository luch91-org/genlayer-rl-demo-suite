"use client";

/*
 * Live mode: read the deployed contract's current state straight from GenLayer,
 * in the browser, at the moment you open the tab. This is the real chain, not a
 * fixture. On-chain reads are slow and can fail, so the view has explicit
 * loading, error, and retry states and never pretends a stale value is fresh.
 */

import { useCallback, useEffect, useState } from "react";
import type { Manifest } from "@/lib/manifest";
import { readLiveState, type LiveState } from "@/lib/live";
import { useManifest } from "@/lib/store";
import { getStateRenderer } from "@/components/state/registry";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; data: LiveState }
  | { kind: "error"; message: string };

export function LiveView({ domainId }: { domainId: string }) {
  const result = useManifest(domainId);
  if (result === null) return <p className="mono muted">Loading manifest...</p>;
  if (!result.ok) {
    return (
      <div className="error-card mono">
        <strong>{domainId}</strong>: {result.error}
      </div>
    );
  }
  return <LiveBody manifest={result.manifest} domainId={domainId} />;
}

function LiveBody({ manifest, domainId }: { manifest: Manifest; domainId: string }) {
  const { contract } = manifest;
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const StateRenderer = getStateRenderer(domainId);

  const read = useCallback(() => {
    setStatus({ kind: "loading" });
    readLiveState(contract.address, contract.chain)
      .then((data) => setStatus({ kind: "ok", data }))
      .catch((e: unknown) =>
        setStatus({ kind: "error", message: e instanceof Error ? e.message : String(e) }),
      );
  }, [contract.address, contract.chain]);

  // Read once when the tab opens; the user can refresh from there.
  useEffect(() => {
    read();
  }, [read]);

  return (
    <div>
      <h1 className="display" style={{ marginBottom: 2 }}>
        Live contract state
      </h1>
      <p className="muted" style={{ marginTop: 0, maxWidth: 720 }}>
        Read directly from the deployed contract on {contract.chain} when you opened this tab. This
        is the current on-chain state left by the last recorded action, not a saved fixture.
      </p>

      <div className="toolbar" style={{ marginTop: 12 }}>
        <span className="chip">contract {shortAddr(contract.address)}</span>
        <span className="chip">{contract.chain}</span>
        {contract.explorer && (
          <a className="chip" href={contract.explorer} target="_blank" rel="noreferrer">
            explorer
          </a>
        )}
        <button
          type="button"
          className="navbtn"
          onClick={read}
          disabled={status.kind === "loading"}
          style={{ marginLeft: "auto" }}
        >
          {status.kind === "loading" ? "Reading..." : "Refresh"}
        </button>
      </div>

      {status.kind === "loading" && (
        <div className="panel">
          <p className="mono muted" style={{ margin: 0 }}>
            Reading the chain. On-chain reads can take a few seconds.
          </p>
        </div>
      )}

      {status.kind === "error" && (
        <div className="error-card mono">
          <strong>Live read failed.</strong> {status.message}
          <div style={{ marginTop: 8 }}>
            <button type="button" className="navbtn" onClick={read}>
              Try again
            </button>
          </div>
        </div>
      )}

      {status.kind === "ok" && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 14 }}>
            <div className="stat">
              <div className="stat-label">Cumulative score</div>
              <div className="readout-lg">
                {status.data.score !== null ? (status.data.score / 100).toFixed(2) : "n/a"}
              </div>
              <div className="mono muted" style={{ fontSize: 12, marginTop: 4 }}>
                {status.data.score !== null ? `raw get_score ${status.data.score}` : "get_score unavailable"}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Read at</div>
              <div className="mono" style={{ fontSize: 15, marginTop: 6 }}>
                {new Date(status.data.readAt).toLocaleTimeString()}
              </div>
              <div className="mono muted" style={{ fontSize: 12, marginTop: 4 }}>
                live from {contract.chain}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="stat-label">get_state()</div>
            <StateRenderer state={status.data.state} which="after" />
          </div>
        </div>
      )}
    </div>
  );
}

function shortAddr(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
