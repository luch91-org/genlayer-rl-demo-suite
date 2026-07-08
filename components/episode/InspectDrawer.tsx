"use client";

/*
 * Deep detail for one step, in a slide-in drawer so the main screen stays
 * compact. Holds the raw before/after state, the exact reward and scale, how it
 * was scored, timing, epsilon, and the transaction/contract identifiers. Since
 * studionet has no public explorer, the hash and address are shown in full to
 * copy rather than linked out. Closes on the button, the scrim, or Escape, and
 * returns focus to whatever opened it.
 */

import { useEffect, useRef } from "react";
import type { Step } from "@/lib/manifest";
import { CopyField } from "@/components/CopyField";
import { getStateRenderer } from "@/components/state/registry";

export function InspectDrawer({
  open,
  onClose,
  step,
  domainId,
  scale,
  contractAddress,
  chain,
}: {
  open: boolean;
  onClose: () => void;
  step: Step | undefined;
  domainId: string;
  scale: [number, number];
  contractAddress: string;
  chain: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const StateRenderer = getStateRenderer(domainId);

  // Capture the opener on open and move focus into the drawer; restore it on
  // close. Escape closes from anywhere while open.
  useEffect(() => {
    if (!open) return;
    openerRef.current = (document.activeElement as HTMLElement) ?? null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleClose = () => {
    onClose();
    openerRef.current?.focus();
  };

  return (
    <>
      <div
        className={`inspect-scrim${open ? " open" : ""}`}
        onClick={handleClose}
        aria-hidden="true"
      />
      <aside
        className={`inspect-drawer${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Step detail"
        aria-hidden={!open}
      >
        <div className="drawer-head">
          <span className="cr-panel-title">Step detail</span>
          <button
            ref={closeRef}
            type="button"
            className="drawer-close"
            onClick={handleClose}
            aria-label="Close detail"
          >
            {"×"}
          </button>
        </div>

        {step && (
          <div className="drawer-body">
            <div className="drawer-states">
              <div className="drawer-state-col">
                <div className="stat-label">state before</div>
                {step.state_before ? (
                  <StateRenderer state={step.state_before} which="before" />
                ) : (
                  <p className="mono muted" style={{ margin: 0 }}>
                    not recorded
                  </p>
                )}
              </div>
              <div className="drawer-arrow" aria-hidden="true">
                {"↓"}
              </div>
              <div className="drawer-state-col">
                <div className="stat-label">state after</div>
                {step.state_after ? (
                  <StateRenderer state={step.state_after} which="after" />
                ) : (
                  <p className="mono muted" style={{ margin: 0 }}>
                    not recorded
                  </p>
                )}
              </div>
            </div>

            <dl className="drawer-facts">
              <Fact label="reward" value={`${step.reward.toFixed(2)} on ${scale[0]} to ${scale[1]}`} />
              <Fact
                label="scored by"
                value={step.reward_kind === "llm" ? "LLM committee" : "fixed rule (deterministic)"}
              />
              {step.tx?.elapsed_s !== undefined && (
                <Fact label="consensus time" value={`${step.tx.elapsed_s}s`} />
              )}
              {step.epsilon !== undefined && (
                <Fact label="exploration" value={`epsilon ${step.epsilon.toFixed(3)}`} />
              )}
              <Fact label="network" value={chain} />
            </dl>

            {step.tx && <CopyField label="tx hash" value={step.tx.hash} />}
            <CopyField label="contract" value={contractAddress} />
            <p className="mono muted" style={{ fontSize: 11, marginTop: 4 }}>
              studionet has no public explorer; identifiers are shown in full to copy.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="drawer-fact">
      <dt className="muted">{label}</dt>
      <dd className="mono">{value}</dd>
    </div>
  );
}
