"use client";

/*
 * Horizontal selector for the steps in an episode. Each chip shows the step
 * index and its reward, colored and glyphed by reward band so the shape of a
 * run is readable at a glance without relying on color alone.
 */

import { BAND_META, rewardBand } from "@/lib/adapters";
import type { Step } from "@/lib/manifest";

export function StepRail({
  steps,
  activeIndex,
  scale,
  onSelect,
}: {
  steps: Step[];
  activeIndex: number;
  scale: [number, number];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="step-rail" role="tablist" aria-label="Steps in this episode">
      {steps.map((step, i) => {
        const band = rewardBand(step.reward, scale);
        const meta = BAND_META[band];
        return (
          <button
            key={i}
            type="button"
            role="tab"
            className="step-chip"
            aria-current={i === activeIndex}
            aria-label={`step ${i}, reward ${step.reward}, ${meta.label}`}
            onClick={() => onSelect(i)}
          >
            <span className="idx">#{i}</span>
            <span className="val" style={{ color: `var(${meta.token})` }}>
              <span aria-hidden="true">{meta.glyph}</span> {step.reward}
            </span>
          </button>
        );
      })}
    </div>
  );
}
