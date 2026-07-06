/*
 * Honest placeholder for a view that is routed and reachable but not yet built.
 * Every tab in the shell leads somewhere real; unfinished views say so plainly
 * rather than rendering a blank page.
 */

const BLURB: Record<string, string> = {
  episode: "Step through a run: action, state, reward, and the judge's reasoning.",
  learning: "The reward curve climbing over training, against random and greedy baselines.",
  verification: "The on-chain receipt: leader score, validator votes, and the transaction.",
  live: "Read the deployed contract's current state directly from GenLayer.",
};

export function ViewPlaceholder({ view }: { view: string }) {
  const label = view.charAt(0).toUpperCase() + view.slice(1);
  return (
    <div className="placeholder">
      <div className="display" style={{ fontSize: 18, marginBottom: 8 }}>
        {label}
      </div>
      <p style={{ margin: "0 auto", maxWidth: 460 }}>
        {BLURB[view] ?? "This view is not built yet."}
      </p>
      <p className="mono muted" style={{ fontSize: 12, marginTop: 10 }}>
        not built yet
      </p>
    </div>
  );
}
