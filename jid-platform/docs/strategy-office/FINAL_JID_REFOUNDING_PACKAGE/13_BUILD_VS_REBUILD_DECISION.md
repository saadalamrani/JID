# Build vs Rebuild Decision

## Recommendation

**B. Hybrid rebuild** — preserve proven security/data/ingestion foundations, create new domain contracts and experience architecture, and replace surfaces/workflows by vertical slice.

## Evidence baseline

At the locked non-production remote baseline JID has 174 pages, 61 API handlers, 28 action files, 136 migrations, 19 Edge Functions and materially expanded automated tests. Catalog and Lammah have governed ingestion, provenance and non-production evidence. Actor identity, verification/Profile separation, RLS, i18n and CI embody learning that would be costly and risky to recreate.

The product also shows breadth, legacy residue, fragmented navigation, deferred features and a previous partially shipped release state. These conditions weaken pure incremental evolution.

## Scoring method

Council judgment, not measured fact. Each criterion is scored 1–5; weights total 100. Weighted total is the normalized score out of 100. Scores should be revisited after architecture mapping and user validation.

| Criterion | Weight | Evolve current | Hybrid rebuild | Clean slate |
|---|---:|---:|---:|---:|
| Time to validated value | 12 | 4 | 4 | 1 |
| Support for new product model | 10 | 2 | 5 | 5 |
| Reuse of current architecture | 8 | 5 | 4 | 1 |
| Migration cost/risk | 10 | 4 | 4 | 1 |
| Auth/identity continuity | 8 | 5 | 5 | 1 |
| RLS/privacy continuity | 10 | 5 | 5 | 1 |
| Technical-debt reduction | 8 | 2 | 4 | 5 |
| UX/IA freedom | 8 | 2 | 5 | 5 |
| Operational complexity | 5 | 3 | 3 | 1 |
| Testing burden | 5 | 4 | 3 | 1 |
| Deployment/reversibility | 5 | 4 | 5 | 2 |
| Cost/founder velocity | 6 | 4 | 4 | 1 |
| Long-term maintainability | 5 | 2 | 4 | 4 |
| **Normalized judgment** | **100** | **72** | **88** | **49** |

## Protected reuse list

- current repository/stack and deployment separation;
- Supabase Auth/Postgres/RLS/audit patterns;
- account/actor identity and privileged-role controls;
- Directory versus authored organization Profile boundary;
- existing Catalog and Lammah provenance/ingestion domains;
- Arabic/English i18n, design tokens, shared components where compatible;
- CI, unit/RLS/E2E infrastructure and migration history;
- reusable canonical record/profile queries proven by audit.

Protected means “preserve until evidence supports a controlled replacement,” not “never change.”

## Rebuild list

- actor navigation and home experiences;
- Career Record canonical contract and authoring flow where facts duplicate;
- unified Opportunity Graph APIs and projections;
- Individual Radar/action journey;
- employer workflow packaging and program focus;
- university cohort/outcome methodology and product surfaces;
- analytics event taxonomy and denominator registry;
- AI/tool isolation and use-case governance;
- product packaging and entitlements.

## Retire/hide candidates

- unsupported or deferred visible capabilities;
- generic/static dashboard modules;
- duplicate CV/profile truth stores;
- dead routes/controls and obsolete terminology;
- paid visibility logic not explicitly adopted;
- AI features without real outcome/evaluation;
- general content/social shell before the purposeful-layer experiment.

## Migration approach

1. Map canonical data and runtime contracts.
2. Define new bounded domain interfaces next to existing implementation.
3. Build one vertical slice behind non-production flags.
4. Dual-read only where necessary; never uncontrolled dual-write.
5. Backfill with provenance, dry-run and rollback.
6. Compare projections and authorization.
7. Cut over one journey at a time.
8. remove old path only after acceptance and audit evidence.

## Change conditions

Reconsider clean slate only if the 30-day architecture audit proves fundamental tenant/identity/RLS incompatibility across most critical domains or migration cost exceeds a rebuilt and independently secured alternative. Reconsider pure evolution only if prototype testing shows the current IA/domain model can support the new loop without duplicate truth or widespread workflow compromise.
