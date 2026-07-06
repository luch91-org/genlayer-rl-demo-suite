/*
 * GenLayer read results come back as viem-style values: dicts are Maps, and
 * integers are BigInt. This normalizer turns them into plain JSON-friendly
 * objects so the state renderers (built for manifest records) can display live
 * on-chain state with no special casing. Pure, so it is unit-tested.
 */

export function normalize(value: unknown): unknown {
  if (typeof value === "bigint") {
    // Numbers on these contracts stay well within Number's safe range.
    return Number(value);
  }
  if (value instanceof Map) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of value) out[String(k)] = normalize(v);
    return out;
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalize(v);
    }
    return out;
  }
  return value;
}

export function normalizeRecord(value: unknown): Record<string, unknown> {
  const n = normalize(value);
  return n && typeof n === "object" && !Array.isArray(n) ? (n as Record<string, unknown>) : {};
}
