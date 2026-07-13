# Shareable cloud test access (non-production)

**Status:** workflow prepared in-repo — remote accounts are **not** created until you run the seed against a dedicated non-prod Supabase project.

## Step 0 summary (safety)

| Question | Finding |
|----------|---------|
| Local `.env.local` | Points at **local** Supabase (`http://127.0.0.1:54321`) |
| Linked Vercel project in this workspace | **Not linked** (no `.vercel/project.json`) |
| Existing friend-facing cloud seed | **None** before this doc — only `pnpm seed:local` / SQL |
| Seed production? | **Forbidden** — `seed:cloud-test` hard-refuses production / `jid.sa` |
| Safe to share current Vercel “production” deploy? | **Not yet** — middleware/env issues + unknown whether it uses prod DB |

If the live Vercel app uses the production Supabase project, **do not** seed `@jidseed.test` users there. Create a separate non-prod project (or Supabase branch) first.

---

## Architecture (current)

| Actor | `profiles.role` | Login route | Notes |
|-------|-----------------|-------------|--------|
| Individual | `individual` | `/login` | Mentors stay `individual` + `mentor_profiles` |
| Business | `entity` → `company_admin` after verification | `/login` | Directory ≠ owned `business_profiles` |
| University | `entity` → `university_admin` after verification | `/login` | University portal routes are thinner than business |
| Staff (internal) | `staff` | `/staff/login` | Requires **MFA (AAL2)** |
| Super Admin (internal) | `super_admin` | `/sys/login` | Requires **MFA (AAL2)** |

Public platform actors are only Individual / Business / University. Staff and Super Admin are internal.

---

## What already exists locally

| Artifact | Purpose |
|----------|---------|
| `supabase/seed/local-test-accounts.sql` | Idempotent fixtures (same emails/password) |
| `pnpm seed:local` | `supabase db reset` — **local only** |
| `docs/LOCAL_TEST_ACCOUNTS.md` | Local matrix |

Cloud seed **reuses** `local-test-accounts.sql` against a non-prod Postgres URL (same UUIDs, roles, Directory ≠ Profile split, verification states, mentor fixtures).

---

## How to create a shareable non-prod environment

### 1. Create a non-production Supabase project

- New project (recommended name: `jid-nonprod` / `jid-staging`)
- Or a Supabase branch — not the production project

### 2. Apply migrations

```bash
cd jid-platform
npx supabase db push --db-url "$SEED_DATABASE_URL"
```

(or link the non-prod project and push via CLI)

### 3. Configure seed env

```bash
cp .env.seed.nonprod.example .env.seed.nonprod
# edit SEED_ENV, SEED_DATABASE_URL, SHAREABLE_TEST_SITE_URL, Supabase URL/anon
```

### 4. Seed accounts (dry-run then execute)

```bash
pnpm seed:cloud-test
pnpm seed:cloud-test --execute --i-confirm-non-production
```

Print helpers:

```bash
pnpm seed:cloud-test --print-matrix
pnpm seed:cloud-test --print-whatsapp
```

### 5. Point a Vercel **Preview** (or separate non-prod project) at that Supabase

Required on that deployment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (= the preview URL)
- Optional: `NEXT_PUBLIC_APP_URL`

Do **not** put `SUPABASE_SERVICE_ROLE_KEY` in client-visible env.

Fix middleware Edge/`server-only` and env issues before inviting friends (see deploy readiness notes).

### 6. Share only friend-safe accounts

Share Individual / Business / University / Mentor rows.  
**Do not** share Staff / Super Admin until you personally enroll MFA on those accounts.

Shared password for all seed accounts: `JidSeed123!`

---

## Account matrix

| البوابة | رابط الدخول | البريد | كلمة المرور | حالة الحساب |
|---|---|---|---|---|
| بوابة الأفراد — ملف مكتمل | `{SITE}/login` | `individual-complete@jidseed.test` | `JidSeed123!` | فرد · ملف مكتمل |
| بوابة الأفراد — مستخدم جديد | `{SITE}/login` | `individual-new@jidseed.test` | `JidSeed123!` | فرد · غير مكتمل |
| ملف المرشد | `{SITE}/login` | `mentor-approved@jidseed.test` | `JidSeed123!` | مرشد معتمد |
| بوابة الأعمال — موثقة | `{SITE}/login` | `business-verified@jidseed.test` | `JidSeed123!` | company_admin |
| بوابة الأعمال — بانتظار التحقق | `{SITE}/login` | `business-pending@jidseed.test` | `JidSeed123!` | entity · pending |
| بوابة الجامعات — موثقة | `{SITE}/login` | `university-verified@jidseed.test` | `JidSeed123!` | university_admin |
| بوابة الجامعات — بانتظار التحقق | `{SITE}/login` | `university-pending@jidseed.test` | `JidSeed123!` | entity · pending |
| بوابة الموظفين | `{SITE}/staff/login` | `staff@jidseed.test` | `JidSeed123!` | staff · MFA |
| لوحة الإدارة | `{SITE}/sys/login` | `admin@jidseed.test` | `JidSeed123!` | super_admin · MFA |

Replace `{SITE}` with `SHAREABLE_TEST_SITE_URL`.

---

## Safety rules

- This seed **hard-refuses** production (`jid.sa`, `SEED_ENV=production`, `NEXT_PUBLIC_APP_ENV=production`, prod-like URL markers).
- Requires `SEED_ENV` ∈ `nonprod|staging|preview|test|development|local`.
- Requires `--i-confirm-non-production` with `--execute`.
- Local DB URLs require `--allow-local` (prefer `pnpm seed:local` instead).
- Does not weaken RLS; does not expose service role to the browser.
- No Claim Existing Profile; Directory companies ≠ owned profiles.

---

## Why you should not WhatsApp friends yet

1. No non-prod remote seed has been executed from this workspace.
2. Current Vercel deploy was reported as middleware 500 / env incomplete.
3. Production DB must not receive `@jidseed.test` fixtures.
4. Staff/Admin need MFA before any internal sharing.
