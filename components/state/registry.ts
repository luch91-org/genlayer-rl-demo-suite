/*
 * StateRendererRegistry: the single seam for domain-specific UI.
 *
 * The dashboard is otherwise fully generic over the manifest. When a step
 * carries domain state, the app looks up a renderer by domain.id here. Adding a
 * new domain means registering one entry; anything unregistered falls back to
 * the generic key-value renderer, so the app never breaks on an unknown domain.
 */

import { GenericState } from "./GenericState";
import { InterpreterState } from "./InterpreterState";
import type { StateRenderer } from "./types";

const REGISTRY: Record<string, StateRenderer> = {
  // Diplomatic Interpreter is the only domain whose recorded runs carry state
  // (polarization). The others use the generic renderer until they publish
  // richer state in their manifests.
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
