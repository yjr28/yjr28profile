# Project interface implementation — November 24, 2026

These pages reuse actual open-source interface assets where possible. Reference products are not affiliated with the projects.

| Page | Reused source and implementation boundary |
|---|---|
| NorthStar | [PatternFly 5.4.2](https://github.com/patternfly/patternfly/tree/v5.4.2), actual CSS and documented table/nav/form/button markup, with NorthStar's existing host and command simulation. [MIT license](licenses/patternfly.txt). Not the complete Cockpit application. |
| Kestrel | [Jaeger UI](https://github.com/jaegertracing/jaeger-ui), upstream SpanBar and SpanBarRow CSS, Apache-2.0 [license](licenses/jaeger.txt), integrated with Kestrel event hierarchy, service color legend and raw event export. This is not a full Jaeger frontend fork. The Go WASM binary is pinned to a repository revision and SHA-256 verified at load. |
| Aster | [Dalibo PEV2](https://github.com/dalibo/pev2) 1.25.0, actual Vue/Bootstrap visualization library, embedded in an isolated frame using Dalibo's documented UMD API. [PostgreSQL license](licenses/pev2.txt). Paste EXPLAIN JSON to extract estimated cost, rows, sequential scans and nested loops into the Python ranking lab. Uncertainty remains a separate input. The starting sample is from the PEV2 README, not a benchmark. |
| AXON | [Actual client task engine](https://github.com/yjr28/Axon/blob/ac0f313ed0cbf4a2a296eaabdfb7ac011c3ea508/packages/engine/src/index.ts), portable JS with type annotations removed. Training flow and result presentation informed by Human Benchmark, Brilliant, Aimlabs and Lichess; no proprietary frontend source copied. Browser-only local practice; no fabricated leaderboard or server-authoritative rank. |
| Waseda Study Hub | Actual public product imagery, brand palette and mark sourced from the organization's public frontend. The portfolio page links the official site and both repositories; it does not expose private student profiles. |
| Japan Line | Existing Three.js animation, camera, train paths, clickable geometry and projected label positions preserved. Added instanced rock/blossom detail, sculpted Fuji, tiled pagoda roofs, train detail, and distinct wa-fu station labels without numbers. This is an incremental 3D geometry upgrade, not a photorealistic reproduction of the reference render. |

## Validation

Run `node tests/axon-engine.mjs` for the task-engine contract. For real browser checks, serve the portfolio on port 4173 and install Playwright with Chromium. Run `node tests/project-labs.mjs` and `node tests/homepage.mjs` (see the workflow for the exact environment). The CI browser job exercises actual runtimes, records failures, and saves desktop/mobile screenshots. Do not claim browser verification until this job succeeds.

## Evidence rules

- NorthStar data remains an explicitly labeled simulation.
- Kestrel events come from the Go engine; failure to load is not replaced with fictional spans.
- Aster's PEV2 example is illustrative; ranker outputs are estimates, not measured query execution time.
- AXON local scoring is distinct from authoritative backend scoring, ranked Arena, and clinical measurements.
- Study Hub requires university authentication for private data.
- Performance numbers must map to reproducible project benchmark evidence.
