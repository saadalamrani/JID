# JID Platform

Arabic-first employment and mentorship platform built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14.2.15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + JID design tokens |
| UI | shadcn/ui (Radix primitives) |
| i18n | next-intl (`ar` default, `en`) |
| Data | Supabase (Postgres, Auth, Realtime, Storage) |
| Client state | TanStack Query v5 |

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill Supabase credentials
pnpm check-env
pnpm dev                     # http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (port 3000) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm type-check` | TypeScript validation |
| `pnpm lint` | ESLint |
| `pnpm check-env` | Validate `.env.local` against Zod schema |
| `pnpm gen-types` | Regenerate Supabase types from local DB |
| `pnpm supabase:start` | Start local Supabase (requires Docker) |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Setup guide](docs/SETUP.md)
- [Conventions](docs/CONVENTIONS.md)

## Locales

| Path | Locale | Direction |
|------|--------|-----------|
| `/` | Arabic (`ar`) | RTL |
| `/en` | English (`en`) | LTR |

## Deployment

Configured for [Vercel](https://vercel.com) via `vercel.json`. Set environment variables in the Vercel dashboard before deploying.

## License

Private — All rights reserved.
