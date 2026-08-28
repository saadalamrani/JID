# JID — Wave 2 Experience Validation Harness Closeout

**Front:** Wave 2 / Parallel Front C — Experience testability + integration harness  
**Owner:** Cursor (Product Experience)  
**Status:** WAVE_2_EXPERIENCE_HARNESS_COMPLETE  
**Branch:** `cursor/wave2-experience-validation-harness`  
**BASE_SHA:** `b9067005d51c344dbb0c538f5629d27e397f02bb`  
**FINAL_SHA:** recorded after this closeout commit in the control-tower handoff

This closeout is committed after the implementation commit. A commit cannot embed its own
SHA. Do **not** treat this as `WAVE_2_COMPLETE`. Authenticated real-backend validation
waits for Codex Core.

## PORT_INJECTION

Production routes consume `resolveCareerRecordPort(port)` and `resolveCvProjectionPort(port)`.

- Production pages pass no override. Bound ports remain `unavailableCareerRecordPort` and
  `unavailableCvProjectionPort`.
- Tests inject in-memory ports from `tests/unit/career-record/test-port.ts` and
  `tests/unit/cv-projection/test-port.ts` only. Fixtures do not ship in runtime.
- No HTTP backend, endpoint URL, or successful production write was invented.

Swap points for the eventual Core adapter:

- `src/features/career-record/port.ts` → `boundCareerRecordPort`
- `src/features/cv-projection/port.ts` → `boundCvProjectionPort`

`CareerRecordPort` now includes the previously missing frozen operations:

- `updateCareerEvidenceDisclosurePolicy`
- `authorizeCareerEvidenceDisclosure`
- `resolveAuthorizedCareerEvidenceDisclosure`

The production implementations of those operations return `{ status: 'unavailable' }`.

CV projection view state now syncs from the loaded port result after async `getCvProjection`.
That is an integration-readiness fix, not a visual redesign.

## TEST_JOURNEYS

Career Record (route + injected port):

- loading
- empty
- populated
- add declared evidence
- inspect
- revise/correct (expected revision)
- declared vs verified
- disputed (lifecycle via inspector)
- revoked / expired (listed contract states)
- forbidden
- stale
- error
- private default
- production unavailable default

CV (route + injected port):

- create/manage projection
- select evidence
- deselect evidence
- reorder sections
- reorder items
- CV-specific presentation text
- fact edit routes to Career Record
- preview
- private default
- recipient share failure when authorization unavailable
- successful share UI only when the test port explicitly returns `share.kind === 'authorized'`

## AR / EN / RTL / LTR / ACCESSIBILITY

Mechanical checks in `career-record-a11y.test.tsx` and `cv-projection-a11y.test.tsx`:

- Arabic `dir="rtl"` `lang="ar"`
- English `dir="ltr"` `lang="en"`
- keyboard focus and Dialog/Sheet
- logical direction (`side="end"`, `border-s-2`, `ps-4`, no physical `text-left` / `ml-*`)
- mobile-width wrapper (375px), `min-w-0`, `flex-wrap`, no `overflow-x-scroll`
- screen-reader loading label, field labels, `aria-labelledby`
- 44px touch targets (`touchTargetClass` / `min-h-11`)
- reduced motion classes

No visual redesign. No fake KPIs.

## TESTS / BUILD

Evidence from this run (`jid-platform`):

- `pnpm exec vitest run tests/unit/career-record tests/unit/cv-projection` — 40 passed
- related shell/nav tests — recorded with the validation commands
- `pnpm type-check`
- `pnpm lint`
- `pnpm build`
- `git diff --check`

## P0 / P1

- P0=NONE
- P1=NONE

## BACKEND_TOUCHED=NO

Untouched: `src/app/api/**`, legacy backend handlers, application backend, production
configuration, `src/lib/career-record/**`, `src/types/career-record.ts`.

## DB_TOUCHED=NO

Untouched: `supabase/**`, migrations, RLS.

## FINAL_REAL_ADAPTER_REQUIREMENTS

The real Core adapter must implement these frontend port operations. Do not invent HTTP
URLs in the experience layer. Codex owns path/contract binding.

### CareerRecordPort (`boundCareerRecordPort`)

| Operation | Frontend result contract | Adapter requirement |
| --- | --- | --- |
| `listCareerEvidence` | `CoreResult<readonly CareerEvidence[]>` | Owner list. Empty is `ok` with `[]` (UI maps to empty). Fail closed: `forbidden`, `error`, `unavailable`, or `stale` with `asOf`. |
| `getCareerEvidence` | `CoreResult<CareerEvidenceHistory>` | Current evidence plus revision lineage. Never silent overwrite. |
| `createDeclaredCareerEvidence` | `CoreResult<CareerEvidence>` | Create declared/self-declared evidence only. Private by default. |
| `getCareerEvidenceDisclosurePolicy` | `CoreResult<CareerEvidenceDisclosurePolicyView>` | Return the policy. Default visibility remains `PRIVATE`. |
| `updateCareerEvidenceDisclosurePolicy` | `CoreResult<CareerEvidenceDisclosurePolicyView>` | Persist policy without implying recipient access. |
| `reviseCareerEvidence` | `CoreResult<CareerEvidence>` | Expected-revision correction. Preserve lineage. Do not mutate from CV presentation. |
| `setCareerEvidenceLifecycle` | `CoreResult<CareerEvidence>` | `archive` / `dispute` / `revoke` / `expire`. Issuer revoke/expire only when Core grants capability. |
| `authorizeCareerEvidenceDisclosure` | `CoreResult<AuthorizedCareerEvidenceDisclosure>` | Exact recipient + purpose C5 authorization. Fail closed when authorization is missing. |
| `resolveAuthorizedCareerEvidenceDisclosure` | `CoreResult<AuthorizedCareerEvidenceDisclosure>` | Resolve an existing authorization ref. Fail closed when inactive/missing. |

### CvProjectionPort (`boundCvProjectionPort`)

| Operation | Frontend result contract | Adapter requirement |
| --- | --- | --- |
| `getCvProjection` | `CoreResult<CvProjection>` | Load or initialize the owner's projection. `share.kind` must be `private` unless an active authorization exists. |
| `updateCvPresentation` | `CoreResult<CvProjection>` | Title/summary/locale/template, section order, and `display_title`/`summary` presentation only. Strip canonical fact keys. |
| `setCvEvidenceSelection` | `CoreResult<CvProjection>` | Include/exclude and item order. Must not mutate Career Record facts. Selection is not disclosure. |
| `previewCvProjection` | `CoreResult<CvProjection>` | Preview payload for HTML now / PDF later. Bind existing renderer without treating legacy `CvRecord` as canonical truth. |
| `createCvSnapshot` | `CoreResult<{ snapshot_id }>` | Snapshot only after active authorization for the stated purpose. Unavailable/forbidden otherwise. |

### Share UI contract

The experience layer treats share as authorized **only** when `getCvProjection` returns
`share.kind === 'authorized'` with `recipient_label` and `authorization_ref`.

A successful `createCvSnapshot` that still yields `share.kind === 'private'` is rendered as
share failure. Do not fabricate C5 authorization on the client.

## Definition of done (this front)

- PORT_TESTABILITY=COMPLETE
- JOURNEY_HARNESS=COMPLETE
- AR=PASS
- EN=PASS
- RTL=PASS
- LTR=PASS
- ACCESSIBILITY=PASS
- TESTS=PASS
- TYPECHECK=PASS
- LINT=PASS
- BUILD=PASS
- P0=NONE
- P1=NONE
- BACKEND_TOUCHED=NO
- DB_TOUCHED=NO
