# JID — Wave 2 Experience Layer Closeout

**Front:** Wave 2 / Front 2B — Career Record + CV Projection presentation layer  
**Owner:** Cursor (Product Experience)  
**Status:** EXPERIENCE_LAYER_COMPLETE_AWAITING_CORE_INTEGRATION  
**Branch:** `cursor/wave2-career-record-cv-experience`  
**Base SHA:** `2bc4bc394fb63794355052e5ceae35e43ffc520b`  
**Implementation SHA:** `e7963067036abb0f83e8dc7019cf16306e08f9dc`

This closeout is committed after the implementation commit. The closeout commit SHA is
reported in the control-tower handoff because a commit cannot embed its own SHA.

Do **not** treat this as `WAVE_2_COMPLETE`. Wave 2 remains open until Codex Core exists
and final integration/runtime validation is complete.

## Exact changed files

### Created

- `src/features/career-record/career-record-route.tsx`
- `src/features/career-record/components/career-evidence-form-dialog.tsx`
- `src/features/career-record/components/career-evidence-inspector.tsx`
- `src/features/career-record/components/career-evidence-item.tsx`
- `src/features/career-record/components/career-record-entry-links.tsx`
- `src/features/career-record/components/career-record-view.tsx`
- `src/features/career-record/copy.ts`
- `src/features/career-record/fact-display.ts`
- `src/features/career-record/index.ts`
- `src/features/career-record/operations.ts`
- `src/features/career-record/port.ts`
- `src/features/career-record/privacy.ts`
- `src/features/career-record/source-explanation.ts`
- `src/features/career-record/view-state.ts`
- `src/features/cv-projection/components/cv-preview-panel.tsx`
- `src/features/cv-projection/components/cv-projection-view.tsx`
- `src/features/cv-projection/components/cv-share-panel.tsx`
- `src/features/cv-projection/copy.ts`
- `src/features/cv-projection/cv-projection-route.tsx`
- `src/features/cv-projection/index.ts`
- `src/features/cv-projection/operations.ts`
- `src/features/cv-projection/port.ts`
- `src/features/cv-projection/presentation-guard.ts`
- `src/app/[locale]/(individual)/profile/career-record/page.tsx`
- `src/app/[locale]/(individual)/profile/cv-projection/page.tsx`
- `tests/unit/career-record/career-record-experience.test.tsx`
- `tests/unit/career-record/fixtures.ts`
- `tests/unit/cv-projection/cv-projection-experience.test.tsx`
- `tests/unit/cv-projection/fixtures.ts`
- `docs/command-center/wave-2/WAVE_2_EXPERIENCE_LAYER_CLOSEOUT.md`

### Modified

- `messages/ar.json`
- `messages/en.json`
- `src/components/layout/profile-dropdown.tsx`
- `src/components/profile/individual-profile-view.tsx`
- `src/lib/navigation/actor-shell.ts`
- `src/lib/navigation/authenticated-shell-routes.ts`
- `src/lib/navigation/individual-quick-actions.ts`
- `tests/unit/navigation/individual-quick-actions.test.ts`
- `tests/unit/shell/experience-integrity-wave1.test.ts`
- `tests/unit/shell/organization-shell-separation.test.ts`

Paths above are relative to `jid-platform/`.

## Existing UI KEEP / ADAPT / REPLACE classification

| Surface                                                                                                        | Classification      | Treatment in this run                                                                                  |
| -------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/lib/cv/formats/**` (registry, Harvard, Global ATS, PDF fonts)                                             | KEEP                | Reused template keys/labels. Not rewritten.                                                            |
| `src/lib/cv/cv-pdf-preview.tsx`, `render-format-pdf.ts`, `pdf-document.tsx`                                    | KEEP                | Functioning renderer left in place. Binding to Career Evidence deferred to Core `previewCvProjection`. |
| `/profile/cv` builder shell, section forms, mutation client                                                    | COMPATIBILITY-ONLY  | Left running. New Wave 2 UI does not call these as canonical writes.                                   |
| `src/types/cv.ts`, `src/lib/cv/client.ts`, `src/app/api/me/cv/**`                                              | COMPATIBILITY-ONLY  | Untouched. Codex owns persistence cutover.                                                             |
| `src/components/profile/cv-builder-cta-card.tsx`                                                               | KEEP                | Remains as compatibility entry.                                                                        |
| Wave 1 `StatusBadge`, `FormField`, `Dialog`, `Sheet`, `PageHeader`, `SurfaceStateView`, `ResponsiveRecordList` | KEEP                | Consumed by the new experience.                                                                        |
| New Career Record and CV projection feature modules                                                            | REPLACE (target IA) | Canonical presentation for السجل المهني / السيرة الذاتية.                                              |

No legacy screen was removed.

## Completed Career Record UI

- Overview, empty, loading, error, forbidden, unavailable, and stale surfaces.
- Evidence grouped by frozen categories: education, experience, skills, projects, credentials, awards, languages, volunteering, publications, other.
- Contract-backed status labels only: DECLARED, VERIFIED, CONFIRMED, SOURCED, DERIVED, DISPUTED, CORRECTED, REVOKED, EXPIRED.
- Inspect sheet, add-declared dialog, explicit correct/revise dialog (expected revision, no silent overwrite).
- Source/provenance explanation and private-by-default disclosure explanation.
- Lifecycle actions only where capabilities allow (owner archive/dispute by default; revoke/expire off until Core grants them).
- Controlled callbacks map to frozen operations. Default port returns `unavailable`.

## Completed CV projection UI

- CV identity (title, summary, language, existing template keys).
- Include/exclude, section order, item order.
- Presentation wording (`display_title` / `summary` only). Canonical fact keys are stripped.
- “تصحيح المعلومة” routes to the Career Record correction seam, not a local duplicate fact.
- HTML preview of selected items. PDF renderer kept for later binding.
- Share panel defaults to private and cannot report a successful share from the unavailable port.

## Privacy / disclosure UX

The UI keeps three distinct scopes:

1. موجود في سجلي المهني
2. مضاف إلى هذه السيرة
3. مشارك مع جهة/مستلم

Private is the default. Verification, CV selection, university affiliation, employer role, and staff role do not imply recipient access. Share requests against the unbound port surface an honest unavailable message.

## AR / EN + RTL / LTR + accessibility

- Arabic-first Saudi product copy with English semantic parity in feature dictionaries plus nav labels in `messages/ar.json` and `messages/en.json`.
- Views set `dir` and `lang`. Logical alignment (`text-start`, `ps-`, `end`) from Wave 1 primitives.
- Keyboard-accessible inspect/include/order/dialog controls, visible focus, 44px touch targets on primary actions, labeled fields/errors, reduced-motion classes.
- Latin digits via existing `formatDate` (`numberingSystem: latn`, `Asia/Riyadh`).

## Tests / build

Evidence from this run (jid-platform):

- `pnpm exec vitest run tests/unit/career-record tests/unit/cv-projection` — pass (20 tests)
- related shell/nav tests — pass
- `pnpm type-check` — pass
- `pnpm lint` — pass
- `pnpm build` — pass (routes `/profile/career-record` and `/profile/cv-projection` emitted)
- scoped Prettier — applied
- `git diff --check` — pass

Unauthenticated runtime probe against production `next start`:

- `/ar/profile/career-record` and `/en/profile/career-record` → 307 `/login`
- `/ar/profile/cv-projection` and `/en/profile/cv-projection` → 307 `/login`

## Codex-owned areas confirmed untouched

- `supabase/**`
- any migration file
- `src/types/contracts/**`
- generated Supabase/database types
- `src/app/api/**`
- backend/server Career Record or CV services
- RLS/auth/database helpers (`src/lib/auth/guards.ts` pattern already covers `/profile/*`)
- `WAVE_2_CAREER_RECORD_MIGRATION_SUBPACKET.md`
- production configuration

## Exact Core operations still awaiting binding

Swap points:

- `src/features/career-record/port.ts` → `boundCareerRecordPort`
- `src/features/cv-projection/port.ts` → `boundCvProjectionPort`

Frozen operations to bind (no frontend HTTP invented):

- `listCareerEvidence`
- `getCareerEvidence`
- `createDeclaredCareerEvidence`
- `getCareerEvidenceDisclosurePolicy`
- `updateCareerEvidenceDisclosurePolicy`
- `reviseCareerEvidence`
- `setCareerEvidenceLifecycle`
- `getCvProjection`
- `updateCvPresentation`
- `setCvEvidenceSelection`
- `previewCvProjection`
- `createCvSnapshot`
- `authorizeCareerEvidenceDisclosure`
- `resolveAuthorizedCareerEvidenceDisclosure`

## Final integration checklist

1. Bind the two ports to Codex Core adapters. Do not add client Supabase writes.
2. Authenticated runtime: empty record, create declared evidence, revise with lineage, lifecycle.
3. Authenticated runtime: CV selection/order/presentation without mutating facts; fact-edit opens Career Record correction.
4. Private default after create; no fabricated C5 authorization.
5. Share/application/public snapshot only after exact active authorization; fail closed otherwise.
6. Bind `previewCvProjection` to the existing PDF renderer without treating legacy `CvRecord` as canonical truth.
7. Arabic RTL and English LTR pass on authenticated pages, including inspector/dialog focus.
8. Retire compatibility CV builder only after Codex CONTRACT cutover — not in this run.
9. Re-run focused tests, type-check, lint, build, and authorized runtime validation.
10. Only then consider Wave 2 closeout. This front must not claim `WAVE_2_COMPLETE`.

## Deferred runtime checks

Authenticated browser walks of ready/empty Career Record and CV composition wait for Core. This run validated components/tests and unauthenticated login redirects only.

## Definition of done (this front)

- EXPERIENCE_ARCHITECTURE=COMPLETE
- CAREER_RECORD_PRESENTATION=COMPLETE
- CV_PROJECTION_PRESENTATION=COMPLETE
- PRIVACY_UX=COMPLETE
- ARABIC=PASS
- ENGLISH=PASS
- RTL=PASS
- LTR=PASS
- ACCESSIBILITY=PASS
- FRONTEND_TESTS=PASS
- TYPECHECK=PASS
- LINT=PASS
- BUILD=PASS
- CODEX_FILES_TOUCHED=NO
- BACKEND_SEMANTICS_INVENTED=NO
- P0=NONE
- P1=NONE
- INTEGRATION_SEAM=RECORDED
