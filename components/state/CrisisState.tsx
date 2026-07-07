import type { ReactNode } from "react";
import { GenericState } from "./GenericState";
import type { StateRendererProps } from "./types";

/*
 * Crisis Response world state: three zones by status and the remaining
 * resources. Works for both the deterministic rollout (state_after) and a live
 * get_state read, since both carry the same resources / zone_status shape. Any
 * other keys fall through to the generic renderer so nothing is hidden.
 */

const ZONE_LABEL: Record<string, string> = {
  zone_a: "Zone A",
  zone_b: "Zone B",
  zone_c: "Zone C",
};

// Starting capacities, used only for the "x of y" denominators.
const RESOURCE_MAX: Record<string, number> = {
  drones: 5,
  ambulances: 3,
  supply_kits: 20,
};

const RESOURCE_LABEL: Record<string, string> = {
  drones: "Drones",
  ambulances: "Ambulances",
  supply_kits: "Supply Kits",
};

// status -> token + readable word. Color is paired with the word, never alone.
const STATUS: Record<string, { token: string; word: string }> = {
  critical: { token: "--red", word: "Critical" },
  moderate: { token: "--blue", word: "Moderate" },
  stable: { token: "--green-ink", word: "Stable" },
  evacuated: { token: "--ink-soft", word: "Evacuated" },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

export function CrisisState({ state }: StateRendererProps): ReactNode {
  const zones = isRecord(state.zone_status) ? state.zone_status : null;
  const resources = isRecord(state.resources) ? state.resources : null;

  if (!zones && !resources) {
    return <GenericState state={state} />;
  }

  return (
    <div>
      {zones && (
        <div className="zone-grid">
          {Object.entries(zones).map(([id, raw]) => {
            const status = String(raw);
            const meta = STATUS[status] ?? { token: "--ink-soft", word: status };
            return (
              <div key={id} className="zone-card" style={{ borderColor: `var(${meta.token})` }}>
                <div className="zone-name">{ZONE_LABEL[id] ?? id}</div>
                <div className="zone-status" style={{ color: `var(${meta.token})` }}>
                  {meta.word}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resources && (
        <div className="resource-grid">
          {Object.entries(resources).map(([id, raw]) => {
            const count = Number(raw);
            const max = RESOURCE_MAX[id];
            return (
              <div key={id} className="resource-card">
                <div className="resource-name">{RESOURCE_LABEL[id] ?? id}</div>
                <div className="resource-count">
                  {count}
                  {max !== undefined && <span className="resource-max">/{max}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
