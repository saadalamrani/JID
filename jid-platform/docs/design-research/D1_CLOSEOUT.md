# D1 — CHECKPOINT 1 CLOSEOUT

**Status:** `D1_CHECKPOINT_1_COMPLETE` — design authority written; R1 + R2
implemented as real product code; R3–R7 specified only.
**NOT** `DESIGN_APPROVED` / `UX_APPROVED` / `MODERNITY_APPROVED` /
`FOUNDER_ACCEPTED`. `FOUNDER_DESIGN_ACCEPTANCE = PENDING`.
**Timezone:** Asia/Riyadh.

---

## LINEAGE

| Field | Value |
|---|---|
| BRANCH | `integration/jid-d1-experience-design-direction` |
| BASE_SHA | `60cdb54f2683995f51a0140273b3a9de9fa5858e` (`origin/integration/org-registration-representative-verification`; contains org-onboarding correction `2d234d5b514ffc95ac333997370b4d4589cd1052`) |
| FINAL_SHA | recorded after this file is committed (see "IMMUTABLE PREVIEW" below) |
| PRODUCTION_TOUCHED | NO |
| MAIN_MERGED | NO |
| DATABASE_CHANGED | NO |
| FOUNDER_DESIGN_ACCEPTANCE | PENDING |

Design/experience input authority: `R1C_JID_EXPERIENCE_CONTENT_THESIS.md` +
`R1C_D1_DESIGN_INPUT.md` at `75500a5827e5353343415be88c6fd0acc4911745`;
`R1B_JID_SAUDI_PRODUCT_LANGUAGE_SYSTEM.md` at
`4ae7dd881fd3d3c4cce13964f5f08c2da7f28851`.

Base was chosen per the D1 brief's rule: the parallel legacy-claim-retirement work
(`integration/retire-legacy-org-claim-model`) is **IN PROGRESS** (≈60 uncommitted
files in a separate working tree), so D1 builds on the completed org-onboarding
lineage and does not touch claim-retirement / DB / RLS / authorization code.

Commits on this branch:
- `4f9b173` docs(d1): experience architecture, design language, reference experiences (C1)
- `5869ca4` feat(d1): recompose R1 public front door + R2 individual home (C2)
- `df553d4` fix(d1): locale-aware job/company/title resolution on Individual Home
- (this closeout commit) → FINAL_SHA

---

## DELIVERABLES

### EXPERIENCE_ARCHITECTURE — COMPLETE
`docs/design-research/D1_JID_EXPERIENCE_ARCHITECTURE.md` — global shell (two frames,
one language), per-actor navigation architecture (3–5 job destinations each; what
becomes object-level / contextual / search / background), the twelve
Individual-capability resolution table, home models for all four actors, AI
placement matrix, server-side locale/direction rules, parallel-engineering
dependency handling.

### DESIGN_LANGUAGE — COMPLETE
`docs/design-research/D1_JID_DESIGN_LANGUAGE.md` — refines (does not fork) the
existing `src/config/design-tokens.ts` brand token system; no new palette. Type
usage scale, spacing rhythm + page width, surfaces/borders/elevation (borders over
shadow), data-presentation rules (number carries its basis; evidence before badge),
forms/status/empty/error/skeleton, no-card-first-design guidance with the
replacement-pattern table, AR-first/RTL mechanics, responsive patterns, accessibility
baseline, binding anti-slop constraints.

### REFERENCE_SPEC — COMPLETE (all 7 defined)
`docs/design-research/D1_REFERENCE_EXPERIENCES.md` — R1 & R2 with
implementation-level composition; R3 (Career Record), R4 (Opportunity Detail +
Apply), R5 (Organization Onboarding), R6 (Employer Hiring Workspace), R7 (University
Outcomes) specified with composition direction + what each must prove. **R3–R7 not
built this checkpoint** (Founder-set scope).

### R1_PUBLIC_FRONT_DOOR — IMPLEMENTED
`src/app/[locale]/(public)/page.tsx` + new components `actor-relationship.tsx`,
`not-a-category.tsx`, `trust-principles.tsx`, `entry-action.tsx`; `home-pulse-hero.tsx`
trimmed. Deleted: `problem-statement.tsx`, `modules-showcase.tsx`,
`pdpl-trust-bar.tsx`, `vision-2030-section.tsx`, `cta-section.tsx`,
`home-hero-floating-cards.tsx`. `landing.*` messages reworked (AR + EN).

### R2_INDIVIDUAL_HOME — IMPLEMENTED
New route `src/app/[locale]/(individual)/home/` (page + 6 section components),
`src/lib/individual-home/get-individual-home-model.ts` (real-contract aggregator).
`getPortalHomeForRole('individual')` and `/me` now resolve to `/home` (approved
mentors still → `/mentor/dashboard`). New `individualHome.*` messages (AR + EN, ICU
plurals). Page-level auth: unauth → `/login`; non-individual actor →
`getPortalHomeForRole(role)`. RLS still scopes every query to the signed-in user.

### Shell / locale
`src/app/layout.tsx` sets `<html lang/dir>` server-side from the middleware-set
`x-pathname` header (Arabic font + zero-letter-spacing rules now apply on first
paint). `LocaleHtmlAttributes` client effect kept as a net for middleware-skipped
paths.

---

## MATERIAL_RECOMPOSITION

| Reference | Composition | Hierarchy | Primary-action model | Nav relationship | Content structure | Responsive model | Verdict |
|---|---|---|---|---|---|---|---|
| **R1** | 3 card grids + colored bar + boxed section → one vertical reading path, connected 3-actor structure on a spine | feature-tiles-equal-weight → one statement + progressive sections | scattered tile links + 2-card CTA slab → hero situational CTAs + one inline entry row | — | card-soup → structured sections, 0 card grids | responsive squeeze → mobile-considered stack, trust facts 3→1 | **MATERIAL_RECOMPOSITION = YES** |
| **R2** | no home (redirect chain to public profile) → real workspace, 6 sections in a defined reading order | n/a → standing → attention → changed → record → opportunities → applications | n/a → per-item single action; contextual Plus boundary | new `/home` destination; `/me` + portal-home repointed | n/a → structured sections + one record panel, no widgets | n/a → same reading order at 375, no overflow | **MATERIAL_RECOMPOSITION = YES** |

Not "same layout + new tokens": R1 deletes 6 components and 3 card grids; R2 creates
a route and an experience that did not exist.

---

## AR / EN / RTL / LTR / MOBILE

| Check | Result |
|---|---|
| AR | PASS (R1, R2) |
| EN | PASS (R1, R2) |
| RTL | PASS — server-side `dir="rtl"`, start-edge spine line, RTL reading order |
| LTR | PASS — server-side `dir="ltr"`, mirrored |
| MOBILE (375) | PASS — R1 + R2 stack in reading order, zero horizontal overflow |
| LOCALE_CONTINUITY | PASS — AR routes stay AR, EN routes stay EN (locale-aware `Link`/`usePathname`); no route resets language |

---

## ACCESSIBILITY

Semantic landmarks (`<main>`, `<section aria-labelledby>`, `<h1>`/`<h2>` order),
locale-aware `Link`s, visible focus (global `:focus-visible` ring), touch targets
≥44px on primary CTAs, color never the sole status indicator (status is a named
word), `prefers-reduced-motion` respected (no new motion added that bypasses the
global rule). Full audit tooling (axe, screen-reader pass) not run this checkpoint —
`ACCESSIBILITY = BASELINE_APPLIED, AUDIT_PENDING`.

---

## BEFORE_AFTER

`BEFORE_AFTER = COMPLETE` for the required set — see `D1_PREVIEW_EVIDENCE.md` and
`docs/design-research/d1-evidence/`:
- BEFORE: R1 AR desktop, R1 AR 375, R2 AR desktop (redirect-chain endpoint — no
  workspace exists at base SHA), R2 AR 375.
- AFTER: R1 AR desktop, R1 EN desktop, R1 AR 375, R2 AR desktop, R2 EN desktop,
  R2 AR 375.

---

## TESTS / TYPECHECK / LINT / BUILD

| Check | Result |
|---|---|
| TYPECHECK | PASS (`tsc --noEmit`) |
| LINT | PASS (`next lint` — no warnings or errors) |
| FORMAT | PASS (`prettier --check` on changed files; `git diff --check` clean) |
| BUILD | PASS — local `pnpm build`: "✓ Compiled successfully", "✓ Generating static pages (334/334)", `/[locale]/home` route present. Vercel preview build of the branch head also succeeds (see below). |
| TESTS | Not run this checkpoint — no test file references the changed surfaces; no product-logic/contract change. `TESTS = NOT_RUN_NO_SCOPE_IMPACT` |
| MESSAGE PARITY | PASS — full `messages/ar.json` vs `messages/en.json`: 0 keys missing either side |

---

## P0 / P1 / P2_P3

- **P0: NONE.** No privacy leak (RLS scopes every R2 query to the signed-in user; no
  fetch-then-hide introduced). No cross-actor authority (non-individual redirected).
  Production not touched. No data loss. No security weakening (no middleware / guard
  / RLS / RPC change).
- **P1: NONE.** AR nav stays AR / EN stays EN (verified). No claim flow reintroduced
  (0 claim strings/surfaces added; base already claim-free). No fake metrics (0). No
  private data rendered publicly. Both references usable. Primary actions work
  (verified in dev). No mobile critical overflow. Neither reference missing. Design
  is a material recomposition, not a reskin (table above).
- **P2 / P3:**
  - R2 desktop reads sparse at wide viewports (single centered column) — refinement
    for Founder review / shell work.
  - Global shell / nav not yet rebuilt (specified, out of C1 scope).
  - `opportunities` shows latest open roles, not personalized matches (honest;
    real matching is `NEEDS_D1_EXPERIMENT` for R4).
  - Seed-fixture proper nouns render Arabic under `/en` (seed data values);
    university-name locale resolution deferred (shared helper).
  - `home-hero-cards.ts` now unreferenced — retained as future-compatible.

---

## PLUS_PLACEMENT_HYPOTHESIS

`PLUS_IS_CONTEXTUAL_NOT_PRIMARY = YES` — applied as instructed. Plus / Lammah appears
only once in R2, as a single line under "opportunities for you", stating the
capability ("Lammah adds external opportunities from official sources JID verifies")
before the tier ("for Plus subscribers"), linking into the real opportunity surface.
No Plus/Upgrade/Pricing nav item. No persistent upgrade pressure. No locked-card
spam. No degraded free visibility. Opportunity ordering is neutral chronological
(existing `fetchJobs` already excludes boosted ordering). No alternative placement
built — Founder decides commercial prominence after seeing R2.

---

## LEGACY_CLAIM_ENGINEERING_STATUS

`PARALLEL_ENGINEERING_WORK / IN_PROGRESS` on `integration/retire-legacy-org-claim-model`
(≈60 uncommitted files in `C:\Users\saada\Downloads\Desktop\JID-1`). D1 did **not**
touch DB schema, migrations, RLS, claim-retirement functions, authorization
contracts, or Supabase architecture. No D1 surface (R1/R2) depended on claim-era
internals — no `PARALLEL_ENGINEERING_DEPENDENCY` encountered.

---

## IMMUTABLE PREVIEW

Vercel git integration → `jid-platform` project (`prj_Bjn17wPig8Anp2KhNPu5qCEZnWuC`,
team `jidplatform`). Each branch push builds an immutable per-SHA deployment.

| SHA | Deployment | State |
|---|---|---|
| `5869ca4` (C2, R1+R2) | `https://jid-platform-92aeec2n3-jidplatform.vercel.app` | READY |
| `df553d4` (locale fix) | building on push — check `list_deployments` / branch alias | — |
| **FINAL_SHA** (this closeout commit) | **recorded here once built:** `______________________________` | — |

Branch alias (tracks the head): `https://jid-platform-git-integration-jid-d1-experien-793675-jidplatform.vercel.app`
Inspector: `https://vercel.com/jidplatform/jid-platform/<deploymentId>`

The preview is behind this team's Vercel deployment protection; the Founder opens
the immutable URL directly to judge R1 (`/`) and R2 (`/home`, after signing in as a
seeded nonprod individual). `EVIDENCE_INDEX = docs/design-research/D1_PREVIEW_EVIDENCE.md`.

---

## DEFINITION OF DONE (this checkpoint)

```
DESIGN_AUTHORITY_WRITTEN            = YES (3 docs)
R1_IMPLEMENTED                      = YES
R2_IMPLEMENTED                      = YES
R3_R7                               = SPECIFIED_ONLY (per Founder scope)
CURRENT_UI_DESIGN_AUTHORITY         = ZERO
MATERIAL_RECOMPOSITION_R1           = YES
MATERIAL_RECOMPOSITION_R2           = YES
AR_ROUTE_CONTINUITY                 = PASS
EN_ROUTE_CONTINUITY                 = PASS
RTL / LTR / MOBILE_375              = PASS
BEFORE_AFTER_EVIDENCE               = COMPLETE
FAKE_METRICS                        = 0
CLAIM_PUBLIC_FLOW                   = 0
FEED_MECHANICS                      = 0
TYPECHECK / LINT / BUILD            = PASS
P0                                  = NONE
P1                                  = NONE
DATABASE_CHANGED                    = NO
PRODUCTION_TOUCHED                  = NO
MAIN_MERGED                         = NO
FOUNDER_DESIGN_ACCEPTANCE           = PENDING
```

**STOP.** Do not begin R3–R7 or I1 full rollout. Await Founder design review.
