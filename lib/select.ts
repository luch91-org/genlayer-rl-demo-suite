/*
 * Selection is the one piece of shared state the whole dashboard reads and
 * writes. It is a plain object, mirrored into the URL so any view is
 * linkable and the back button works:
 *
 *   /{domain}/{view}?run=<runId>&ep=<episodeIndex>&step=<stepIndex>
 *
 * resolveSelection turns a possibly-stale or partial selection into concrete
 * run / episode / step objects, clamping indices so the UI can never point at
 * something that does not exist.
 */

import { episodeAt, stepAt } from "./adapters";
import type { Episode, Manifest, Run, Step } from "./manifest";

export const VIEWS = ["episode", "learning", "verification", "live"] as const;
export type View = (typeof VIEWS)[number];

export function isView(v: string): v is View {
  return (VIEWS as readonly string[]).includes(v);
}

export interface Selection {
  domainId: string;
  view: View;
  runId?: string;
  episodeIndex: number;
  stepIndex: number;
}

export interface ResolvedSelection {
  selection: Selection;
  run?: Run;
  episode?: Episode;
  step?: Step;
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.min(Math.max(n, lo), hi);
}

/**
 * Resolve a partial/loose selection against a manifest. Missing or
 * out-of-range fields fall back to the first valid value rather than erroring,
 * so a hand-edited URL degrades gracefully instead of blanking the page.
 */
export function resolveSelection(
  manifest: Manifest,
  partial: Partial<Selection> & { domainId: string },
): ResolvedSelection {
  const view: View = partial.view && isView(partial.view) ? partial.view : "episode";

  const runs = manifest.runs;
  const run =
    runs.find((r) => r.id === partial.runId) ?? runs[0] ?? undefined;

  const episodeCount = run ? run.episodes.length : 0;
  const episodeIndex = episodeCount
    ? clamp(partial.episodeIndex ?? 0, 0, episodeCount - 1)
    : 0;

  const episode = run ? episodeAt(run, episodeIndex) : undefined;
  const stepCountForEp = episode ? episode.steps.length : 0;
  const stepIndex = stepCountForEp
    ? clamp(partial.stepIndex ?? 0, 0, stepCountForEp - 1)
    : 0;

  const step = run ? stepAt(run, episodeIndex, stepIndex) : undefined;

  return {
    selection: {
      domainId: partial.domainId,
      view,
      runId: run?.id,
      episodeIndex,
      stepIndex,
    },
    run,
    episode,
    step,
  };
}

/* ---------- URL <-> selection ---------- */

export function selectionPath(sel: Selection): string {
  const params = new URLSearchParams();
  if (sel.runId) params.set("run", sel.runId);
  params.set("ep", String(sel.episodeIndex));
  params.set("step", String(sel.stepIndex));
  const qs = params.toString();
  return `/${sel.domainId}/${sel.view}${qs ? `?${qs}` : ""}`;
}

export function selectionFromParams(
  domainId: string,
  view: string,
  params: URLSearchParams | Record<string, string | undefined>,
): Partial<Selection> & { domainId: string } {
  const get = (k: string): string | undefined =>
    params instanceof URLSearchParams ? (params.get(k) ?? undefined) : params[k];

  const ep = get("ep");
  const step = get("step");
  return {
    domainId,
    view: isView(view) ? view : "episode",
    runId: get("run"),
    episodeIndex: ep !== undefined ? Number.parseInt(ep, 10) : 0,
    stepIndex: step !== undefined ? Number.parseInt(step, 10) : 0,
  };
}
