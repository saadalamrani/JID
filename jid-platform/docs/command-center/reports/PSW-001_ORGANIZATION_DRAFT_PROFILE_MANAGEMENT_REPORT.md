# PSW-001 — Organization Draft Profile Management

**Date:** 2026-07-21  
**Branch:** `cursor/psw-001-organization-draft-management`  
**Base:** `agent/nonprod-signup-fix` @ `b74bfb3621e72fab36969dfc8cb99c365770d06e`

## Working routes

| Route | Purpose |
|---|---|
| `/company/dashboard` | Business draft dashboard (checklist, directory reference, empty opportunities) |
| `/company/profile/edit` | Business profile management shell (sections: overview, identity, details, media, preview, reference, correction) |
| `/company/profile/preview` | Business visitor preview from owned Profile |
| `/company/profile-suspended` | Suspended state (existing) |
| `/university/dashboard` | University draft dashboard |
| `/university/profile/edit` | University profile management shell |
| `/university/profile/preview` | University visitor preview from owned Profile |
| `/university/profile-suspended` | Suspended state (existing) |

## Real saved fields (owned Profile tables)

### Business (`business_profiles`)

- `display_name_ar`, `display_name_en`
- `tagline_ar`
- `about_ar`, `about_en`
- `founded_year`, `employee_count_range`
- `cover_image_url`

Logo remains directory-sourced (`companies.logo_url`).

### University (`university_profiles`)

- `display_name_ar`, `display_name_en`
- `about_ar`, `about_en`
- `university_type` (`government` \| `private`)
- `established_year`
- `cover_image_url`

## Deferred scope (design fields not in schema)

| Field | Reason |
|---|---|
| Official email on Profile | No column on `business_profiles` / `university_profiles`; shown read-only from Directory |
| Official website on Profile | Directory-only (`companies.website_url`); correction path available |
| Contact phone / professional links | No Profile columns |
| Business sector on Profile | Directory uses `sector_id`; not on owned Profile |
| Short name | No Profile column |
| Profile logo upload | Logo is directory-owned only |
| Employer information (separate field) | No dedicated column; covered by `about_*` |
| Academic areas, accreditation, partnership highlights | Schema exists but not in owner edit scope for this slice |
| Publish / publication workflow | Intentionally excluded per constitution |

## Authorization boundary

- Server actions require authenticated user via `requireAuthenticatedUser()`
- Updates scoped with `.eq('owner_user_id', userId)` on profile row
- Separate tables: business owners update `business_profiles` only; university owners update `university_profiles` only
- `assertNoModerationFields` blocks `status`, `published_at`, `verified_badge`
- RLS + DB trigger (pre-existing) enforce suspended edit block and moderation field immutability
- Route guards: `organization_profile` condition + profile-owner patterns for `/company/profile/*` and `/university/profile/*`
- Directory rows never updated from Profile edit paths; corrections use `directory_correction_suggestions` insert only

## Local test account / state

Local Supabase (Docker) was **not running** in this environment (`supabase status` failed — Docker Desktop unavailable). Smoke journeys against live auth/session were **not executed**. Validation relied on:

- Focused unit tests (`organization-draft-management.test.tsx`)
- Full Vitest suite
- Production build route compilation

## Validation results

| Command | Result |
|---|---|
| `git diff --check` | PASS |
| `corepack pnpm --version` | 9.15.4 |
| `corepack pnpm install --frozen-lockfile` | PASS |
| `corepack pnpm lint` | PASS (0 warnings) |
| `corepack pnpm type-check` | PASS |
| `corepack pnpm test` | PASS — 141 passed, 34 skipped (175 total) |
| `corepack pnpm build` | PASS |

### PSW-001 focused tests (15)

All in `src/lib/profile/organization-draft-management.test.tsx` — PASS.

## Local smoke results

| Journey | Result |
|---|---|
| Business draft dashboard | Not run — no local Supabase |
| University draft dashboard | Not run — no local Supabase |
| Save and reload | Covered by unit tests 3–5 |
| Preview | Covered by unit test 11 + build |
| Empty state | Covered by unit test 12 |
| Suspended state | Covered by unit test 13 |
| Unauthorized access | Covered by unit tests 6–8 |

## Deferred issues (non-blocking)

- University KPI dashboard still loads for published university profiles; draft owners see profile-centric dashboard instead
- `business-profile-media` storage bucket not in migrations (pre-existing)
- Legacy `/company/profile` owner view unchanged
- Gallery jsonb on business profiles not exposed in UI

## CI validation

_To be filled after push._

## Target promotion

_To be filled after CI green and fast-forward._
