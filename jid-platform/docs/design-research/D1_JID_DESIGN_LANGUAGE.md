# D1 — JID Design Language

**Status:** `DESIGN_LANGUAGE=WRITTEN` — not design-approved.
**Builds on, does not replace:** `src/config/design-tokens.ts` (brand palette + semantic
roles already exist and are sound) and `semantic-theme-plugin.ts`. D1 **refines and
extends** this token layer; it does not fork it or introduce a second system.
**Anti-Slop authority:** `JID_UI_AUDIT_INDEX_ANTI_SLOP_ADDENDUM.md` / `slop.md`
rules are binding.

Every rule below answers a product purpose (§0). None exist for fashion.

---

## 0. THE FOUR QUALITIES THIS LANGUAGE OPTIMIZES FOR

1. **Orientation speed** — the reader knows what this is and what to do in one pass.
2. **Evidence legibility** — a claim, score, or status is always secondary to, and one
   step from, what backs it.
3. **Purposeful density, per actor** — generous for Public/Individual; precise for
   Employer; analytical where real comparison exists for University; dense for Staff.
4. **Native Arabic composition** — RTL is the default reading of every pattern below,
   not a mirrored afterthought.

---

## 1. BRAND FOUNDATION (unchanged; preserved per Founder instruction)

```
Primary Olive    #2F3A2E   --color-olive / --color-primary
Secondary Olive  #414D40   --color-olive-secondary
Gold (accent)    #E6B43A   --color-gold / --color-accent
Off-White        #F7F5EF   --color-beige / --color-background
Arabic type      IBM Plex Sans Arabic
Latin type       Manrope
```

Gold is **accent/action only** — never a decorative fill, never a background wash. It
marks the one active/selected/primary-action thing on a screen, not a section.

Modernity comes from composition, hierarchy, interaction, typography, density, and
motion — **not** from a new palette. No blue-purple gradients, no palette drift toward
"trendy SaaS." The existing `colors` / `semanticColors` map in
`src/config/design-tokens.ts` is retained as-is; D1 adds usage discipline, not new hex
values.

---

## 2. TYPE SYSTEM

The existing `typography.fontSize` scale (`xs`…`5xl`, zero letter-spacing baked in) is
kept. D1 adds a **usage scale** — which size does which job, so "modern" doesn't mean
"bigger everywhere":

| Role | Size | Weight | Where |
|---|---|---|---|
| Page/section statement (public hero, home standing-line) | `4xl`–`5xl` | 700 | At most one per screen |
| Section heading | `2xl`–`3xl` | 600 | One per section |
| Card/row title, object name | `lg`–`xl` | 600 | Object headers |
| Body | `base` | 400 | Default reading text |
| Secondary / meta (dates, coverage basis, status detail) | `sm` | 400–500 | Always paired with its primary, never standalone |
| Micro (badges, tags, timestamps) | `xs` | 500 | Sparingly — a micro label is not a substitute for the evidence itself |

**Rules:**
- Arabic: `letter-spacing: 0`, always (already enforced globally — never override).
- English tracking is opt-in only via the existing `typographyScale` helper, never a
  raw Tailwind `tracking-*` class on Arabic-adjacent components.
- One `4xl+` headline per page. A second big number/headline on the same screen means
  the hierarchy is broken, not that the second thing is also important.
- Line length: body text wraps at a comfortable measure (`max-w-xl`/`max-w-2xl`
  containers) — no full-bleed paragraph text.

---

## 3. SPACING RHYTHM & PAGE WIDTH

Existing `spacing` scale (`design-tokens.ts`) kept as-is. D1 fixes the **rhythm**
(which steps get used where) and **page width**:

| Context | Container | Vertical rhythm between sections |
|---|---|---|
| Public marketing page | `container-jid` (max-w-7xl) but **content inside stays max-w-2xl–3xl** — the container gives breathing room, it does not mean "fill the width" | `16`–`24` (py-16 to py-24) between sections |
| Workspace home (single focus column) | `max-w-3xl` centered within the rail layout | `8`–`12` between sections; `4`–`6` inside a section between items |
| Dense object detail (Employer/University/Staff) | wider working column, up to `max-w-6xl`, but text/criteria blocks still wrap at `max-w-2xl` | `6`–`8` |
| Between an item's label and its value | `1`–`2` | — |

**Rule:** whitespace is used to establish reading order and grouping, never as
"premium" filler. A section with nothing to say is removed, not padded.

---

## 4. SURFACES, BORDERS, ELEVATION

- **Surfaces:** `background` (canvas) → `surface` (a grouped region) → `card`
  (an individual object at rest) — three steps only, using the existing semantic
  tokens. No ad hoc fourth "elevated-elevated" surface.
- **Borders over shadow** as the default separator (`border-border`, 1px). Shadow
  (`shadows.sm`/`DEFAULT`) is reserved for **transient, layered** elements only:
  dropdowns, popovers, the mobile sheet, a modal. A static page section never floats
  on a shadow "for depth."
- **No glassmorphism, no frosted panels, no glow.** (Anti-Slop.)
- **Radius:** `--radius` (0.5rem) for cards/inputs/buttons; `full` only for true pills
  (a status chip, an avatar). Not every container gets rounded corners — a full-width
  section, a table, a list row does not need `rounded-2xl`.
- **Not every piece of information lives in a card.** See §11.

---

## 5. ICONOGRAPHY

Use the existing icon system (no new library). One icon per concept, used
consistently platform-wide (Article 7: search before adding). Icons are:
- Never decorative filler next to a heading that already says the same thing.
- Always paired with a text label on first use in a section (icon-only only inside a
  dense, already-labeled toolbar).
- `aria-label` required on every icon-only control (accessibility baseline).

---

## 6. DATA PRESENTATION

This is where "modern JID" is actually proven — not in the hero.

- **A number always carries its basis** in the same visual unit (font/line/row), never
  a tooltip-only footnote: "Based on 62 of 90…", "3 experiences, 5 skills, last updated
  6 days ago."
- **Status is a named word from a fixed set**, never a color alone (Article 11: color
  is never the sole indicator). Pair a status pill with one line of what happens next
  where relevant.
- **Absent data renders as an honest sentence, or the card does not render at all.**
  Never a dash, a zero, or a spinner-forever standing in for "no data."
- **Evidence-before-badge:** any score, fit assessment, or rubric result is visually
  secondary to, and one tap/click from, the evidence it's built on.
- **Tables** are for comparable rows of the same object (candidates against one role's
  criteria, programs across cohorts) — not a generic layout device. On mobile a table
  becomes a prioritized list with the decision-relevant field surfaced; a "view as
  table" action is explicit, not the default.
- **Charts** only with a real comparison and a real decision behind them (University is
  the primary home for this). Every chart states its time basis and, where relevant,
  its coverage. No sparkline or trend without a genuine historical snapshot mechanism.

---

## 7. FORMS

- Field label states the fact requested ("الاسم الكامل"), never an instruction
  ("يرجى إدخال…").
- Staged, short steps for any multi-step flow — one decision per screen, specific-verb
  CTA per step. No front-loaded wizard.
- Required-state declared once at the form level, not per field, unless a field's
  requirement is genuinely conditional.
- Helper text explains *why* only when not obvious from the label; never restates the
  label.

---

## 8. STATUS, EMPTY, ERROR, SKELETON

- **Status:** fixed named states (existing `applicationStatus` set is the model), each
  optionally paired with "what happens next."
- **Empty states** answer, in order: what is this / why is it empty / what can I do.
  Not a centered illustration + one line — a plain sentence structure per R1-B §9's
  pattern. A not-yet-live capability states that plainly (`FUTURE_COMPATIBLE_NOT_FAKE_LIVE`),
  never a fake empty destination.
- **Error states** name the failed action specifically and give a specific recovery
  action; the fully generic catch-all is reserved for genuinely unhandled cases only.
- **Skeletons** mirror the real layout's structure (same regions, same rough
  proportions) — never a generic shimmer block unrelated to what's loading. Respect
  `prefers-reduced-motion` (static loading indicator instead of shimmer).

---

## 9. NAVIGATION & SHELL

- One dark-olive top bar (`bg-jid-olive-900`), consistent silhouette across public and
  workspace frames (§ Experience Architecture §2).
- One left/right rail (locale-aware side) for workspace actors, 3–5 destinations, icon
  + label, current destination marked by the gold underline/indicator already used in
  `SmartHeader`'s active-link treatment — reuse that exact visual mechanism, don't
  invent a second one.
- One command palette instance platform-wide (existing gate:
  `shellShowsIndividualCommandPalette` / actor equivalents) — D1 does not add a second
  implementation; consolidating the four that exist is an engineering dependency
  (R1-C §24.3), out of scope here.
- Mobile: no fixed sidebar; the rail collapses to a bottom bar (workspace actors) or a
  slide-out sheet from the existing `SmartHeaderMobileMenu` pattern (public/simple
  cases).

---

## 10. INTERACTION & MOTION

- Motion explains **state change, hierarchy, or continuity** only: an item entering
  the "what changed" list, a status transitioning, a panel opening. Duration/easing
  use the existing `motion` tokens (`fast`/`normal` for UI feedback, `slow` only for a
  page-level transition).
- No decorative landing-page animation theatre (parallax, floating shapes, gradient
  sweep, staggered reveal-on-scroll for its own sake).
- `prefers-reduced-motion` collapses every transition to instant (existing global CSS
  rule already does this — new components must not bypass it with inline styles).
- Motion never delays the action it accompanies (no "wait for the animation to finish
  before you can click").

---

## 11. NO CARD-FIRST DESIGN — WHAT REPLACES THE CARD

Before placing anything in a card, decide: **relationship → hierarchy → reading order
→ action → state.** Only then ask whether a card is the right container.

| Information shape | Correct pattern | Not |
|---|---|---|
| A single fact + its basis (a stat, a status) | An inline **row** (label + value + basis on one line/stack) | A stat card |
| A set of comparable objects (candidates, cohorts, opportunities) | A **list** or **table**, one row per object | A grid of cards |
| A record's sections (education, experience, skills) | **Structured sections** inside one page, not one card per entry | A card wall |
| A sequence over time (timeline, application history) | A **timeline** component | Cards in a row |
| An object's full detail reached from a list | A **split detail view** or a dedicated page/drawer | A modal stuffed with tabs |
| A short-lived, dismissible thing (a filter set, quick info) | A **drawer** or **popover** | A permanent card taking layout space |
| A genuinely discrete, self-contained unit the user compares against siblings of the same shape (an opportunity teaser in a short curated set) | A **card is acceptable here** — same shape, same size, small count | A card used for anything asymmetric or singular |

A card is the right container only when several *of the same kind of thing* are being
compared at a glance, in small number. Never the default wrapper for "a piece of
content."

---

## 12. AR-FIRST / RTL MECHANICS

- Every pattern above is authored in RTL first (Arabic reading order, action
  placement, icon-mirroring) then validated in LTR — not the reverse.
- `dir` is set server-side on `<html>` (Experience Architecture §8).
- Directional icons (arrows, chevrons) mirror with `dir`; numerals/time/mono stay
  LTR-isolated (existing `[dir='rtl'] .tabular-nums` rule).
- Breadcrumbs, table column order, and the rail's side all follow `dir` — nothing
  hardcodes a Latin-reading-order assumption.

---

## 13. RESPONSIVE / MOBILE PATTERNS

| Pattern | Desktop | Mobile |
|---|---|---|
| Rail navigation | Persistent side rail | Bottom bar (workspace) / slide-out (public simple menu) |
| List/table of comparable objects | Full table | Prioritized list, decision field surfaced, "view as table" explicit |
| Multi-step form | Can show step progress inline | One step per screen, always |
| Detail + list (e.g., candidate list + candidate detail) | Split view side by side | List → full-screen detail, back to return |
| Dense comparison (criteria × candidates) | Desktop-primary | Mobile-safe read-only view; decision action still available if evidence is legible |

Zero horizontal overflow on any viewport (hard gate). Touch targets ≥44px (existing
`min-h-[44px]` convention on primary CTAs — keep it).

---

## 14. TOKENS — WHAT D1 ADDS

No new raw colors. D1 formalizes usage-level semantic names on top of the existing
`--color-*` custom properties (already generated by `semantic-theme-plugin.ts`):

| Token (already exists) | D1 usage discipline added |
|---|---|
| `background` | Page canvas only. |
| `surface` | A grouped region within the canvas (a section band, a rail). |
| `card` | An individual object at rest — used per §11's rule, not by default. |
| `border` | Default separator; replaces shadow as the primary structuring device. |
| `text-primary` / `text-secondary` | Primary = the fact; secondary = its basis/meta — always paired, never secondary alone. |
| `accent` (gold) | The one active/primary-action element per view. Never a fill, never a background wash, never used twice in the same view for two different things. |
| `success` / `warning` / `danger` | Paired with a word, never color-only (Article 11). |
| `focus` / `ring` | Keyboard focus only — do not repurpose for hover decoration. |

No new token names are introduced for this checkpoint; if R3–R7 surface a genuine gap
(e.g., a dedicated "attention" role for the bell/home items, distinct from `warning`),
it is proposed then, against real usage, not speculatively now.

---

## 15. ACCESSIBILITY BASELINE (every D1 surface)

Semantic HTML landmarks (`header`/`nav`/`main`/`footer`), one `<h1>` per page, full
keyboard operability, visible focus (`:focus-visible` ring — already global),
`aria-label` on icon-only controls, real `alt` text, sufficient contrast (verify new
gold-on-beige / beige-on-olive combinations meet WCAG AA), touch targets ≥44px, no
`div`-as-button, color never the sole state indicator, `prefers-reduced-motion`
respected, form labels + error association (`aria-describedby`).

---

## 16. WHAT "MODERN" IS NOT, HERE

No generic split hero, no random card grids, no icon-tile grids, no glowing pills, no
glassmorphism, no decorative statistics, no gradient headline gimmicks, no floating
fake dashboard cards, no graph-paper decoration, no giant premium whitespace with
nothing in it, no excessive rounded containers, no "everything is a card," no fake
macOS window chrome, no decorative charts, no generic pre-footer CTA slab.

---

*End of D1 Design Language. Companion: `D1_JID_EXPERIENCE_ARCHITECTURE.md`,
`D1_REFERENCE_EXPERIENCES.md`.*
