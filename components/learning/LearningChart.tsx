"use client";

/*
 * Self-contained SVG line chart for the learning curve. No charting library:
 * the geometry comes from lib/chart, so there is nothing to load and nothing
 * that can violate the static-export CSP. Series are distinguished by dash
 * pattern and label as well as color, so the chart is readable without color.
 */

import { useMemo, useRef, useState } from "react";
import { buildPath, indexAtFraction, linearScale, niceTicks, type Pt } from "@/lib/chart";
import type { LearningSeriesPoint } from "@/lib/manifest";
import type { LearningView } from "@/lib/adapters";

const VIEW_W = 1000;
const VIEW_H = 420;
const PAD_L = 46;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 30;

interface SeriesStyle {
  key: string;
  label: string;
  color: string;
  width: number;
  dash?: string;
  opacity?: number;
  marker?: boolean;
}

const AGENT: SeriesStyle = { key: "agent", label: "agent (rolling avg)", color: "var(--blue)", width: 2.6 };
const RANDOM: SeriesStyle = { key: "random", label: "random baseline", color: "var(--red)", width: 1.6, dash: "7 5" };
const GREEDY: SeriesStyle = { key: "greedy", label: "greedy-only baseline", color: "var(--band-fair)", width: 1.6, dash: "2 5" };
const RAW: SeriesStyle = { key: "raw", label: "per-episode reward", color: "var(--ink-soft)", width: 1, opacity: 0.22 };

export interface LivePoint {
  i: number;
  reward: number;
}

export function LearningChart({
  view,
  showRandom = true,
  showGreedy = true,
  live,
}: {
  view: LearningView;
  showRandom?: boolean;
  showGreedy?: boolean;
  /** Off-by-default live-run overlay: discrete per-step markers, not a line. */
  live?: { series: LivePoint[] };
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const xs = view.raw.map((p) => p.i);
  const xDomain: [number, number] = [xs[0] ?? 0, xs[xs.length - 1] ?? 1];
  const xScale = useMemo(() => linearScale(xDomain, [PAD_L, VIEW_W - PAD_R]), [xDomain[0], xDomain[1]]);
  const yScale = useMemo(() => linearScale(view.yDomain, [VIEW_H - PAD_B, PAD_T]), [view.yDomain[0], view.yDomain[1]]);

  const toPts = (series: LearningSeriesPoint[]): Pt[] =>
    series.map((p) => ({ x: xScale(p.i), y: yScale(p.reward) }));

  const paths = useMemo(
    () => ({
      raw: buildPath(toPts(view.raw)),
      agent: buildPath(toPts(view.rolling)),
      random: view.baselines.random ? buildPath(toPts(view.baselines.random)) : "",
      greedy: view.baselines.greedy_only ? buildPath(toPts(view.baselines.greedy_only)) : "",
    }),
    [view],
  );

  const yTicks = niceTicks(view.yDomain[0], view.yDomain[1], 5);
  const xTicks = niceTicks(xDomain[0], xDomain[1], 6);

  const active = hover ?? view.rolling.length - 1;
  const readout = {
    episode: view.raw[active]?.i ?? 0,
    agent: view.rolling[active]?.reward,
    random: view.baselines.random?.[active]?.reward,
    greedy: view.baselines.greedy_only?.[active]?.reward,
  };
  const guideX = view.raw[active] ? xScale(view.raw[active].i) : null;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx = rect.width / VIEW_W;
    const plotL = PAD_L * sx;
    const plotR = (VIEW_W - PAD_R) * sx;
    const frac = (e.clientX - rect.left - plotL) / (plotR - plotL || 1);
    setHover(indexAtFraction(frac, view.raw.length));
  };

  return (
    <div>
      <div className="readout-row" aria-hidden="true">
        <ReadoutCell label="episode" value={String(readout.episode)} />
        <ReadoutCell label="agent" value={fmt(readout.agent)} color="var(--blue)" />
        <ReadoutCell label="random" value={fmt(readout.random)} color="var(--red-ink)" />
        <ReadoutCell label="greedy" value={fmt(readout.greedy)} color="var(--band-fair)" />
      </div>

      <div className="chart">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Learning curve. Agent rolling average rises from ${fmt(
            view.startAverage,
          )} to ${fmt(view.finalAverage)} over ${view.raw.length} episodes.`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* horizontal grid + y labels */}
          {yTicks.map((t) => {
            const y = yScale(t);
            return (
              <g key={`y${t}`}>
                <line x1={PAD_L} y1={y} x2={VIEW_W - PAD_R} y2={y} stroke="var(--grid-line)" strokeWidth={1} />
                <text x={PAD_L - 6} y={y + 3} textAnchor="end" fontSize={11} fill="var(--ink-soft)" fontFamily="var(--font-mono)">
                  {t}
                </text>
              </g>
            );
          })}

          {/* x labels */}
          {xTicks.map((t) => (
            <text key={`x${t}`} x={xScale(t)} y={VIEW_H - 8} textAnchor="middle" fontSize={11} fill="var(--ink-soft)" fontFamily="var(--font-mono)">
              {t}
            </text>
          ))}

          {/* hover guide */}
          {guideX !== null && (
            <line x1={guideX} y1={PAD_T} x2={guideX} y2={VIEW_H - PAD_B} stroke="var(--ink-soft)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
          )}

          {paths.raw && <path d={paths.raw} fill="none" stroke={RAW.color} strokeWidth={RAW.width} opacity={RAW.opacity} />}
          {showRandom && paths.random && <path d={paths.random} fill="none" stroke={RANDOM.color} strokeWidth={RANDOM.width} strokeDasharray={RANDOM.dash} />}
          {showGreedy && paths.greedy && <path d={paths.greedy} fill="none" stroke={GREEDY.color} strokeWidth={GREEDY.width} strokeDasharray={GREEDY.dash} />}
          <path d={paths.agent} fill="none" stroke={AGENT.color} strokeWidth={AGENT.width} strokeLinejoin="round" />

          {/* Live run: discrete per-step markers, plotted by step index (not the
              episode unit of the mock curve), so they are shapes, not a line. */}
          {live &&
            live.series.map((p, i) => (
              <circle
                key={i}
                cx={xScale(p.i)}
                cy={yScale(p.reward)}
                r={4}
                fill="var(--ink)"
                stroke="var(--paper)"
                strokeWidth={1.5}
              />
            ))}
        </svg>
      </div>

      <Legend
        items={[
          AGENT,
          ...(showRandom && view.baselines.random ? [RANDOM] : []),
          ...(showGreedy && view.baselines.greedy_only ? [GREEDY] : []),
          RAW,
          ...(live
            ? [
                {
                  key: "live",
                  label: `live run (${live.series.length} steps)`,
                  color: "var(--ink)",
                  width: 0,
                  marker: true,
                } as SeriesStyle,
              ]
            : []),
        ]}
      />

      <details style={{ marginTop: 10 }}>
        <summary className="mono muted" style={{ cursor: "pointer", fontSize: 13 }}>
          data table
        </summary>
        <DataTable view={view} />
      </details>
    </div>
  );
}

function ReadoutCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="stat" style={{ padding: "8px 12px" }}>
      <div className="stat-label" style={{ marginBottom: 2 }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: 18, color: color ?? "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

function Legend({ items }: { items: SeriesStyle[] }) {
  return (
    <div className="legend">
      {items.map((s) => (
        <span className="legend-item" key={s.key}>
          <svg width={26} height={10} aria-hidden="true">
            {s.marker ? (
              <circle cx={13} cy={5} r={3.5} fill={s.color} />
            ) : (
              <line
                x1={0}
                y1={5}
                x2={26}
                y2={5}
                stroke={s.color}
                strokeWidth={s.width + 0.5}
                strokeDasharray={s.dash}
                opacity={s.opacity}
              />
            )}
          </svg>
          {s.label}
        </span>
      ))}
    </div>
  );
}

/* A sampled table so the curve's numbers are available without the chart. */
function DataTable({ view }: { view: LearningView }) {
  const n = view.raw.length;
  const stride = Math.max(1, Math.floor(n / 10));
  const rows: number[] = [];
  for (let i = 0; i < n; i += stride) rows.push(i);
  if (rows[rows.length - 1] !== n - 1) rows.push(n - 1);

  return (
    <div style={{ overflowX: "auto", marginTop: 8 }}>
      <table className="mono" style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
        <thead>
          <tr>
            {["episode", "agent", "random", "greedy"].map((h) => (
              <th key={h} style={{ textAlign: "right", padding: "4px 10px", color: "var(--ink-soft)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i}>
              <td style={cell}>{view.raw[i]?.i}</td>
              <td style={cell}>{fmt(view.rolling[i]?.reward)}</td>
              <td style={cell}>{fmt(view.baselines.random?.[i]?.reward)}</td>
              <td style={cell}>{fmt(view.baselines.greedy_only?.[i]?.reward)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cell: React.CSSProperties = {
  textAlign: "right",
  padding: "4px 10px",
  borderTop: "1px solid var(--grid-line)",
};

function fmt(v: number | undefined): string {
  return v === undefined ? "n/a" : v.toFixed(2);
}
