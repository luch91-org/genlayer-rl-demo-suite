"use client";

/*
 * The domain instrument panel: one screen for one agent. Run and episode live
 * in the URL (?run=&ep=) so a run is linkable; the step index and playback are
 * local so the timeline scrubs and plays smoothly. Top band is World State
 * (left) and the Judge (right); below is the step timeline with transport, then
 * the step readout, the policy inspector, and the on-chain consensus summary.
 *
 * World State follows the global Replay / Live mode: Replay shows the selected
 * step's recorded state, Live reads the deployed contract now. The Judge always
 * reflects the currently selected step, so scrubbing never leaves it stale.
 *
 * useSearchParams forces a client bail-out under static export, so the reader is
 * wrapped in its own Suspense boundary here.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { judgeConsensus, stepCount } from "@/lib/adapters";
import { readLiveState, type LiveState } from "@/lib/live";
import type { Manifest, Run, Step } from "@/lib/manifest";
import { narrateStep } from "@/lib/narrate";
import { resolveSelection, selectionFromParams } from "@/lib/select";
import { useManifest, useMode } from "@/lib/store";
import { JudgeGauge } from "@/components/JudgeGauge";
import { Narration } from "@/components/Narration";
import { getStateRenderer } from "@/components/state/registry";
import { ConsensusSummary } from "./ConsensusSummary";
import { EpisodePlayer } from "./EpisodePlayer";
import { InspectDrawer } from "./InspectDrawer";
import { PolicyInspector } from "./PolicyInspector";
import { ViewNav } from "./ViewNav";

export function EpisodeView({ domainId }: { domainId: string }) {
  return (
    <Suspense fallback={<p className="mono muted">Loading run...</p>}>
      <EpisodeInner domainId={domainId} />
    </Suspense>
  );
}

function EpisodeInner({ domainId }: { domainId: string }) {
  const result = useManifest(domainId);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (result === null) {
    return <p className="mono muted">Loading run...</p>;
  }
  if (!result.ok) {
    return (
      <div className="error-card mono">
        <strong>{domainId}</strong>: {result.error}
      </div>
    );
  }
  return (
    <EpisodeBody
      manifest={result.manifest}
      domainId={domainId}
      params={params}
      onNavigate={(runId, ep) => {
        const q = new URLSearchParams();
        if (runId) q.set("run", runId);
        q.set("ep", String(ep));
        router.replace(`${pathname}?${q.toString()}`, { scroll: false });
      }}
    />
  );
}

function EpisodeBody({
  manifest,
  domainId,
  params,
  onNavigate,
}: {
  manifest: Manifest;
  domainId: string;
  params: URLSearchParams;
  onNavigate: (runId: string | undefined, ep: number) => void;
}) {
  const resolved = resolveSelection(manifest, selectionFromParams(domainId, "episode", params));
  const { run, episode } = resolved;
  const { episodeIndex } = resolved.selection;
  const scale = manifest.reward.scale;
  const steps = episode?.steps ?? [];

  const [mode] = useMode();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A fresh run or episode always restarts the timeline from the top.
  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [run?.id, episodeIndex]);

  const idx = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const step = steps[idx];

  // Arrow keys move between steps unless a form control is focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(t.tagName)) return;
      if (e.key === "ArrowRight") setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      else if (e.key === "ArrowLeft") setStepIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps.length]);

  // Live read of the deployed contract, only while the global mode is Live.
  const [live, setLive] = useState<{
    status: "idle" | "loading" | "error";
    msg?: string;
    data?: LiveState;
  }>({ status: "idle" });

  const readLive = useCallback(() => {
    setLive({ status: "loading" });
    readLiveState(manifest.contract.address, manifest.contract.chain)
      .then((data) => setLive({ status: "idle", data }))
      .catch((e: unknown) =>
        setLive({ status: "error", msg: e instanceof Error ? e.message : String(e) }),
      );
  }, [manifest.contract.address, manifest.contract.chain]);

  useEffect(() => {
    if (mode === "live" && live.status === "idle" && !live.data) readLive();
  }, [mode, live.status, live.data, readLive]);

  if (!run) {
    return (
      <div>
        <ViewNav domainId={domainId} view="episode" />
        <h1 className="visually-hidden">{manifest.domain.plain_name} instrument panel</h1>
        <p className="muted">No runs recorded for this domain.</p>
      </div>
    );
  }

  const playerRun: Run = episode ? { ...run, episodes: [episode] } : run;
  const replayState = step?.state_after ?? step?.state_before ?? {};
  const worldState = mode === "live" ? live.data?.state ?? {} : replayState;
  const worldCaption =
    mode === "live"
      ? live.status === "loading"
        ? "reading chain"
        : "live on-chain"
      : `after step ${idx + 1}`;

  const StateRenderer = getStateRenderer(domainId);

  return (
    <div>
      <ViewNav domainId={domainId} view="episode" />
      <h1 className="visually-hidden">{manifest.domain.plain_name} instrument panel</h1>

      <div className="toolbar">
        <label>
          <span className="field-label">Run</span>
          <select className="select" value={run.id} onChange={(e) => onNavigate(e.target.value, 0)}>
            {manifest.runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label} ({r.mode}, {stepCount(r)} steps)
              </option>
            ))}
          </select>
        </label>

        {run.episodes.length > 1 && (
          <label>
            <span className="field-label">Episode</span>
            <select
              className="select"
              value={episodeIndex}
              onChange={(e) => onNavigate(run.id, Number(e.target.value))}
            >
              {run.episodes.map((_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            type="button"
            className="navbtn"
            onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
            disabled={idx <= 0}
            aria-label="Previous step"
          >
            Prev
          </button>
          <button
            type="button"
            className="navbtn"
            onClick={() => setStepIndex((i) => Math.min(i + 1, steps.length - 1))}
            disabled={idx >= steps.length - 1}
            aria-label="Next step"
          >
            Next
          </button>
        </div>
      </div>

      <div className="cr-grid" style={{ marginTop: 12 }}>
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
          {!(mode === "live" && live.status !== "idle") && (
            <StateRenderer state={worldState} which="after" />
          )}
        </section>

        <section className="panel cr-panel">
          <div className="cr-panel-head">
            <span className="cr-panel-title">The Judge - on-chain LLM</span>
            <span className="cr-panel-tag">this step</span>
          </div>
          <JudgePanel step={step} scale={scale} />
        </section>
      </div>

      {steps.length > 0 && (
        <section className="panel cr-player">
          <EpisodePlayer
            run={playerRun}
            scale={scale}
            index={idx}
            onIndex={setStepIndex}
            playing={playing}
            onPlaying={setPlaying}
            speed={speed}
            onSpeed={setSpeed}
            onInspect={() => setDrawerOpen(true)}
          />
        </section>
      )}

      {step && (
        <div style={{ marginTop: 14 }}>
          {step.illustrative && (
            <div className="banner-illustrative">
              <span aria-hidden="true">◆</span>
              <span>
                Illustrative step. One or more fields here are reconstructed for the walkthrough, not
                captured from a live run.
              </span>
            </div>
          )}
          <Narration live text={narrateStep(step, scale, idx, steps.length)} />
          <PolicyInspector step={step} />
          {step.consensus && <ConsensusSummary consensus={step.consensus} domainId={domainId} />}
        </div>
      )}

      <InspectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        step={step}
        domainId={domainId}
        scale={scale}
        contractAddress={manifest.contract.address}
        chain={manifest.contract.chain}
      />
    </div>
  );
}

function JudgePanel({ step, scale }: { step: Step | undefined; scale: [number, number] }) {
  if (!step) {
    return <p className="mono muted">No step selected.</p>;
  }
  const consensus = judgeConsensus(step);
  if (consensus) {
    return <JudgeGauge consensus={consensus} scale={scale} />;
  }
  return (
    <div>
      <p className="mono" style={{ margin: "0 0 8px" }}>
        A fixed rule set this score, so there is no LLM committee to show for this step.
      </p>
      <span className="readout-lg">{step.reward.toFixed(2)}</span>
      <span className="mono muted" style={{ marginLeft: 8, fontSize: 13 }}>
        deterministic reward on {scale[0]} to {scale[1]}
      </span>
    </div>
  );
}
