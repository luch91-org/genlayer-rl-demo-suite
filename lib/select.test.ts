import { describe, expect, it } from "vitest";
import type { Manifest } from "./manifest";
import { resolveSelection, selectionFromParams, selectionPath } from "./select";

const manifest = {
  schema_version: "1",
  domain: {
    id: "crisis",
    name: "Crisis Negotiator",
    plain_name: "Crisis Response",
    plain_blurb: "b",
    world: "w",
  },
  provenance: {
    repo: "r",
    commit: "c",
    sdk: "s",
    runner_pin: "p",
    generated_at: "2026-07-05",
  },
  contract: { address: "0x0000000000000000000000000000000000000000", chain: "studionet" },
  reward: { kind: "llm_comparative", scale: [0, 10], principle: "p" },
  learning: { rolling_window: 20, episodes: [{ i: 0, reward: 1 }] },
  runs: [
    {
      id: "live",
      mode: "live",
      label: "live",
      episodes: [{ i: 0, steps: [{ i: 0, action: { id: "a", label: "a" }, reward: 1, reward_kind: "llm" }] }],
    },
    {
      id: "replay",
      mode: "replay",
      label: "replay",
      episodes: [
        {
          i: 0,
          steps: [
            { i: 0, action: { id: "a", label: "a" }, reward: 1, reward_kind: "llm" },
            { i: 1, action: { id: "b", label: "b" }, reward: 2, reward_kind: "llm" },
          ],
        },
      ],
    },
  ],
} as unknown as Manifest;

describe("resolveSelection", () => {
  it("defaults to overview and the first run", () => {
    const r = resolveSelection(manifest, { domainId: "crisis" });
    expect(r.selection.view).toBe("overview");
    expect(r.selection.runId).toBe("live");
    expect(r.run?.id).toBe("live");
    expect(r.step?.action.id).toBe("a");
  });

  it("selects a named run and resolves its step", () => {
    const r = resolveSelection(manifest, {
      domainId: "crisis",
      view: "episode",
      runId: "replay",
      episodeIndex: 0,
      stepIndex: 1,
    });
    expect(r.run?.id).toBe("replay");
    expect(r.step?.action.id).toBe("b");
  });

  it("clamps an out-of-range step instead of erroring", () => {
    const r = resolveSelection(manifest, {
      domainId: "crisis",
      runId: "replay",
      episodeIndex: 0,
      stepIndex: 99,
    });
    expect(r.selection.stepIndex).toBe(1);
    expect(r.step?.action.id).toBe("b");
  });

  it("falls back to the first run when the runId is unknown", () => {
    const r = resolveSelection(manifest, { domainId: "crisis", runId: "nope" });
    expect(r.selection.runId).toBe("live");
  });

  it("ignores an invalid view", () => {
    const r = resolveSelection(manifest, {
      domainId: "crisis",
      view: "bogus" as never,
    });
    expect(r.selection.view).toBe("overview");
  });
});

describe("url round trip", () => {
  it("encodes selection into the sync-rule path", () => {
    expect(
      selectionPath({
        domainId: "crisis",
        view: "episode",
        runId: "replay",
        episodeIndex: 0,
        stepIndex: 2,
      }),
    ).toBe("/crisis/episode?run=replay&ep=0&step=2");
  });

  it("parses params back into a selection and resolves them", () => {
    const params = new URLSearchParams("run=replay&ep=0&step=1");
    const partial = selectionFromParams("crisis", "episode", params);
    const r = resolveSelection(manifest, partial);
    expect(r.selection.view).toBe("episode");
    expect(r.run?.id).toBe("replay");
    expect(r.step?.action.id).toBe("b");
  });
});
