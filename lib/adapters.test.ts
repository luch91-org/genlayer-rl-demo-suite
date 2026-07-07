import { describe, expect, it } from "vitest";
import {
  BAND_META,
  judgeConsensus,
  learningView,
  reachedMajority,
  rewardBand,
  rollingAverage,
  stepCount,
  tallyVotes,
} from "./adapters";
import type { Consensus, LearningSchemaShape, Run, Step } from "./manifest";

describe("rewardBand", () => {
  it("splits the scale into thirds", () => {
    expect(rewardBand(0, [0, 10])).toBe("poor");
    expect(rewardBand(2, [0, 10])).toBe("poor");
    expect(rewardBand(5, [0, 10])).toBe("fair");
    expect(rewardBand(8, [0, 10])).toBe("strong");
    expect(rewardBand(10, [0, 10])).toBe("strong");
  });

  it("handles a degenerate scale without dividing by zero", () => {
    // span collapses to 0; the guard treats it as 1 and returns a valid band
    // instead of NaN-banding or throwing.
    expect(["poor", "fair", "strong"]).toContain(rewardBand(5, [5, 5]));
  });

  it("every band has a non-color glyph", () => {
    for (const band of ["poor", "fair", "strong"] as const) {
      expect(BAND_META[band].glyph.length).toBeGreaterThan(0);
      expect(BAND_META[band].label.length).toBeGreaterThan(0);
    }
  });
});

describe("rollingAverage", () => {
  it("averages within a trailing window", () => {
    const out = rollingAverage(
      [
        { i: 0, reward: 0 },
        { i: 1, reward: 10 },
        { i: 2, reward: 20 },
      ],
      2,
    );
    expect(out.map((p) => p.reward)).toEqual([0, 5, 15]);
  });

  it("treats window < 1 as 1", () => {
    const series = [
      { i: 0, reward: 3 },
      { i: 1, reward: 7 },
    ];
    expect(rollingAverage(series, 0).map((p) => p.reward)).toEqual([3, 7]);
  });
});

describe("learningView", () => {
  const learning: LearningSchemaShape = {
    rolling_window: 2,
    episodes: [
      { i: 0, reward: 2 },
      { i: 1, reward: 4 },
      { i: 2, reward: 8 },
    ],
    epsilon: [{ i: 0, value: 1 }],
    baselines: { random: [{ i: 0, reward: 3 }] },
  };

  it("derives rolling curve, headline averages, and a padded y range", () => {
    const v = learningView(learning);
    expect(v.window).toBe(2);
    expect(v.rolling).toHaveLength(3);
    expect(v.startAverage).toBe(2);
    expect(v.finalAverage).toBe(6); // (4 + 8) / 2
    expect(v.yDomain[0]).toBeLessThan(2);
    expect(v.yDomain[1]).toBeGreaterThan(8);
    expect(v.baselines.random).toBeDefined();
  });
});

describe("consensus tallies", () => {
  const consensus: Consensus = {
    outcome: "MAJORITY",
    leader_score: 8,
    validators: [
      { vote: "agree" },
      { vote: "agree" },
      { vote: "disagree" },
      { vote: "idle" },
      { vote: "timeout" },
    ],
  };

  it("counts votes by kind", () => {
    const t = tallyVotes(consensus);
    expect(t.agree).toBe(2);
    expect(t.disagree).toBe(1);
    expect(t.idle).toBe(1);
    expect(t.timeout).toBe(1);
    expect(t.total).toBe(5);
  });

  it("reads the recorded majority outcome", () => {
    expect(reachedMajority(consensus)).toBe(true);
    expect(reachedMajority({ ...consensus, outcome: "NO_MAJORITY" })).toBe(false);
  });
});

describe("judgeConsensus follows the selected step", () => {
  // Three steps: two LLM-judged with different leader scores, one deterministic.
  const steps: Step[] = [
    {
      i: 0,
      action: { id: "a", label: "a" },
      reward: 2,
      reward_kind: "llm",
      consensus: { outcome: "MAJORITY", leader_score: 2, validators: [] },
    },
    {
      i: 1,
      action: { id: "b", label: "b" },
      reward: 9,
      reward_kind: "deterministic",
    },
    {
      i: 2,
      action: { id: "c", label: "c" },
      reward: 8.4,
      reward_kind: "llm",
      consensus: { outcome: "MAJORITY", leader_score: 8.4, validators: [] },
    },
  ];

  it("shows the selected step's leader score, not another step's", () => {
    expect(judgeConsensus(steps[0])?.leader_score).toBe(2);
    expect(judgeConsensus(steps[2])?.leader_score).toBe(8.4);
  });

  it("shows no consensus for a deterministic step", () => {
    expect(judgeConsensus(steps[1])).toBeNull();
  });

  it("is null for an absent step", () => {
    expect(judgeConsensus(undefined)).toBeNull();
  });
});

describe("run navigation", () => {
  const run: Run = {
    id: "r",
    mode: "replay",
    label: "l",
    episodes: [
      { i: 0, steps: [{ i: 0, action: { id: "a", label: "a" }, reward: 1, reward_kind: "llm" }] },
      {
        i: 1,
        steps: [
          { i: 0, action: { id: "b", label: "b" }, reward: 2, reward_kind: "llm" },
          { i: 1, action: { id: "c", label: "c" }, reward: 3, reward_kind: "llm" },
        ],
      },
    ],
  };

  it("counts every step across episodes", () => {
    expect(stepCount(run)).toBe(3);
  });
});
