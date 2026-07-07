"use client";

/* The deployed contract address with a copy button and an explorer link. */

import { useState } from "react";

export function ContractChip({ address, explorer }: { address: string; explorer?: string }) {
  const [copied, setCopied] = useState(false);
  const short = address.length > 12 ? `${address.slice(0, 8)}…${address.slice(-4)}` : address;

  const copy = () => {
    navigator.clipboard?.writeText(address).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => setCopied(false),
    );
  };

  return (
    <span className="contract-chip">
      <span className="contract-dot" aria-hidden="true" />
      <span className="mono">{short}</span>
      <button type="button" className="chip-icon" onClick={copy} aria-label="Copy contract address">
        {copied ? "ok" : "copy"}
      </button>
      {explorer && (
        <a className="chip-icon" href={explorer} target="_blank" rel="noreferrer" aria-label="Open in explorer">
          open
        </a>
      )}
    </span>
  );
}
