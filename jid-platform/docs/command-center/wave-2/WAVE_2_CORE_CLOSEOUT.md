# JID — Wave 2 / Front 2A Core Closeout (IN PROGRESS)

**Status:** `CODE_COMPLETE_AWAITING_DB_VALIDATION`

Wave 2A Core is **not** fully closed. The forward-only migration, deterministic
backfill, Career Record + CV projection service boundary, and focused unit tests
are authored and committed. Validation against a live PostgreSQL / Supabase
non-production database is still outstanding (see §9).

---

## 1. Continuity

| Item | Value |
| --- | --- |
| Trusted base | `2bc4bc394fb63794355052e5ceae35e43ffc520b` (`codex/wave2-career-record-core`) |
| This front's branch | `claude/wave2-career-record-core` |
| Ownership | Dynamic handoff: Codex → Claude Code (execution reassignment, same Front, same scope, same contracts, same migration packet, same P1 findings) |
| Base is ancestor of HEAD | verified (`git merge-base --is-ancestor`) |
| Governing packet | `docs/command-center/wave-2/WAVE_2_CAREER_RECORD_MIGRATION_SUBPACKET.md` |
| Salvage checkpoint | `9a856d0` — `wave2(2A): salvage EXPAND migration + deterministic backfill` |

### Environment identity (proven, not name-only)

| Environment | Supabase ref | Corroboration |
| --- | --- | --- |
| **Production (FORBIDDEN, untouched)** | `znfhladafpajyjwcfzvv` | `docs/command-center/ENVIRONMENT_MAP.md:12` |
| **Non-production (authorized target)** | `hmjuijmaefajdjrjdsxu` | `ENVIRONMENT_MAP.md:13` + `.env.seed.nonprod.example:12` ("Project ref must be exactly: hmjuijmaefajdjrjdsxu"); live Supabase API: name `jid-nonprod`, `ACTIVE_HEALTHY`, Postgres 17 |

Migration history of `hmjuijmaefajdjrjdsxu` matches the repository `supabase/migrations`
directory through `20260823181000` (schema parity confirmed, read-only).

---

## 2. Files produced

| File | Purpose |
| --- | --- |
| `supabase/migrations/20260827120000_wave2_career_record_core_expand.sql` | Forward-only EXPAND: enums, 9 tables, deferred/circular FKs, immutability + integrity triggers, P1-B deletion guard, RLS (enabled + forced), 6 SECURITY DEFINER RPCs, grants. |
| `supabase/migrations/20260827120001_wave2_career_record_core_backfill.sql` | Deterministic, idempotent, restart-safe legacy backfill (Stage 2). |
| `src/types/career-record.ts` | Domain types mirroring the frozen `CareerEvidence` / disclosure contracts. |
| `src/lib/career-record/service.ts` | Frozen service boundary (§14 of the packet). |
| `src/lib/career-record/normalize.ts` | P2-A pinned normalization reference implementation (DB mirror). |
| `src/lib/career-record/projection-order.ts` | P1-A deterministic dense projection ordering reference implementation (DB mirror). |
| `tests/unit/career-record/normalize.test.ts` | Pinned normalization vectors. |
| `tests/unit/career-record/projection-order.test.ts` | Projection ordering / dedupe / restart-safety. |

No legacy CV/Profile table, column, policy or grant is dropped or narrowed.
Migrations `026`, `068`–`072` and every historical applied migration are untouched.

---

## 3. Target physical model (as built in the migration)

`career_evidence_disclosure_policies`, `career_evidence`, `career_evidence_revisions`,
`career_evidence_artifacts`, `disclosure_authorizations`,
`career_evidence_legacy_sources`, `cv_projection_sections`, `cv_projection_items`,
`cv_projection_snapshots`, plus nullable `applications.cv_snapshot_id`.

- Stable root identity is separated from immutable revisions.
- `career_evidence_revisions` and `cv_projection_snapshots` are immutable
  (BEFORE UPDATE/DELETE guard). Disclosure policies are immutable; a policy
  change appends a new row.
- RLS is **enabled and forced** on every new table. No `anon` grant anywhere.
  Owner-only `SELECT`; canonical writes only through SECURITY DEFINER RPCs.
  No blanket staff-role access to Career Record.
- Deferred constraint triggers enforce policy/root subject equality, current
  revision consistency, artifact subject/root/revision ownership, and
  projection owner == evidence subject.

### Disclosure model (C2 ≠ C5) preserved

- Every evidence root carries a required **disclosure policy** (private-by-default).
- **Disclosure authorization** is optional on private owner evidence and
  **mandatory + exact** for any real recipient disclosure. `create_cv_projection_snapshot`
  fails closed for `APPLICATION` / `PUBLIC_SHARE` / `RECIPIENT_DISCLOSURE` without
  an active, subject-owned, recipient-matched authorization; it **rejects** an
  authorization on owner-only `EXPORT` / `PROFILE_PREVIEW`.
- Backfill creates **zero** `disclosure_authorizations`.

---

## 4. P1 remediation status

### P1-A — Projection backfill determinism — **FIXED (code); pending DB proof**

- Raw legacy `sort_order` is **never** copied into the uniqueness-constrained
  `cv_projection_items`. Final order derives from
  `(legacy sort_order ASC, stable legacy row id ASC, first-seen seq ASC)` then a
  **dense** re-rank (`row_number() - 1` per section).
- Exactly one projection item per `(cv_id, evidence_id)` — enforced by
  `UNIQUE (cv_id, evidence_id)` + `ON CONFLICT DO NOTHING`.
- Multiple legacy source rows that deduplicate to one canonical root → **one**
  projection item (earliest derived position); **all** source rows retained in
  `career_evidence_legacy_sources`.
- Reference implementation + tests: `projection-order.ts`,
  `tests/unit/career-record/projection-order.test.ts` (multiple `sort_order=0`,
  duplicate sources → one root, restart-safe identical output).

### P1-B — Account deletion / erasure — **CONTROLLED (fail-closed)**

- `public.guard_career_record_account_deletion()` — `BEFORE DELETE ON public.profiles`.
- If the subject owns any canonical Career Record row (evidence, policies,
  revisions, artifacts, authorizations, ledger, snapshots), deletion is **blocked
  with an explained error** (`restrict_violation` + `HINT`), not an opaque FK
  cascade failure.
- Canonical `ON DELETE RESTRICT` semantics are **kept** — no destructive CASCADE
  workaround was introduced.
- Named future dependency: **`JID-WAVE2-ERASURE-DEP`** — "Governed Account Erasure /
  Anonymisation" — must later reconcile deletion rights, retained legal/audit
  obligations, immutable hiring/application history legitimately retained,
  personal-data minimisation, and anonymisation. No legal basis is invented; no
  production erasure model is asserted as approved.
- Test: `DEFERRED_TO_NONPROD_DB_VALIDATION` (trigger behaviour requires a DB).

### P1-C — DATA_LOSS=0 complete coverage — **FIXED (code); pending DB proof**

- Backfill covers **all** declared legacy sources including `profile_skills`
  (`source_locator = '{profile_id}:{skill_id}'`) and the Profile
  education-candidate (`source_table = 'profiles.education'`,
  `source_locator = '{profile_id}'`, carrying `university_id` / `college_id` /
  `major_id` / `graduation_year`), plus `profiles.presentation` (snapshot-only,
  `DEFERRED`).
- Every row-based source and every JSON array element gets exactly one ledger
  locator; a silently skipped source makes the reconciliation "unmatched" query
  non-zero and **fails DATA_LOSS=0**.
- PRE/POST count + deterministic checksum queries, `profile_skills` PRE/POST
  checksum + unmatched query, and Profile education-candidate unmatched query
  are specified in the packet §9–§11 and will be executed and recorded during
  the non-production validation pass (§9 here).

---

## 5. P2 items addressed

| Item | Status |
| --- | --- |
| **P2-A** normalization | Pinned: `private.jid_normalize_identity()` (SQL) + `normalize.ts` (TS mirror) + vectors. Handles whitespace trim/collapse, casefold, Unicode NFKC, Arabic tatweel, Arabic harakat, empty→null; does not over-normalize distinct values. |
| **P2-B** CORRECTED state | `career_evidence_revisions` `CHECK (verification_state <> 'CORRECTED')`. `CORRECTED` is derived from the successor chain by the service (`CareerEvidenceWithHistory.revisions`), never persisted. |
| **P2-C** backfill source/state | Every backfilled revision is structurally `SELF_DECLARED` / `DECLARED`. `VERIFIED`/`CONFIRMED`/`SOURCED`/`DERIVED` require the matching `source_class` + non-null `source_ref` (CHECK constraints). `revise_career_evidence` never carries verification forward. |
| **P2-D** artifact immutability | `career_evidence_revisions` is immutable except a one-time `NULL → value` set of `primary_artifact_id` through `attach_career_evidence_artifact()` (governed deferred reference, guarded by a transaction-local flag + full-row equality check). The successor-revision path remains available via `revise_career_evidence`. |

---

## 6. Service boundary (`src/lib/career-record/service.ts`) — frozen semantics

| Operation | Implemented |
| --- | --- |
| `listCareerEvidence` | ✅ owner-scoped roots + resolved current revision |
| `getCareerEvidence` | ✅ owner-scoped current revision + full history |
| `createDeclaredCareerEvidence` | ✅ → `create_career_evidence` RPC |
| `reviseCareerEvidence` | ✅ → `revise_career_evidence` RPC (optimistic revision no.) |
| `setCareerEvidenceLifecycle` | ✅ → `set_career_evidence_lifecycle` RPC |
| `getCvProjection` | ✅ sections + items + evidence resolved to current revisions |
| `updateCvPresentation` | ✅ header + section order/headings only; no evidence writes |
| `setCvEvidenceSelection` | ✅ → `set_cv_projection_items` RPC |
| `previewCvProjection` | ✅ (missing values preserved as missing) |
| `createCvSnapshot` | ✅ → `create_cv_projection_snapshot` RPC; owner-only vs recipient authorization enforced |
| `authorizeCareerEvidenceDisclosure` | ✅ real basis/retention input only; never during create/backfill |

`resolveAuthorizedCareerEvidenceDisclosure` and API route wiring are **remaining
work** (§10).

---

## 7. Tests

| Suite | Result |
| --- | --- |
| `tests/unit/career-record/normalize.test.ts` | `DEFERRED` — execution pending `pnpm install` in this clone (authored; no infra needed) |
| `tests/unit/career-record/projection-order.test.ts` | `DEFERRED` — same |
| `tests/unit/contracts/shared-contracts.test.ts` (existing) | not re-run in this pass |
| Migration apply / PRE-POST / checksums / reconciliation / DATA_LOSS=0 | `DEFERRED_TO_NONPROD_DB_VALIDATION` |
| Backfill idempotency / rerun | `DEFERRED_TO_NONPROD_DB_VALIDATION` |
| RLS acceptance matrix (owner / other individual / business / university / staff / anon / disclosure) | `DEFERRED_TO_NONPROD_DB_VALIDATION` |
| Storage artifact authorization | `DEFERRED_TO_NONPROD_DB_VALIDATION` |
| `pnpm type-check` / `pnpm lint` / `pnpm build` | `DEFERRED` — pending install |

_Test PASS is not fabricated. See "Elapsed execution outcome" below._

---

## 8. Migration strategy position

`EXPAND` authored. `BACKFILL` authored. `VERIFY`, `APPLICATION CUTOVER`, and
`CONTRACT` are downstream. No legacy table is dropped. Broad legacy staff CV
policies remain during EXPAND (to be replaced by audited purpose-bound access at
CONTRACT, under separate authorization).

---

## 9. Exact non-production DB validation still required

Against `hmjuijmaefajdjrjdsxu` (proven non-production; never production):

1. Record migration history before.
2. Capture PRE_COUNTS + deterministic checksums (packet §9), including
   `profile_skills` and Profile education-candidate.
3. Apply `20260827120000` then `20260827120001`.
4. Regenerate `src/lib/supabase/types.ts` from the resulting schema.
5. POST_COUNTS + reconciliation queries (packet §10).
6. Prove `DATA_LOSS=0` (packet §11) — every legacy row/array element has exactly
   one ledger locator; legacy counts + checksums unchanged; zero fabricated
   authorizations; all revisions `SELF_DECLARED`/`DECLARED`; every root has a
   same-subject private-by-default policy.
7. Re-run the backfill; prove idempotency (no new roots/revisions/ledger
   rows/projection items).
8. Run the RLS acceptance matrix (§12 of the packet).
9. Record migration history after.

**The disposable-DB pre-step could not run in the recovery pass:** Docker Desktop's
privileged service cannot start without elevation in this environment; Supabase
branching requires the Pro plan (org is not on Pro). The next validation pass
should either (a) run `supabase start` locally once Docker is available, or
(b) run the migration + backfill + all §9–§11 checks inside a single
`BEGIN … ROLLBACK` transaction on `hmjuijmaefajdjrjdsxu` as a zero-persistence
dry-run, then apply for real.

---

## 10. Remaining Wave 2A work (not started / partial)

- `resolveAuthorizedCareerEvidenceDisclosure` service op + audit-on-deny.
- API routes / adapters exposing the service boundary.
- Application dual-read / guarded dual-write (Stage 3): adapt legacy CV fact-edit
  endpoints to call create/revise Career Evidence + update projection selection.
- New application submission → atomic `cv_projection_snapshots` + `applications.cv_snapshot_id`.
- Private `career-evidence` Storage bucket + policies (non-production only).
- RLS test suite committed as a repeatable harness.
- Verify `profiles.university_id/college_id/major_id` FK target
  (`universities_catalog` vs `universities`) against the live schema and adjust
  the backfill join if needed.

---

## 11. Cursor integration handoff (frozen)

- Cursor owns the Wave 2 Experience Layer / presentation only
  (`cursor/wave2-career-record-cv-experience`, reported SHA
  `b9067005d51c344dbb0c538f5629d27e397f02bb`). This pass did **not** depend on or
  edit that branch.
- Backend contract Cursor may bind to after DB validation: the frozen service
  boundary in §6 + `src/types/career-record.ts`. Frontend must **not** write the
  new base tables directly and must **not** treat legacy CV/Profile records as
  canonical evidence.
- Presentation edits (include/exclude, order, section order, CV-specific title,
  summary, template, language, formatting) route through `updateCvPresentation` /
  `setCvEvidenceSelection` and never write a Career Evidence revision.
- Fact edits route through `createDeclaredCareerEvidence` / `reviseCareerEvidence`.

---

## 12. Production

**Production system `znfhladafpajyjwcfzvv` was not contacted, queried, migrated,
or written in any pass.** No merge to `main`. No force push. No destructive
migration. No `main`-branch change.
