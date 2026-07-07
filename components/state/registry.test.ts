import { describe, expect, it } from "vitest";
import { CrisisState } from "./CrisisState";
import { GenericState } from "./GenericState";
import { InterpreterState } from "./InterpreterState";
import { getStateRenderer, hasStateRenderer } from "./registry";

describe("StateRendererRegistry", () => {
  it("returns the bespoke renderer for a registered domain", () => {
    expect(getStateRenderer("interpreter")).toBe(InterpreterState);
    expect(hasStateRenderer("interpreter")).toBe(true);
    expect(getStateRenderer("crisis")).toBe(CrisisState);
    expect(hasStateRenderer("crisis")).toBe(true);
  });

  it("falls back to the generic renderer for unregistered domains", () => {
    expect(getStateRenderer("unknown-domain")).toBe(GenericState);
    expect(hasStateRenderer("unknown-domain")).toBe(false);
  });
});
