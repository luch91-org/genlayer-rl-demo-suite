/*
 * Pure geometry helpers for the SVG learning chart. Kept separate from the
 * component so the coordinate math is unit-tested and the component stays a
 * thin renderer. No React, no DOM.
 */

export type Range = [number, number];

/** Linear mapping from a data domain onto a pixel range. */
export function linearScale(domain: Range, range: Range): (v: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

export interface Pt {
  x: number;
  y: number;
}

/** Build an SVG polyline path ("M x y L x y ...") from pixel points. */
export function buildPath(points: Pt[]): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`)
    .join(" ");
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Human-friendly axis ticks spanning [min, max] with roughly `count` steps,
 * snapped to 1/2/5 x 10^k. Always includes at least the two ends.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return [min];
  }
  const span = max - min;
  const rawStep = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;

  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= max + step * 1e-6; t += step) {
    ticks.push(round(t));
  }
  return ticks;
}

/**
 * Nearest data index for a fractional 0..1 position along the x axis. Used to
 * turn a hover position into an episode index.
 */
export function indexAtFraction(fraction: number, length: number): number {
  if (length <= 0) return 0;
  const clamped = Math.min(1, Math.max(0, fraction));
  return Math.round(clamped * (length - 1));
}
