# JID-102B — Deliberate Business and University Profile Creation Report

Date: 2026-07-20 (Asia/Riyadh)

## Result

Business and University representatives now deliberately create **draft** owned Profiles after Staff approval. Business creation no longer attempts owner writes to `status` or `published_at`. University approved-without-profile users route to `/university/create-profile` instead of looping through pending-review.

No verification INSERT RLS, JID-102A migration, billing, jobs, production, cloud, or `TASK_BOARD.md` changes.

## Base

- Required base commit: `7e8e21a36fee6ce4941c1bac3d1f72b7c536ab89`
- Branch: `cursor/jid-102b-profile-creation`
- Isolated worktree: `JID-worktrees/jid-102b-profile-creation`
- Prior Cursor worktree (`jid-102a1-verification-boundary`): **clean** — no uncommitted changes; no abort diff required

## Business behavior

### Before

- `create_business_profile` RPC created a draft Profile
- `publishBusinessProfileAction` then owner-updated `status = published` and `published_at`
- JID-107 moderation boundary rejected those fields → UI reported failure despite RPC success

### After

- `createBusinessProfileAction` calls RPC only for creation authority
- Post-RPC owner UPDATE writes **content fields only** (tagline, about, founded year, etc.)
- Profile remains **`draft`**
- Success toast + redirect to `/company/dashboard`
- Copy updated from “publish” to “create draft profile”

## University behavior

### Before

- `create_university_profile` RPC existed
- No `/university/create-profile` application flow
- `checkOrganizationProfile` sent approved-without-profile users to `/university/pending-review` → redirect loop

### After

- `/university/create-profile` page + wizard + `createUniversityProfileAction`
- Approved-without-profile → `/university/create-profile`
- Pending/under-review → `/university/pending-review`
- Rejected → `/university/rejected` (new page)
- Existing profile owner → satisfied (portal access)
- Suspended → `/university/profile-suspended`
- Post-creation redirect → `/university/dashboard`
- Profile remains **`draft`**

## Routes

| Route | Action |
|-------|--------|
| `/company/create-profile` | Fixed — draft creation only |
| `/university/create-profile` | **Created** |
| `/university/rejected` | **Created** |
| `/university/pending-review` | **Updated** — lifecycle redirects |

## Tests (14/14 matrix)

Unit tests in `profile-creation.test.ts` + `profile-creation-content.test.ts`:

1. Unverified Business user cannot create (RPC + routing)
2. Approved Business representative can create draft (RPC mock)
3. Business content patch excludes status/published_at
4. Duplicate Business creation denied (`profile_already_created`)
5. Unverified University user cannot create
6. Approved University → `/university/create-profile`
7. Approved University can create draft (RPC mock)
8. University routing loop removed
9. Duplicate University creation denied
10. Wrong verification type denied
11. Pending/rejected route correctly
12. Existing profile owner satisfied
13. AR/EN copy parity for create-profile keys
14. JID-107 RLS tests **unchanged** (5 skipped RLS suites when no disposable env)

## Quality gate

- `git diff --check`: PASS
- `corepack pnpm --version`: 9.15.4
- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm lint`: PASS
- `corepack pnpm type-check`: PASS
- `corepack pnpm test`: PASS — 62 passed / 34 skipped (RLS suites)
- `corepack pnpm build`: PASS

## Deferred scope

- **Publication workflow** — Profiles remain `draft`; no owner or Staff publish flow in this task
- Team memberships, ownership transfer, billing/subscription changes

## Files changed

- `src/lib/auth/organization-profile.ts`
- `src/lib/auth/profile-creation-content.ts`
- `src/lib/auth/profile-creation-content.test.ts`
- `src/lib/auth/profile-creation.test.ts`
- `src/lib/auth/guards.ts`
- `src/lib/validations/university-profile.ts`
- `src/app/[locale]/(company)/company/create-profile/actions.ts`
- `src/app/[locale]/(company)/company/create-profile/_components/profile-creation-wizard.tsx`
- `src/app/[locale]/(company)/company/create-profile/_components/profile-wizard-shell.tsx`
- `src/app/[locale]/(university)/university/create-profile/**` (new)
- `src/app/[locale]/(university)/university/pending-review/page.tsx`
- `src/app/[locale]/(university)/university/rejected/page.tsx` (new)
- `messages/en.json`, `messages/ar.json`
- Removed: `src/lib/auth/organization-profile.test.ts` (consolidated into profile-creation.test.ts)
