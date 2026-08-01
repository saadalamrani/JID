# JID Spec 09 — QA Plan

**Session authoring:** 09-A
**JID09_RUN_ID:** `jid09-20260801-7d956c`
**Fixture manifest:** `docs/command-center/reports/JID_09_QA_Fixture_Manifest.md`
**Non-production deployment:** `https://jid-dev.vercel.app`
**Canonical tip at Session 09-A start:** `eead420cdfcd99e4195dcef5fc9a32e1daf4ea06`
**Spec 08 SHIPPED token:** `SPEC_08_SHIPPED e65134c1dc0fc7b3798650a2f2c8ae7dd8842e11` (ancestral to tip)

## Environment and harness reality

| Check | Result |
|---|---|
| Specs 02–08 ledger status | SHIPPED (verified from tip ledger object) |
| Non-prod Vercel | `jid-dev` serves tip; AR/EN HTTP 200; commit statuses success for tip |
| Approved Supabase ref | `hmjuijmaefajdjrjdsxu` only |
| Playwright config | Present: `playwright.config.ts` + `tests/e2e/smoke.spec.ts` |
| Harness decision | Use existing Playwright as a **capture tool** only. Do **not** invent a new e2e harness. Scripted browser walks with screenshots remain the required baseline when a journey is not already covered by smoke. |
| Product changes in 09-A | None (docs + synthetic fixtures only) |

## Evidence naming convention

```
docs/command-center/reports/ui-evidence/final-qa/
  J{n}-{slug}__{locale}__{viewport}__{state}.png
```

- `J{n}` = journey number 1–6
- `locale` = `ar` \| `en`
- `viewport` = `desktop` \| `375`
- `state` = short state token (e.g. `pending`, `rejected`, `published`, `view-only`)

Index entries must cite actor alias from the fixture manifest (never passwords).

## Account → journey matrix

| Actor alias | Primary journeys / cells |
|---|---|
| `bizApplicant` / `bizOwner*` | Journey 1 (Business) |
| `uniApplicant` / `uniOwner*` | Journey 2 (University) |
| `staffA`, `staffB`, `superAdmin`, `staffSelfReviewApplicant` | Journey 3 (Staff) |
| `correctionSuggester` + `staffA` | Journey 4 (Directory correction) |
| `bizOwnerNoProfile`, `uniOwnerNoProfile` | Journey 5 (Notifications) |
| `bizOwnerDraft/Published/Suspended`, `uniOwnerDraft/Published/Suspended` | Journey 6 (Publication) |
| `individual`, `anon` | §14 negative matrix |
| `assignApplicantA/B` | Staff assignment / view-only cells |

## Journeys (Spec §7) — execution ownership

### Journey 1 — Business (Session 09-B)

Signup → verify → reject → reapply → approve → create draft → edit/save/reload → publish → public page → unpublish → dashboard.

Locales: AR + EN. Primary flow also at 375px. Actors: business applicant/owner fixtures for this RUN_ID.

### Journey 2 — University (Session 09-B)

Same chain including reapply + snapshot-present and snapshot-absent dashboard honesty.

### Journey 3 — Staff (Session 09-B)

Queue → filters → auto-assign → view-only (other reviewer) → self-review block → approve with no-auto-Profile notice → reject with reason → terminal read-only → Super Admin explicit override.

### Journey 4 — Directory correction (Session 09-C)

Suggest → staff review → apply → audit row verified in DB → Directory updated. Use `correction-pending` fixture as starting point or recreate under the same RUN_ID if consumed.

### Journey 5 — Notifications (Session 09-C)

Both decision notifications land in-app with correct AR/EN copy and Spec 03 outcome destinations. Seeded `notif-approved` / `notif-rejected` support rendering checks; live decisions during walks remain authoritative.

### Journey 6 — Publication (Session 09-C)

Full Spec 07 §22 walk for Business and University using draft/published/suspended fixtures.

## Negative authorization matrix (Spec §14) — Session 09-C

Every cell must be evidenced (screenshot and/or server denial note):

| Cell | Actor | Expectation |
|---|---|---|
| Anon → staff routes | anon | redirect/404 |
| Anon → owner routes | anon | denied |
| Anon → draft/suspended public Profile | anon | 404 |
| Individual → staff | individual | 404 |
| Staff B → decide Staff A request | staffB on `vr-assigned-a` | denied UI + server |
| Admin invent override | _(no Admin actor; record absence)_ | no invented Admin override |
| Owner → direct status manipulation | biz/uni owner | denied |
| Suggester → apply own correction | correctionSuggester | denied |
| `/sys/claims` | any | must not exist |

## Accessibility passes (Spec §17) — Session 09-C

1. One full keyboard-only staff decision walk.
2. Focus-visible spot checks on decision and publish controls.
3. Screen-reader label spot checks on those controls.
4. AR terminology sweep on rendered pages: no visible `Claim` / `مطالبة`; Latin digits in Arabic.

## Defect handling

- Journeys B/C **record** defects in `JID_09_Defect_Register.md` — they do not fix product code.
- Honest empty / unavailable / deferred states are correct outcomes.
- Session 09-D is mechanically gated on the classified 09-C register.

## Session boundaries

| Session | Delivers |
|---|---|
| 09-A (this session) | Binding repair, RUN_ID, fixtures, manifest, this plan, ledger IN_PROGRESS |
| 09-B | Journeys 1–3 evidence |
| 09-C | Journeys 4–6 + negative matrix + a11y + defect register |
| 09-D | Micro-fix or durable skip |
| 09-E | Release report + cleanup + Spec 09 SHIPPED |

## Pre-flight validation (09-A)

From `jid-platform/`:

```bash
git diff --check
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm type-check
corepack pnpm test
corepack pnpm build
```
