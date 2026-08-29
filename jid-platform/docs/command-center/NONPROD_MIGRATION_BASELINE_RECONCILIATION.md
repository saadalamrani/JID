# Shared Nonprod Migration Baseline Reconciliation

**Date:** 2026-08-29 (Asia/Riyadh)  
**Project:** `jid-nonprod` (`hmjuijmaefajdjrjdsxu`)  
**Branch:** `integration/nonprod-migration-baseline-reconciliation`  
**BASE_SHA:** `c51d7d39688e74d62406aaf2ff5636c5ddd55128`  
**Terminal state:** `BLOCKED_WITH_EXACT_CAUSE`

## Safety result

- Production was not queried or modified.
- Shared nonprod received no SQL, migration, reset, or history write.
- `supabase migration repair` was not used.
- No feature migration from Wave 4, Wave 5, or Wave 6 was applied.
- `DATA_LOSS=0`.

## Current truth

The project identity was independently confirmed by the CLI and connected Supabase API:
`hmjuijmaefajdjrjdsxu` is `jid-nonprod`, active/healthy, PostgreSQL 17.6.

The current Supabase CLI (`2.116.0`) removes the false mismatch previously reported for
versions `024`–`028`; their repository filenames and remote version/name pairs are aligned.
CLI `2.20.12` reported them incorrectly as separate local/remote rows.

All normal versions through `122` align. The following SQL-bearing remote-only versions were
recovered exactly using `supabase migration fetch --linked` in a disposable directory:

| Version | Name | Repository SHA-256 |
| --- | --- | --- |
| `20260718063438` | `harden_11_risky_tables_rls` | `7FDAE5FBA3C2B274E9659F72E20CC2455AAA6EE5EC0288BDD368462AD1CC4786` |
| `20260803001636` | `catalog_phase1_foundations` | `270B855CF89D90A3A2BCEB0ABA2CD62156C60A350988ABE1D781850633BB7913` |
| `20260803054613` | `catalog_gleif_review_states` | `8128810DEFE48B672962BCD61D5A4D3788F3D57712DB06BF5A742FEA900A20E8` |

The copied files are byte-identical to the CLI export. Remote history reports respectively
one stored statement of 6,409, 61,598, and 46,845 characters.

## Malformed remote history — exact blocker

The following applied remote rows have the migration name embedded in the `version` field,
`name IS NULL`, and `statements IS NULL`:

1. `123_harden_risky_tables_rls`
2. `124_reconcile_mentor_domain`
3. `125_allow_anon_execute_is_mentorship_staff`
4. `126_revoke_truncate_deprecated_commitment_scores`
5. `127_verification_assigned_reviewer_authorization`
6. `20260719100425_enforce_suspended_profile_transition_boundary`
7. `20260720072615_harden_verification_request_insert_boundary`
8. `20260726183230_lammah_native_dedup_boundary`
9. `20260730190000_directory_correction_notification_categories`
10. `20260730190001_directory_correction_apply_hardening`
11. `20260730190002_notify_claim_decision_outcome_urls`
12. `20260730190003_profile_publication_rpcs`
13. `20260802120000_university_dashboard_view_owner_scope`

Supabase migration filenames encode a version separately from the name. Neither CLI `2.20.12`
nor current CLI `2.116.0` can map a valid local filename to these malformed remote versions.
Even `supabase migration fetch` exports placeholder files but its own resulting directory still
fails `db push --dry-run` with `LegacyDbPushMissingLocalError` for the same 13 versions.

Git contains SQL files with matching semantic names, introduced by these commits:

| Local file/version | Creation commit |
| --- | --- |
| `123` | `d80556e41476976901618a676881b0283494d85e` |
| `124` | `8b70b0dd9dbd3b0da8cb4b2ab6516d8998cd2553` |
| `125` | `7ace81423764dd2752477e07533f75eaace43dfa` |
| `126` | `6f0ed77225dba07b37abca6a5f580576dda99011` |
| `127` | `30f809b28cd794569c2208101e11ee2929b7ea59` |
| `20260719100425` | `a93c06e2c8a31e92e8b27518ee5fc9ead4b2e14a` |
| `20260720072615` | `3a0ced75aa9e0f470b3d860ece6252313655d64c` |
| `20260726183230` | `5af8b8aa6786fc45b19e3ea7eba49cdf52c284f1` |
| `20260730190000` / `190001` | `45020bb37d652bf0f6362ce5fb95b03515ed75ce` |
| `20260730190002` | `f6397f27b0fde5717a2df8bf3cae6526c3bdc896` |
| `20260730190003` | `46244bd43f660f7ac046d23d114d0abb8b65cdcf` |
| `20260802120000` | `fdaf5d1a1d6325073b890bffdbbfdbf1765893f5` |

Those files are strong semantic candidates, but because the remote rows stored no statements,
there is no exact evidence that their bytes/statements are what ran. Renaming or duplicating files
does not make either CLI recognize the malformed versions. Claiming exact recovery would be a
guess.

## Missing-on-remote local versions

The malformed rows above leave their normal local versions appearing missing remotely:
`123`–`127`, `20260719100425`, `20260720072615`, `20260726183230`,
`20260730190000`–`20260730190003`, and `20260802120000`.

Two additional canonical migrations are genuinely local-only/pending on the Wave 3 baseline:

- `20260802205903_catalog_phase1_foundations.sql`
- `20260803120000_catalog_gleif_review_states.sql`

They were not applied in this front. Their concepts overlap the two recovered remote migrations,
but this front does not alter, deduplicate, or infer their semantics.

## Duplicate/version collisions

- No duplicate version prefix exists inside the canonical migration directory.
- Remote/local semantic collisions exist for the 13 malformed rows listed above.
- The recovered `20260803001636` / `20260803054613` migrations coexist with local-only
  `20260802205903` / `20260803120000`; resolving their semantic relationship requires a separate,
  explicitly authorized schema-history decision and must not be guessed here.

## Disposable validation

Docker Desktop/PostgreSQL was unavailable. `supabase db dump` failed because CLI `2.20.12`
required the missing Docker engine. The strategy changed immediately, within the packet's
10-minute limit. No local replay was attempted after that point.

Read-only SQL via the connected Supabase API verified exact history metadata and statement
presence/hashes. A disposable `migration fetch` directory and both CLI versions reproduced the
same malformed-history failure.

## Remote non-mutating proof

`supabase migration list --linked` after recovery:

- `024`–`028`: aligned under CLI `2.116.0`;
- the three recovered timestamped versions: aligned;
- the 13 malformed remote rows: still unrepresentable/missing locally;
- normal local counterparts and two later catalog migrations: local-only.

`supabase db push --linked --dry-run` after recovery:

```text
LegacyDbPushMissingLocalError: Remote migration versions not found in local migrations directory.
Remaining remote versions: the 13 malformed versions listed above.
```

No dry-run progressed to a pending-migration plan. No remote mutation occurred.

## Required resolution authority

The historical blocker cannot be removed without mutating the 13 malformed rows in
`supabase_migrations.schema_migrations` (normally `migration repair` or an equivalent direct
history write). Both are explicitly forbidden by this packet. Exact applied SQL is also
unrecoverable from those rows because `statements IS NULL`.

`BLOCKED_WITH_EXACT_CAUSE: 13 jid-nonprod migration-history rows contain CLI-unrepresentable version strings with embedded names and no stored SQL statements; both Supabase CLI 2.20.12 and 2.116.0 reject their own fetched history, and resolving them requires forbidden migration-history mutation or guessing exact applied SQL.`
