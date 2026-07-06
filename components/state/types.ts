import type { ReactNode } from "react";

/**
 * A state renderer turns a domain's opaque state record into readable UI.
 * The app selects one by domain.id; anything unregistered gets the generic
 * key-value renderer. The manifest keeps state_before / state_after opaque, so
 * this registry is the ONLY place that knows what a given domain's state means.
 */
export interface StateRendererProps {
  /** Opaque per-domain state (state_before or state_after). May be empty. */
  state: Record<string, unknown>;
  /** Which snapshot this is, for labelling. */
  which?: "before" | "after";
}

export type StateRenderer = (props: StateRendererProps) => ReactNode;
