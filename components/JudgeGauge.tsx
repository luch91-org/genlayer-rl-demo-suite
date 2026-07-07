"use client";

/*
 * The Judge panel: the on-chain LLM verdict as a semicircular gauge, the
 * leader's one-line reason, the leader plus each validator's vote, and the
 * equivalence outcome. Vote marks are drawn as SVG shapes (check, cross, dash,
 * square) so they read without relying on color or unicode glyphs.
 */

import { rewardBand, BAND_META, tallyVotes, reachedMajority } from "@/lib/adapters";
import type { Consensus } from "@/lib/manifest";

export function JudgeGauge({
  consensus,
  scale,
}: {
  consensus: Consensus;
  scale: [number, number];
}) {
  const score = consensus.leader_score ?? 0;
  const band = BAND_META[rewardBand(score, scale)];
  const agreed = reachedMajority(consensus);
  const tally = tallyVotes(consensus);

  return (
    <div>
      <div className="judge-top">
        <Gauge value={score} max={scale[1]} token={band.token} />
        <div className="judge-reason-wrap">
          {consensus.leader_reason && <p className="judge-reason">{consensus.leader_reason}</p>}
        </div>
      </div>

      <div className="judge-voters">
        <div className="voters-label">Leader + validators</div>
        <div className="voters-row">
          <span className="voter-leader" title={consensus.leader_model ?? "leader"}>
            L
          </span>
          {consensus.validators.map((v, i) => (
            <VoteMark key={i} vote={String(v.vote)} model={v.model ?? undefined} />
          ))}
        </div>
      </div>

      <p className="judge-tolerance">
        Accept if scores agree within {consensus.tolerance ?? 1.5} points. {tally.agree} of{" "}
        {tally.total} within tolerance.{" "}
        <span
          className="judge-outcome"
          style={{ color: agreed ? "var(--green-ink)" : "var(--red)" }}
        >
          {agreed ? "MAJORITY" : "NO MAJORITY"}
        </span>
      </p>
    </div>
  );
}

function Gauge({ value, max, token }: { value: number; max: number; token: string }) {
  const W = 200;
  const H = 120;
  const cx = 100;
  const cy = 105;
  const r = 82;
  const frac = Math.min(1, Math.max(0, value / (max || 1)));
  const bg = arcPath(cx, cy, r, 180, 0);
  const fg = arcPath(cx, cy, r, 180, 180 - frac * 180);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="gauge" role="img" aria-label={`score ${value} of ${max}`}>
      <path d={bg} fill="none" stroke="var(--grid-line)" strokeWidth={14} strokeLinecap="round" />
      <path d={fg} fill="none" stroke={`var(${token})`} strokeWidth={14} strokeLinecap="round" />
      <text x={cx} y={cy - 6} textAnchor="middle" className="gauge-value" fill={`var(${token})`}>
        {value.toFixed(1)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="gauge-max">
        /{max}
      </text>
    </svg>
  );
}

/** SVG arc between two angles (degrees, standard math orientation). */
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = Math.abs(a0 - a1) > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
}

function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function VoteMark({ vote, model }: { vote: string; model?: string }) {
  const meta = VOTE[vote] ?? { color: "var(--ink-soft)", bg: "var(--cream)" };
  return (
    <span
      className="vote-mark"
      title={`${model ?? "validator"}: ${vote}`}
      style={{ borderColor: meta.color, background: meta.bg }}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        {vote === "agree" && (
          <polyline points="3,8 7,12 13,4" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {vote === "disagree" && (
          <g stroke={meta.color} strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </g>
        )}
        {vote === "idle" && <line x1="4" y1="8" x2="12" y2="8" stroke={meta.color} strokeWidth="2" strokeLinecap="round" />}
        {vote === "timeout" && <rect x="4" y="4" width="8" height="8" rx="1" fill={meta.color} />}
      </svg>
      <span className="visually-hidden">{vote}</span>
    </span>
  );
}

const VOTE: Record<string, { color: string; bg: string }> = {
  agree: { color: "var(--green-ink)", bg: "var(--green-wash)" },
  disagree: { color: "var(--red)", bg: "var(--red-wash)" },
  idle: { color: "var(--ink-soft)", bg: "var(--cream)" },
  timeout: { color: "var(--band-fair)", bg: "#fbf3df" },
};
