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

## Next interface pass: direct screen reuse, not another custom design

Use one actual reference screen per workflow. Keep its component geometry, spacing, typography and interaction structure; change domain data, project branding and the adapter only. Do not combine multiple unrelated reference aesthetics. Where upstream source is reused, retain the applicable license and notices; do not copy proprietary code or logos. An upstream component stylesheet alone is not a complete screen transplant.

- NorthStar: Cockpit Machines / Overview, using the actual Cockpit/PatternFly page components; host and command adapters remain NorthStar's.
- Kestrel: Jaeger UI TracePage / TraceTimelineViewer, actual upstream React screen rather than only span CSS. Map real Kestrel events to spans without inventing durations; keep replay controls as a separate extension.
- Aster: Dalibo PEV2's actual full-screen plan explorer, with Aster ranking as a separate workspace. No invented replacement visualization.
- AXON: Human Benchmark's focused test screen, Brilliant's exercise selection, Aimlabs' results view and Lichess's practice/competition layout. Treat each as a specific screen, not a blended aesthetic. Local data only until real services are connected.
- Study Hub: use the official deployed product and its own frontend components, not a lookalike student dashboard. Keep public source/case-study links and the existing authentication boundary.

Acceptance: capture side-by-side browser screenshots of each chosen reference and the implementation, and check actual interactions. A design is not accepted merely because static checks pass.

## Direct-screen pass
Aster uses the actual PEV2 component full-screen; ranking is a separate workspace. AXON has separate Brilliant-style selection, Human Benchmark-style focus and Aimlabs-style results screens, using only measured results. NorthStar adopts Cockpit's Usage render structure with PatternFly progress bars and retains its simulated backend. Kestrel exports recorded spans in OTLP JSON for Jaeger file upload; full upstream frontend is not yet embedded. Study Hub now opens the real product and retains its case study separately. These changes are not verified pixel-identical ports. Homepage files unchanged.
