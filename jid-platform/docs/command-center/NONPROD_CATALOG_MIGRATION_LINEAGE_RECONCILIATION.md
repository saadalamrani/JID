# Nonprod Catalog Migration Lineage Reconciliation

**Status:** NORMAL_DRY_RUN_READY
**PROJECT_REF:** `hmjuijmaefajdjrjdsxu` (`jid-nonprod`)
**BASE_SHA:** `adcf57e38c27b85d4f4f9fc70aa473427118ce1c`
**FINAL_SHA:** branch tip reported in the terminal handoff (a commit cannot contain its own SHA)
**Production project `znfhladafpajyjwcfzvv`:** forbidden and untouched

## Method

Line endings were normalized to LF for analytical SHA-256 and diffing. No other normalization was
performed. Exact `git diff --no-index --ignore-space-at-eol` output showed only the literals and
empty trailing statements recorded below. Current Supabase CLI version was `2.116.0`.

## PAIR_A

- Local: `20260802205903_catalog_phase1_foundations.sql`
- Remote-applied counterpart: `20260803001636_catalog_phase1_foundations.sql`
- `LOCAL_SHA256` (LF-normalized):
  `f57cca6aee55910714356b8f870e76a1635b9fbcb27303c44bd3844fe860c8ff`
- `REMOTE_SHA256` (LF-normalized):
  `270b855cf89d90a3a2bceb0aba2cd62156c60a350988abe1d781850633bb7913`

### SEMANTIC_DIFF

All DDL, DML ordering, functions, policies, permissions, comments, and transaction structure are
identical. There are exactly three textual differences:

1. The local `catalog.phase1_ingestion.label_ar` is valid Arabic
   (`إدخال مرشحي الدليل — المرحلة الأولى`); the remote-applied file contains its mojibake form.
2. The local `catalog.phase1_ingestion.description_ar` is valid Arabic
   (`بوابة إدخال مرشحي الدليل للمراجعة البشرية فقط. معطلة افتراضياً.`); the remote-applied file
   contains its mojibake form.
3. The remote-applied file ends with a standalone `;` after `NOTIFY`. This is an empty SQL
   statement and has no semantic effect.

The Arabic values are seed/config-row semantics, not comments or whitespace. No transaction-wrapper
or statement-order difference exists.

### Affected-object inventory

- Roles: `catalog_worker`, `catalog_function_owner`.
- Tables (all created with their complete column sets and named constraints identically in both
  variants): `directory_sources`, `directory_sync_runs`, `directory_raw_evidence`,
  `directory_import_candidates`, `directory_candidate_facts`, `directory_review_queue`,
  `directory_dead_letters`.
- Existing tables touched: `feature_flags`, `profiles`, `companies`.
- Indexes: `directory_import_candidates_published_directory_idx`,
  `directory_candidate_facts_active_key`, `directory_sources_governance_idx`,
  `directory_sync_runs_source_status_idx`, `directory_raw_evidence_retention_idx`,
  `directory_raw_evidence_run_idx`, `directory_import_candidates_state_idx`,
  `directory_import_candidates_match_idx`, `directory_candidate_facts_evidence_idx`,
  `directory_review_queue_work_idx`, `directory_dead_letters_retry_idx`.
- Constraints: the complete named table constraint sets for the seven tables, including lifecycle,
  licensing, retention, checksum, idempotency, state/terminal, reviewer, publication, evidence,
  retry, and composite foreign/unique constraints; exact definitions are statement-identical.
- Functions/RPCs: `_catalog_guard_transition`, `_catalog_audit_transition`,
  `_catalog_reject_intake`, `ingest_directory_candidate`, `_catalog_authority_rank`,
  `_catalog_publication_denied`, `publish_directory_candidate`.
- Triggers: guard and audit triggers on each of the seven new tables (14 total).
- Policies: `catalog_function_owner_catalog_flag_select`,
  `directory_catalog_function_select`, `directory_catalog_function_insert`,
  `directory_catalog_function_update`.
- Grants/revokes: schema usage/temporary ownership grants; table/column grants and revokes for
  `catalog_worker`, `catalog_function_owner`, `authenticated`, `anon`, `service_role`,
  and `PUBLIC`; function execute grants/revokes. These are statement-identical.
- Views: none.
- Seed/config rows: one `feature_flags` upsert for `catalog.phase1_ingestion`; this is the only
  semantic divergence.

### GIT_LINEAGE

The local file was created at
`6c48ffc3501e1a4c3420dc6c69122a19d7af5855`
(`feat(catalog): add phase 1 foundations`) on the Catalog foundations recovery lineage. It has no
modification commit. The later timestamped file was added at
`bc6156a5f637f2af91d26cfc394fb5a615fc83f2`
(`chore(migrations): recover nonprod historical SQL evidence`) from the remote-preserved migration.
Git records an add, not a rename. The statement-level comparison proves it is the same lineage except
for encoding-corrupted Arabic literals and the trailing empty statement.

### REMOTE_SCHEMA_EVIDENCE

Remote history contains canonical version `20260803001636`, name
`catalog_phase1_foundations`, with one preserved statement. Current nonprod has the feature flag,
but its two Arabic fields equal the remote mojibake literals. Repository search found no later
migration correcting those fields. The English fields and operational flag exist; a later operation
has enabled the flag, which the forward delta deliberately does not change.

### DECISION

`LOCAL_HAS_PROVEN_MISSING_DELTA`. The valid Arabic metadata is a legitimate intended durable effect,
is absent from the remote-applied counterpart, absent from all later migrations, and absent from
current nonprod. The obsolete local historical file is retired; only its proven Arabic delta is
carried forward.

## PAIR_B

- Local: `20260803120000_catalog_gleif_review_states.sql`
- Remote-applied counterpart: `20260803054613_catalog_gleif_review_states.sql`
- `LOCAL_SHA256` (LF-normalized):
  `3a1b7d0a88459a8732556d1caed7608cb7d5dd2b76f0617e7d786feefeaaa2aa`
- `REMOTE_SHA256` (LF-normalized):
  `9b3f593a67fa576a572cc42b6202920e0a804ed17345a64cb48e84b88269f2f8`

### SEMANTIC_DIFF

All schema changes, ordering, functions, policies, permissions, comments, and transaction structure
are identical. There are exactly three textual differences:

1. The local `catalog.gleif_connector_enabled.label_ar` is valid Arabic
   (`موصل GLEIF`); the remote-applied file contains its mojibake form.
2. The local Arabic description is
   `مفتاح إيقاف استرجاع بيانات GLEIF. معطل افتراضياً.`; the remote-applied file contains its
   mojibake form.
3. The remote-applied file has one final standalone empty `;` after `NOTIFY`.

Only the Arabic seed/config literals are semantically different.

### Affected-object inventory

- Tables altered: `directory_sources`, `directory_sync_runs`, `directory_raw_evidence`,
  `directory_import_candidates`, `directory_candidate_facts`, `directory_review_queue`.
- Columns added/altered: connector kind/base URL, page/failure controls; sync checkpoint/external-run
  and operational counts; raw source payload; candidate LEI, match metadata, review flags and
  terminal state; fact provenance/assist metadata; review assignment/decision/return metadata.
- Indexes: `directory_sync_runs_one_active_gleif`,
  `directory_import_candidates_active_lei`.
- Constraints: replacement named checks/uniques for all altered column groups above, including
  source connector, sync checkpoint/status/counts, raw payload, candidate LEI/match/flags/state,
  fact provenance/reviewer/assist, and review status/decision constraints. Definitions are
  statement-identical between variants.
- Functions/RPCs: replacement `_catalog_guard_transition`; new
  `catalog_capture_gleif_facts`, `catalog_begin_gleif_run`,
  `catalog_capture_gleif_metadata`, `catalog_finish_gleif_run`,
  `claim_directory_candidate`, `review_directory_candidate`, `configure_catalog_gleif`,
  `redrive_catalog_dead_letter`, `execute_catalog_retention`.
- Policies: `catalog_function_owner_gleif_flag_select`,
  `catalog_function_owner_catalog_flags_update`,
  `directory_review_queue_assigned_reviewer_update`,
  `directory_import_candidates_assigned_reviewer_update`,
  `directory_candidate_facts_assigned_reviewer_insert`,
  `directory_candidate_facts_assigned_reviewer_update`,
  `directory_sources_super_admin_update`, `catalog_flags_super_admin_update`,
  `directory_dead_letters_super_admin_update`,
  `directory_raw_evidence_super_admin_retention_update`.
- Grants/revokes: column-level update/insert grants and function execute/ownership changes for the
  same Catalog roles and authenticated boundary; statement-identical.
- Roles: no new role; reuses `catalog_worker` and `catalog_function_owner`.
- Triggers and views: none newly created; the guard function used by existing triggers is replaced.
- Seed/config rows: `feature_flags.catalog.gleif_connector_enabled` and the `gleif_api`
  `directory_sources` row. Only the feature flag's two Arabic literals diverge.

### GIT_LINEAGE

The local GLEIF file was independently introduced on two sibling histories at
`2fe7ab01b8f69e40cee7250a4d7ceeb03b447d86` and
`c023b2e1281619977051446fb438a37e252debd6`, both with
`feat(catalog): ship GLEIF review workflow`; no later modification is recorded. The remote
timestamped evidence file was added at
`bc6156a5f637f2af91d26cfc394fb5a615fc83f2`. Git records no rename. Exact comparison proves the
remote-preserved form derives from the same SQL lineage except for the two corrupted Arabic literals
and final empty statement.

### REMOTE_SCHEMA_EVIDENCE

Remote history contains canonical version `20260803054613`, name
`catalog_gleif_review_states`, with one preserved statement. Current nonprod has the GLEIF feature
flag and its Arabic fields exactly match the remote mojibake literals. No later migration corrects
them. Later state enabled the flag; the new delta does not touch enablement.

### DECISION

`LOCAL_HAS_PROVEN_MISSING_DELTA`. The intended Arabic metadata is proven, durable, absent remotely,
and not superseded. The obsolete historical file is retired and only this delta is forwarded.

## Repository reconciliation

**FILES_RETIRED**

- `supabase/migrations/20260802205903_catalog_phase1_foundations.sql`
- `supabase/migrations/20260803120000_catalog_gleif_review_states.sql`

Their Git history is retained.

**NEW_FORWARD_MIGRATIONS_CREATED**

- `supabase/migrations/20260829123625_catalog_arabic_metadata_reconciliation.sql`

The migration changes only `label_ar` and `description_ar` for the two exact keys and only when
both fields still equal the proven mojibake values. It does not change enablement or any other field.
It was syntax/planner-validated with non-executing `EXPLAIN` against current nonprod and was not
applied.

## Normal CLI proof

- `supabase migration list --linked`: succeeds. Both remote historical versions match local;
  neither retired timestamp appears. Only the new forward migration is local-only.
- `supabase db push --linked --dry-run`: succeeds normally without `--include-all`.
- Proposed migration: only
  `20260829123625_catalog_arabic_metadata_reconciliation.sql`.
- Historical migration proposed for replay: none.
- `LegacyDbPushMissingLocalError`: absent.
- `LegacyDbPushMissingRemoteError`: absent.

## Safety result

- `REMOTE_HISTORY_CHANGED=NO`
- `APPLICATION_SCHEMA_CHANGED=NO`
- `DATA_LOSS=0`
- `PRODUCTION_TOUCHED=NO`
- Feature migrations applied: none.
- New Catalog reconciliation delta applied: no.