"use client";

/*
 * Secondary navigation, inside the domain screen rather than in the shell. A
 * back link returns to the all-agents overview, then a row of the per-domain
 * views: the episode instrument panel, the learning curve, the on-chain
 * receipt, and the live read. Shown on every domain view so getting back and
 * moving between views works the same everywhere.
 */

import Link from "next/link";
import { VIEWS, type View } from "@/lib/select";

const LABELS: Record<View, string> = {
  episode: "Instrument panel",
  learning: "Learning curve",
  verification: "On-chain receipt",
  live: "Live read",
};

export function ViewNav({ domainId, view }: { domainId: string; view: View }) {
  return (
    <div className="view-nav-bar">
      <Link href="/" className="back-link">
        <span aria-hidden="true">←</span> All agents
      </Link>
      <nav className="view-nav" aria-label="Views for this agent">
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={`/${domainId}/${v}/`}
            className="view-nav-link"
            aria-current={v === view ? "page" : undefined}
          >
            {LABELS[v]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
