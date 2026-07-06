import { describe, expect, it } from "vitest";
import { normalize, normalizeRecord } from "./normalize";

describe("normalize", () => {
  it("converts BigInt to Number", () => {
    expect(normalize(4800n)).toBe(4800);
  });

  it("converts a Map to a plain object", () => {
    const m = new Map<string, unknown>([
      ["round", 13n],
      ["last_reason", "ok"],
    ]);
    expect(normalize(m)).toEqual({ round: 13, last_reason: "ok" });
  });

  it("recurses into nested Maps (dict of dict)", () => {
    const inner = new Map<string, unknown>([["drones", 2n]]);
    const outer = new Map<string, unknown>([["resources", inner]]);
    expect(normalize(outer)).toEqual({ resources: { drones: 2 } });
  });

  it("normalizes arrays and leaves primitives alone", () => {
    expect(normalize([1n, "a", true])).toEqual([1, "a", true]);
    expect(normalize("plain")).toBe("plain");
    expect(normalize(null)).toBe(null);
  });

  it("normalizeRecord returns an object, or empty for non-objects", () => {
    expect(normalizeRecord(new Map([["a", 1n]]))).toEqual({ a: 1 });
    expect(normalizeRecord(5n)).toEqual({});
    expect(normalizeRecord([1n])).toEqual({});
  });
});
