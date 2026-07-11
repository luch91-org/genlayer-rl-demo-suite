/*
 * Explorer links for studionet.
 *
 * The public explorer is live at https://explorer-studio.genlayer.com,
 * following the explorer-{network}.genlayer.com pattern. Confirmed by hand on
 * 2026-07-11 by loading real deployed addresses in a browser:
 *   /address/{addr}   renders the contract page (balance, tx count)  [we use this]
 *   /contracts/{addr} renders the same contract page
 *   /tx/{hash}        renders the transaction details
 * Both /address/ and /contracts/ resolve to the contract page; the spec calls
 * for /address/, which is confirmed working.
 *
 * Honesty note: the manifests still carry an `explorer` field built on the old
 * host explorer-studionet.genlayerlabs.com, which currently returns 503 (dead).
 * We therefore trust a manifest-provided explorer URL only when it is on a
 * known-live host, and otherwise derive the link from the confirmed base. That
 * keeps the "prefer the per-tx explorer field" intent without reintroducing the
 * dead links this restore exists to fix.
 */

const EXPLORER_BASE = "https://explorer-studio.genlayer.com";
const LIVE_HOSTS = new Set(["explorer-studio.genlayer.com"]);

function liveExplorer(url: string | undefined): url is string {
  if (!url) return false;
  try {
    return LIVE_HOSTS.has(new URL(url).host);
  } catch {
    return false;
  }
}

/** Explorer link for a transaction, preferring a live manifest value. */
export function explorerTxUrl(hash: string, provided?: string): string {
  return liveExplorer(provided) ? provided : `${EXPLORER_BASE}/tx/${hash}`;
}

/** Explorer link for a contract address, preferring a live manifest value. */
export function explorerAddressUrl(address: string, provided?: string): string {
  return liveExplorer(provided) ? provided : `${EXPLORER_BASE}/address/${address}`;
}
