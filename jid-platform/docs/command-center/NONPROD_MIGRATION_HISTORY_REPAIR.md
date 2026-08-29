# Nonprod Migration History Metadata Repair

**Status:** BLOCKED_AFTER_AUTHORIZED_REPAIR
**Authorized project:** `hmjuijmaefajdjrjdsxu` (`jid-nonprod`)
**Forbidden production project:** `znfhladafpajyjwcfzvv`
**Base:** `48191a2131a5c11ca3bb93c3128c22f65b6f9e2c`

## PRE_REPAIR evidence

- Project identity: `hmjuijmaefajdjrjdsxu`, `jid-nonprod`, `ACTIVE_HEALTHY`, PostgreSQL 17.6.
- Migration-history row count: `147`.
- Migration-history metadata hash: `2f963611eca9e7521d72f355e295f63f`.
- Application-schema catalog fingerprint: `53a0b60cca9ea674fddfdafde188d776`.
- Target count: `13`.
- Every target exists with `name IS NULL`.
- Every target has `statements IS NULL`; normalized empty hash is
  `d41d8cd98f00b204e9800998ecf8427e`.
- No target's canonical version already exists remotely.
- Every split is deterministic: numeric version prefix followed by `_` and the exact repository
  migration name.

| Current version                                                | Canonical version | Canonical name                                  |
| -------------------------------------------------------------- | ----------------- | ----------------------------------------------- |
| `123_harden_risky_tables_rls`                                  | `123`             | `harden_risky_tables_rls`                       |
| `124_reconcile_mentor_domain`                                  | `124`             | `reconcile_mentor_domain`                       |
| `125_allow_anon_execute_is_mentorship_staff`                   | `125`             | `allow_anon_execute_is_mentorship_staff`        |
| `126_revoke_truncate_deprecated_commitment_scores`             | `126`             | `revoke_truncate_deprecated_commitment_scores`  |
| `127_verification_assigned_reviewer_authorization`             | `127`             | `verification_assigned_reviewer_authorization`  |
| `20260719100425_enforce_suspended_profile_transition_boundary` | `20260719100425`  | `enforce_suspended_profile_transition_boundary` |
| `20260720072615_harden_verification_request_insert_boundary`   | `20260720072615`  | `harden_verification_request_insert_boundary`   |
| `20260726183230_lammah_native_dedup_boundary`                  | `20260726183230`  | `lammah_native_dedup_boundary`                  |
| `20260730190000_directory_correction_notification_categories`  | `20260730190000`  | `directory_correction_notification_categories`  |
| `20260730190001_directory_correction_apply_hardening`          | `20260730190001`  | `directory_correction_apply_hardening`          |
| `20260730190002_notify_claim_decision_outcome_urls`            | `20260730190002`  | `notify_claim_decision_outcome_urls`            |
| `20260730190003_profile_publication_rpcs`                      | `20260730190003`  | `profile_publication_rpcs`                      |
| `20260802120000_university_dashboard_view_owner_scope`         | `20260802120000`  | `university_dashboard_view_owner_scope`         |

## Repair contract

The authorized transaction may update only `version` and `name` for these exact rows. It must
preserve `statements` as NULL, require exactly 13 source rows, reject canonical-version
collisions, update exactly 13 rows, and roll back on any mismatch.

Post-repair evidence will append the actual row count, new history hash, unchanged application
schema fingerprint, CLI migration list/dry-run outcome, data-loss result, and production-touch
confirmation.
## POST_REPAIR evidence

- `PROJECT_REF`: `hmjuijmaefajdjrjdsxu` (`jid-nonprod`).
- `ACTUAL_ROWS_CHANGED`: `13` (transactional `GET DIAGNOSTICS`; the transaction aborted on any
  count other than 13).
- `POST_REPAIR_ROWS`: all 13 canonical `version` / `name` pairs exist with `statements IS NULL`.
- Malformed target rows remaining: `0`.
- Duplicate migration versions: `0`.
- Migration-history row count: `147` before and `147` after; non-target row count after: `134`.
- Post-repair migration-history metadata hash:
  `3e1cd7fbd7a0aab0d370368a0f463191`.
- Unrelated-row protection: the exclusive table lock covered the transaction; the single `UPDATE`
  joined only the exact 13-row mapping, changed only `version` and `name`, and asserted an exact
  affected-row count of 13 before commit.
- Application schema: `UNCHANGED_BY_REPAIR`. The committed transaction contained no DDL and no
  application-schema or application-data statement. The broad post-query catalog fingerprint was
  `45c4c2b438d1e88ec7b0991da2346b93`, which does not reproduce the pre-query value and is therefore
  retained as a non-comparable/volatile catalog observation rather than claimed as equality proof.
- Current Supabase CLI: `2.116.0`.
- `supabase migration list --linked`: succeeds and lists all 13 repaired versions canonically.
- `supabase db push --linked --dry-run`: exits `1` with a new
  `LegacyDbPushMissingRemoteError`. The CLI reports these local files would be inserted before the
  last remote migration:
  - `supabase/migrations/20260802205903_catalog_phase1_foundations.sql`
  - `supabase/migrations/20260803120000_catalog_gleif_review_states.sql`
- `NEW_BLOCKERS`: the two local-only, out-of-order migrations above. Per founder authority, no
  `--include-all` run and no expansion of repair scope was attempted.
- `DATA_LOSS`: `0`.
- `PRODUCTION_TOUCHED`: `NO` (`znfhladafpajyjwcfzvv` was never queried or mutated).
- Wave 4 / Wave 5 / Wave 6 feature migrations applied: `NO`.

## Terminal result

`BLOCKED_WITH_EXACT_CAUSE`: the authorized 13-row metadata repair succeeded and removed the former
malformed-version blocker, but normal dry-run now fails on the distinct local-only, out-of-order
migrations `20260802205903` and `20260803120000`. This front stopped without applying either file.
