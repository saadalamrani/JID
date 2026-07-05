# JID Platform — Conventions

## Package manager

Always use **pnpm**. Never commit `package-lock.json` or `yarn.lock`.

## TypeScript

- `strict: true` and `noUncheckedIndexedAccess: true` — do not weaken
- No `any`; use `unknown` + type guards or Zod
- Prefer `import type { Foo }` for type-only imports
- Path alias: `@/` maps to `src/`

## React & Next.js

- **Server Components by default** — add `'use client'` only when needed
- Use `next/navigation`, not `next/router`
- Use `next/image` for images
- Colocate Server Actions in `actions.ts` next to their route segment
- Never read `process.env` directly — use `src/lib/env.ts`

## i18n

- All user-facing strings in `messages/ar.json` and `messages/en.json`
- Use `useTranslations` (client) or `getTranslations` (server)
- Never hardcode UI text in components
- Navigation: import `Link` from `@/lib/i18n/navigation`, not `next/link`

## Styling

- Colors from `src/config/design-tokens.ts` via Tailwind `jid-*` classes
- Never hardcode hex values in components
- RTL default; use `dir` from `localeConfig`
- Arabic: never apply positive `letter-spacing`
- Numbers: always Latin digits via `format.ts` (`numberingSystem: 'latn'`)
- Mono text: JetBrains Mono via `font-mono`

## Supabase

- Browser: `@/lib/supabase/client`
- Server: `@/lib/supabase/server`
- Middleware: `@/lib/supabase/middleware`
- Admin (server-only): `@/lib/supabase/admin`
- Never import `admin.ts` from Client Components
- Enable RLS on every table; write policies before exposing data
- Migrations in `supabase/migrations/` — never edit applied migrations

## File naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserMenu.tsx` |
| Utilities | kebab-case or camelCase file | `format.ts` |
| Server Actions | `actions.ts` | `profile/actions.ts` |
| Hooks | `use-` prefix | `use-tasks.ts` |
| Types | PascalCase in `types/` | `types/database.ts` |

## Git commits

Conventional Commits enforced by commitlint:

```
<type>(<optional scope>): <description>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
```

Examples:

- `feat(auth): add phone OTP verification`
- `fix(jobs): correct expiry date formatting`
- `chore: update dependencies`

## Code review checklist

- [ ] No hardcoded strings (i18n)
- [ ] No hardcoded colors (design tokens)
- [ ] No `any` types
- [ ] No service role key in client code
- [ ] RLS policies for new tables
- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
