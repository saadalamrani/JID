# JID — Durable Release Smoke Harness

## Purpose

Reusable pre-promotion smoke suite for stable JID contracts.

Supports the anti-loop closure model:

`IMPLEMENTATION → FULL SELF-VALIDATION → ONE FINAL GATE → DONE`

It is **not** a full-platform audit, not a polish checklist, and not a visual
regression suite. Future workstreams run this once before asking for promotion.

## Commands

From `jid-platform/`:

```bash
# Contract unit checks (always safe; no browser / no network)
pnpm test tests/unit/release/release-smoke-harness.test.ts

# Live browser smoke against non-prod (default: https://jid-dev.vercel.app)
pnpm test:release-smoke

# Local Next.js server instead of jid-dev (PowerShell)
$env:RELEASE_SMOKE_LOCAL='1'; pnpm test:release-smoke

# Skip authenticated actor matrix (PowerShell)
$env:RELEASE_SMOKE_AUTH='0'; pnpm test:release-smoke
```

Optional overrides:

| Variable | Effect |
|---|---|
| `SMOKE_BASE_URL` | Override non-prod host |
| `PLAYWRIGHT_BASE_URL` | Alternate host override |
| `SEED_PASSWORD` | Override deterministic seed password (defaults to repo seed fixture) |
| `RELEASE_SMOKE_AUTH=0` | Skip authenticated journeys |
| `RELEASE_SMOKE_LOCAL=1` | Boot local `pnpm dev` |

## Coverage

| Area | What is asserted | Severity |
|---|---|---|
| Public AR/EN | `/`, `/catalog`, `/opportunities`, `/login`, `/signup`, `/signup/entity-type` load | P1 |
| Locale | Arabic RTL, English LTR; locale switch keeps critical surfaces alive | P1 |
| Runtime | No fatal hydration / uncaught page errors on tested routes | P1 |
| Navigation | Primary sticky header has no known dead-link placeholders | P1 |
| A11y landmarks | Sticky platform header + main/nav landmark present on public pages | P1 |
| Mobile | Home viewport does not catastrophically break navigation | P1 |
| Auth entry | Sign-in / sign-up forms render actionable controls | P1 |
| Institutional | Business + University journeys expose identify → verify → prepare | P1 |
| Architecture | No user-facing Claim/مطالبة profile ownership copy on onboarding surfaces | P1 |
| Authenticated | Individual `/profile`, Business `/company/dashboard`, University `/university/dashboard` (seed fixtures) | P1 |

## Fixtures / environment

- Browser framework: existing **Playwright** (`@playwright/test`) — no second framework.
- Non-prod host: `jid-dev` / `https://jid-dev.vercel.app`
- Authenticated accounts: deterministic `*@jidseed.test` shareable seed matrix already in
  `scripts/lib/seed-safety.ts` (same accounts used by `nonprod-account-role-smoke.spec.ts`)
- No production credentials are invented or required
- Auth smoke is skipped with `RELEASE_SMOKE_AUTH=0`

## Blocker classification

| Severity | Meaning | Blocks promotion? |
|---|---|---|
| **P0** | security / privacy / data-loss / authorization / core app unavailable | **Yes** |
| **P1** | core actor journey broken / route unavailable / severe runtime regression | **Yes** |
| **P2** | localized or non-blocking UX defect | No |
| **P3** | cosmetic | No |

Tests annotate severity (`@P0` / `@P1` …). Helpers in
`tests/e2e/release-smoke/helpers/severity.ts` classify unannotated failures.

**Only P0/P1 are promotion blockers by default.** Do not elevate P2/P3 into release failures.

## How future Cursor workstreams invoke it

1. Finish implementation on a non-production branch.
2. Run:
   ```bash
   pnpm test tests/unit/release/release-smoke-harness.test.ts
   pnpm test:release-smoke
   ```
3. If any **P0/P1** fails: fix application code in that workstream (or open an exact blocker).
4. Do **not** modify the harness to hide unfinished product behavior.
5. Attach pass evidence (command output) in the workstream report before promotion.

## What this harness intentionally does NOT test

- Subjective polish, spacing, typography taste
- Pixel-perfect / screenshot diffs
- Unfinished Organization Shell behavior as a permanent contract
- Full RLS matrices (use `pnpm test:rls`)
- Staff/sys MFA deep journeys
- Mentorship product depth
- Payment / billing provider live calls
- Production Supabase or `main`

## How to add a new stable journey without brittle sprawl

1. Confirm the journey is a **stable product contract**, not temporary WIP.
2. Prefer extending helpers in `tests/e2e/release-smoke/helpers/` over copy-paste.
3. Add one focused spec under `tests/e2e/release-smoke/`.
4. Annotate `@P0` or `@P1` only when failure should block promotion.
5. Reuse existing selectors / seed actors; do not invent credentials.
6. Assert availability and architectural invariants — not visual chrome details.
7. Update the coverage table in this document in the same PR.

## File map

```
playwright.release-smoke.config.ts
tests/e2e/release-smoke/
  public-guest.spec.ts
  institutional-onboarding.spec.ts
  authenticated-actors.spec.ts
  helpers/
tests/unit/release/release-smoke-harness.test.ts
docs/command-center/reports/JID_RELEASE_SMOKE_HARNESS.md
```
