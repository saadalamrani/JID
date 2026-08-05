# Shareable cloud test access (non-production)

**Canonical target:** Vercel `jid-dev` → `https://jid-dev.vercel.app`
**Supabase:** `jid-nonprod` → project ref `hmjuijmaefajdjrjdsxu`
**Seed marker:** `JID_SHAREABLE_TEST_SEED_V2`
**Command-center report:** [`docs/command-center/reports/JID_SHAREABLE_NONPROD_TEST_ACCESS.md`](./command-center/reports/JID_SHAREABLE_NONPROD_TEST_ACCESS.md)

## Safety (hard gates)

`pnpm seed:cloud-test --execute --i-confirm-non-production` refuses unless:

| Gate                  | Required value                                 |
| --------------------- | ---------------------------------------------- |
| `SEED_ENV`            | `nonprod` (or other allowed non-prod class)    |
| Project ref           | exactly `hmjuijmaefajdjrjdsxu`                 |
| Site URL              | exactly `https://jid-dev.vercel.app`           |
| Confirmation          | `--i-confirm-non-production`                   |
| Privileged credential | `SEED_DATABASE_URL` (server-side Postgres URI) |

Never seeds production (`znfhladafpajyjwcfzvv`, `jid.sa`, `SEED_ENV=production`).

## Seed

```bash
cd jid-platform
cp .env.seed.nonprod.example .env.seed.nonprod
# fill SEED_DATABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY

pnpm seed:cloud-test
pnpm seed:cloud-test --execute --i-confirm-non-production

pnpm seed:cloud-test --print-matrix
pnpm seed:cloud-test --print-whatsapp
pnpm seed:cloud-test --print-premium-matrix
pnpm seed:cloud-test --print-internal
```

SQL applied (idempotent):

1. `supabase/seed/local-test-accounts.sql` — auth users, profiles, Directory ≠ Profile, Verification, mentor fixtures
2. `supabase/seed/shareable-test-premium-entitlements.sql` — complimentary `jid_plus` / `employer_premium` with `payment_provider=nonprod_seed`

Shared password: `JidSeed123!`

## Premium truth (Model 1)

| Actor                 | Plan key           | Feature keys                                         |
| --------------------- | ------------------ | ---------------------------------------------------- |
| Individual (+ mentor) | `jid_plus`         | `cv_pro_formats`, `lammah_feed`                      |
| Business              | `employer_premium` | `smart_communication`, `ssis`, `priority_visibility` |
| University            | —                  | **Not implemented** in Model 1                       |
| Staff / Super Admin   | —                  | Internal auth only — no consumer subscription        |

Pending Business may hold an `employer_premium` seed row for boundary testing; verified-only authority remains blocked until Verification is approved.

## Packs

- **Pack A (friends):** Individual complete/new, mentor, Business verified/pending, University verified/pending
- **Pack B (founder/internal):** Staff + Super Admin — **داخلي فقط — لا يُشارك بشكل عام** — MFA enrollment required (no shared TOTP secret in Git)

## Architecture reminders

- Public actors: Individual / Business / University only
- Mentor = Individual + mentor capability
- Directory ≠ owned Profile
- Verification approval ≠ automatic Profile ownership
- No Claim Existing Profile
- No real billing charges; seed entitlements are marked `nonprod_seed` / complimentary
