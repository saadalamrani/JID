# Nonprod Migration History Metadata Repair

**Status:** PRE_REPAIR_SNAPSHOT_COMMITTED
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
