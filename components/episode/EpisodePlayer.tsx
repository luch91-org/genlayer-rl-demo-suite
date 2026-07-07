"use client";

/*
 * The episode player: a step rail plus transport controls that auto-advance
 * through a run. The selected index is owned by the parent so the world-state
 * and judge panels update in step. Autoplay is user-initiated and stops at the
 * end; speed scales the dwell time. An optional Inspect action opens the deep
 * detail drawer for the current step.
 */

import { useEffect } from "react";
import { StepRail } from "@/components/episode/StepRail";
import type { Run } from "@/lib/manifest";

const SPEEDS = [1, 2, 4] as const;
const BASE_MS = 1100;

export function EpisodePlayer({
  run,
  scale,
  index,
  onIndex,
  playing,
  onPlaying,
  speed,
  onSpeed,
  onInspect,
}: {
  run: Run;
  scale: [number, number];
  index: number;
  onIndex: (i: number) => void;
  playing: boolean;
  onPlaying: (p: boolean) => void;
  speed: number;
  onSpeed: (s: number) => void;
  onInspect?: () => void;
}) {
  const steps = run.episodes[0]?.steps ?? [];
  const atEnd = index >= steps.length - 1;
  const step = steps[index];

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      onPlaying(false);
      return;
    }
    const id = setTimeout(() => onIndex(index + 1), BASE_MS / speed);
    return () => clearTimeout(id);
  }, [playing, atEnd, index, speed, onIndex, onPlaying]);

  const togglePlay = () => {
    if (atEnd) {
      onIndex(0);
      onPlaying(true);
    } else {
      onPlaying(!playing);
    }
  };

  const elapsed = step?.tx?.elapsed_s;

  return (
    <div>
      <div className="player-controls">
        <button
          type="button"
          className="navbtn"
          onClick={() => onIndex(Math.max(0, index - 1))}
          disabled={index <= 0}
          aria-label="Previous step"
        >
          Prev
        </button>
        <button type="button" className="play-btn" onClick={togglePlay}>
          {playing ? "Pause" : atEnd ? "Replay episode" : "Play episode"}
        </button>
        <button
          type="button"
          className="navbtn"
          onClick={() => onIndex(Math.min(steps.length - 1, index + 1))}
          disabled={atEnd}
          aria-label="Next step"
        >
          Next
        </button>

        <div className="speed-group" role="group" aria-label="Playback speed">
          <span className="field-label">speed</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className="speed-btn"
              aria-pressed={s === speed}
              onClick={() => onSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <StepRail steps={steps} activeIndex={index} scale={scale} onSelect={onIndex} />

      {step && (
        <p className="player-readout mono">
          <span className="muted">action</span> {step.action.label}
          <span className="muted"> reward</span> {step.reward.toFixed(1)}
          {elapsed !== undefined && (
            <>
              <span className="muted"> logged</span> {elapsed}s
            </>
          )}
          {step.epsilon !== undefined && (
            <>
              <span className="muted"> epsilon</span> {step.epsilon.toFixed(2)}
            </>
          )}
          {onInspect && (
            <button type="button" className="inspect-btn" onClick={onInspect}>
              Inspect transaction {"→"}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
