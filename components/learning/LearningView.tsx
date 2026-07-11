"use client";

/*
 * Learning view: the headline of the whole suite. The agent's rolling reward
 * climbing over training, plotted against the random and greedy baselines, plus
 * the exploration rate decaying as it shifts from exploring to exploiting.
 */

import { useState } from "react";
import { BAND_META, learningView, rewardBand } from "@/lib/adapters";
import { buildPath, linearScale } from "@/lib/chart";
import type { Manifest } from "@/lib/manifest";
import { narrateLearning } from "@/lib/narrate";
import { useManifest } from "@/lib/store";
import { Narration } from "@/components/Narration";
import { ViewNav } from "@/components/episode/ViewNav";
import { LearningChart } from "./LearningChart";

export function LearningView({ domainId }: { domainId: string }) {
  const result = useManifest(domainId);
  if (result === null) return <p className="mono muted">Loading curve...</p>;
  if (!result.ok) {
    return (
      <div className="error-card mono">
        <strong>{domainId}</strong>: {result.error}
      </div>
    );
  }
  return (
    <div>
      <ViewNav domainId={domainId} view="learning" />
      <LearningBody manifest={result.manifest} />
    </div>
  );
}

// A live run needs more than a handful of steps before a per-step series is
// worth plotting against the 500-episode mock curve. Below this we show an
// honest note instead of a misleading chart.
const LIVE_MIN_STEPS = 5;

function LearningBody({ manifest }: { manifest: Manifest }) {
  const view = learningView(manifest.learning);
  const gain = view.finalAverage - view.startAverage;
  const band = BAND_META[rewardBand(view.finalAverage, manifest.reward.scale)];
  const randomFinal = view.baselines.random?.at(-1)?.reward;
  const greedyFinal = view.baselines.greedy_only?.at(-1)?.reward;

  const hasRandom = !!view.baselines.random;
  const hasGreedy = !!view.baselines.greedy_only;

  // Part B: a non-rolling reward-per-step series from a live run, if one exists.
  const liveRun = manifest.runs.find((r) => r.mode === "live");
  const liveSeries = liveRun
    ? liveRun.episodes.flatMap((ep) => ep.steps).map((s, i) => ({ i, reward: s.reward }))
    : [];
  const livePlottable = liveSeries.length >= LIVE_MIN_STEPS;

  // Toggles: baselines default on (unchanged behavior); the live overlay is a
  // sparser, opt-in comparison and starts off.
  const [showRandom, setShowRandom] = useState(true);
  const [showGreedy, setShowGreedy] = useState(true);
  const [showLive, setShowLive] = useState(false);

  return (
    <div>
      <h1 className="display" style={{ marginBottom: 2 }}>
        Learning curve
      </h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {manifest.domain.plain_name} &middot; reward per episode, smoothed over a window of{" "}
        {view.window}
      </p>

      <Narration
        text={narrateLearning(
          manifest.domain.plain_name,
          view.startAverage,
          view.finalAverage,
          randomFinal,
        )}
      />

      <div className="stat-grid" style={{ margin: "14px 0 18px" }}>
        <div className="stat">
          <div className="stat-label">Final avg</div>
          <div className="readout-lg" style={{ color: `var(${band.token})` }}>
            <span aria-hidden="true">{band.glyph}</span> {view.finalAverage.toFixed(2)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Gain over training</div>
          <div className="readout-lg" style={{ color: gain >= 0 ? "var(--green-ink)" : "var(--red-ink)" }}>
            {gain >= 0 ? "+" : ""}
            {gain.toFixed(2)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Gap over random</div>
          <div className="readout-lg">
            {randomFinal !== undefined ? `+${(view.finalAverage - randomFinal).toFixed(2)}` : "n/a"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Gap over greedy</div>
          <div className="readout-lg">
            {greedyFinal !== undefined ? `+${(view.finalAverage - greedyFinal).toFixed(2)}` : "n/a"}
          </div>
        </div>
      </div>

      {(hasRandom || hasGreedy || livePlottable) && (
        <div className="series-toggles" role="group" aria-label="Baseline overlays">
          {hasRandom && (
            <SeriesToggle
              label="random baseline"
              color="var(--red)"
              dash="7 5"
              pressed={showRandom}
              onToggle={() => setShowRandom((v) => !v)}
            />
          )}
          {hasGreedy && (
            <SeriesToggle
              label="greedy-only baseline"
              color="var(--band-fair)"
              dash="2 5"
              pressed={showGreedy}
              onToggle={() => setShowGreedy((v) => !v)}
            />
          )}
          {livePlottable && (
            <SeriesToggle
              label={`live run (${liveSeries.length} steps)`}
              color="var(--ink)"
              marker
              pressed={showLive}
              onToggle={() => setShowLive((v) => !v)}
            />
          )}
        </div>
      )}

      <div className="chart-card panel">
        <LearningChart
          view={view}
          showRandom={showRandom}
          showGreedy={showGreedy}
          live={showLive && livePlottable ? { series: liveSeries } : undefined}
        />
      </div>

      {showLive && livePlottable && (
        <p className="mono muted" style={{ marginTop: 8, fontSize: 12 }}>
          Live-run markers are plotted by step index, not by the episode unit of the mock curve;
          the two x-axes are not directly comparable.
        </p>
      )}

      {liveRun && !livePlottable && (
        <p className="mono muted" style={{ marginTop: 8, fontSize: 12 }}>
          Not enough live steps yet to plot a comparable curve
          {` (${liveSeries.length} recorded, need ${LIVE_MIN_STEPS}).`}
        </p>
      )}

      {view.epsilon.length > 0 && (
        <div className="chart-card panel" style={{ marginTop: 16 }}>
          <div className="stat-label" style={{ marginBottom: 6 }}>
            Exploration rate (epsilon)
          </div>
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            High early on, when the agent explores; decaying as it comes to trust its policy.
          </p>
          <EpsilonSparkline epsilon={view.epsilon} />
        </div>
      )}
    </div>
  );
}

function SeriesToggle({
  label,
  color,
  dash,
  marker,
  pressed,
  onToggle,
}: {
  label: string;
  color: string;
  dash?: string;
  marker?: boolean;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" className="series-toggle" aria-pressed={pressed} onClick={onToggle}>
      <svg width={22} height={10} aria-hidden="true">
        {marker ? (
          <circle cx={11} cy={5} r={3.5} fill={color} opacity={pressed ? 1 : 0.4} />
        ) : (
          <line
            x1={0}
            y1={5}
            x2={22}
            y2={5}
            stroke={color}
            strokeWidth={2}
            strokeDasharray={dash}
            opacity={pressed ? 1 : 0.4}
          />
        )}
      </svg>
      <span>{label}</span>
    </button>
  );
}

function EpsilonSparkline({ epsilon }: { epsilon: { i: number; value: number }[] }) {
  const W = 1000;
  const H = 120;
  const padL = 34;
  const padB = 20;
  const xs = epsilon.map((p) => p.i);
  const xScale = linearScale([xs[0] ?? 0, xs[xs.length - 1] ?? 1], [padL, W - 8]);
  const yScale = linearScale([0, 1], [H - padB, 8]);
  const path = buildPath(epsilon.map((p) => ({ x: xScale(p.i), y: yScale(p.value) })));
  const first = epsilon[0]?.value ?? 0;
  const last = epsilon[epsilon.length - 1]?.value ?? 0;

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Exploration rate decays from ${first.toFixed(2)} to ${last.toFixed(2)}.`}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={padL} y1={yScale(t)} x2={W - 8} y2={yScale(t)} stroke="var(--grid-line)" strokeWidth={1} />
            <text x={padL - 6} y={yScale(t) + 3} textAnchor="end" fontSize={11} fill="var(--ink-soft)" fontFamily="var(--font-mono)">
              {t}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--green-ink)" strokeWidth={2} />
      </svg>
    </div>
  );
}
