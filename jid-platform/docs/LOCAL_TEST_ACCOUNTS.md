# Local test accounts (JID)

**Environment:** local Supabase only  
**Shared password:** `JidSeed123!`  
**Seed file:** `supabase/seed/local-test-accounts.sql`  
**Command:** `pnpm seed:local` (runs `supabase db reset`, which applies all configured seeds)

Do not use these credentials outside local development.

## Login matrix

| Persona | Email | Role | Portal |
|---------|-------|------|--------|
| Individual (complete) | `individual-complete@jidseed.test` | `individual` | `/login` → `/me` or `/profile` |
| Individual (new/incomplete) | `individual-new@jidseed.test` | `individual` | `/login` → incomplete UX |
| Approved mentor | `mentor-approved@jidseed.test` | `individual` + `mentor_profiles.approved` | `/mentor/dashboard`, `/mentors/noura-al-qahtani` |
| Mentee (supporting) | `mentee-fixture@jidseed.test` | `individual` | optional login for review authorship |
| Business verified | `business-verified@jidseed.test` | `company_admin` | `/login` → `/company/dashboard` |
| Business pending | `business-pending@jidseed.test` | `entity` | `/company/verification-pending` |
| University verified | `university-verified@jidseed.test` | `university_admin` | `/university/dashboard` (route may still be thin) |
| University pending | `university-pending@jidseed.test` | `entity` | pending verification UX |
| Staff | `staff@jidseed.test` | `staff` | `/staff/login` → `/staff` |
| Super Admin | `admin@jidseed.test` | `super_admin` | `/sys/login` → `/sys/dashboard` |

## What each fixture includes

### Individual complete
- Public profile, onboarding completed, KSU `university_id`, graduate directory consent on (`show_profile_in_university_stats`)
- Primary CV with education, experience, 3 skills, certification + project (`cv_additional`)
- Privacy fields seeded explicitly

### Individual new
- Incomplete profile, onboarding started only
- KSU link for “hidden graduate” consent test (`show_profile_in_university_stats = false`)

### Mentor approved
- Approved `mentor_profiles` (still `individual` role)
- Accepted + declined requests with `responded_at` (for response analytics)
- 3 completed meetings; reviews: `public_named`, `public_anonymous`, `private`
- **No articles** — `mentor_articles` table does not exist

### Business verified
- Directory company ≠ owned `business_profiles` row
- Approved `verification_requests` (`verification_type = business`)
- Published + draft jobs; one submitted application from individual-complete

### Business pending
- `pending_review` verification; no owned business profile; no jobs

### University verified / pending
- Same Layer-2 / Layer-3 pattern with `university` type
- No university-owned department table — catalog colleges/majors not duplicated as owned entities

### Staff / Admin
- Exact `staff` and `super_admin` roles; RLS unchanged

## Legacy accounts

| Old email | Status |
|-----------|--------|
| `ahmad.mohammed@jidapp.test` | Never present in this repo |
| `seed-co-01@jidseed.test` | Never present |
| `e2e-staff-01@jidseed.test` | Never present |
| `e2e-admin-01@jidseed.test` | Never present |
| `*@test.jid.local` (seed.sql) | **Kept** as secondary public-view fixtures (`TestProfile1!`) — not deprecated |

## Architecture gaps (not faked)

- Evidence Vault — no table; UI flag is aspirational
- Mentor articles — no table
- Entity team seats — only invitations table; owner is sole operator
- Career Canvas / Timeline / Record — UI names over CV + profile data
- Graduate Badge award row — not auto-inserted; consent uses `show_profile_in_university_stats`

## Re-run

```bash
cd jid-platform
pnpm seed:local
```

Or apply only the matrix (when DB already running):

```bash
docker cp supabase/seed/local-test-accounts.sql supabase_db_jid-platform:/tmp/local-test-accounts.sql
docker exec supabase_db_jid-platform psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/local-test-accounts.sql
```
