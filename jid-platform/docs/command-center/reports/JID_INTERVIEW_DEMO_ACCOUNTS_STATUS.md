# JID Interview Demo Accounts Status

**Checked at:** 2026-08-23 (Asia/Riyadh)  
**Target:** nonprod Supabase `hmjuijmaefajdjrjdsxu` only  
**Password:** fixture password in `scripts/lib/seed-safety.ts` — not repeated here.

## Auth API password login

All of the following succeeded (`email_confirmed`):

| Email | Role | Login |
|---|---|---|
| `individual-complete@jidseed.test` | individual | PASS |
| `individual-new@jidseed.test` | individual | PASS |
| `business-verified@jidseed.test` | company_admin | PASS |
| `university-verified@jidseed.test` | university_admin | PASS |
| `staff@jidseed.test` | staff | PASS |
| `admin@jidseed.test` | super_admin | PASS |

## Presentation names (after targeted UPDATE)

| Surface | Value |
|---|---|
| Individual complete `full_name` | حساب جِد التجريبي |
| Business owned profile | منشأة جِد التجريبية / JID Demo Organization |
| University owned profile | مساحة جامعة تجريبية / JID Demo University |
| Seed Directory business slug | `seed-verified-business-co` (excluded from public catalogue) |
| Seed Directory university slug | `seed-verified-university` (excluded from public catalogue) |

## Business triage fixture

| Field | Value |
|---|---|
| `business_profiles.owner_user_id` | `b1000005-0000-4000-8000-000000000005` |
| Published job | Software Engineer / مهندس برمجيات |
| Job id | `b3000007-0000-4000-8000-000000000007` |
| Applications | 1 |

## MFA

| Email | `auth.mfa_factors` |
|---|---|
| `individual-complete@jidseed.test` | 0 |
| `business-verified@jidseed.test` | 0 |
| `university-verified@jidseed.test` | 0 |
| `staff@jidseed.test` | 0 |
| `admin@jidseed.test` | 1 |

**SYS_POST_MFA_RUNTIME_QA_LIMITATION:** Super Admin still has one enrolled MFA factor. Runtime QA for `/sys` AAL2 is not claimed. Interview Staff demo should use `staff@jidseed.test`. MFA was not bypassed.

## Not re-run

Full `pnpm seed:cloud-test --execute` was not re-applied in this closeout. Names, login, and the owned-job fixture were verified with targeted SQL + Auth API instead, to avoid resetting Lammah/catalog publication state.
