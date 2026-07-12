# P-110 Legacy Profile Backfill — Operational Runbook

This runbook covers the **manual, human-timed** execution of the P-110 legacy data backfill. The backfill scripts are idempotent and default to dry-run; production execution is a deliberate decision, not an automated deploy step.

## Prerequisites

- P-101 through P-104 migrations applied on the target database (`claimed_by`, `verification_requests`, `business_profiles`, `university_profiles`, `jobs.business_profile_id` must exist).
- `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` set in `.env.local` (server-only; never commit).
- Node.js + `pnpm` available in `jid-platform/`.
- A **pre-migration backup snapshot** of the target database confirmed before any production write.

## Safety flags (non-negotiable)

| Flag | Purpose |
|------|---------|
| `--dry-run` (default) | Compute and log; no writes |
| `--execute` | Enable writes (requires next flag) |
| `--i-understand-this-modifies-production-data` | Required with `--execute` |
| `BACKFILL_PROD_CONFIRM=yes-i-am-sure` | Additional env var required when `NEXT_PUBLIC_APP_ENV=production` |

If `NEXT_PUBLIC_APP_ENV=production`, a single `--execute` flag is **never** sufficient.

## Staging procedure

### 1. Dry-run on staging

```bash
cd jid-platform
pnpm tsx scripts/backfill-legacy-profiles.ts --dry-run
```

Review output:

- Total claimed companies (business, then university)
- Skipped (already migrated) count
- **Synthesized verification anomalies** — each `company_id` listed individually
- Jobs that would be re-anchored
- `verified_domains` sourced from `companies.domains` (legacy provenance, distinct from P-102 staff-captured domains)

Abort if counts diverge wildly from expected Step 0 baseline.

### 2. Execute on staging

```bash
pnpm tsx scripts/backfill-legacy-profiles.ts \
  --execute \
  --i-understand-this-modifies-production-data
```

Re-running this command is safe (idempotent): already-migrated companies are skipped.

### 3. Verify integrity on staging

```bash
pnpm tsx scripts/verify-backfill-integrity.ts
```

All five checks must report **PASS**. Save the full terminal output as the proof artifact.

### 4. Manual review of synthesized anomalies

Every company that required a synthesized `verification_requests` row is logged with prefix `ANOMALY synthesize verification`. Founder/Staff must review this list post-backfill — these rows reconstruct audit trail from `claimed_by` where no approved verification existed.

### 5. Apply cleanup migration on staging (manual)

**Pre-check (must return zero rows):**

```sql
SELECT id FROM public.jobs WHERE business_profile_id IS NULL;
```

If zero rows, apply:

```bash
# Example — use your project's migration apply procedure
supabase db push
# or apply supabase/migrations/117_retire_transitional_clauses.sql directly
```

Migration `117_retire_transitional_clauses.sql`:

- Drops P-104 `-- TRANSITIONAL (P-104)` branches from jobs/applications RLS
- Sets `jobs.business_profile_id` NOT NULL
- Drops deprecated `companies` ownership columns

### 6. Re-verify on staging

```bash
pnpm tsx scripts/verify-backfill-integrity.ts
```

Confirm full PASS again after migration 117.

## Production procedure

Repeat staging steps 1–6 during a **low-traffic window**, with production credentials and:

```bash
export NEXT_PUBLIC_APP_ENV=production
export BACKFILL_PROD_CONFIRM=yes-i-am-sure
```

### Rollback note

If production backfill or migration 117 must be reversed:

1. **Restore from the pre-migration backup snapshot** taken immediately before step 2.
2. Do not attempt partial manual undo of profile rows — the backup is the authoritative rollback path.

> **Action item:** Confirm the project's documented backup/restore procedure (Supabase PITR, `pg_dump`, or hosting provider snapshot) before scheduling production execution. If no procedure is documented, establish one before proceeding.

## Logic proof without a migrated database

When the linked database has not received P-101–P-104 (schema preflight fails), use simulate mode to validate script wiring:

```bash
pnpm tsx scripts/backfill-legacy-profiles.ts --simulate
pnpm tsx scripts/verify-backfill-integrity.ts --simulate
```

Simulate mode does not touch the database.

## Scripts reference

| Script | Role |
|--------|------|
| `scripts/backfill-legacy-profiles.ts` | Idempotent profile + job re-anchor backfill |
| `scripts/verify-backfill-integrity.ts` | Read-only five-check integrity verifier |
| `supabase/migrations/117_retire_transitional_clauses.sql` | Post-backfill cleanup (manual apply) |

## Admin client

Backfill uses the service-role Supabase client pattern from `src/lib/supabase/admin.ts` (`createAdminClient`): elevated privileges, server-side only, bypasses RLS. Scripts mirror this via `scripts/lib/p110-env.ts` because `server-only` cannot be imported from CLI scripts.
