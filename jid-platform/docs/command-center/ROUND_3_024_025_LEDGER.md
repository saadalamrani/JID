# Round 3 — 024/025 migration ledger snapshot

**Project:** jid-nonprod `hmjuijmaefajdjrjdsxu`  
**Production:** not queried (`znfhladafpajyjwcfzvv`)  
**Branch:** `integration/round3-final-closure`  
**Base:** `WAVE_12_COMPLETE` `c1b25ed494a6e0365603923a71a865db82c02af6`

## PRE snapshot (read-only)

`supabase_migrations.schema_migrations` columns: `version`, `statements`, `name`, `created_by`, `idempotency_key`, `rollback`.

Exact rows with `version like '024%' or '025%'`:

| version | name |
| --- | --- |
| `024` | `create_pulse_feature_flags` |
| `0241` | `profile_enhancements` |
| `025` | `create_public_announcements` |
| `0251` | `profile_views_table` |

Local files with matching names exist:

- `024_create_pulse_feature_flags.sql`
- `0241_profile_enhancements.sql`
- `025_create_public_announcements.sql`
- `0251_profile_views_table.sql`

Provenance: already-applied historical state. Not pending schema work.

## CLI artifact (not a ledger defect)

`pnpm exec supabase` is CLI `2.20.12`. That version splits `024`/`0241` and `025`/`0251` in `migration list` and asks for `migration repair --status reverted 024 025 026 027 028`.

Repairing those as `reverted` would be false: the rows are applied and match repository files.

CLI `2.116.0` lists `024`/`025`/`0241`/`0251` with local=remote.

## POST (no history mutation)

- `migration repair`: not used
- SQL replay: not used
- application/schema data: unchanged
- `npx supabase@2.116.0 db push --linked --dry-run`: `Remote database is up to date.`
- `NORMAL_LINKED_DRY_RUN=CLEAN`
- `SCHEMA_DATA_CHANGED_BY_LEDGER_REPAIR=NO`
- Wave 11/12 versions not re-applied
