# JID Interview Demo Runbook

**Environment:** non-production only  
**URL:** https://jid-dev.vercel.app  
**Supabase ref:** `hmjuijmaefajdjrjdsxu`  
**Timezone:** Asia/Riyadh  
**Branch:** `cursor/jid-interview-mvp-final-closeout-v1`

Password for fixture accounts lives in `scripts/lib/seed-safety.ts` (nonprod fixtures only). Do not share production credentials. Never use `znfhladafpajyjwcfzvv`.

## Before the interview

1. Open https://jid-dev.vercel.app/ar (Arabic-first).
2. Confirm the hero reads: **جِد تربط الفرد، جهة التوظيف، والجامعة**.
3. Guest CTAs: **إنشاء حساب** and **استكشف الفرص**.
4. Keep a second window on `/en` only if the interviewer asks for English.

## Actor sequence (recommended)

### 1. Public / guest

| Step | Route | What to show |
|---|---|---|
| Home | `/ar` | Three-actor positioning; no Pulse footer unless the Pulse flag is on |
| Opportunities | `/ar/opportunities` | Native JID jobs plus Lammah listings; apply is on the official source |
| Catalogue | `/ar/catalog` | Platform Directory records (not owned Profiles). Seed slugs `seed-%` are excluded |

Do **not** open Abhathli, Professional Discovery controls, or Paid Visibility. They are out of demo scope.

### 2. Individual

- Login: `/ar/login` → `individual-complete@jidseed.test`
- Land on the individual profile / `/me`
- Show CV builder as a **render** of the canonical profile (`/ar/profile/cv`) — not a second source of truth
- Print CV uses **باني السيرة الذاتية**
- Radar (`/ar/radar`) if asked about applications

### 3. Business

- Login: `/ar/login` → `business-verified@jidseed.test`
- Dashboard: `/ar/company/dashboard`
- Owned profile is **منشأة جِد التجريبية** — Directory row `seed-verified-business-co` is separate and not public catalogue
- Applicants: published job **مهندس برمجيات** (`b3000007-0000-4000-8000-000000000007`) has 1 application. Open `/ar/jobs/{id}/applicants` as the **owner** (`business_profiles.owner_user_id`)

### 4. University

- Login: `/ar/login` → `university-verified@jidseed.test`
- Dashboard: `/ar/university/dashboard`
- Owned space name: **مساحة جامعة تجريبية**
- `/ar/university/rejected` is a real Spec 03 outcome surface (must not crash)

### 5. Staff (internal)

- Login: `/ar/staff/login` → `staff@jidseed.test`
- Catalogue / Lammah review if asked: publication is staff-gated; auto-publish is **OFF**
- Super Admin `admin@jidseed.test` may hit AAL2 (`SYS_POST_MFA_RUNTIME_QA_LIMITATION`). Prefer `staff@` for the demo.

## Lammah talking points

- 13 active opportunities from official sources (Aramco, KAUST, Elm, HRDF Tamheer).
- ACWA Planning Engineer is **not** published (Directory mapping unavailable; no invented Directory row).
- Application never happens inside JID; the listing points at the official URL.
- Auto-publication remains disabled.

## Directory talking points

- 36 public active business Directory rows (non-seed).
- Directory ≠ Profile. Publishing a catalogue row does not create an owned employer account.

## If something looks empty

That is honest. Do not invent KPIs, match percentages, or engagement metrics.
