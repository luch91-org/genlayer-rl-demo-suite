#!/usr/bin/env node
/*
 * Pull each domain repo's emitted manifest.json into public/data, so the four
 * agent repositories are the source of truth and this suite stays a pure
 * reader. The vendored copies remain committed, so the suite still builds
 * standalone and offline; this script just refreshes them.
 *
 * By default it looks for the four repos as siblings of this one. Point it
 * elsewhere with REPOS_DIR. After syncing, run `npm test` to validate the
 * refreshed manifests against the schema.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const suiteRoot = resolve(here, "..");
const reposDir = process.env.REPOS_DIR ? resolve(process.env.REPOS_DIR) : resolve(suiteRoot, "..");

const DOMAINS = [
  { id: "crisis", repo: "genlayer-rl-crisis-negotiator" },
  { id: "immunologist", repo: "genlayer-rl-protocol-immunologist" },
  { id: "heretic", repo: "genlayer-rl-scientific-heretic" },
  { id: "interpreter", repo: "genlayer-rl-diplomatic-interpreter" },
];

let failed = 0;
for (const { id, repo } of DOMAINS) {
  const src = join(reposDir, repo, "manifest.json");
  if (!existsSync(src)) {
    console.warn(`skip ${id}: no manifest at ${src}`);
    failed++;
    continue;
  }
  const raw = readFileSync(src, "utf-8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error(`skip ${id}: ${repo}/manifest.json is not valid JSON (${e.message})`);
    failed++;
    continue;
  }
  if (parsed?.domain?.id !== id) {
    console.error(`skip ${id}: manifest domain.id is "${parsed?.domain?.id}", expected "${id}"`);
    failed++;
    continue;
  }
  writeFileSync(join(suiteRoot, "public", "data", `${id}.json`), raw);
  console.log(`synced ${id} from ${repo}`);
}

if (failed > 0) {
  console.error(`${failed} domain(s) not synced; see messages above`);
  process.exit(1);
}
console.log("all four manifests synced. run: npm test");
