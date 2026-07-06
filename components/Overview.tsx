"use client";

/*
 * Overview: the summary tab for one domain. Answers, at a glance, what the
 * agent learns, how much it improved over its baselines, what contract judges
 * it, and which runs are on record. Everything here is derived from the
 * validated manifest via the adapters.
 */

import Link from "next/link";
import { BAND_META, learningView, rewardBand, stepCount } from "@/lib/adapters";
import type { Manifest } from "@/lib/manifest";
import { narrateLearning } from "@/lib/narrate";
import { useManifest } from "@/lib/store";
import { Narration } from "./Narration";

export function Overview({ domainId }: { domainId: string }) {
  const result = useManifest(domainId);

  if (result === null) {
    return <p className="mono muted">Loading manifest...</p>;
  }
  if (!result.ok) {
    return (
      <div className="error-card mono">
        <strong>{domainId}</strong>: {result.error}
      </div>
    );
  }
  return <OverviewBody manifest={result.manifest} />;
}

function OverviewBody({ manifest }: { manifest: Manifest }) {
  const { domain, contract, reward, provenance, runs } = manifest;
  const lv = learningView(manifest.learning);
  const delta = lv.finalAverage - lv.startAverage;
  const band = rewardBand(lv.finalAverage, reward.scale);
  const bandMeta = BAND_META[band];
  const randomFinal = lv.baselines.random?.at(-1)?.reward;

  return (
    <div>
      <h1 className="display" style={{ marginBottom: 4 }}>
        {domain.plain_name}
      </h1>
      <p className="muted" style={{ margin: "0 0 10px" }}>
        {domain.name}
      </p>
      <p style={{ maxWidth: 680 }}>{domain.plain_blurb}</p>
      <p className="muted" style={{ maxWidth: 680, fontSize: 14, marginBottom: 16 }}>
        {domain.world}
      </p>

      <Narration
        text={narrateLearning(
          domain.plain_name,
          lv.startAverage,
          lv.finalAverage,
          randomFinal,
        )}
      />

      <div className="stat-grid" style={{ marginTop: 18 }}>
        <div className="stat">
          <div className="stat-label">Final avg reward</div>
          <div className="readout-lg" style={{ color: `var(${bandMeta.token})` }}>
            <span className="band-glyph" aria-hidden="true">
              {bandMeta.glyph}
            </span>{" "}
            {lv.finalAverage.toFixed(2)}
          </div>
          <div className="mono muted" style={{ fontSize: 12, marginTop: 4 }}>
            {bandMeta.label} on a {reward.scale[0]} to {reward.scale[1]} scale
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">Learning gain</div>
          <div className="readout-lg" style={{ color: delta >= 0 ? "var(--green-ink)" : "var(--red)" }}>
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(2)}
          </div>
          <div className="mono muted" style={{ fontSize: 12, marginTop: 4 }}>
            {lv.startAverage.toFixed(2)} to {lv.finalAverage.toFixed(2)} rolling
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">Gap over random</div>
          <div className="readout-lg">
            {randomFinal !== undefined ? `+${(lv.finalAverage - randomFinal).toFixed(2)}` : "n/a"}
          </div>
          <div className="mono muted" style={{ fontSize: 12, marginTop: 4 }}>
            {randomFinal !== undefined
              ? `random baseline ${randomFinal.toFixed(2)}`
              : "no baseline recorded"}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">Episodes trained</div>
          <div className="readout-lg">{lv.raw.length}</div>
          <div className="mono muted" style={{ fontSize: 12, marginTop: 4 }}>
            window {lv.window}
          </div>
        </div>
      </div>

      <h2 className="section-title">Who judges it</h2>
      <div className="panel">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span className="chip">contract {shortAddr(contract.address)}</span>
          <span className="chip">{contract.chain}</span>
          <span className="chip">reward {reward.kind}</span>
          {contract.explorer && (
            <a className="chip" href={contract.explorer} target="_blank" rel="noreferrer">
              explorer
            </a>
          )}
        </div>
        <p className="mono" style={{ fontSize: 13, marginTop: 12, marginBottom: 0 }}>
          <span className="muted">equivalence principle: </span>
          {reward.principle}
        </p>
      </div>

      <h2 className="section-title">Runs on record</h2>
      {runs.length === 0 && <p className="muted">No runs recorded.</p>}
      {runs.map((run) => (
        <div className="run-row" key={run.id}>
          <div>
            <div style={{ fontWeight: 500 }}>{run.label}</div>
            <div className="mono muted" style={{ fontSize: 12 }}>
              {run.mode} &middot; {run.episodes.length} episode(s) &middot; {stepCount(run)} step(s)
            </div>
          </div>
          <Link className="chip" href={`/${domain.id}/episode/?run=${encodeURIComponent(run.id)}`}>
            open
          </Link>
        </div>
      ))}

      <h2 className="section-title">Provenance</h2>
      <div className="panel mono" style={{ fontSize: 12 }}>
        <div>
          <span className="muted">repo </span>
          {provenance.repo}
        </div>
        <div>
          <span className="muted">commit </span>
          {provenance.commit.slice(0, 10)}
        </div>
        <div>
          <span className="muted">sdk </span>
          {provenance.sdk}
        </div>
        <div>
          <span className="muted">runner pin </span>
          {provenance.runner_pin}
        </div>
        <div>
          <span className="muted">generated </span>
          {provenance.generated_at}
        </div>
      </div>
    </div>
  );
}

function shortAddr(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
