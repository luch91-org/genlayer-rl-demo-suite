import type { ReactNode } from "react";
import type { StateRendererProps } from "./types";

/**
 * Fallback renderer for any domain state we have no bespoke view for. Renders a
 * definition list; nested objects expand one level as their own list so live
 * on-chain state (dict of dicts) stays readable. Nothing is dropped.
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
  return <KeyValue entries={entries} depth={0} />;
}

function KeyValue({ entries, depth }: { entries: [string, unknown][]; depth: number }) {
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
            {renderValue(value, depth)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function renderValue(value: unknown, depth: number): ReactNode {
  if (isPlainObject(value) && depth < 2) {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    return (
      <div style={{ paddingLeft: 8, borderLeft: "1px solid var(--grid-line)" }}>
        <KeyValue entries={entries} depth={depth + 1} />
      </div>
    );
  }
  return <span>{formatScalar(value)}</span>;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function formatScalar(value: unknown): string {
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
