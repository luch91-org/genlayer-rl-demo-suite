"use client";

/*
 * Copy helpers used wherever an address or transaction hash appears. GenLayer
 * studionet has no public block explorer, so nothing here links out. Instead we
 * show the full value in place, selectable, with a one-click copy so a reviewer
 * can copy or share it. This is the honest substitute for a dead explorer link.
 */

import { useState } from "react";

export function CopyButton({
  value,
  label = "copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => setCopied(false),
    );
  };
  return (
    <button
      type="button"
      className="chip-icon"
      onClick={copy}
      aria-label={`Copy ${label}`}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

/**
 * A labelled key/value row showing the full value in mono type with a copy
 * button. No truncation and no link: the value is here to be copied or shared.
 */
export function CopyField({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="copy-field">
      <span className="muted copy-field-label">{label}</span>
      <span className="mono copy-field-value">{value}</span>
      {suffix && <span className="mono muted copy-field-suffix">{suffix}</span>}
      <CopyButton value={value} label={label} />
    </div>
  );
}
