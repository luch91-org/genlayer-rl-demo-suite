import { describe, expect, it } from "vitest";
import { buildPath, indexAtFraction, linearScale, niceTicks } from "./chart";

describe("linearScale", () => {
  it("maps domain ends onto range ends", () => {
    const s = linearScale([0, 10], [0, 100]);
    expect(s(0)).toBe(0);
    expect(s(10)).toBe(100);
    expect(s(5)).toBe(50);
  });

  it("inverts when the range is inverted (svg y grows down)", () => {
    const s = linearScale([0, 10], [400, 0]);
    expect(s(0)).toBe(400);
    expect(s(10)).toBe(0);
  });

  it("does not divide by zero on a flat domain", () => {
    const s = linearScale([5, 5], [0, 100]);
    expect(Number.isFinite(s(5))).toBe(true);
  });
});

describe("buildPath", () => {
  it("starts with M and continues with L", () => {
    expect(
      buildPath([
        { x: 0, y: 0 },
        { x: 10, y: 20 },
        { x: 20, y: 5 },
      ]),
    ).toBe("M0 0 L10 20 L20 5");
  });

  it("returns empty string for no points", () => {
    expect(buildPath([])).toBe("");
  });
});

describe("niceTicks", () => {
  it("produces evenly snapped ticks within range", () => {
    const ticks = niceTicks(0, 10, 5);
    expect(ticks[0]).toBeGreaterThanOrEqual(0);
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(10);
    // snaps to a step of 2 over this span: 0, 2, 4, 6, 8, 10
    expect(ticks).toEqual([0, 2, 4, 6, 8, 10]);
    const step = ticks[1] - ticks[0];
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i] - ticks[i - 1]).toBeCloseTo(step);
    }
  });

  it("handles a degenerate range", () => {
    expect(niceTicks(3, 3)).toEqual([3]);
  });
});

describe("indexAtFraction", () => {
  it("maps fractions to nearest index", () => {
    expect(indexAtFraction(0, 500)).toBe(0);
    expect(indexAtFraction(1, 500)).toBe(499);
    expect(indexAtFraction(0.5, 501)).toBe(250);
  });

  it("clamps out-of-range fractions", () => {
    expect(indexAtFraction(-1, 10)).toBe(0);
    expect(indexAtFraction(2, 10)).toBe(9);
  });
});
