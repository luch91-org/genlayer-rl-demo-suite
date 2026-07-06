import type { ReactNode } from "react";
import { GenericState } from "./GenericState";
import type { StateRendererProps } from "./types";

/**
 * Diplomatic Interpreter state. The one field the recorded runs actually carry
 * is `polarization` (0 = agreement, 1 = maximal split). We show it as a labelled
 * meter so the mediator's progress is legible; any other keys fall through to
 * the generic renderer so nothing is hidden.
 */
export function InterpreterState({ state, which }: StateRendererProps): ReactNode {
  const polarization = state.polarization;
  const { polarization: _omit, ...rest } = state;

  return (
    <div>
      {typeof polarization === "number" && (
        <PolarizationMeter value={polarization} which={which} />
      )}
      {Object.keys(rest).length > 0 && (
        <div style={{ marginTop: 10 }}>
          <GenericState state={rest} which={which} />
        </div>
      )}
    </div>
  );
}

function PolarizationMeter({
  value,
  which,
}: {
  value: number;
  which?: "before" | "after";
}): ReactNode {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  // Lower polarization is better, so a low meter reads "strong".
  const token = pct <= 33 ? "--band-strong" : pct <= 66 ? "--band-fair" : "--band-poor";
  const label = pct <= 33 ? "low" : pct <= 66 ? "moderate" : "high";

  return (
    <div>
      <div
        className="mono"
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
      >
        <span style={{ color: "var(--ink-soft)" }}>
          polarization{which ? ` (${which})` : ""}
        </span>
        <span>
          {value.toFixed(2)} &middot; {label}
        </span>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={value}
        aria-label={`polarization ${label}`}
        style={{
          height: 10,
          borderRadius: 5,
          background: "var(--grid-line)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: `var(${token})`,
          }}
        />
      </div>
    </div>
  );
}
