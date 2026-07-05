# JID Platform — Setup Guide

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | LTS recommended |
| pnpm | 9.15+ | `npm install -g pnpm` |
| Docker Desktop | Latest | Required for local Supabase |
| Supabase CLI | 2.20+ | Bundled via `pnpm` devDependency |

## 1. Clone and install

```bash
git clone https://github.com/saadalamrani/JID.git
cd JID/jid-platform
pnpm install
```

## 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in values from your [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API:

| Variable | Where |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` secret (server only) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for local dev |

Validate:

```bash
pnpm check-env
```

## 3. Local Supabase (optional)

Requires Docker Desktop running.

```bash
pnpm supabase:start
```

Copy the `anon key` and `service_role key` from the CLI output into `.env.local`.

- API: `http://127.0.0.1:54321`
- Studio: `http://localhost:54323`
- Database: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Regenerate TypeScript types after schema changes:

```bash
pnpm gen-types
```

## 4. Development server

```bash
pnpm dev
```

Open:

- Arabic (default): http://localhost:3000
- English: http://localhost:3000/en
- Health check: http://localhost:3000/api/health

## 5. Quality checks

```bash
pnpm type-check   # TypeScript
pnpm lint         # ESLint
pnpm build        # Production build
pnpm format:check # Prettier
```

## 6. Git hooks

Husky runs at the repository root (`JID/`). Hooks execute lint-staged inside `jid-platform/`:

- **pre-commit**: Prettier + ESLint on staged files
- **commit-msg**: Conventional commit format enforced by commitlint

Example valid commit: `feat: add user profile page`

## 7. Vercel deployment

1. Connect the GitHub repository to Vercel
2. Set **Root Directory** to `jid-platform`
3. Add all environment variables from `.env.example`
4. Deploy — `vercel.json` configures the build

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `check-env` fails | Ensure `.env.local` exists with valid Supabase URL |
| `supabase start` fails | Start Docker Desktop, retry |
| Port 3000 in use | `pnpm dev -- -p 3001` or kill the conflicting process |
| Font flash on load | Fonts use `display: swap` — expected on slow connections |
