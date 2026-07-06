"use client";

/*
 * The detail panel for a single step: what the agent did, the state around it,
 * the reward and its band, the judge's reasoning, and (for on-chain steps) a
 * compact consensus summary with a pointer to the full Verification view.
 */

import Link from "next/link";
import { BAND_META, reachedMajority, rewardBand, tallyVotes } from "@/lib/adapters";
import type { Consensus, Step } from "@/lib/manifest";
import { narrateStep } from "@/lib/narrate";
import { getStateRenderer } from "@/components/state/registry";
import { Narration } from "@/components/Narration";

export function StepDetail({
  step,
  index,
  total,
  domainId,
  scale,
}: {
  step: Step;
  index: number;
  total: number;
  domainId: string;
  scale: [number, number];
}) {
  const band = rewardBand(step.reward, scale);
  const meta = BAND_META[band];
  const StateRenderer = getStateRenderer(domainId);
  const hasState = Boolean(step.state_before || step.state_after);

  return (
    <div>
      {step.illustrative && (
        <div className="banner-illustrative">
          <span aria-hidden="true">◆</span>
          <span>
            Illustrative step. One or more fields here are reconstructed for the walkthrough,
            not captured from a live run.
          </span>
        </div>
      )}

      <Narration live text={narrateStep(step, scale, index, total)} />

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 10 }}>
        <span className="mono muted">
          step {index} of {total - 1}
        </span>
        <span className="tag">{step.reward_kind === "llm" ? "LLM-judged" : "deterministic"}</span>
      </div>

      <h2 className="display" style={{ margin: "6px 0 2px", fontSize: 22 }}>
        {step.action.label}
      </h2>
      <div className="mono muted" style={{ fontSize: 12 }}>
        action id {step.action.id}
      </div>

      <div style={{ marginTop: 12, marginBottom: 4 }}>
        <span className="readout-lg" style={{ color: `var(${meta.token})` }}>
          <span aria-hidden="true">{meta.glyph}</span> {step.reward.toFixed(2)}
        </span>
        <span className="mono muted" style={{ marginLeft: 8, fontSize: 13 }}>
          {meta.label} &middot; scale {scale[0]} to {scale[1]}
        </span>
      </div>

      <div className="detail-grid" style={{ marginTop: 14 }}>
        <div className="panel">
          <div className="stat-label">State</div>
          {hasState ? (
            <>
              {step.state_before && (
                <div style={{ marginBottom: 10 }}>
                  <StateRenderer state={step.state_before} which="before" />
                </div>
              )}
              {step.state_after && <StateRenderer state={step.state_after} which="after" />}
            </>
          ) : (
            <p className="mono muted" style={{ margin: 0 }}>
              no state snapshot recorded for this step
            </p>
          )}
        </div>

        <div className="panel">
          <div className="stat-label">Judge&apos;s reasoning</div>
          {step.reason ? (
            <p className="reason">{step.reason}</p>
          ) : (
            <p className="mono muted" style={{ margin: 0 }}>
              no reasoning recorded
            </p>
          )}

          {(step.epsilon !== undefined || step.tx) && (
            <div style={{ marginTop: 12 }}>
              {step.epsilon !== undefined && (
                <div className="kv-row">
                  <span className="muted">exploration rate</span>
                  <span className="mono">
                    epsilon {step.epsilon.toFixed(3)}
                  </span>
                </div>
              )}
              {step.tx && (
                <div className="kv-row">
                  <span className="muted">transaction</span>
                  <span className="mono">
                    {step.tx.explorer ? (
                      <a href={step.tx.explorer} target="_blank" rel="noreferrer">
                        {shortHash(step.tx.hash)}
                      </a>
                    ) : (
                      shortHash(step.tx.hash)
                    )}
                    {step.tx.elapsed_s !== undefined ? ` (${step.tx.elapsed_s}s)` : ""}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {step.consensus && (
        <ConsensusSummary consensus={step.consensus} domainId={domainId} />
      )}
    </div>
  );
}

function ConsensusSummary({
  consensus,
  domainId,
}: {
  consensus: Consensus;
  domainId: string;
}) {
  const tally = tallyVotes(consensus);
  const agreed = reachedMajority(consensus);
  const pills: { key: string; label: string; n: number }[] = [
    { key: "agree", label: "agree", n: tally.agree },
    { key: "disagree", label: "disagree", n: tally.disagree },
    { key: "idle", label: "idle", n: tally.idle },
    { key: "timeout", label: "timeout", n: tally.timeout },
  ];

  return (
    <div className="panel" style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div className="stat-label" style={{ marginBottom: 2 }}>
            On-chain consensus
          </div>
          <span className="mono">
            {agreed ? "majority agreed" : "no majority"} on the leader score{" "}
            {consensus.leader_score !== undefined ? consensus.leader_score.toFixed(2) : ""}
          </span>
        </div>
        <Link className="chip" href={`/${domainId}/verification/`}>
          full receipt
        </Link>
      </div>
      <div className="vote-tally">
        {pills
          .filter((p) => p.n > 0)
          .map((p) => (
            <span className="vote-pill" key={p.key}>
              {p.label} {p.n}
            </span>
          ))}
        <span className="vote-pill muted">{tally.total} validators</span>
      </div>
    </div>
  );
}

function shortHash(h: string): string {
  return h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h;
}
