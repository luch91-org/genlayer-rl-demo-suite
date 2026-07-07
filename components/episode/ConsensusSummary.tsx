"use client";

/*
 * Compact on-chain consensus summary for a single step: the outcome, the leader
 * score, the validator tally, and a link into the full Verification receipt.
 * Shown only for steps that were LLM-judged (i.e. carry a consensus).
 */

import Link from "next/link";
import { reachedMajority, tallyVotes } from "@/lib/adapters";
import type { Consensus } from "@/lib/manifest";

export function ConsensusSummary({
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
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
