"use client";

/*
 * The deployed contract address. The chip reveals the full address in place for
 * the reviewer to copy or share, and links out to the studionet explorer. The
 * status dot tracks the global mode: green in Replay, red in Live.
 */

import { useState } from "react";
import { CopyButton } from "./CopyField";
import { explorerAddressUrl } from "@/lib/explorer";
import { useMode } from "@/lib/store";

export function ContractChip({ address }: { address: string }) {
  const [revealed, setRevealed] = useState(false);
  const [mode] = useMode();
  const short = address.length > 12 ? `${address.slice(0, 8)}…${address.slice(-4)}` : address;
  const dot = mode === "live" ? "var(--red)" : "var(--green-ink)";

  return (
    <span className="contract-chip">
      <span className="contract-dot" style={{ background: dot }} aria-hidden="true" />
      <span className="mono contract-addr">{revealed ? address : short}</span>
      <CopyButton value={address} label="contract address" />
      <button
        type="button"
        className="chip-icon"
        onClick={() => setRevealed((r) => !r)}
        aria-expanded={revealed}
        aria-label={revealed ? "Hide full contract address" : "Reveal full contract address"}
      >
        {revealed ? "hide" : "reveal"}
      </button>
      <a
        className="chip-icon"
        href={explorerAddressUrl(address)}
        target="_blank"
        rel="noreferrer"
        aria-label="Open contract in the studionet explorer"
      >
        explorer
      </a>
    </span>
  );
}
