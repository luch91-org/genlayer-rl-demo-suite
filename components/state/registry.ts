/*
 * StateRendererRegistry: the single seam for domain-specific UI.
 *
 * The dashboard is otherwise fully generic over the manifest. When a step
 * carries domain state, the app looks up a renderer by domain.id here. Adding a
 * new domain means registering one entry; anything unregistered falls back to
 * the generic key-value renderer, so the app never breaks on an unknown domain.
 */

import { CrisisState } from "./CrisisState";
import { GenericState } from "./GenericState";
import { InterpreterState } from "./InterpreterState";
import type { StateRenderer } from "./types";

const REGISTRY: Record<string, StateRenderer> = {
  // Crisis renders zones and resources; Interpreter renders its polarization
  // meter. Domains without a bespoke renderer use the generic key-value view.
  crisis: CrisisState,
  interpreter: InterpreterState,
};

/** Return the renderer for a domain, or the generic fallback. */
export function getStateRenderer(domainId: string): StateRenderer {
  return REGISTRY[domainId] ?? GenericState;
}

/** True when a domain has a bespoke renderer (not the generic fallback). */
export function hasStateRenderer(domainId: string): boolean {
  return domainId in REGISTRY;
}

export { GenericState } from "./GenericState";
export type { StateRenderer, StateRendererProps } from "./types";
