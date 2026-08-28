# WAVE 2 — DATABASE + MIGRATION + RLS VALIDATION CLOSURE

**Front:** Wave 2 / Parallel Front A — Database Validation
**Branch:** `claude/wave2-db-validation`
**Owner run:** automated closure, single session, no subagents

---

## IDENTITY

| Key | Value |
|---|---|
| `START_SHA` | `968c5c8f14224f4663d894f9412c5743b6db7484` (`wave2(2A): fix type-check downlevel iteration + correct normalization test vectors`) |
| `FINAL_SHA` | see branch tip commit `docs(wave2): record DB validation closure` |
| `PROJECT_REF` (non-production) | `hmjuijmaefajdjrjdsxu` — Supabase project **`jid-nonprod`**, region `ap-south-1`, `ACTIVE_HEALTHY`, Postgres 17.6 |
| Production ref (NEVER TOUCHED) | `znfhladafpajyjwcfzvv` — status `INACTIVE` |
| `PRODUCTION_TOUCHED` | **NO** — every statement in this closure targeted `project_id=hmjuijmaefajdjrjdsxu` only. Identity proven live: `SELECT current_database(), current_user` → `postgres` / `postgres` on `db.hmjuijmaefajdjrjdsxu.supabase.co`. No new project, no branch, no Docker, no disposable environment created. |

---

## MIGRATIONS VALIDATED

Two forward-only, additive migrations from the Core implementation (unchanged in content;
byte round-trip verified against the repo working tree — `git diff --stat` clean):

- `jid-platform/supabase/migrations/20260827120000_wave2_career_record_core_expand.sql`
- `jid-platform/supabase/migrations/20260827120001_wave2_career_record_core_backfill.sql`

No historical migration was edited. No CONTRACT / destructive migration was required or written.

### MIGRATION_HISTORY_BEFORE (tail)

```
... 20260822140000
    20260823120000  lammah_source_host_allowlist
    20260823180000  catalog_review_auth_uid_bridge
    20260823181000  lammah_staff_auth_uid_bridge
```
Neither Wave 2 migration was present. `career_evidence*` tables: **NONE**.

### MIGRATION_HISTORY_AFTER (tail)

```
    20260823181000  lammah_staff_auth_uid_bridge
    20260827120000  wave2_career_record_core_expand      <-- applied this closure
    20260827120001  wave2_career_record_core_backfill    <-- applied this closure
```
`apply_migration` initially recorded auto-timestamped versions (`20260828081033`,
`20260828081243`); both rows in `supabase_migrations.schema_migrations` were realigned to
the exact repo filenames (`20260827120000`, `20260827120001`) so a later `supabase db push`
from the repo recognises them as already applied. Statement bodies retained.

---

## LIVE SCHEMA RECONCILIATION (read-only, before any write)

All migration assumptions checked against the live non-production schema. **No conflicts** — the
two new migrations were applied unmodified.

| Assumption | Live result |
|---|---|
| `public.profiles(id)` PK | ✓ PK = `id` |
| `public.cvs(id, user_id)` | ✓ both present (`user_id` is the owner column the migration/policies use) |
| `public.cvs.technical_skills`, `public.cvs.languages` | ✓ both `jsonb` |
| `cv_education / cv_experience / cv_skills / cv_additional` columns | ✓ every column referenced by the backfill exists |
| `cv_additional.category` enum | ✓ `additional_category_enum` = certification, language, project, award, volunteer, publication, other, leadership — all covered by the backfill `CASE` maps |
| `cv_experience.bullets` | ✓ `text[]` — `= '{}'` guard valid |
| `public.applications(id)` PK | ✓ PK = `id`; `cv_snapshot_id` added by EXPAND §13 |
| `public.profile_skills(profile_id, skill_id)`, `public.skills(id, name, name_ar)` | ✓ |
| Catalog identity space: `universities_catalog`, `colleges_catalog`, `majors_catalog` — `(id, name_en, name_ar)` | ✓ all three present with those columns; `profiles.university_id/college_id/major_id/graduation_year` all present (`graduation_year smallint`) |
| `public._write_audit_log(...)` | ✓ 9 params, 5 defaulted (min 4 required); the 6- and 7-arg calls in EXPAND §17 resolve |
| `extensions.digest` / `pgcrypto` in `extensions` schema | ✓ present; `private` helpers pin `search_path = pg_catalog, extensions` |
| `auth.uid()` | ✓ present |
| Storage config | `storage.buckets` = **NONE** — no `career-evidence` bucket exists (see STORAGE) |

Legacy data present at validation time (non-prod is a small seeded set):
`cvs`=1, `profiles`=17, `cv_education`=1, `cv_experience`=1, `cv_skills`=0, `cv_additional`=2,
`cvs.technical_skills`=3 elements, `cvs.languages`=2 elements, `profile_skills`=5,
profiles with education candidate fields = 3, profiles with presentation content = 3.
Total legacy source units = **20**.

---

## SAFE VALIDATION — TRANSACTIONAL DRY-RUN

The Supabase MCP executes each call on its own connection; a cross-call transaction is not
possible, but a **single-call** transaction is. Verified mechanically that an unterminated
`BEGIN` (no `COMMIT`) is rolled back on connection close: a probe `CREATE TABLE` inside such a
block did **not** persist (`to_regclass` → `null` afterwards).

Dry-run: `BEGIN;` + full EXPAND DDL (schema/table/trigger/RLS layer) + full BACKFILL `DO` block
+ validation report SELECT, **no COMMIT** → auto-rollback. Post-rollback proof:
`career_evidence` / `cv_projection_items` → `null` (do not exist); `cvs`=1, `profiles`=17
unchanged; **legacy source checksum identical** in-transaction vs after-rollback
(`3cd60fe313352af91a15f0e9d8db281d`).

Dry-run report (rolled back): `DATA_LOSS_ZERO=true`, 20 ledger rows, recon
`LINKED 13 / DEFERRED 3 / CONFLICT_NEEDS_REVIEW 4`, 17 roots / 17 revisions all
`SELF_DECLARED`+`DECLARED`, 9 projection items = 9 distinct `(cv_id, evidence_id)`,
sections dense-contiguous from 0, FORCE RLS on all 9 tables. Identical to the post-apply
result below (determinism confirmed).

The 6 SECURITY DEFINER write functions and the `REVOKE ... FROM anon` block were validated
statically (full read) and exercised only in the real apply — they have no effect on backfill
data and could not be meaningfully dry-run without committing function objects.

---

## APPLIED TO NON-PRODUCTION — POST-APPLY EVIDENCE

`apply_migration` wraps each migration in its own `BEGIN/COMMIT` (atomic; no partial-persist
risk). EXPAND then BACKFILL. Both returned `success`.

### PRE_COUNTS → POST_COUNTS

| Table | PRE | POST |
|---|---|---|
| `career_evidence` | 0 | **17** |
| `career_evidence_revisions` | 0 | **17** |
| `career_evidence_disclosure_policies` | 0 | **17** |
| `career_evidence_legacy_sources` | 0 | **20** |
| `career_evidence_artifacts` | 0 | **0** |
| `disclosure_authorizations` | 0 | **0** |
| `cv_projection_sections` | 0 | **6** |
| `cv_projection_items` | 0 | **9** |
| `cv_projection_snapshots` | 0 | **0** |

17 roots = 13 `LINKED` + 4 `CONFLICT_NEEDS_REVIEW` (each conflict arm gets its own declared
root). 3 `DEFERRED` (`profiles.presentation`) create no root. 1 policy + 1 revision per root.

### CHECKSUMS

| Artifact | Value |
|---|---|
| Legacy source checksum (`cv_education ∪ cv_experience ∪ cv_skills ∪ cv_additional ∪ cvs ∪ profile_skills`, md5 of ordered per-row md5) — BEFORE apply | `3cd60fe313352af91a15f0e9d8db281d` |
| Same checksum — AFTER apply + AFTER idempotency re-run | `3cd60fe313352af91a15f0e9d8db281d` — **unchanged** |

Legacy source rows/columns/counts are byte-identical before and after. The Wave 2 migrations
touched no legacy CV / Profile table, column, policy or grant.

### DATA_LOSS = 0

Every legacy source unit is accounted for: `legacy_rows == ledger_rows == distinct_locators`
for all 9 source tables (`bool_and` → **true**).

| source_table | legacy units | ledger rows | distinct locators | reconciliation states |
|---|---|---|---|---|
| `cv_education` | 1 | 1 | 1 | LINKED 1 |
| `cv_experience` | 1 | 1 | 1 | LINKED 1 |
| `cv_skills` | 0 | 0 | 0 | — |
| `cv_additional` | 2 | 2 | 2 | LINKED 2 |
| `cvs.technical_skills` | 3 | 3 | 3 | LINKED 1, CONFLICT_NEEDS_REVIEW 2 |
| `cvs.languages` | 2 | 2 | 2 | LINKED 2 |
| `profile_skills` | 5 | 5 | 5 | LINKED 3, CONFLICT_NEEDS_REVIEW 2 |
| `profiles.education` | 3 | 3 | 3 | LINKED 3 |
| `profiles.presentation` | 3 | 3 | 3 | DEFERRED 3 (`"presentation/preferences preserved; not a career fact"`) |
| **total** | **20** | **20** | **20** | LINKED 13 / DEFERRED 3 / CONFLICT_NEEDS_REVIEW 4 |

No silent omission. No `INVALID_PRESERVED` needed (all seeded array elements well-formed
strings/objects). The 4 `CONFLICT_NEEDS_REVIEW` rows are the same normalised skill identity
appearing in both `profile_skills` (rank 30, payload includes `skill_name_ar`) and
`cvs.technical_skills` (rank 20, `skill_name` only) for the CV owner — differing payloads under
one identity key. This is an explicit, spec-allowed disposition (separate declared roots,
`conflict_group_id` set, note recorded), **not** data loss.

**No fabrication.** All 17 revisions: `source_class = SELF_DECLARED`, `verification_state =
DECLARED`, `source_ref` NULL, `dispute_ref` NULL. Zero `VERIFIED` / `CONFIRMED` / `SOURCED` /
`DERIVED` / `CORRECTED`. Zero `disclosure_authorizations` invented. All disclosure policies
`default_visibility = PRIVATE` and `subject_id` matches the evidence subject. All revisions
`revision_no = 1`; zero evidence rows with a dangling `current_revision_id`.

### IDEMPOTENCY = PASS

Re-ran the full BACKFILL candidate-collection body against the post-apply state:
**0 unreconciled candidate rows** (every legacy unit already carries a ledger locator via
`UNIQUE (source_table, source_locator)`), so the migration's `IF v_cand = 0 THEN RETURN`
short-circuits and creates nothing. Counts after re-run: `career_evidence`=17,
`revisions`=17, `legacy_sources`=20, `projection_items`=9, `projection_sections`=6 —
**identical**. Projection inserts additionally carry `ON CONFLICT DO NOTHING`.

### PROJECTION DETERMINISM (P1-A) = PASS

`cv_projection_items` = 9, `COUNT(DISTINCT (cv_id, evidence_id))` = 9 → exactly one item per
`(cv_id, evidence_id)`. Every section's items are dense and contiguous from 0
(`min = 0`, `max = n-1`, `count = count(distinct sort_order)`). Every item's CV owner equals
its evidence subject (integrity trigger + verified in data). Raw legacy `sort_order` is never
copied into the uniqueness-constrained row — order is `(legacy_sort_order, legacy_tiebreak,
seq)` re-ranked dense.

---

## RLS MATRIX = PASS (mechanically proven)

Simulated with `SET LOCAL ROLE` + `SET LOCAL request.jwt.claims`, inside `BEGIN … ROLLBACK`.
Owner = `b1000001-…-000000000001` (13 evidence roots, 1 CV). Other individual =
`b1000005-…-000000000005`.

| Requirement | Test | Result |
|---|---|---|
| OWNER → own evidence only | owner reads base tables | `career_evidence` 13, `revisions` 13, `policies` 13, `legacy_sources` 14, `cv_projection_sections` 6, `cv_projection_items` 9, `artifacts` 0, `disclosure_authorizations` 0 — exactly the owner's own rows |
| OTHER INDIVIDUAL → denied | other authenticated user reads every table | **0** rows on all 9 tables |
| BUSINESS / UNIVERSITY / MENTOR (actor role) → no access | no role-scoped policy exists; such an actor is `authenticated` with a different `sub` ⇒ identical to "other individual" | **0** rows |
| UNIVERSITY affiliation → no access | affiliation is not referenced by any Career Record policy | **0** rows |
| STAFF / ADMIN → no blanket Career Record access | no `service_role`/staff/admin policy on any of the 9 tables (`pg_policies` enumerated — all policies are owner-scoped `subject_id = auth.uid()` or `cvs.user_id = auth.uid()`) | no blanket path |
| ANON → no base-table access | anon reads every table | **DENIED — "permission denied for table …"** on all 9 (no grant + `FORCE ROW LEVEL SECURITY`); `anon` also has **no `EXECUTE`** on any of the 6 governed functions |
| PRIVATE EVIDENCE exists without recipient authorization | 17 evidence roots, 17 PRIVATE policies, **0** `disclosure_authorizations` | private evidence is fully first-class with zero recipients |
| PUBLIC / BUSINESS / UNIVERSITY DISCLOSURE requires exact active authorization | `create_cv_projection_snapshot()` (SECURITY DEFINER) requires an `ACTIVE`, in-window `disclosure_authorizations` row whose `recipient_type` matches the purpose (`APPLICATION`→`BUSINESS`, `PUBLIC_SHARE`→`PUBLIC`); `cv_projection_snapshots` has **no INSERT/ALL RLS policy** (SELECT-own only) so snapshots cannot be created by direct DML | disclosure is gated, not ambient |
| ARTIFACT → private, server-authorized, no public listing | `career_evidence_artifacts`: SELECT-own policy only, no anon grant, `bucket_id` fixed `'career-evidence'` by CHECK, `object_path` must be `subject_id/…` (integrity trigger), created only via `attach_career_evidence_artifact()` SECURITY DEFINER; `primary_artifact_id` is write-once (`jid_revisions_guard`) | no public listing surface |

FORCE RLS confirmed on all 9 tables (`relrowsecurity AND relforcerowsecurity` → true for each).
`anon` table grants after apply: **NONE**. `anon` function EXECUTE after apply: **NONE**.
P1-B account-deletion guard trigger `trg_profiles_guard_career_record_deletion` present on
`public.profiles`.

---

## PRIVACY = PASS

- Every canonical evidence root is `PRIVATE` by construction (`default_visibility = 'PRIVATE'`
  CHECK; integrity trigger rejects a non-PRIVATE or foreign policy).
- Backfill created **zero** `disclosure_authorizations` — no disclosure basis was invented.
- `profiles.presentation` content is preserved verbatim in the append-only ledger snapshot as
  `DEFERRED` with the note *"presentation/preferences preserved; not a career fact"* — captured,
  never promoted to a disclosable fact.
- No personal data placed in any URL/query parameter; all work via the sanctioned MCP against
  the proven non-production ref.

---

## STORAGE = PASS (with a named forward dependency)

- `storage.buckets` on non-production = **NONE**. The `career-evidence` bucket does **not**
  exist yet, and the EXPAND migration deliberately does not create it.
- `career_evidence_artifacts` is **metadata-only**: `bucket_id` is a fixed-value CHECK
  (`'career-evidence'`), there is **no foreign key** to `storage.buckets`, and **0 artifact
  rows** exist. No storage object is referenced, so there is no storage exposure.
- Object-path safety is enforced at the metadata layer today: `jid_artifact_integrity_check()`
  requires `split_part(object_path, '/', 1) = subject_id::text`.
- **Forward dependency (P3, non-blocking):** creating the private `career-evidence` Storage
  bucket and its Storage RLS policies (owner-only read via signed URL, subject-prefixed path
  enforcement, no public listing, service-role write) is a separate, not-yet-authorized
  deliverable. It is **not** required for Wave 2 DB truth because no artifact upload path is
  active. Tracked here so it is not silently skipped.

---

## FINDINGS

| Sev | Finding | Disposition |
|---|---|---|
| `P0` | — | **NONE** |
| `P1` | — | **NONE** |
| `P2` | `apply_migration` auto-timestamps the recorded migration version; initial rows were `20260828081033/…081243` instead of the repo `20260827120000/…120001`. | **Fixed** — `schema_migrations.version` realigned to the repo filenames in the same session. |
| `P3` | `career-evidence` Storage bucket + Storage RLS policies not yet created. | **Deferred, named** (see STORAGE). Non-blocking: no artifact path active, no FK, 0 rows. |
| `P3` | 4 `CONFLICT_NEEDS_REVIEW` ledger rows (skill identity present in both `profile_skills` and `cvs.technical_skills` for the CV owner, differing payloads). | **Working as designed.** Spec-allowed disposition; separate declared roots, `conflict_group_id` set, owner-review note recorded. No data loss. |

---

## RESULT

```
MIGRATION_VALIDATED = PASS
NONPROD_APPLIED     = PASS
DATA_LOSS           = 0
IDEMPOTENCY         = PASS
RLS                 = PASS
PRIVACY             = PASS
STORAGE             = PASS (career-evidence bucket + storage policies = named P3 forward dependency)
P0                  = NONE
P1                  = NONE
P2/P3               = P2 x1 (fixed: migration-version realignment); P3 x2 (deferred+named: storage bucket; by-design: skill conflicts)
PRODUCTION_TOUCHED  = NO
EVIDENCE            = RECORDED (this file)
```
