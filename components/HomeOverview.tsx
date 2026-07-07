"use client";

/*
 * The home overview: all four agents at one glance. Each card shows the plain
 * name and blurb, a live-reachability status (an actual on-chain read fired on
 * mount), a headline score, and a sparkline of the learning curve. The card is
 * a link into that domain's episode screen.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { learningView } from "@/lib/adapters";
import { readLiveState } from "@/lib/live";
import type { LoadResult } from "@/lib/load";
import { DOMAIN_IDS } from "@/lib/manifest";
import { useManifests } from "@/lib/store";
import { Sparkline } from "./overview/Sparkline";

export function HomeOverview() {
  const manifests = useManifests();

  return (
    <main className="wrap home-wrap" id="main">
      <div className="home-head">
        <BrandMark />
        <div>
          <h1 className="display home-title">RL Demo Suite</h1>
          <p className="muted home-intro">
            Four reinforcement-learning agents, each optimizing an immutable LLM-consensus reward on
            GenLayer. Pick an agent to watch it act, get judged, and learn.
          </p>
        </div>
      </div>

      <div className="home-grid">
        {DOMAIN_IDS.map((id) => {
          const result = manifests?.find((r) => r.id === id) ?? null;
          return <DomainCard key={id} id={id} result={result} />;
        })}
      </div>
    </main>
  );
}

function DomainCard({ id, result }: { id: string; result: LoadResult | null }) {
  if (result === null) {
    return (
      <div className="home-card">
        <p className="mono muted" style={{ margin: 0 }}>
          loading {id}...
        </p>
      </div>
    );
  }
  if (!result.ok) {
    return (
      <div className="home-card">
        <div className="home-card-title">{id}</div>
        <p className="mono muted" style={{ margin: 0 }}>
          {result.error}
        </p>
      </div>
    );
  }

  const m = result.manifest;
  const lv = learningView(m.learning);
  const rolling = lv.rolling.map((p) => p.reward);
  const best = m.learning.episodes.reduce((a, p) => Math.max(a, p.reward), 0);
  const [lo, hi] = m.reward.scale;

  return (
    <Link href={`/${id}/episode/`} className="home-card">
      <div className="home-card-head">
        <div className="home-card-title">{m.domain.plain_name}</div>
        <LiveStatus address={m.contract.address} chain={m.contract.chain} />
      </div>
      <p className="home-blurb">{m.domain.plain_blurb}</p>

      <div className="home-spark">
        <Sparkline points={rolling} />
      </div>

      <div className="home-metrics">
        <div>
          <div className="stat-label">recent avg</div>
          <div className="home-metric-val mono">{lv.finalAverage.toFixed(1)}</div>
        </div>
        <div>
          <div className="stat-label">best</div>
          <div className="home-metric-val mono">{best.toFixed(1)}</div>
        </div>
        <div>
          <div className="stat-label">scale</div>
          <div className="home-metric-val mono">
            {lo} to {hi}
          </div>
        </div>
      </div>
    </Link>
  );
}

type Live = "checking" | "reachable" | "unreachable";

function LiveStatus({ address, chain }: { address: string; chain: string }) {
  const [status, setStatus] = useState<Live>("checking");

  useEffect(() => {
    let live = true;
    readLiveState(address, chain)
      .then(() => live && setStatus("reachable"))
      .catch(() => live && setStatus("unreachable"));
    return () => {
      live = false;
    };
  }, [address, chain]);

  const meta: Record<Live, { word: string; token: string; glyph: string }> = {
    checking: { word: "checking", token: "--ink-soft", glyph: "…" },
    reachable: { word: "live", token: "--green-ink", glyph: "●" },
    unreachable: { word: "offline", token: "--ink-soft", glyph: "○" },
  };
  const s = meta[status];
  return (
    <span className="home-status" style={{ color: `var(${s.token})` }}>
      <span aria-hidden="true">{s.glyph}</span> {s.word}
    </span>
  );
}

function BrandMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 26 26" aria-hidden="true" className="brand-svg">
      <rect x="2" y="15" width="6" height="9" rx="1" fill="var(--blue)" />
      <rect x="10" y="9" width="6" height="15" rx="1" fill="var(--red)" />
      <rect
        x="18"
        y="3"
        width="6"
        height="21"
        rx="1"
        fill="var(--green-sig)"
        stroke="var(--green-ink)"
        strokeWidth="1"
      />
    </svg>
  );
}
