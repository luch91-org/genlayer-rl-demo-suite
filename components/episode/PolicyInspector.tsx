"use client";

/*
 * The policy inspector: why the agent chose what it chose. Each action gets a
 * bar sized to its Q-value relative to the best in the list, with the chosen
 * (greedy) action set apart by a filled bar, a bold label, and a leading glyph
 * so it reads without relying on color. A plain-language line translates the
 * numbers, including how much the agent was still exploring at this stage.
 */

import type { ReactNode } from "react";
import type { PolicyEntry, Step } from "@/lib/manifest";

export function PolicyInspector({ step }: { step: Step }): ReactNode {
  const policy = step.policy;
  if (!policy || policy.length === 0) {
    // No policy trace for this step: render nothing rather than an empty panel.
    return null;
  }

  const qs = policy.map((p) => p.q);
  const maxQ = Math.max(...qs);
  const minQ = Math.min(...qs);
  const span = maxQ - minQ || 1;
  const chosen = policy.find((p) => p.chosen) ?? maxEntry(policy);

  return (
    <div className="panel policy-panel">
      <div className="stat-label">Why it chose this</div>
      <div className="policy-rows">
        {policy.map((p, i) => {
          const width = ((p.q - minQ) / span) * 100;
          const isChosen = Boolean(p.chosen) || p === chosen;
          return (
            <div key={i} className={`policy-row${isChosen ? " policy-row-chosen" : ""}`}>
              <span className="policy-label">
                <span className="policy-glyph" aria-hidden="true">
                  {isChosen ? "▶" : "·"}
                </span>
                {p.action}
              </span>
              <span className="policy-bar-track">
                <span
                  className={`policy-bar${isChosen ? " policy-bar-chosen" : ""}`}
                  style={{ width: `${Math.max(2, width)}%` }}
                />
              </span>
              <span className="policy-q mono">{p.q.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
      <p className="policy-plain">{plainLanguage(chosen, step.epsilon)}</p>
    </div>
  );
}

function maxEntry(policy: PolicyEntry[]): PolicyEntry {
  return policy.reduce((best, p) => (p.q > best.q ? p : best), policy[0]);
}

function plainLanguage(chosen: PolicyEntry, epsilon: number | undefined): string {
  const base = `It expected "${chosen.action}" to score highest, so it chose that.`;
  if (epsilon === undefined) return base;
  const pct = Math.round(epsilon * 100);
  if (pct <= 0) {
    return `${base} By this stage it had stopped exploring and followed its policy.`;
  }
  const oneIn = Math.max(2, Math.round(1 / epsilon));
  return `${base} It was still exploring about ${pct}% of the time at this stage, roughly 1 in ${oneIn} moves.`;
}
