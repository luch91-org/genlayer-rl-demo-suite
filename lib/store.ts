"use client";

/*
 * Client-side manifest cache. The shell and every view read manifests through
 * these hooks so the four JSON files are fetched once per session, not once per
 * component. Results keep their per-domain ok/error shape.
 */

import { useEffect, useState } from "react";
import { loadManifests, type LoadResult } from "./load";

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
