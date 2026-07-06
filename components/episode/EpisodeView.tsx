"use client";

/*
 * Episode view: step through a recorded run. The current run/episode/step live
 * in the URL query (?run=&ep=&step=) so any step is linkable and the back
 * button walks the history. Left/Right arrow keys move between steps.
 *
 * useSearchParams forces a client-side bail-out under static export, so the
 * search-param reader is wrapped in its own Suspense boundary here.
 */

import { Suspense, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { stepCount } from "@/lib/adapters";
import type { Manifest } from "@/lib/manifest";
import { resolveSelection, selectionFromParams } from "@/lib/select";
import { useManifest } from "@/lib/store";
import { StepDetail } from "./StepDetail";
import { StepRail } from "./StepRail";

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
      onNavigate={(runId, ep, step) => {
        const q = new URLSearchParams();
        if (runId) q.set("run", runId);
        q.set("ep", String(ep));
        q.set("step", String(step));
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
  onNavigate: (runId: string | undefined, ep: number, step: number) => void;
}) {
  const resolved = resolveSelection(
    manifest,
    selectionFromParams(domainId, "episode", params),
  );
  const { run, episode, step } = resolved;
  const { episodeIndex, stepIndex } = resolved.selection;
  const scale = manifest.reward.scale;
  const steps = episode?.steps ?? [];

  const goStep = useCallback(
    (i: number) => {
      const clamped = Math.min(Math.max(i, 0), steps.length - 1);
      onNavigate(run?.id, episodeIndex, clamped);
    },
    [onNavigate, run?.id, episodeIndex, steps.length],
  );

  // Arrow keys move between steps unless a form control is focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
      if (e.key === "ArrowRight") {
        goStep(stepIndex + 1);
      } else if (e.key === "ArrowLeft") {
        goStep(stepIndex - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goStep, stepIndex]);

  if (!run) {
    return <p className="muted">No runs recorded for this domain.</p>;
  }

  return (
    <div>
      <div className="toolbar">
        <label>
          <span className="field-label">Run</span>
          <select
            className="select"
            value={run.id}
            onChange={(e) => onNavigate(e.target.value, 0, 0)}
          >
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
              onChange={(e) => onNavigate(run.id, Number(e.target.value), 0)}
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
            onClick={() => goStep(stepIndex - 1)}
            disabled={stepIndex <= 0}
            aria-label="Previous step"
          >
            Prev
          </button>
          <button
            type="button"
            className="navbtn"
            onClick={() => goStep(stepIndex + 1)}
            disabled={stepIndex >= steps.length - 1}
            aria-label="Next step"
          >
            Next
          </button>
        </div>
      </div>

      <StepRail
        steps={steps}
        activeIndex={stepIndex}
        scale={scale}
        onSelect={(i) => goStep(i)}
      />

      {step ? (
        <div style={{ marginTop: 8 }}>
          <StepDetail
            step={step}
            index={stepIndex}
            total={steps.length}
            domainId={domainId}
            scale={scale}
          />
        </div>
      ) : (
        <p className="muted">This episode has no steps.</p>
      )}
    </div>
  );
}
