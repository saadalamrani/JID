# JID — Wave 1 / Front 3 Closeout

**Front:** Design Foundations / Frontend Shared Primitives
**Status:** CODE COMPLETE
**Starting branch:** `cursor/wave1-front3-design-foundations` (created from `nebres/wave1-front2-codex-contracts`)
**Starting SHA:** `8a3f6bca8a655be278b3a736d99cdf7cceb230b1`
**Final branch:** `cursor/wave1-front3-design-foundations`
**Final implementation SHA:** `7e911cde3bf30e0dd2c8fca54518e18a61e2f82e`

The closeout document is committed after the implementation commit. Its commit SHA is
reported in the final control-tower handoff because a commit cannot embed its own SHA.

## Changed files

### Modified

- `src/config/design-tokens.ts`
- `src/config/semantic-theme-plugin.ts`
- `tailwind.config.ts`
- `src/lib/typography.ts`
- `src/styles/fonts.ts`
- `src/app/[locale]/globals.css`
- `src/components/ui/status-badge.tsx`
- `src/components/ui/page-header.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/bottom-sheet.tsx`
- `src/components/auth/form-field.tsx`
- `tests/unit/design-system/tokens-typography.test.ts`
- `tests/unit/design-system/status-badge.test.tsx`
- `tests/unit/design-system/page-header.test.tsx`
- `tests/unit/design-system/dialog-rtl.test.tsx`

### Created

- `src/lib/ui/a11y.ts`
- `src/lib/ui/surface-state.ts`
- `src/lib/ui/contract-presentation.ts`
- `src/components/ui/sheet.tsx`
- `src/components/ui/form-field.tsx`
- `src/components/ui/surface-state.tsx`
- `src/components/ui/metric-figure.tsx`
- `src/components/ui/responsive-record-list.tsx`
- `src/components/ui/automation-review-callout.tsx`
- `tests/unit/design-system/sheet-rtl.test.tsx`
- `tests/unit/design-system/form-field.test.tsx`
- `tests/unit/design-system/surface-state.test.tsx`
- `tests/unit/design-system/contract-presentation.test.tsx`
- `tests/unit/design-system/automation-review-callout.test.tsx`
- `tests/unit/design-system/responsive-record-list.test.tsx`
- `tests/unit/design-system/front3-invariants.test.ts`
- `docs/command-center/wave-1/WAVE_1_FRONT_3_CLOSEOUT.md`

No dependency, migration, Edge Function, product route, product screen, RLS policy,
pricing behavior, or deployment configuration changed.

## Semantic token changes

- Frozen first-class semantic roles: `background`, `surface`, `card`, `foreground`,
  `textPrimary`, `textSecondary`, `border`, `primary`, `accent`, `success`, `warning`,
  `danger`, `focus`, `ring`.
- Brand aliases remain for theme wiring: olive `#2F3A2E`, secondary olive `#414D40`,
  gold `#E6B43A`, warm off-white `#F7F5EF`.
- Feature-facing Tailwind tokens now resolve through `--color-foreground`,
  `--color-primary`, `--color-accent`, and `--color-focus`.
- Gold remains accent/action/focus, not a decorative fill.
- No blue/purple AI gradients, glassmorphism, glow, or aurora were introduced.
- Legacy `jid-*` palette tokens were preserved; no mass rewrite of old surfaces.

## Typography changes

- Arabic remains IBM Plex Sans Arabic.
- Latin remains Manrope.
- Mono token now matches the loaded face: JetBrains Mono (no IBM Plex Mono mismatch).
- All `text-*` size tokens use `letterSpacing: 0`. Latin tracking remains opt-in via
  `typographyScale.classes` only.
- `html[lang='ar']` still forces `letter-spacing: 0` on all descendants.
- Lining Latin digits are set as the product default (`font-variant-numeric: lining-nums`).
- No decorative all-caps/kicker pattern was added as a platform default.

## Shared primitives created/reconciled

Reconciled:

- `PageHeader` plus new `SectionHeader` grammar
- `StatusBadge` (contract-backed domain/state map, visual variants retained)
- `FilterBar` (unchanged; already logical/responsive)
- `Dialog` (named close slot, 44px target, reduced-motion)
- `BottomSheet` (named close slot, 44px target, reduced-motion)
- `Table` (unchanged; already `text-start`)
- Auth `FormField` now re-exports the shared primitive

Created:

- `Sheet` (start/end/bottom, RTL logical edges)
- `FormField` (label / hint / error / `aria-invalid`)
- `SurfaceStateView` (loading / ready / empty / error / forbidden / unavailable / stale)
- `ResponsiveRecordList` (stacked list on small screens, table from `md`)
- `MetricFigure` (source, window, population, coverage, missingness, privacy)
- `AutomationReviewCallout` (explainability, human review, explicit confirmation)
- `a11y` helpers (focus ring, touch target, reduced motion, visually hidden)

## State components implemented

UI surface states only — not competing C1–C10 enums:

- `loading` — announced, no placeholder KPIs
- `ready` — children slot
- `empty` — truthful copy, optional action
- `error` — retry only when a caller supplies a real retry handler
- `forbidden` — dedicated copy; no “load then hide” payload
- `unavailable` — capability/source unavailable, no glow/glass
- `stale` — distinguishable freshness copy

Offline/retry is not a standalone product flow. Retry exists only on error surfaces that
already have a technical retry callback (`isDbOfflineError` remains the existing backend
hint, unused by this front as a new screen).

## Accessibility / RTL evidence

Unit evidence (jsdom), both `dir="rtl"` and `dir="ltr"`:

- Dialog close uses `end-4`, not `right-4`; keyboard tab reaches the named close control
- Sheet start/end use logical `start-0` / `end-0` plus RTL slide variants
- StatusBadge, PageHeader, FilterBar, FormField render Arabic and English slots
- `tracking-normal` on shared headings/badges
- `prefers-reduced-motion` global CSS plus `motion-reduce:*` on Dialog/Sheet/BottomSheet
- Icon-only close controls require an accessible name and `min-h-11 min-w-11`
- Color is never the only status indicator (label is required)

No browser MCP/devtools were available in this session, so live Arabic/English viewport
screenshots and overflow probing were not captured. Representative shared components were
verified through focused RTL/LTR, keyboard, and reduced-motion tests instead.

## Tests and exact results

1. `pnpm exec vitest run tests/unit/design-system --reporter=verbose --maxWorkers=3`
   - Exit `0`.
   - `13` test files passed; `62` tests passed; `0` failed or skipped.
   - Existing toolchain notice: Vite reported that native `resolve.tsconfigPaths` can
     replace the currently configured `vite-tsconfig-paths` plugin. No dependency/config
     change was made.
   - An earlier unlimited-worker run hit Vitest fork-pool timeouts on this machine; the
     bounded `--maxWorkers=3` rerun is the recorded passing evidence, including a second
     pass after Prettier.
2. `pnpm type-check`
   - Exit `0`; no TypeScript errors.
3. `pnpm lint`
   - Exit `0`; `No ESLint warnings or errors`.
4. `pnpm exec prettier --check` on changed files
   - Exit `0`; all matched files use Prettier code style.
   - Checking the whole `tests/unit/design-system` folder also warned on pre-existing
     `button-brand.test.tsx` and `filter-bar.test.tsx`. Those files were not part of this
     front and were not rewritten.
5. `pnpm build`
   - Exit `0`.
   - Next.js `14.2.15` compiled successfully, linted, validated types, generated
     `304/304` static pages, finalized optimization, and collected build traces
     (`elapsed_ms: 433045`).
6. `git diff --check`
   - Exit `0`; no whitespace errors.
   - Git emitted Windows line-ending notices that LF working-tree content may be converted
     to CRLF when Git next touches the files; no content or validation failure resulted.

No broader unrelated test suite was run.

## Unresolved design debt

- `FeatureUnavailable` still uses decorative gold/glow/glass treatment. It was not
  mass-rewritten; later consumers should move to `SurfaceStateView state="unavailable"`.
- Existing `EmptyState` still requires a Lucide icon. The new surface empty state does not.
- `ErrorState` still defaults retry copy to English `"Try again"`. Callers should pass i18n;
  the new error surface requires a caller-supplied label when retry is present.
- Dialog/Sheet/BottomSheet `closeLabel` still defaults to English `"Close"` so existing
  tests keep a named control. Feature screens must pass `next-intl` copy.
- Raw `jid-*` colors, local gradients, and inconsistent radius remain on legacy screens.
  This front did not mass-migrate them.
- `typographyScale` Latin classes still include approved negative tracking; Arabic bundles
  stay at `tracking-normal`.
- `BottomSheet` remains for current mobile/nav consumers; `Sheet` is the cross-wave primitive.
- No live AR/EN browser screenshots were captured in this environment.

## Confirmations

- No domain contract in `src/types/contracts` was changed.
- No Wave 2+ screen was implemented (no Career Record, CV builder, Opportunity, Radar,
  Abhathli, Social/feed, Hiring Workspace, assessment, University dashboard, Government,
  or GCC market work).
- No Supabase/database change occurred. No migration was created or applied.
- No production deployment was intentionally performed.
- This branch was not merged to `main`.
- Git push of a non-`main` branch may trigger automatic Vercel **PREVIEW** builds.
  Those must not be aliased, promoted, or treated as production. PREVIEW ≠ PRODUCTION.

## Exact recommendation for Wave 1 final validation/closeout

Wave 1 now has all three bounded fronts on dedicated branches:

1. Front 1 architecture packet (Claude)
2. Front 2 canonical contracts (Codex) at `8a3f6bca8a655be278b3a736d99cdf7cceb230b1`
3. Front 3 design foundations (this branch) at implementation SHA `7e911cde3bf30e0dd2c8fca54518e18a61e2f82e`

Control Tower should:

1. Review this branch against Front 2 contracts and the design-foundation handoff.
2. Confirm no production alias/promote occurred if a Vercel preview appears.
3. Author `docs/command-center/wave-1/WAVE_1_CLOSEOUT_REPORT.md` only after all three
   fronts are accepted.
4. Keep Wave 2+ product work gated on `WAVE_1_COMPLETE`.
5. Do not merge this branch to `main` as part of Front 3 closeout.

WAVE_1_CURSOR_FOUNDATIONS_COMPLETE
