"use client";

/*
 * Secondary navigation, inside the domain screen rather than in the shell. The
 * header carries only the domain tabs; the per-domain views (the episode
 * instrument panel, the learning curve, the on-chain receipt, and the live
 * read) are reached from here.
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
  );
}
