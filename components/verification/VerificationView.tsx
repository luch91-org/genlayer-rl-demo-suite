"use client";

/*
 * Verification view: the judge-transparency layer. It shows the real on-chain
 * receipt for the domain's captured live step so a reviewer can see exactly how
 * the reward was reached: the leader's score and reasoning, each validator's
 * vote under the comparative equivalence principle, the recorded outcome, and
 * the transaction. Nothing here is invented; it is the captured consensus.
 */

import Link from "next/link";
import { firstConsensusStep, reachedMajority, tallyVotes } from "@/lib/adapters";
import type { Consensus, Manifest, ValidatorVote } from "@/lib/manifest";
import { narrateConsensus } from "@/lib/narrate";
import { useManifest } from "@/lib/store";
import { CopyField } from "@/components/CopyField";
import { Narration } from "@/components/Narration";

const VOTE_META: Record<
  string,
  { label: string; color: string; shape: string }
> = {
  agree: { label: "agree", color: "var(--green-ink)", shape: "vote-shape-agree" },
  disagree: { label: "disagree", color: "var(--red)", shape: "vote-shape-disagree" },
  idle: { label: "idle", color: "var(--ink-soft)", shape: "vote-shape-idle" },
  timeout: { label: "timeout", color: "var(--band-fair)", shape: "vote-shape-timeout" },
};

function voteMeta(vote: string) {
  return VOTE_META[vote] ?? { label: vote, color: "var(--ink-soft)", shape: "vote-shape-idle" };
}

export function VerificationView({ domainId }: { domainId: string }) {
  const result = useManifest(domainId);
  if (result === null) return <p className="mono muted">Loading receipt...</p>;
  if (!result.ok) {
    return (
      <div className="error-card mono">
        <strong>{domainId}</strong>: {result.error}
      </div>
    );
  }
  return <VerificationBody manifest={result.manifest} domainId={domainId} />;
}

function VerificationBody({ manifest, domainId }: { manifest: Manifest; domainId: string }) {
  const found = firstConsensusStep(manifest);

  return (
    <div>
      <h1 className="display" style={{ marginBottom: 2 }}>
        On-chain verification
      </h1>
      <p className="muted" style={{ marginTop: 0, maxWidth: 720 }}>
        The reward is not a local number. A leader validator scores the action with an LLM, then a
        committee votes on whether that score is acceptable under a stated equivalence principle.
        Validators vote agree, disagree, idle, or timeout; they do not each publish their own
        number. This is the recorded receipt.
      </p>

      {!found ? (
        <div className="placeholder" style={{ marginTop: 16 }}>
          No on-chain consensus step is recorded for this domain yet.
        </div>
      ) : (
        <Receipt
          manifest={manifest}
          domainId={domainId}
          consensus={found.step.consensus as Consensus}
          action={found.step.action.label}
          tx={found.step.tx}
        />
      )}
    </div>
  );
}

function Receipt({
  manifest,
  domainId,
  consensus,
  action,
  tx,
}: {
  manifest: Manifest;
  domainId: string;
  consensus: Consensus;
  action: string;
  tx: { hash: string; explorer?: string; elapsed_s?: number } | undefined;
}) {
  const agreed = reachedMajority(consensus);
  const tally = tallyVotes(consensus);

  return (
    <div style={{ marginTop: 16 }}>
      <Narration text={narrateConsensus(consensus)} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <span className={`outcome-badge ${agreed ? "outcome-majority" : "outcome-none"}`}>
          {agreed ? "majority agreed" : "no majority"}
        </span>
        <span className="mono muted" style={{ fontSize: 13 }}>
          judged action: {action}
        </span>
      </div>

      <div className="receipt-grid">
        <div className="panel">
          <div className="stat-label">Leader</div>
          <div className="mono" style={{ fontSize: 13, marginBottom: 6 }}>
            {consensus.leader_model ?? "unknown model"}
          </div>
          <div className="readout-lg" style={{ marginBottom: 8 }}>
            {consensus.leader_score !== undefined ? consensus.leader_score.toFixed(2) : "n/a"}
            <span className="mono muted" style={{ fontSize: 13, marginLeft: 8 }}>
              score on {manifest.reward.scale[0]} to {manifest.reward.scale[1]}
            </span>
          </div>
          {consensus.leader_reason && <p className="reason">{consensus.leader_reason}</p>}

          <div className="stat-label" style={{ marginTop: 16 }}>
            Equivalence principle
          </div>
          <div className="principle-box">{manifest.reward.principle}</div>
          {consensus.tolerance !== undefined && (
            <p className="mono muted" style={{ fontSize: 12, marginTop: 6 }}>
              tolerance {consensus.tolerance}
            </p>
          )}
        </div>

        <div>
          <div className="panel" style={{ marginBottom: 14 }}>
            <div className="stat-label">Validator committee</div>
            <TallyBar tally={tally} />
            <div className="mono muted" style={{ fontSize: 12, marginBottom: 10 }}>
              {tally.agree} agree &middot; {tally.disagree} disagree &middot; {tally.idle} idle
              &middot; {tally.timeout} timeout &middot; {tally.total} total
            </div>
            {consensus.validators.map((v, i) => (
              <ValidatorLine key={i} v={v} />
            ))}
          </div>

          <div className="panel">
            <div className="stat-label">Transaction</div>
            {tx ? (
              <div className="mono" style={{ fontSize: 13 }}>
                <CopyField label="hash" value={tx.hash} />
                <div className="kv-row">
                  <span className="muted">chain</span>
                  <span>{manifest.contract.chain}</span>
                </div>
                {tx.elapsed_s !== undefined && (
                  <div className="kv-row">
                    <span className="muted">consensus time</span>
                    <span>{tx.elapsed_s}s</span>
                  </div>
                )}
                <CopyField label="contract" value={manifest.contract.address} />
              </div>
            ) : (
              <p className="mono muted" style={{ margin: 0 }}>
                no transaction recorded
              </p>
            )}
            <p className="mono muted" style={{ fontSize: 11, marginTop: 8 }}>
              studionet has no public explorer; the hash and address are shown in full to copy.
            </p>
            <div style={{ marginTop: 12 }}>
              <Link className="chip" href={`/${domainId}/episode/`}>
                see this step in context
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TallyBar({
  tally,
}: {
  tally: { agree: number; disagree: number; idle: number; timeout: number; total: number };
}) {
  const total = tally.total || 1;
  const segs = [
    { key: "agree", n: tally.agree, color: "var(--green-ink)" },
    { key: "disagree", n: tally.disagree, color: "var(--red)" },
    { key: "timeout", n: tally.timeout, color: "var(--band-fair)" },
    { key: "idle", n: tally.idle, color: "var(--grid-line)" },
  ];
  return (
    <div className="tally-bar" role="img" aria-label={`${tally.agree} of ${tally.total} validators agreed`}>
      {segs
        .filter((s) => s.n > 0)
        .map((s) => (
          <div
            key={s.key}
            className="tally-seg"
            style={{ width: `${(s.n / total) * 100}%`, background: s.color }}
          />
        ))}
    </div>
  );
}

function ValidatorLine({ v }: { v: ValidatorVote }) {
  const meta = voteMeta(v.vote);
  return (
    <div className="validator-row" style={{ borderLeftColor: meta.color }}>
      <span className="vote-badge" style={{ color: meta.color }}>
        <span className={`vote-shape ${meta.shape}`} aria-hidden="true" />
        {meta.label}
      </span>
      <span className="validator-model" title={v.model ?? "no model"}>
        {v.model ?? "(no model reported)"}
      </span>
    </div>
  );
}
