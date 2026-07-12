# RLS Test Harness (P-003)

Reusable pattern for asserting Supabase Row Level Security against a **local or dedicated test** instance — never production.

## Target environment

- Point `NEXT_PUBLIC_SUPABASE_URL` at local Supabase (`http://127.0.0.1:54321` after `pnpm supabase:start`).
- Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from `supabase start` output (or `.env.local`).
- Helpers in `helpers/supabase-clients.ts` refuse non-local URLs so accidental cloud runs are blocked.

Run:

```bash
pnpm supabase:start
pnpm vitest run tests/rls
```

## Client roles

| Client | Key | Purpose |
|--------|-----|---------|
| **Service role** | `SUPABASE_SERVICE_ROLE_KEY` | Setup/teardown only — create users, seed rows, delete fixtures. Bypasses RLS. |
| **Anon** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Unauthenticated policies (`anon` role). |
| **Authenticated** | Anon key + `signInWithPassword` | Per-user JWT; policies see `auth.uid()`. |

Future suites will add dedicated contexts for `individual`, `entity`, `staff`, and `super_admin` by creating users with the appropriate `profiles.role` (or invite flows) and signing in as each.

Factory helpers live in `helpers/supabase-clients.ts`:

- `createServiceRoleClient(env)` — admin operations
- `createAnonClient(env)` — unsigned requests
- `createAuthenticatedClient(env, email, password)` — role-under-test client

## Assertion shape

Every RLS test should read like a policy sentence:

> **As role X**, `SELECT` / `INSERT` / `UPDATE` / `DELETE` on table **Y** should **[succeed | fail]** when **[condition]**.

Example (`profiles.rls.test.ts`):

- As **authenticated user A**, `SELECT` on `profiles` where `id = auth.uid()` → **succeed**
- As **authenticated user A**, `SELECT` on `profiles` where `id = user_B.id` and `visibility = private` → **fail** (zero rows)

Prefer `maybeSingle()` + `expect(data).toBeNull()` for denied `SELECT`, and explicit `error` checks for denied writes.

## Fixtures (`fixtures/`)

- One file per domain (e.g. `fixtures/profiles.ts`).
- Export `create*` helpers that use the **service role** to insert minimal valid rows.
- Export matching `delete*` / `cleanup*` helpers.
- Generate unique emails/IDs per run (`randomUUID`) to avoid collisions.

## Seed / cleanup convention (hard rule)

1. **beforeAll** — service role creates users and seed data.
2. **Test body** — only authenticated/anon clients; never service role for assertions.
3. **afterAll** — service role deletes everything created in step 1 (users cascade to `profiles`).

The database must be left in the state the suite found. No orphaned `rls-*@jid.local.test` users.

## File layout

```
tests/rls/
  README.md                 ← this document
  helpers/
    supabase-clients.ts     ← env guard + client factories
  fixtures/
    profiles.ts             ← profile test users
  *.rls.test.ts             ← one policy area per file
```

## Adding a new RLS test

1. Add fixture helpers under `fixtures/` if new tables are involved.
2. Create `tests/rls/<area>.rls.test.ts` with `// @vitest-environment node` at the top.
3. Gate with `getRlsTestEnv()` — skip when local Supabase is unavailable (CI may allow-fail until Phase 7).
4. Document the migration/policy name in a file header comment.
5. Ownership Law proofs live in `ownership-law.rls.test.ts` (P-103 migrations 109–113).
6. Jobs re-anchoring proofs live in `jobs-reanchor.rls.test.ts` (P-104 migrations 114–116).

## What not to test here (yet)

- Production Supabase projects
- Policies that require full seed graphs unless fixtures are explicitly maintained
