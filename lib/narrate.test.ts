import { describe, expect, it } from "vitest";
import type { Consensus, Step } from "./manifest";
import { narrateConsensus, narrateLearning, narrateStep } from "./narrate";

describe("narrateLearning", () => {
  it("describes a climb above the random baseline", () => {
    const s = narrateLearning("Crisis Response", 3.5, 8.1, 3.1);
    expect(s).toContain("climbed from 3.5 to 8.1");
    expect(s).toContain("above a random agent");
  });

  it("omits the comparison when no baseline is given", () => {
    const s = narrateLearning("Crisis Response", 3.5, 8.1);
    expect(s).not.toContain("random");
  });

  it("notes when the agent has not beaten random", () => {
    expect(narrateLearning("X", 4, 3, 5)).toContain("has not learned yet");
  });
});

describe("narrateStep", () => {
  const step: Step = {
    i: 1,
    action: { id: "a", label: "send drones to zone A" },
    reward: 2,
    reward_kind: "llm",
    reason: "wasted resources",
  };

  it("names the action, score, band, and reason", () => {
    const s = narrateStep(step, [0, 10], 1, 4);
    expect(s).toContain("send drones to zone A");
    expect(s).toContain("2.0 out of 10");
    expect(s).toContain("low score");
    expect(s).toContain("Reason: wasted resources");
  });

  it("says a fixed rule scored deterministic steps", () => {
    const s = narrateStep({ ...step, reward_kind: "deterministic", reason: undefined }, [0, 10], 0, 2);
    expect(s).toContain("a fixed rule scored it");
    expect(s).not.toContain("Reason:");
  });
});

describe("narrateConsensus", () => {
  it("summarizes the outcome and vote split", () => {
    const c: Consensus = {
      outcome: "MAJORITY",
      leader_score: 8,
      validators: [{ vote: "agree" }, { vote: "agree" }, { vote: "disagree" }],
    };
    const s = narrateConsensus(c);
    expect(s).toContain("reached a majority");
    expect(s).toContain("2 of 3 validators agreed");
    expect(s).toContain("8.0");
  });
});
