"use client";

/*
 * The control room: the mockup's single-screen view of one agent. World state
 * on the left, the on-chain judge on the right, and the episode player below.
 *
 * REPLAY steps through the trained policy's deterministic rollout, which is the
 * only run carrying full per-step world state. LIVE reads the deployed
 * contract's current state instead. The judge panel always shows the real
 * captured on-chain consensus, which is labelled as such.
 */

import { useCallback, useEffect, useState } from "react";
import { firstConsensusStep } from "@/lib/adapters";
import { readLiveState, type LiveState } from "@/lib/live";
import type { Manifest, Run } from "@/lib/manifest";
import { useManifest } from "@/lib/store";
import { JudgeGauge } from "@/components/JudgeGauge";
import { getStateRenderer } from "@/components/state/registry";
import { EpisodePlayer } from "./EpisodePlayer";

function pickPlayerRun(runs: Run[]): Run | undefined {
  return (
    runs.find((r) => r.id === "policy-rollout") ??
    runs.find((r) => r.mode === "replay") ??
    runs[0]
  );
}

export function ControlRoom({ domainId }: { domainId: string }) {
  const result = useManifest(domainId);
  if (result === null) return <p className="mono muted">Loading agent...</p>;
  if (!result.ok) {
    return (
      <div className="error-card mono">
        <strong>{domainId}</strong>: {result.error}
      </div>
    );
  }
  return <ControlRoomBody manifest={result.manifest} domainId={domainId} />;
}

function ControlRoomBody({ manifest, domainId }: { manifest: Manifest; domainId: string }) {
  const scale = manifest.reward.scale;
  const run = pickPlayerRun(manifest.runs);
  const steps = run?.episodes[0]?.steps ?? [];

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState<"replay" | "live">("replay");
  const [live, setLive] = useState<{ status: "idle" | "loading" | "error"; msg?: string; data?: LiveState }>(
    { status: "idle" },
  );

  const StateRenderer = getStateRenderer(domainId);
  const consensusStep = firstConsensusStep(manifest);
  const step = steps[index];
  const replayState = step?.state_after ?? step?.state_before ?? {};

  const readLive = useCallback(() => {
    setLive({ status: "loading" });
    readLiveState(manifest.contract.address, manifest.contract.chain)
      .then((data) => setLive({ status: "idle", data }))
      .catch((e: unknown) =>
        setLive({ status: "error", msg: e instanceof Error ? e.message : String(e) }),
      );
  }, [manifest.contract.address, manifest.contract.chain]);

  useEffect(() => {
    if (mode === "live" && live.status === "idle" && !live.data) {
      readLive();
    }
  }, [mode, live.status, live.data, readLive]);

  const worldState = mode === "live" ? live.data?.state ?? {} : replayState;
  const worldCaption =
    mode === "live"
      ? live.status === "loading"
        ? "reading chain"
        : "live on-chain"
      : `after step ${index + 1}`;

  return (
    <div>
      <div className="cr-modebar">
        <div className="mode-toggle" role="group" aria-label="Data source">
          <button
            type="button"
            className="mode-btn"
            aria-pressed={mode === "replay"}
            onClick={() => setMode("replay")}
          >
            REPLAY
          </button>
          <button
            type="button"
            className="mode-btn"
            aria-pressed={mode === "live"}
            onClick={() => setMode("live")}
          >
            LIVE
          </button>
        </div>
      </div>

      <div className="cr-grid">
        <section className="panel cr-panel">
          <div className="cr-panel-head">
            <span className="cr-panel-title">World State</span>
            <span className="cr-panel-tag">{worldCaption}</span>
          </div>
          {mode === "live" && live.status === "loading" && (
            <p className="mono muted">Reading the chain. This can take a few seconds.</p>
          )}
          {mode === "live" && live.status === "error" && (
            <div className="error-card mono">
              live read failed: {live.msg}
              <div style={{ marginTop: 8 }}>
                <button type="button" className="navbtn" onClick={readLive}>
                  Try again
                </button>
              </div>
            </div>
          )}
          {!(mode === "live" && live.status !== "idle") && <StateRenderer state={worldState} which="after" />}
        </section>

        <section className="panel cr-panel">
          <div className="cr-panel-head">
            <span className="cr-panel-title">The Judge - on-chain LLM</span>
            <span className="cr-panel-tag">consensus</span>
          </div>
          {consensusStep?.step.consensus ? (
            <JudgeGauge consensus={consensusStep.step.consensus} scale={scale} />
          ) : (
            <p className="mono muted">No on-chain consensus captured for this agent yet.</p>
          )}
        </section>
      </div>

      {mode === "replay" && run && steps.length > 0 && (
        <section className="panel cr-player">
          <EpisodePlayer
            run={run}
            scale={scale}
            index={index}
            onIndex={(i) => {
              setIndex(i);
            }}
            playing={playing}
            onPlaying={setPlaying}
            speed={speed}
            onSpeed={setSpeed}
          />
        </section>
      )}
    </div>
  );
}
