# GenLayer RL Demo Suite

One hosted dashboard for watching four reinforcement-learning agents learn
human-like judgment from an on-chain LLM committee on GenLayer.

Each agent lives in its own repository and publishes a single `manifest.json`
describing its contract, reward function, learning curve, and recorded runs.
This suite is a pure reader of those manifests. It never imports source from the
four domain repositories; the dependency points one way, from the suite to the
published artifacts.

## Domains

| Tab | Repository | The agent learns to |
|---|---|---|
| Crisis Negotiator | `genlayer-rl-crisis-negotiator` | Dispatch drones, ambulances, and supplies without wasting capacity |
| Protocol Immunologist | `genlayer-rl-protocol-immunologist` | Pause, rotate signers, and hedge only when a threat is real |
| Scientific Heretic | `genlayer-rl-scientific-heretic` | Propose novel, falsifiable, plausible hypotheses |
| Diplomatic Interpreter | `genlayer-rl-diplomatic-interpreter` | Draft compromise text that lowers polarization |

## Architecture

The suite is manifest-driven. A zod schema (`lib/manifest.ts`) validates every
manifest at load time; the dashboard renders generically from the validated
shape. The only domain-specific code is a small state renderer per domain,
selected by `domain.id`, with a generic key-value fallback.

Under a comparative equivalence principle the validators vote
agree/disagree/idle/timeout on the leader's single numeric score. They do not
each emit an independent number. The schema and UI reflect that reality and do
not invent per-validator scores.

## Tech stack

- Next.js 15 (App Router) with static export
- TypeScript
- `genlayer-js` for live on-chain reads
- `zod` for manifest validation
- `vitest` for tests

## Development

```
npm install
npm run dev        # local dashboard
npm run typecheck  # tsc --noEmit
npm run test       # vitest
npm run build      # static export to out/
```

## Data honesty

Fixtures in `public/data` are seeded from real runs: real contract addresses,
real learning curves, and real consensus receipts captured from live studionet
transactions. Anything that could not be captured from a real run is flagged as
illustrative so the UI can surface it rather than hide it.

## License

MIT
