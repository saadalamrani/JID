# Wave 4 Nonprod DB Closure Report

**Status:** BLOCKED_WITH_EXACT_CAUSE
**BASE_SHA:** `cdd6c84774de206dce145a6474e2ebaf46e5a250`
**WAVE4_SOURCE_SHA:** `b976bc504b379088899451db77dda4b570962068`
**FINAL_SHA:** branch tip reported in terminal handoff
**NONPROD_REF:** `hmjuijmaefajdjrjdsxu`
**Forbidden production ref:** `znfhladafpajyjwcfzvv`

## Catalog reconciliation

- `CATALOG_RECONCILIATION_APPLIED=YES`
- Remote version: `20260829123625`, recorded exactly once.
- `CATALOG_METADATA_VERIFIED=PASS`: both Arabic label/description pairs now contain valid Arabic.
- `CATALOG_ENABLEMENT_CHANGED=NO`: both flags remained enabled before and after.
- Their `updated_at` values remained `2026-08-05T18:58:51.026203+00:00`.
- `APPLICATION_SCHEMA_CHANGED=NO`: pre/post public-schema hash remained
  `1473fc80fabba231c2b2864ea85e5d82`.
- Duplicate migration versions: zero.
- Embedded-name malformed migration rows: zero.
- Post-Catalog normal dry run: no pending migrations.

## Wave 4 migration

- Integration used a normal merge of the exact Wave 4 source commit.
- Pre-apply normal dry run proposed only
  `20260829140000_wave4_career_operations_private.sql`.
- `WAVE4_MIGRATION_APPLIED=YES`
- `REMOTE_MIGRATION_VERSION=20260829140000`, recorded exactly once.
- Expected tables present: 11 of 11.
- RLS enabled and forced: 11 of 11.
- Owner-all authenticated policies: 11 of 11.
- Anon/PUBLIC grants on Wave 4 tables: zero.
- Wave 4 trigger attached outside owned tables: zero.
- Destructive data operation: none.
- Transaction-scoped authorization test rows remaining after rollback: zero.

## RLS / privacy matrix

The new Wave 4 owner-private tables passed these real database tests under role/JWT context:

1. Owner Individual inserted and read their own `career_items`: pass.
2. Different Individual read zero owner items: pass.
3. Business actor read zero owner items, notes, and Abhathli recommendations: pass.
4. University actor read zero owner items, notes, and Abhathli recommendations: pass.
5. Anon direct access to `career_items`: hard permission denial: pass.
6. Owner-private note visible to owner and invisible to other Individual/business/university: pass.
7. Abhathli private recommendation/reasoning visible to owner and invisible to other actors: pass.
8. `GOVERNED_EXTERNAL` plus non-null `application_id` was rejected by
   `career_items_external_no_application`: pass.
9. Wave 4 defines no Career Record write RPC/trigger and attaches its update trigger only to owned
   tables: pass.
10. Normal owner writes under authenticated JWT context: pass.

However, the current Supabase security advisor exposed a separate, pre-existing P1:

- `public.radar_cards` is owned by `postgres` and is a security-definer view over
  `public.applications`.
- `anon` has `SELECT` on the view (and excessive additional view privileges).
- Direct anon access to `public.applications` is denied, but an actual
  `SET LOCAL ROLE anon; SELECT count(*) FROM public.radar_cards` returned `1`.
- The exposed projection includes application identity and status fields:
  `id`, `applicant_id/user_id`, `job_id`, `company_id`, `status`,
  status actor/timestamps, and creation/update timestamps.

Therefore:

- `RLS_NEGATIVE_MATRIX=FAIL`
- `P0=0`
- `P1=1`: anonymous application-data exposure through `public.radar_cards`.
- `P2_P3=1_WAVE4_SCOPED`: advisor warns that `wave4_touch_updated_at` has a mutable
  `search_path`. Other advisor findings predate and exceed this bounded front.
- No remediation was attempted because this packet authorizes Wave 4 DB closure, not an unrelated
  historical-view security migration.

Advisor reference:
https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

## Generated types and validation

- `GENERATED_TYPES=PASS`: regenerated `src/lib/supabase/types.ts` from actual linked nonprod.
- Removed temporary untyped Supabase client wrappers from Wave 4 Career Operations and Abhathli
  services. Narrow JSON-to-domain boundary casts remain explicit.
- `TYPECHECK=PASS`: `pnpm type-check`.
- `LINT=PASS`: `pnpm lint`, zero warnings/errors.
- `BUILD=PASS`: `pnpm build`, 315 static pages generated.
- `FOCUSED_TESTS=PASS`: 3 files, 17 tests. Initial concurrent fork workers timed out before test
  execution; serial one-thread rerun passed all assertions.

## Final database proof

- `FINAL_DRY_RUN=PASS_UP_TO_DATE`: no pending migration.
- `HISTORICAL_REPLAY=NONE`
- `CATALOG_RECONCILIATION=APPLIED`
- `WAVE4_MIGRATION=APPLIED`
- `GENERATED_TYPES=PASS`
- `DATA_LOSS=0`
- `PRODUCTION_TOUCHED=NO`
- Wave 5 migrations applied: no.
- Wave 6 migrations applied: no.

## Terminal result

`BLOCKED_WITH_EXACT_CAUSE`: Wave 4-owned RLS passed, but anonymous users can read one existing
application identity/status row through the security-definer `public.radar_cards` view. The packet
requires stopping on any privacy/security P0/P1.