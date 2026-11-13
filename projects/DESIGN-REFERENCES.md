# Design references for the project demos

These pages use interaction patterns observed in real developer tools. They do not reproduce proprietary source, logos, screenshots, brand palettes, or exact layouts.

| Project | Real product reference | Observed pattern | Implemented behavior |
| --- | --- | --- | --- |
| Kestrel | [Sentry: Trace View](https://sentry.io/changelog/the-new-trace-view-is-generally-available/) and [distributed tracing example](https://sentry-build-otlp.sentry.dev/distributed-tracing/) | A waterfall aligned against elapsed time, selection-driven details, span metadata, filters, error evidence | Go/WASM results populate a timed waterfall; baseline/injected/replay switch, service search, anomalies-only filter, raw event inspector and replay-equality result |
| Aster | [pganalyze: plan comparison](https://pganalyze.com/docs/workbooks/how-to-use-workbooks), [EXPLAIN grid](https://pganalyze.com/docs/explain/grid) | Inspect plan alternatives and compare numerical estimates in one place, then drill into rationale | Editable candidate rows, model-score comparison, PostgreSQL fallback result with uncertainty/margin evidence, original Python ranker |
| NorthStar | [Tailscale Machines](https://tailscale.com/docs/features/access-control/device-management/how-to/filter) and [Better Stack monitoring](https://betterstack.com/uptime) | Searchable/filterable machines table, selected device details, operations and activity tied to host | Search by host/region/version, filter by online state, health metrics, heartbeat, offline simulation, command queue/lease/ack history, API activity |

## Principles used

1. **Start with the user's task.** No decorative hero scenes or stock dashboard widgets. Kestrel starts with a trace, Aster with candidates, NorthStar with the inventory.
2. **Keep data honest.** Kestrel executes the repository's Go fault/replay code compiled to WASM. Aster executes the repository's Python ranking module via Pyodide. NorthStar is explicitly labeled an in-browser simulation, not a live Java control-plane connection.
3. **Explain state with text.** The selected row and recorded outcome have explicit labels; color is secondary.
4. **Use genuine interactions.** Tabs, search, anomaly filters, editable plan values, command controls, and detail views all affect what the user sees.
5. **Reserve motion for utility.** No ambient rotating globe, fake packet pulses, star fields or cosmetic charts. Controls and panes are stable, with system outputs updated directly.

## Testing performed

- Browser smoke tests for Go/WASM replay, Python ranking and PostgreSQL fallback, fleet search/status filters, command leasing/acknowledgement, and offline/heartbeat recovery.
- Automated WCAG 2.0 / 2.1 A/AA analysis using axe-core plus keyboard and mobile overflow checks.
- Site reference and JavaScript syntax checks.

The references describe UI *patterns*, not equivalence in feature scope or operational maturity.
