# JID — Wave 1 Design Foundation Handoff

**Owner after contract acceptance:** Cursor  
**Scope:** shared design foundations only; no Wave 2+ feature-screen redesign

## 1. Current design truth

### Preserve

- Brand primary olive: `#2F3A2E`.
- Secondary olive: `#414D40`.
- Gold: `#E6B43A`.
- Warm off-white/beige: `#F7F5EF`.
- Arabic: IBM Plex Sans Arabic.
- Latin: Manrope.
- semantic theme variables already wired through Tailwind.
- existing `next-intl` / locale routing and Arabic-first structure.
- existing reusable brand/logo, Smart Header, language switcher, auth/layout and other shared primitives where they pass current UX/accessibility review.

### Current conflicts / debt

1. `design-tokens.ts` applies negative `letterSpacing` to larger typography sizes. This is unsafe for Arabic and conflicts with the zero-letter-spacing requirement for Arabic-rendered text. Cursor must establish language-safe typography behavior rather than applying Latin tracking to Arabic.
2. `design-tokens.ts` names IBM Plex Mono in its raw token list while `src/styles/fonts.ts` currently loads JetBrains Mono. This is a consistency defect; resolve to one actual current mono token without changing the approved Arabic/Latin brand faces.
3. raw `jid-*`, `bg-white`, local gradients and inconsistent radius/card treatments remain across legacy surfaces. Do not mass-rewrite blindly; migrate shared primitives first and later feature waves consume them.
4. role-specific route groups and older component generations coexist. Shared foundations must not become a reason for broad route refactoring in Wave 1.

## 2. Design authority for Cursor

Use in this order for Wave 1 design work:

1. adopted JID Trust & Rights Constitution;
2. dated Founder Decisions / Wave 1 frozen contracts;
3. current architecture, privacy, permissions and real domain states;
4. current Brand Identity and canonical design tokens;
5. JID UI Audit and Anti-Slop Addendum;
6. `slop.md` anti-generic design rules;
7. reference images as inspiration only.

When an old UI audit recommendation conflicts with a newer founder decision, the founder decision wins. In particular, the Professional / Social Layer is now approved; anti-slop rules govern its quality and incentives rather than banning its existence.

## 3. Semantic foundation to freeze

Cursor should consolidate—not reinvent—the following semantic roles:

### Color roles

`background`, `surface`, `card`, `foreground/text-primary`, `text-secondary`, `border`, `primary/olive`, `accent/gold`, `success`, `warning`, `danger`, `focus/ring`.

Rules:

- feature code consumes semantic roles first;
- raw brand palette is available to foundation code, not as the default feature styling language;
- no blue/purple AI gradients, glow or glassmorphism as generic decoration;
- gold is purposeful accent/action/emphasis, not a decorative fill for every element;
- color is never the only indicator of state.

### Typography

- Arabic: IBM Plex Sans Arabic.
- English/Latin: Manrope.
- Arabic letter spacing = `0` in all text sizes/weights.
- English may use approved tracking where needed, but typography tokens must be direction/language safe.
- Latin digits in Arabic and English product UI.
- headings and body hierarchy rely on size/weight/spacing rather than decorative uppercase/kicker patterns.

### Geometry

Preserve a small controlled radius set and quiet elevation. Cards are not the default layout unit. Use sections, lists, tables, dividers, whitespace, drawers/sheets and direct surfaces according to the job.

### Motion

- content visible by default;
- motion is enhancement, not a loading dependency;
- respect `prefers-reduced-motion`;
- avoid repeated hover-lift/entrance animation patterns;
- use motion only to clarify state, hierarchy or transition.

## 4. Required universal page states

Every data-bearing shared pattern must support real contract states without invented filler:

- `loading`
- `ready`
- `empty`
- `error`
- `forbidden`
- `unavailable/disabled` where capability/source is legitimately unavailable
- `stale` where source freshness is material
- `offline/retry` only where the actual technical flow supports it

Rules:

- missing numbers do not become `0` unless zero is the actual measured value;
- a missing metric card disappears unless the user needs a truthful empty state/action;
- forbidden data is not loaded then hidden;
- stale source data is visibly different from current verified data where material.

## 5. Domain-state presentation contract

Shared badges/chips may represent **real** domain states only. Examples:

- declared / verified / needs review;
- draft / published / closed / expired;
- pending / approved / rejected only where the underlying workflow has those exact states;
- source freshness/verification where supported.

Do not create decorative `AI`, `smart`, `hot`, `best match`, popularity, trust or progress badges without a defined backing contract.

Badges are not the default label container. Reduce pill density.

## 6. Shared primitive targets

Cursor may create or reconcile shared primitives only when they have cross-wave reuse:

- `PageHeader` / section header grammar;
- status badge with contract-backed state map;
- accessible `FilterBar` / filter controls;
- Dialog/Sheet patterns that correctly handle RTL/LTR;
- table/list responsive patterns;
- form field/error/help pattern;
- loading/empty/error/forbidden/stale state components;
- shell/header navigation primitives;
- focus/touch-target/accessibility helpers.

Do not build Career Record, Opportunity, Radar, Hiring, Social or University feature screens in Wave 1.

## 7. Accessibility baseline

Mandatory for shared primitives:

- semantic landmarks/headings;
- keyboard operation;
- visible focus;
- icon-only controls have accessible names;
- sufficient contrast;
- adequate touch targets;
- no hover-only essential action;
- no color-only state;
- reduced-motion behavior;
- correct RTL/LTR logical alignment and directional icons;
- no horizontal overflow on supported mobile layouts.

## 8. Anti-slop acceptance rules

Reject shared patterns that normalize:

- decorative KPI grids;
- fake or unsupported charts;
- nested card soup;
- icon tiles for every feature;
- random pills/badges;
- floating decorative cards;
- glowing/aurora/glass backgrounds;
- generic SaaS split-hero patterns as a platform default;
- invented testimonials/customer logos;
- placeholder metrics;
- Arabic copy that reads as literal English translation;
- social engagement treatment optimized for status/vanity rather than professional utility.

The Professional / Social Layer, when implemented in its later wave, may use feed/follow/reaction mechanics because they are founder-approved; this handoff only prohibits generic engagement-maximizing visual/incentive defaults.

## 9. Data/contract boundary for Cursor

Cursor may not invent backend semantics to complete a visual state.

If a required UI state is absent from C1–C10, Cursor must:

1. stop that component behavior;
2. record the missing contract;
3. request a Control Tower decision/handoff;
4. never fabricate a value, enum or percentage in the UI.

## 10. Validation expected from Cursor Front 3

- Arabic and English representative renders;
- RTL/LTR direction tests for shared overlays/navigation;
- keyboard/focus checks;
- reduced-motion check;
- responsive checks for shared primitives;
- no Arabic tracking regression;
- semantic token usage in touched foundation files;
- no Wave 2+ feature work;
- changed-files list and focused component/test evidence.

## 11. Exact no-touch boundary

Wave 1 design work must not:

- redesign full pages actor by actor;
- remove legacy screens merely because they look dated;
- change domain enums/permissions;
- create metrics/charts;
- alter RLS/auth;
- implement Professional/Social product features;
- implement checkout/pricing;
- deploy to production.
