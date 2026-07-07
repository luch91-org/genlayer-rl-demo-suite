/*
 * Adapters: derived views over a validated Manifest. Components never compute
 * these inline; they read them from here so the math lives in one tested place.
 *
 * Everything is a pure function of already-validated data. No fetching, no
 * React, no domain-specific knowledge beyond the reward scale.
 */

import type {
  Consensus,
  Episode,
  LearningSchemaShape,
  LearningSeriesPoint,
  Manifest,
  Run,
  Step,
} from "./manifest";

/* ---------- reward bands ---------- */

export type RewardBand = "poor" | "fair" | "strong";

/**
 * Band a reward into poor / fair / strong by thirds of the reward scale.
 * Color is never the only signal in the UI, so each band also gets a glyph and
 * a label here for non-color encoding.
 */
export function rewardBand(reward: number, scale: [number, number]): RewardBand {
  const [lo, hi] = scale;
  const span = hi - lo || 1;
  const t = (reward - lo) / span;
  if (t < 1 / 3) return "poor";
  if (t < 2 / 3) return "fair";
  return "strong";
}

export const BAND_META: Record<RewardBand, { label: string; glyph: string; token: string }> = {
  // glyph is a shape cue, not decoration: it carries the state without color.
  poor: { label: "poor", glyph: "▼", token: "--band-poor" }, // down triangle
  fair: { label: "fair", glyph: "◆", token: "--band-fair" }, // diamond
  strong: { label: "strong", glyph: "▲", token: "--band-strong" }, // up triangle
};

/* ---------- learning curve ---------- */

/** Trailing rolling average of a reward series, window >= 1. */
export function rollingAverage(
  series: LearningSeriesPoint[],
  window: number,
): LearningSeriesPoint[] {
  const w = Math.max(1, Math.floor(window));
  const out: LearningSeriesPoint[] = [];
  const q: number[] = [];
  let sum = 0;
  for (const p of series) {
    q.push(p.reward);
    sum += p.reward;
    if (q.length > w) sum -= q.shift() as number;
    out.push({ i: p.i, reward: sum / q.length });
  }
  return out;
}

export interface LearningView {
  raw: LearningSeriesPoint[];
  rolling: LearningSeriesPoint[];
  window: number;
  epsilon: { i: number; value: number }[];
  baselines: {
    random?: LearningSeriesPoint[];
    greedy_only?: LearningSeriesPoint[];
  };
  /** Rolling average of the first and last window, for a headline delta. */
  startAverage: number;
  finalAverage: number;
  /** Inclusive y range covering every plotted series, padded a touch. */
  yDomain: [number, number];
}

export function learningView(learning: LearningSchemaShape): LearningView {
  const window = learning.rolling_window ?? 20;
  const raw = learning.episodes;
  const rolling = rollingAverage(raw, window);
  const baselines = {
    random: learning.baselines?.random,
    greedy_only: learning.baselines?.greedy_only,
  };

  const all: number[] = [
    ...raw.map((p) => p.reward),
    ...rolling.map((p) => p.reward),
    ...(baselines.random ?? []).map((p) => p.reward),
    ...(baselines.greedy_only ?? []).map((p) => p.reward),
  ];
  const lo = all.length ? Math.min(...all) : 0;
  const hi = all.length ? Math.max(...all) : 1;
  const pad = (hi - lo || 1) * 0.05;

  return {
    raw,
    rolling,
    window,
    epsilon: learning.epsilon ?? [],
    baselines,
    startAverage: rolling.length ? rolling[0].reward : 0,
    finalAverage: rolling.length ? rolling[rolling.length - 1].reward : 0,
    yDomain: [lo - pad, hi + pad],
  };
}

/* ---------- consensus ---------- */

export type VoteKind = "agree" | "disagree" | "idle" | "timeout" | "other";

export interface VoteTally {
  agree: number;
  disagree: number;
  idle: number;
  timeout: number;
  other: number;
  total: number;
}

export function tallyVotes(consensus: Consensus): VoteTally {
  const t: VoteTally = { agree: 0, disagree: 0, idle: 0, timeout: 0, other: 0, total: 0 };
  for (const v of consensus.validators) {
    t.total += 1;
    switch (v.vote) {
      case "agree":
        t.agree += 1;
        break;
      case "disagree":
        t.disagree += 1;
        break;
      case "idle":
        t.idle += 1;
        break;
      case "timeout":
        t.timeout += 1;
        break;
      default:
        t.other += 1;
    }
  }
  return t;
}

/** True when the recorded outcome is a majority agreement. */
export function reachedMajority(consensus: Consensus): boolean {
  return consensus.outcome === "MAJORITY";
}

/* ---------- run / episode / step navigation ---------- */

/** Flatten a run into steps tagged with their episode index and position. */
export function flattenSteps(
  run: Run,
): { episodeIndex: number; stepIndex: number; step: Step }[] {
  const out: { episodeIndex: number; stepIndex: number; step: Step }[] = [];
  run.episodes.forEach((ep, episodeIndex) => {
    ep.steps.forEach((step, stepIndex) => out.push({ episodeIndex, stepIndex, step }));
  });
  return out;
}

/** Total number of steps across every episode in a run. */
export function stepCount(run: Run): number {
  return run.episodes.reduce((a, ep) => a + ep.steps.length, 0);
}

/** The single live/on-chain step in a run, if the run captured one. */
export function firstConsensusStep(manifest: Manifest): { run: Run; step: Step } | null {
  for (const run of manifest.runs) {
    for (const ep of run.episodes) {
      for (const step of ep.steps) {
        if (step.consensus) return { run, step };
      }
    }
  }
  return null;
}

/**
 * The consensus the Judge panel should show for a step, or null when the step
 * was scored by a fixed rule (deterministic) and so carries no committee. The
 * panel and its test read this one rule, so the Judge always tracks the
 * currently selected step and never a different one.
 */
export function judgeConsensus(step: Step | undefined): Consensus | null {
  return step?.consensus ?? null;
}

export function episodeAt(run: Run, index: number): Episode | undefined {
  return run.episodes[index];
}

export function stepAt(run: Run, episodeIndex: number, stepIndex: number): Step | undefined {
  return run.episodes[episodeIndex]?.steps[stepIndex];
}
