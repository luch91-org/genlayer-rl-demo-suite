/*
 * The manifest is the architectural backbone. Every domain publishes one
 * manifest.json; the dashboard renders generically from it. The ONLY
 * domain-specific code is a small state renderer per domain (see the registry
 * in Phase 1), chosen by domain.id, with a generic key-value fallback.
 *
 * Reality note on consensus (verified against a live studionet receipt,
 * 2026-07-05): under a comparative equivalence principle the validators VOTE
 * agree/disagree/idle/timeout on the LEADER's single number -- they do NOT each
 * emit an independent numeric score. So `consensus` carries the leader's real
 * numeric score plus each validator's {model, vote}. Per-validator numeric
 * `score` is therefore optional and normally absent; do not invent it.
 */

import { z } from "zod";

export const DomainSchema = z.object({
  id: z.string(),
  name: z.string(),
  plain_name: z.string(),
  plain_blurb: z.string(),
  world: z.string(),
});

export const ProvenanceSchema = z.object({
  repo: z.string(),
  commit: z.string(),
  sdk: z.string(),
  runner_pin: z.string(),
  generated_at: z.string(),
});

export const ContractSchema = z.object({
  address: z.string(),
  chain: z.string(),
  explorer: z.string().optional(),
});

export const RewardSchema = z.object({
  // "llm_comparative" = judged by the LLM committee; "deterministic" domains
  // may still describe a fixed rule here.
  kind: z.string(),
  scale: z.tuple([z.number(), z.number()]),
  principle: z.string(),
  prompt_template: z.string().optional(),
});

const SeriesPointSchema = z.object({ i: z.number(), reward: z.number() });
const EpsilonPointSchema = z.object({ i: z.number(), value: z.number() });

export const LearningSchema = z.object({
  rolling_window: z.number().default(20),
  episodes: z.array(SeriesPointSchema),
  epsilon: z.array(EpsilonPointSchema).optional(),
  baselines: z
    .object({
      random: z.array(SeriesPointSchema).optional(),
      greedy_only: z.array(SeriesPointSchema).optional(),
    })
    .optional(),
});

export const ActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  args: z.record(z.unknown()).optional(),
});

// state_before / state_after are OPAQUE to the app except through the domain's
// registered renderer. Keep them as free records.
const StateSchema = z.record(z.unknown());

export const ValidatorVoteSchema = z.object({
  // A validator that went idle or timed out may report no model.
  model: z.string().nullable().optional(),
  vote: z.enum(["agree", "disagree", "idle", "timeout"]).or(z.string()),
  // Per-validator numeric score does not exist under comparative eq; optional,
  // normally absent. Only present if a domain genuinely produces it.
  score: z.number().optional(),
  within: z.boolean().optional(),
});

export const ConsensusSchema = z.object({
  outcome: z.enum(["MAJORITY", "NO_MAJORITY"]).or(z.string()),
  tolerance: z.number().optional(),
  leader_model: z.string().nullable().optional(),
  leader_score: z.number().optional(),
  leader_reason: z.string().optional(),
  validators: z.array(ValidatorVoteSchema).default([]),
});

export const TxSchema = z.object({
  hash: z.string(),
  explorer: z.string().optional(),
  elapsed_s: z.number().optional(),
});

export const PolicyEntrySchema = z.object({
  action: z.string(),
  q: z.number(),
  chosen: z.boolean().optional(),
});

export const NoteSchema = z.object({
  text: z.string(),
  source: z.string().optional(),
});

export const StepSchema = z.object({
  i: z.number(),
  action: ActionSchema,
  state_before: StateSchema.optional(),
  state_after: StateSchema.optional(),
  reward: z.number(),
  // "llm" steps are judged by the committee; "deterministic" steps got their
  // score from a fixed rule and carry no consensus.
  reward_kind: z.enum(["llm", "deterministic"]).default("llm"),
  reason: z.string().optional(),
  consensus: ConsensusSchema.optional(),
  tx: TxSchema.optional(),
  epsilon: z.number().optional(),
  policy: z.array(PolicyEntrySchema).optional(),
  notes: z.array(NoteSchema).optional(),
  // Honesty flag: true when any field on this step is illustrative rather than
  // captured from a real run. The UI must surface this, never hide it.
  illustrative: z.boolean().optional(),
});

export const EpisodeSchema = z.object({
  i: z.number(),
  steps: z.array(StepSchema),
});

export const RunSchema = z.object({
  id: z.string(),
  mode: z.enum(["live", "replay", "mock"]).or(z.string()),
  label: z.string(),
  episodes: z.array(EpisodeSchema),
});

export const ManifestSchema = z.object({
  schema_version: z.string(),
  domain: DomainSchema,
  provenance: ProvenanceSchema,
  contract: ContractSchema,
  reward: RewardSchema,
  learning: LearningSchema,
  runs: z.array(RunSchema).default([]),
});

export type Manifest = z.infer<typeof ManifestSchema>;
export type Domain = z.infer<typeof DomainSchema>;
export type LearningSchemaShape = z.infer<typeof LearningSchema>;
export type RewardShape = z.infer<typeof RewardSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type Tx = z.infer<typeof TxSchema>;
export type Run = z.infer<typeof RunSchema>;
export type Episode = z.infer<typeof EpisodeSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Consensus = z.infer<typeof ConsensusSchema>;
export type ValidatorVote = z.infer<typeof ValidatorVoteSchema>;
export type LearningSeriesPoint = z.infer<typeof SeriesPointSchema>;
export type PolicyEntry = z.infer<typeof PolicyEntrySchema>;
export type Note = z.infer<typeof NoteSchema>;

/** The four domains the suite ships with, in display order. */
export const DOMAIN_IDS = ["crisis", "immunologist", "heretic", "interpreter"] as const;
export type DomainId = (typeof DOMAIN_IDS)[number];
