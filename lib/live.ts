/*
 * Live on-chain read. This is the only place the suite talks to GenLayer at
 * runtime. It calls the contract's read-only views (get_state, get_score) with
 * an ephemeral account, so no key and no funds are needed. genlayer-js is
 * dynamically imported so it never weighs down the other routes.
 */

import { normalizeRecord } from "./normalize";

export interface LiveState {
  state: Record<string, unknown>;
  score: number | null;
  readAt: string;
}

const CHAINS = ["studionet", "localnet", "testnetAsimov"] as const;
type ChainName = (typeof CHAINS)[number];

function chainName(chain: string): ChainName {
  return (CHAINS as readonly string[]).includes(chain) ? (chain as ChainName) : "studionet";
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
    ),
  ]);
}

export async function readLiveState(address: string, chain: string): Promise<LiveState> {
  const { createAccount, createClient, chains } = await import("genlayer-js");
  const selected = chains[chainName(chain)];
  const client = createClient({ chain: selected, account: createAccount() });

  const addr = address as `0x${string}`;

  const rawState = await withTimeout(
    client.readContract({ address: addr, functionName: "get_state", args: [] }),
    25000,
    "reading get_state",
  );
  const state = normalizeRecord(rawState);

  let score: number | null = null;
  try {
    const rawScore = await withTimeout(
      client.readContract({ address: addr, functionName: "get_score", args: [] }),
      25000,
      "reading get_score",
    );
    score = Number(rawScore as bigint);
  } catch {
    // get_score is optional context; a failure here should not sink the read.
    score = null;
  }

  return { state, score, readAt: new Date().toISOString() };
}
