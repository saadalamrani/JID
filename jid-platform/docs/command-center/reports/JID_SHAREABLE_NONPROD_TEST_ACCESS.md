# JID_SHAREABLE_NONPROD_TEST_ACCESS

**Task:** Shareable non-production premium test access
**Branch:** `cursor/jid-shareable-nonprod-premium-access`
**Seed marker:** `JID_SHAREABLE_TEST_SEED_V2`
**Canonical starting SHA:** `6c48ffc3501e1a4c3420dc6c69122a19d7af5855` (`origin/agent/nonprod-signup-fix` at task start)

## 1–4. Environments

| Item | Value |
|------|-------|
| Vercel project | `jid-dev` |
| Shareable URL | `https://jid-dev.vercel.app` |
| Supabase project | `jid-nonprod` |
| Supabase project ref | `hmjuijmaefajdjrjdsxu` |
| Production ref (never used) | `znfhladafpajyjwcfzvv` |
| Confirmation | **Non-production only** — seed hard-refuses production |

## 5. Seed command

```bash
cd jid-platform
pnpm seed:cloud-test --execute --i-confirm-non-production
```

Helpers:

```bash
pnpm seed:cloud-test
pnpm seed:cloud-test --print-matrix
pnpm seed:cloud-test --print-whatsapp
pnpm seed:cloud-test --print-premium-matrix
pnpm seed:cloud-test --print-internal
pnpm tsx scripts/verify-shareable-seed-logins.ts
```

## 6. Required environment-variable names

From `.env.seed.nonprod` (never commit secrets):

- `SEED_ENV`
- `SEED_DATABASE_URL` *(privileged server credential)*
- `SHAREABLE_TEST_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (optional)
- `NEXT_PUBLIC_APP_ENV` (optional)

## 7–11. Account inventory / mapping / MFA

| Email | Actor/role | Directory | Verification | Owned Profile | Premium | MFA |
|-------|------------|-----------|--------------|---------------|---------|-----|
| `individual-complete@jidseed.test` | Individual | — | — | Complete individual profile | `jid_plus` | N/A |
| `individual-new@jidseed.test` | Individual | — | — | Incomplete / empty | `jid_plus` | N/A |
| `mentor-approved@jidseed.test` | Individual + mentor approved | — | — | Individual + mentor surface | `jid_plus` | N/A |
| `business-verified@jidseed.test` | `company_admin` | Seed Verified Business Co | Approved | Deliberate `business_profiles` | `employer_premium` | N/A |
| `business-pending@jidseed.test` | `entity` | Seed Pending Business Co | Pending | None | seed plan row; verified authority blocked | N/A |
| `university-verified@jidseed.test` | `university_admin` | Seed Verified University | Approved | Deliberate `university_profiles` | **No university plan in Model 1** | N/A |
| `university-pending@jidseed.test` | `entity` | Seed Pending University | Pending | None | none | N/A |
| `staff@jidseed.test` | Staff (internal) | — | — | — | none (internal only) | **Manual TOTP enrollment required** |
| `admin@jidseed.test` | Super Admin (internal) | — | — | — | none (internal only) | **Manual TOTP enrollment required** |

Password (non-prod fixtures only): `JidSeed123!`

## 12. Login routes

| Portal | Route | English |
|--------|-------|---------|
| Public actors | `/login` | `/en/login` |
| Staff | `/staff/login` | `/en/staff/login` |
| Super Admin | `/sys/login` | `/en/sys/login` |

Landing (post-login): Individual → `/me`; Business verified → `/company/dashboard`; University verified → `/university/dashboard`; pending entity → verification pending routes; Staff → `/staff` (AAL2); Super Admin → `/sys/dashboard` (AAL2).

## 13–14. Remote creation + live login

Remote seed executed successfully against `hmjuijmaefajdjrjdsxu`.

Password login (Supabase Auth): **PASS for all 9 accounts** (emails confirmed).

Entitlement RPC verification:

- Individuals + mentor: `cv_pro_formats`, `search_for_me`, `lammah_feed`
- Business verified: `company_has_entitlement` true for `smart_communication`, `ssis`, `priority_visibility`
- Business pending: subscription row present for boundary testing; verified dashboard/authority still blocked by Verification state
- University / Staff / Admin: no consumer entitlements

HTTP route checks on `https://jid-dev.vercel.app`: `/login`, `/en/login`, `/staff/login`, `/sys/login`, `/`, `/en` → **200**.

## 15. Premium feature matrix

See `pnpm seed:cloud-test --print-premium-matrix` (Model 1 keys only). University premium is **not implemented**.

## 16–17. Sharing packs

- **Friends:** complete/new Individual, mentor, Business verified/pending, University verified/pending
- **Internal only:** Staff + Super Admin — `داخلي فقط — لا يُشارك بشكل عام`

## 18. Known limitations

1. No deterministic shared MFA TOTP secret for Staff/Super Admin — founder must enroll manually before internal portal use.
2. No university billing plan/audience in Model 1 — cannot invent one in this task.
3. Pending Business may show company entitlement RPC true for the seed directory company id, but product Verification gates keep verified-only journeys unavailable.
4. Mentor has JID Plus only; no separate mentor premium plan key exists.
5. Live browser viewport QA at 375px is smoke-level (HTTP + Auth); deep UI interaction QA is for friend testing.

## 19. Rerun

```bash
pnpm seed:cloud-test --execute --i-confirm-non-production
```

Idempotent: repairs auth passwords, confirms emails, upserts fixtures, re-applies V2 complimentary subscriptions for seed subjects only.

## 20. Cleanup

Do **not** delete unrelated rows. To remove only shareable fixtures, delete `@jidseed.test` auth users and rows with stable `b1…` / `b2…` / `b3…` / `b4…` seed UUIDs / `provider_ref = JID_SHAREABLE_TEST_SEED_V2`. Prefer founder-approved SQL. Never run against production.

## 21. Files changed

- `scripts/lib/seed-safety.ts`
- `scripts/seed-cloud-test-accounts.ts`
- `scripts/verify-shareable-seed-logins.ts`
- `supabase/seed/shareable-test-premium-entitlements.sql`
- `tests/unit/scripts/seed-safety.test.ts`
- `tests/unit/scripts/shareable-seed-sql.test.ts`
- `.env.seed.nonprod.example`
- `docs/SHAREABLE_TEST_ACCESS.md`
- `docs/command-center/reports/JID_SHAREABLE_NONPROD_TEST_ACCESS.md`

## 22. Validation results

| Check | Result |
|-------|--------|
| `git diff --check` | PASS |
| `corepack pnpm install --frozen-lockfile` | PASS |
| `corepack pnpm lint` | PASS |
| `corepack pnpm type-check` | PASS |
| Focused seed tests (25) | PASS |
| `corepack pnpm test` (423 passed / 101 skipped) | PASS |
| `corepack pnpm build` | PASS |
| Secret scan | PASS (only intentional production-ref refusal constants / “do not put service role” docs; no credentials committed) |
| Changed-file scope | PASS (seed scripts, seed SQL, docs, focused tests, example env only) |
| Remote seed against `hmjuijmaefajdjrjdsxu` | PASS |
| Live Auth password login (9/9) | PASS |
| Live Plus / employer entitlement RPCs | PASS |
| `jid-dev` bound to nonprod Supabase in shipped JS | PASS (`hmjuijmaefajdjrjdsxu`; production ref absent) |
| Arabic `/login` + English `/en/login` HTTP 200 | PASS |
| Mobile UA smoke on login routes | PASS |
| Catalog foundations | Untouched |
| Implementation SHA | `0c668153053f5e9d0eb0c3f476f0fca04177fc3c` |
| Promoted SHA | `4f7eba7d07f017665c730542fbfbf824b0189977` |
| CI on promoted SHA | PASS ([run 30777408268](https://github.com/saadalamrani/JID/actions/runs/30777408268)) |

**Recommendation:** `SAFE_TO_SHARE` for Pack A friend accounts. Staff/Super Admin remain internal and require manual MFA enrollment.
