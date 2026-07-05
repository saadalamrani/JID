# JID Platform — Architecture

## Overview

JID (جِد) is a bilingual (Arabic-first) web platform connecting talent with employment and mentorship opportunities. The frontend is a Next.js App Router application; all persistent data lives in Supabase Postgres with Row Level Security.

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / Client                     │
│  React 18 · next-intl · TanStack Query · Tailwind       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│              Next.js 14 App Router (Vercel)              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Middleware  │  │ Server       │  │ API Routes      │ │
│  │ (i18n/auth) │  │ Components   │  │ /api/health     │ │
│  └─────────────┘  └──────────────┘  └─────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Supabase clients: browser · server · middleware ·   │ │
│  │ admin (service-role, server-only)                   │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ Supabase JS / PostgREST
┌────────────────────────▼────────────────────────────────┐
│                    Supabase Cloud / Local                  │
│  Postgres · Auth · Realtime · Storage · Edge Functions  │
└─────────────────────────────────────────────────────────┘
```

## Directory structure

```
jid-platform/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root HTML shell + fonts
│   │   ├── [locale]/               # Locale-scoped pages
│   │   │   ├── layout.tsx          # i18n + Query + Toaster
│   │   │   ├── page.tsx            # Home
│   │   │   ├── error.tsx           # Error boundary
│   │   │   ├── not-found.tsx       # 404
│   │   │   └── globals.css         # Design tokens + base styles
│   │   └── api/health/route.ts     # Health check
│   ├── components/
│   │   ├── ui/                     # shadcn primitives
│   │   └── providers/              # Query, locale attributes
│   ├── config/
│   │   ├── design-tokens.ts        # Canonical color/spacing/type tokens
│   │   └── site.ts                 # Site metadata config
│   ├── lib/
│   │   ├── supabase/               # Supabase client layer
│   │   ├── i18n/                   # next-intl routing + navigation
│   │   ├── utils/                  # cn, format, validators, constants
│   │   └── env.ts                  # Zod env validation
│   ├── styles/fonts.ts             # next/font definitions
│   └── middleware.ts               # Locale routing
├── messages/                       # ar.json, en.json
├── supabase/                       # Migrations, config.toml
├── public/                         # Static assets
└── docs/                           # Project documentation
```

## Key design decisions

### Arabic-first i18n

- Default locale `ar` served at `/` (no prefix) via `localePrefix: 'as-needed'`
- English at `/en`
- `html[lang="ar"]` enforces `letter-spacing: 0` to preserve Arabic glyph joining
- RTL numerals, time, and mono text are LTR-isolated in CSS

### Supabase client separation

| Client | File | Context |
|--------|------|---------|
| Browser | `client.ts` | Client Components |
| Server | `server.ts` | Server Components, Server Actions |
| Middleware | `middleware.ts` | `middleware.ts` session refresh |
| Admin | `admin.ts` | Server-only, bypasses RLS (service role) |

### Security boundaries

- `SUPABASE_SERVICE_ROLE_KEY` never exposed to the browser
- `admin.ts` imports `server-only` guard
- All tables require RLS policies before production
- Env vars validated through `src/lib/env.ts` Zod schema

## Data flow (planned)

Auth sessions are stored in HTTP-only cookies managed by `@supabase/ssr`. Server Components fetch data through the server client; Client Components use TanStack Query with the browser client. Realtime subscriptions use Supabase channels for live updates.

## Deployment target

Vercel (Frankfurt region) with environment variables mirroring `.env.example`.
