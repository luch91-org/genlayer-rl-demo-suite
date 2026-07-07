"use client";

/*
 * Client-side manifest cache. The shell and every view read manifests through
 * these hooks so the four JSON files are fetched once per session, not once per
 * component. Results keep their per-domain ok/error shape.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { loadManifests, type LoadResult } from "./load";

/*
 * Global Replay / Live mode. One switch the whole dashboard reads: the header
 * owns the toggle, every view reads the same value. Kept as a tiny external
 * store (not React context) so it survives navigation between the statically
 * exported pages without a provider, matching the manifest cache below.
 */
export type Mode = "replay" | "live";

let currentMode: Mode = "replay";
const modeListeners = new Set<() => void>();

export function getMode(): Mode {
  return currentMode;
}

export function setMode(next: Mode): void {
  if (next === currentMode) return;
  currentMode = next;
  for (const listen of modeListeners) listen();
}

function subscribeMode(listener: () => void): () => void {
  modeListeners.add(listener);
  return () => modeListeners.delete(listener);
}

export function useMode(): [Mode, (next: Mode) => void] {
  // getServerSnapshot returns the default so static export renders in Replay.
  const mode = useSyncExternalStore(subscribeMode, getMode, () => "replay" as Mode);
  return [mode, setMode];
}

let pending: Promise<LoadResult[]> | null = null;
let settled: LoadResult[] | null = null;

function allManifests(): Promise<LoadResult[]> {
  if (settled) return Promise.resolve(settled);
  if (!pending) {
    pending = loadManifests().then((r) => {
      settled = r;
      return r;
    });
  }
  return pending;
}

export function useManifests(): LoadResult[] | null {
  const [results, setResults] = useState<LoadResult[] | null>(settled);
  useEffect(() => {
    let live = true;
    allManifests().then((r) => {
      if (live) setResults(r);
    });
    return () => {
      live = false;
    };
  }, []);
  return results;
}

export function useManifest(id: string): LoadResult | null {
  const all = useManifests();
  if (!all) return null;
  return all.find((r) => r.id === id) ?? { ok: false, id, error: "unknown domain" };
}
