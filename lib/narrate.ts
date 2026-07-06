/*
 * Plain-language narration. These turn the numbers on screen into a sentence a
 * newcomer can read, so the dashboard explains itself. Pure functions of data
 * already on the page, so they are unit-tested and never drift from the UI.
 */

import { rewardBand, type RewardBand } from "./adapters";
import type { Consensus, Step } from "./manifest";

const BAND_WORD: Record<RewardBand, string> = {
  poor: "a low score",
  fair: "a middling score",
  strong: "a high score",
};

/** One sentence on how much the agent improved over training. */
export function narrateLearning(
  plainName: string,
  startAvg: number,
  finalAvg: number,
  randomFinal?: number,
): string {
  const direction = finalAvg >= startAvg ? "climbed" : "fell";
  const base = `Over training, the ${plainName} agent's average reward ${direction} from ${startAvg.toFixed(
    1,
  )} to ${finalAvg.toFixed(1)}.`;
  if (randomFinal === undefined) return base;
  const gap = finalAvg - randomFinal;
  const comp =
    gap >= 0
      ? `That is ${gap.toFixed(1)} points above a random agent, so it learned something real.`
      : `That is below a random agent, so it has not learned yet.`;
  return `${base} ${comp}`;
}

/** One sentence describing what happened on a single step. */
export function narrateStep(
  step: Step,
  scale: [number, number],
  index: number,
  total: number,
): string {
  const band = rewardBand(step.reward, scale);
  const judged =
    step.reward_kind === "llm" ? "the LLM committee judged it" : "a fixed rule scored it";
  const head = `Step ${index} of ${total - 1}: the agent chose "${step.action.label}", and ${judged} ${step.reward.toFixed(
    1,
  )} out of ${scale[1]} (${BAND_WORD[band]}).`;
  return step.reason ? `${head} Reason: ${step.reason}` : head;
}

/** One sentence summarizing the on-chain consensus outcome. */
export function narrateConsensus(consensus: Consensus): string {
  const agree = consensus.validators.filter((v) => v.vote === "agree").length;
  const total = consensus.validators.length;
  const outcome = consensus.outcome === "MAJORITY" ? "reached a majority" : "found no majority";
  const score =
    consensus.leader_score !== undefined ? ` on the leader's score of ${consensus.leader_score.toFixed(1)}` : "";
  return `The committee ${outcome}${score}: ${agree} of ${total} validators agreed.`;
}
