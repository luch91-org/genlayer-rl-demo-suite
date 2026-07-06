import type { ReactNode } from "react";
import type { StateRendererProps } from "./types";

/**
 * Fallback renderer for any domain state we have no bespoke view for. Renders a
 * flat definition list; nested objects and arrays are shown as compact JSON so
 * nothing is silently dropped.
 */
export function GenericState({ state }: StateRendererProps): ReactNode {
  const entries = Object.entries(state);
  if (entries.length === 0) {
    return (
      <p className="mono" style={{ color: "var(--ink-soft)", margin: 0 }}>
        no state recorded for this step
      </p>
    );
  }
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
        gap: "4px 14px",
        margin: 0,
      }}
    >
      {entries.map(([key, value]) => (
        <div key={key} style={{ display: "contents" }}>
          <dt className="mono" style={{ color: "var(--ink-soft)" }}>
            {key}
          </dt>
          <dd className="mono" style={{ margin: 0 }}>
            {formatValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
