# D1 — Preview & Before/After Evidence (Checkpoint 1)

**Checkpoint scope:** Design authority (3 docs) + **R1 (Public Front Door)** and
**R2 (Individual Home)** implemented. R3–R7 specified only.
**Branch:** `integration/jid-d1-experience-design-direction`
**Base:** `origin/integration/org-registration-representative-verification`
(`60cdb54`, contains org-onboarding correction `2d234d5`).
**Screenshots:** `docs/design-research/d1-evidence/*.png` — captured from a local Next
dev server (`next dev`, Next 14.2.15) pointed at **jid-nonprod**
(`hmjuijmaefajdjrjdsxu.supabase.co`, never production), viewport-emulated Chromium
via Playwright. Authenticated captures signed in as the seeded nonprod fixture
`individual-complete@jidseed.test`.

Simple factual captures — not a marketing comparison deck.

---

## IMMUTABLE PREVIEW

Vercel is connected to `saadalamrani/JID` via git integration for the `jid-platform`
project (team `jidplatform`, `team_GA06Rp5g2uEFY3EYmuwuLacG`). Every push of this
branch produces an immutable preview deployment for that exact commit SHA.

| Field | Value |
|---|---|
| Project | `jid-platform` (`prj_Bjn17wPig8Anp2KhNPu5qCEZnWuC`) |
| Branch alias (moves with the branch head) | `https://jid-platform-git-integration-jid-d1-experien-793675-jidplatform.vercel.app` |
| Immutable deployment — D1-C2 (`5869ca4`, R1+R2) | `https://jid-platform-92aeec2n3-jidplatform.vercel.app` — state READY (`dpl_F1hnFHtyQS9mK9ePvgABC7TmxrZk`) |
| **Immutable deployment — FINAL_SHA `f51dcd3`** | **`https://jid-platform-je90aqi3z-jidplatform.vercel.app`** — state READY (`dpl_4t3nscc5szv3JGNNAehScvza93Tr`), Vercel build PASS |
| Inspector (FINAL_SHA) | `https://vercel.com/jidplatform/jid-platform/4t3nscc5szv3JGNNAehScvza93Tr` |

**Founder access:** open the immutable URL for the final SHA (see `D1_CLOSEOUT.md`).
The preview sits behind Vercel deployment protection / SSO for this team, so
automated browser capture of the hosted preview is not possible from this session —
the Founder opens it directly. Local-dev captures below stand in for the visual
record and were taken from the identical committed source.

`AR` and `EN` route continuity, `RTL`/`LTR`, and mobile 375 were all verified on the
local dev server against the committed source (see the state table below).

---

## BEFORE / AFTER — R1 PUBLIC FRONT DOOR

| Aspect | BEFORE (`60cdb54`) | AFTER (`df553d4`) |
|---|---|---|
| Sections | Hero → 3-card problem grid → 8→4-tile module grid (icon tiles) → olive PDPL badge bar → boxed Vision 2030 marketing paragraph → 2-card CTA slab | Hero (statement + one checkable subline + situational CTAs) → **the three-actor relationship as one connected structure on a single spine line** → one honest "what JID is not" paragraph → three plain checkable trust facts → one inline situational entry row |
| Storytelling device | Scattered feature tiles + pain cards; the 3-actor relationship only implied | The page structure *is* the explanation: one record, three vantage points |
| Card grids | 3 (problem, modules, CTA) | 0 |
| Decorative KPIs / unsupported numbers | none present (already clean) | none |
| Composition | card-soup, feature-per-tile | one vertical reading path |

**Files:**
`d1-evidence/before_R1_home_ar_desktop.png` · `d1-evidence/before_R1_home_ar_375.png`
`d1-evidence/after_R1_home_ar_desktop.png` · `d1-evidence/after_R1_home_en_desktop.png`
· `d1-evidence/after_R1_home_ar_375.png`

**What it proves:** JID reads as Saudi career infrastructure — not a job board, ATS,
LinkedIn clone, or government portal — through the page's own structure, not three
generic actor cards or a KPI strip. (`D1_REFERENCE_EXPERIENCES.md#r1`.)

---

## BEFORE / AFTER — R2 INDIVIDUAL HOME

| Aspect | BEFORE (`60cdb54`) | AFTER (`df553d4`) |
|---|---|---|
| Route | No individual home. `/me` → `/profile` → `/profile/{userId}` — the person's **own public profile projection** stands in for a workspace | New `/home`: a real personal workspace. `/me` and `getPortalHomeForRole('individual')` resolve here (approved mentors still route to `/mentor/dashboard`) |
| What it answers | "here is your public profile" | "where do I stand / what needs my attention / what changed / what can I do next" |
| Reading order | n/a | standing line → what needs my attention → what changed → Career Record at a glance (+ derived views as outputs) → opportunities for me → my applications |
| Metrics | profile "completion %" concept exists in the projection UI | **no score, no %, no readiness number, no streak, no feed, no fabricated progress** anywhere on the page |
| Data | — | real contracts only: `getCurrentViewer`, `fetchOwnProfilePageContext`, `fetchUserApplications`, `fetchJobs` |
| Plus / Lammah | — | one contextual line under "opportunities for you", capability stated before the tier; never a persistent upgrade banner |

**Files:**
`d1-evidence/before_R2_home_ar_desktop.png` (redirect-chain endpoint mid-load —
there is no workspace surface to capture at the base SHA) ·
`d1-evidence/before_R2_home_ar_375.png`
`d1-evidence/after_R2_home_ar_desktop.png` · `d1-evidence/after_R2_home_en_desktop.png`
· `d1-evidence/after_R2_home_ar_375.png`

**Live nonprod data visible in the AFTER captures** (fixture
`individual-complete@jidseed.test`): "3 skills recorded", "Affiliated with King Saud
University", "last updated 1 wk. ago", a real application to a seeded role showing
status **Submitted**, and "What changed → your application … moved to Submitted — 2
days ago". "What needs your attention → nothing needs your attention right now" and
"Opportunities for you → no opportunities available right now" are honest empty
states (the nonprod project has no live opportunities matching the neutral query).

**What it proves:** "home" is a workspace anchored to the Career Record, with
opportunities, applications, and readiness shown as one system — not a widget
dashboard. (`D1_REFERENCE_EXPERIENCES.md#r2`.)

---

## STATE / LOCALE / VIEWPORT VERIFICATION (local dev, committed source)

| Check | R1 | R2 |
|---|---|---|
| AR / RTL | PASS — `<html lang="ar" dir="rtl">` set **server-side** (root layout reads middleware `x-pathname`), RTL reading order, spine line on the start edge | PASS — same; sections stack in RTL reading order |
| EN / LTR | PASS — `<html lang="en" dir="ltr">`, mirrored | PASS — nav + content in EN; locale-aware resolution of bilingual job/company names |
| AR route continuity | PASS — nav links stay `/ar/*` (locale-aware `Link`) | PASS |
| EN route continuity | PASS | PASS |
| Mobile 375 | PASS — sections stack, trust facts collapse 3→1 col, no horizontal overflow | PASS — same reading order, no horizontal overflow |
| Empty state | n/a | PASS — "nothing needs your attention", "no opportunities available", honest phrasing |
| Loading / not-found | inherits existing `(public)` shell | inherits root `loading.tsx`; unauth → `redirect('/login')`; wrong actor → `redirect(getPortalHomeForRole(role))` |
| Fabricated metrics | 0 | 0 |
| Claim public flow | 0 | 0 |
| Feed mechanics | 0 | 0 |

---

## VALIDATION

| Check | Result |
|---|---|
| `pnpm type-check` (`tsc --noEmit`) | **PASS** |
| `pnpm lint` (`next lint`) | **PASS — No ESLint warnings or errors** |
| `pnpm exec prettier --check` (changed files) | **PASS** |
| `git diff --check` | **PASS** |
| `pnpm build` (local) | **PASS — "✓ Compiled successfully", "✓ Generating static pages (334/334)"**, `/[locale]/home` route built. (The prior org-onboarding team saw local build stall; this checkpoint's build completed locally.) |
| AR/EN message key parity (full `messages/*.json`) | **PASS — 0 keys only-in-ar, 0 only-in-en** |

---

## KNOWN GAPS / FOLLOW-UPS (not blockers for review)

- **R2 desktop reads sparse** at ≥1280px: the single-focus column is centered with
  wide empty side margins. The design-language calls for a single focus column
  (`D1_JID_DESIGN_LANGUAGE.md §3`); whether the workspace should be left-aligned
  within a rail, or slightly wider, is a refinement for the shell work (R3+) and for
  Founder review.
- **Global shell / navigation unchanged** this checkpoint. `SmartHeader` still shows
  the current nav items ("استكشف الفرص", "الرادار", "الإرشاد المهني", "الدليل"…). The
  D1 navigation architecture (`D1_JID_EXPERIENCE_ARCHITECTURE.md §2`) is specified,
  not built — rebuilding the shell was out of the Founder-set scope for C1.
- **`opportunities` = latest open roles, not personalized matches.** A real
  criteria-aware match explanation ("why this fits you", missing evidence) does not
  exist as a live product capability; fabricating a match score/reason would violate
  Article 4. Honest "latest available" + a link into the real opportunity surface is
  the checkpoint behavior. Personalized matching is `NEEDS_D1_EXPERIMENT` for R4.
- **Seed-data artifacts** in the EN captures: the fixture's `full_name` and one
  skill label are Arabic even under `/en` (they are the seeded values). Real
  English-locale users have Latin names; the model now resolves bilingual
  *proper-noun* fields (job/company titles) locale-first. University name still
  resolves via the shared `fetchOwnProfilePageContext` helper (`name_ar ?? name_en`)
  — a shared-helper change deferred to avoid touching a widely-used query in a
  design checkpoint.
- `src/lib/navigation/home-hero-cards.ts` is now unreferenced (the hero no longer
  renders the floating activity-card row). Retained as future-compatible data
  plumbing for a later "what changed" / activity surface; `landing.hero.cards.*`
  message keys kept alongside it.

---

*Companion: `D1_CLOSEOUT.md`, `D1_JID_EXPERIENCE_ARCHITECTURE.md`,
`D1_JID_DESIGN_LANGUAGE.md`, `D1_REFERENCE_EXPERIENCES.md`.*
