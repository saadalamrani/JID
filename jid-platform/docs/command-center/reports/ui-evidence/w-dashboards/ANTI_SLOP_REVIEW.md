# Spec 08-B / 08-E Anti-Slop Review — W-Dashboards

## Removed / avoided generic UI
- Removed Business `placeholderMetrics` honesty-breaking placeholder block and related copy keys.
- Avoided decorative KPI wallpaper, fake trend charts, and completeness percentages.
- Flat metric cards; no heavy shadows, glow, or gradient hero chrome on owner dashboards.

## Simplified
- Business metrics resolve per-metric `{status:'ok'|'error'}` with explicit `data-metric-state`.
- University dashboard keeps three honest branches: snapshot present, snapshot absent, query error.

## Decorative content rejected
- No fabricated percentages, engagement scores, or social activity strips.
- No fake “this week” marketing callouts on owner dashboards.
- No inventing applications/jobs counts from unauthorized client filters.

## Unsupported elements omitted
- No `university_dashboard_view` / `claimed_by` schema work (deferred).
- No individual graduate data on University surfaces.
- No cross-owner counts; owner identity remains server-scoped.

## Copy corrected
- Removed placeholder-metric messaging that implied unavailable data was “coming soon” zeros.
- AR/EN metric labels under `company.dashboard.metrics.*` and university dashboard namespaces.

## Prototype / reference conflicts
| Assumption | Product reality | Resolution |
|---|---|---|
| Dashboard shows rich analytics | Spec 08 forbids unsupported metrics | Keep only authorized real counts / snapshot KPIs |
| Absence equals zero KPIs | Spec 05 honesty | `EmptyUniversityState` without zero KPIs |
| Query error can look like empty | Spec 05 honesty | Distinct error presentation |

## JID-specific decisions
- Brand olive / beige / gold via existing semantic tokens.
- Latin digits in Arabic date formatting on university dashboard.
- Zero Arabic letter-spacing/tracking on touched surfaces.
- Content visible without animation-dependent reveal.
