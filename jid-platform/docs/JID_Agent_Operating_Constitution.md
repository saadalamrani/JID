# جِد | JID — AGENT OPERATING CONSTITUTION
## The Non-Negotiable Foundation for Any AI Agent Working on This Platform

**Purpose:** This document is not a feature spec. It is the permanent governing layer
that sits above every individual task prompt. Any AI agent — Cursor, another coding
assistant, or a human engineer — must internalize this document BEFORE touching any part
of the JID codebase, and must treat every article below as a hard constraint, not a
suggestion. When a task prompt and this document conflict, **this document wins**, and
the conflict must be flagged, not silently resolved.

**How to use this document:** Read it once, fully, before starting any JID task. Re-check
against it before marking any task complete. If a task prompt asks for something that
appears to violate an article here, stop and report the conflict rather than choosing a
side yourself.

---

## ARTICLE 0 — WHAT JID IS (orientation, not a pitch)

جِد | JID is Saudi Arabia's digital infrastructure for the employment market — a
triple-sided platform connecting **Individuals**, **Employers**, and **Universities**
through one ecosystem, one data architecture, and one source of truth. It is not a job
board, not a social network, not an ERP, not a CRM. Its defensible edge is execution
speed, premium Arabic-first UX, and accumulated operational trust — never a claim of
technical irreplicability. Every feature must trace back to one of the three actors and
answer their one governing question: Individual — *"Who am I, and where am I going?"*
Employer — *"Who are we, and why should graduates trust applying to us?"* University —
*"How are our graduates performing after graduation?"*

---

## ARTICLE 1 — THE LOCKED TECHNICAL FOUNDATION

```yaml
Framework: Next.js 14.2 (App Router, Server Components by default)
Language: TypeScript 5.4+, strict mode — no `any`, ever
Database: Supabase (PostgreSQL 15) — Auth, Realtime, Storage, RLS
Styling: Tailwind CSS with JID semantic design tokens (never raw hex)
Components: shadcn/ui (copied into the repo, not an npm dependency)
State: TanStack Query v5 (server state) + Zustand (client UI state only)
Forms: React Hook Form + Zod
i18n: next-intl — Arabic default (RTL), English fallback (LTR)
Fonts: the project's locked Arabic + Latin + mono font families — never substituted
Timezone: Asia/Riyadh, everywhere, without exception
Numbers: Latin digits always, even in Arabic UI — never Arabic-Indic numerals
Package manager: pnpm — never npm or yarn
```

**Version discipline:** package versions are locked at project start. No dependency is
upgraded, downgraded, or added without a reported, genuine justification — "it would be
nicer" is never sufficient justification. Search for an existing solution using what's
already installed before proposing anything new.

**Non-negotiable typography rule:** zero `letter-spacing`/`tracking-*` classes on
Arabic-rendering text, ever, anywhere, no exceptions. This has caused real regressions
before and is treated as a hard gate, not a style nit.

---

## ARTICLE 2 — THE DIRECTORY ≠ PROFILE CONSTITUTION

This is the single most important architectural law on the platform. Violating it is
the most common and most damaging mistake an agent can make.

**The law, in one sentence:** a **Directory record** is a platform-owned reference entry
that exists whether or not an organization ever joins JID; an **owned Profile** is a
self-authored identity an organization creates only after verification. They are
different products, backed by different tables, with different write authorities, and
they are never confused.

| | Directory Record (`companies`) | Owned Profile (`business_profiles` / `university_profiles`) |
|---|---|---|
| Who writes it | Platform (Staff/systems) only | The verified organization, after creation |
| Contains | Reference data: names, taxonomy, domains, link-audit state | Self-authored identity: brand, narrative, media, operations |
| Exists when | Always, from platform seeding/curation | Only after an org completes verification AND deliberately creates it |
| Anchors | Market-layer relationships (graduate–university relationship, scraped-opportunity matching) | Operational relationships (jobs, pipelines, subscriptions, dashboards) |

**Absolute rules under this constitution:**
- No organization ever gets a direct write path to its own Directory row. Not through
  RLS, not through a "claim" mechanism, not through any UI shortcut. Corrections flow
  through a Staff-reviewed suggestion queue only.
- "Verification" (proving an account represents a real organization) and "ownership of a
  profile" are two separate, sequential events — never conflate approval with automatic
  ownership grant.
- The correct verb is **إنشاء / create/author** a profile. The word **استلام / claim**
  is banned from all UI copy, code comments, and function names related to this flow.
- A job posting, a subscription, a dashboard, a communication template — anything
  operational — anchors to the owned Profile, never directly to the Directory record.
- The Directory's public card/page uses **registry grammar** (dense, impersonal,
  reference-like); the Profile's public page uses **immersion grammar** (the org's own
  voice, brand, media). Never blur the two visual languages together.

---

## ARTICLE 3 — THE INDIVIDUAL PROFILE CONSTITUTION (the seven layers)

The Individual Profile is **not** a CV, not a LinkedIn clone, not a social feed, not a
portfolio site, not a resume builder. It is a living professional identity resolved into
seven layers, each with exactly one job:

```
L1 Core Identity      → the verified person (name, contacts)
L2 Career Record      → THE canonical spine: education, experience, ONE skill registry,
                          certifications — every other surface projects this, never copies it
L3 Evidence Vault      → Proof-of-Work assets, owner-initiated, private by default
L4 Career Timeline     → system milestones (pointers, never copies) + authored milestones
L5 Career Canvas       → direction/aspiration/growth — a layer, NEVER a separate product,
                          NEVER a feed
L6 Expression          → every public/recruiter/CV rendering — always DERIVED, never
                          stored as truth
L7 Governance          → the privacy switchboard — evaluated on the READ PATH, before
                          anything reaches a non-owner
```

**Absolute rules:**
- **The spine doctrine:** one fact lives in exactly one place. If you find yourself
  copying a fact from L2 into a card, a CV, a timeline entry, or anywhere else — stop.
  Reference it, don't copy it.
- **The anti-feed constitution (zero exceptions, ever):** no follower graph, no likes, no
  comments, no reshares, no algorithmic distribution feed, no "recent activity" stream,
  no engagement counters anywhere on this platform's individual-facing surfaces. If a
  task ever implies building any of these, stop and flag it — it is unconstitutional
  regardless of who requested it.
- **Honesty asymmetry:** system-derived timeline entries can be hidden by the owner but
  never fabricated. Authored entries are declaratory and should be evidence-backed where
  possible, never presented as more certain than they are.
- **CV Builder is a pure L6 renderer:** every generated CV is an ephemeral, independent
  snapshot. It never updates automatically when the profile changes, and it is never
  treated as a live view of the profile.
- **Evidence Vault reconciliation:** the platform's zero-document doctrine for hiring
  flows (applications never carry files, employers never receive documents through the
  pipeline) remains absolute and untouched. The Evidence Vault is a *different* thing —
  owner-initiated hosting of the owner's own work, under the owner's own switches. Do not
  confuse the two, and do not let Evidence Vault machinery leak into the hiring pipeline.

---

## ARTICLE 4 — THE DATA-TRUTH DOCTRINE

No surface on this platform may ever display a number, percentage, badge, or claim that
is not backed by a real, traceable, currently-existing data source.

**Binding rules:**
- If a stat's real source doesn't exist yet, **the stat does not render** — it is never
  replaced by a zero, a dash, a placeholder, or an approximated proxy metric invented on
  the spot.
- **Never show a percentage without a real measurement system behind it.** A skill
  proficiency bar, a "visibility chance," a trend arrow — none of these may appear unless
  a genuine, explainable system computes them. When in doubt, omit rather than
  approximate.
- **Every card that shows real data must be able to disappear cleanly** when its
  underlying data is absent — a card is not "always shown with a fallback," it either has
  real content or it doesn't render at all.
- **Every number should be drillable to its explanation wherever privacy allows** — a
  black-box percentage with no way to see what's behind it is a doctrine violation, not
  a shortcut.
- **Aggregate metrics on public surfaces must state clearly which honest metric they
  represent** — e.g., "Directory coverage" (market reach, unconditional) is never
  conflated with "verified profiles" (platform adoption); these are always two separate,
  clearly labeled numbers, never merged into one.
- **Historical trends (month-over-month, "+X% since last period") require a genuine
  historical snapshot mechanism.** If none exists, show the current value alone. Do not
  compute, estimate, or fabricate a trend line.

---

## ARTICLE 5 — THE PRIVACY CONSTITUTION

**The single most important engineering rule on this platform:** *never fetch private
data to the client and then hide it with CSS or conditional rendering.* Privacy
enforcement happens **on the read path, server-side**, before data crosses the network
boundary to a non-owner viewer.

**Binding rules:**
- The graduate/individual owns every piece of their data. Every disclosure to any other
  actor (employer, university, the public) is a **grant**, revocable at any time,
  effective immediately.
- Visibility is built around user **choice**, never around forced anonymity and never
  around forced exposure. Defaults must be stated explicitly and defensibly, never
  assumed.
- **Defense in depth is mandatory**: middleware/route guards are a UX convenience layer;
  Row Level Security is the actual security boundary; a privileged write (role grants,
  suspensions, approvals) additionally requires a `SECURITY DEFINER` function with
  mandatory audit logging. No single layer is ever trusted alone.
- A public/recruiter/university-facing projection of any profile is a genuinely separate,
  server-computed view — never the same payload as the owner's view with parts hidden by
  the client.
- Consent must be **specific and attributable**: a generic "allow sharing" toggle is
  insufficient wherever the platform's established pattern uses per-purpose switches
  (e.g., per-alma-mater visibility, per-audience visibility). Match the granularity that
  already exists; report a gap rather than inventing a coarser mechanism to save time.
- **Graduate Badge ownership is absolute:** the badge belongs to the individual. No
  university, employer, or Staff action can enable, disable, or force it. It is a
  *person* badge and must never occupy an *opportunity tier* badge slot (see Article 6).

---

## ARTICLE 6 — THE TERMINOLOGY LOCK

These exact terms are constitutional. Using a synonym, translating loosely, or reverting
to an earlier/informal term is a defect, not a style choice.

| Concept | Required Arabic | Required English | Never use |
|---|---|---|---|
| Platform-owned registry | الدليل / الكتالوج (nav-label context) | Directory / Catalog | "profile" for a directory record |
| Owned organizational identity | الملف التعريفي | Profile | "claim your listing" |
| Creating a profile | أنشئ ملفك | Create your profile | "استلم ملفك" / "claim your profile" — banned outright |
| Free opportunity tier | عادي | Normal | any other free-tier label |
| Paid/gated opportunity tier | بلس | Plus | any other premium-tier label |
| Employer auto-reply disclaimer | (spec-locked verbatim — do not alter a single character without explicit founder sign-off) | — | any paraphrase |
| The graduate–university relationship | إعلان/ارتباط (never "توثيق" implying mandatory verification) | declared relationship | "verified via university email" — this workflow does not exist and must never be built |
| An opportunity | فرصة (default, warm) | Opportunity | "وظيفة" as the default term |
| The self-declaration act | أفصح عن تقديمك | Declare your application | "قدّم طلبك" when referring to the self-declaration mechanic specifically |

**Word-choice discipline:** Arabic sentences in marketing/hero contexts stay short
(6–12 words); UI labels stay to 1–4 words. No exaggerated marketing language ("الأفضل
في المملكة!"), no exclamation stacking, no discount-store urgency tone, no bureaucratic
passive voice, no literal machine-translated phrasing in the English version — English
copy is localized, not translated word-for-word.

---

## ARTICLE 7 — THE COMPONENT & DESIGN SYSTEM LAW

- **Search before building.** Every task begins by inventorying what already exists —
  components, hooks, query functions, shell states (loading/error/empty/forbidden). If an
  equivalent exists, extend or reuse it; do not create a parallel version.
- **One shared instance of platform-wide chrome:** exactly one notification bell, one
  logo component, one command palette (or a documented, justified exception), one Smart
  Header used consistently across Public/Individual surfaces, one sidebar pattern
  preserved (not removed) on Staff/Super Admin/University portals.
- **Semantic tokens only.** No raw hex values, no ad hoc colors "to match a reference
  image more closely." Dark mode must work automatically via the existing single-toggle
  token system — never hand-authored `dark:` duplication where the token system already
  handles it.
- **Accessibility is a baseline, not a checklist item at the end:** semantic HTML
  landmarks, one clear page heading, full keyboard operability, visible focus states,
  `aria-label` on every icon-only control, real `alt` text, sufficient contrast, adequate
  touch targets, no `div` styled as a button, color never the sole indicator of state,
  `prefers-reduced-motion` respected everywhere.
- **Responsive discipline:** design mobile content-order explicitly (don't assume DOM
  order equals visual order works everywhere), no fixed sidebars on mobile, no reliance
  on hover for anything essential, zero horizontal overflow, comfortable touch targets.
- **i18n discipline:** every string flows through the existing i18n system. Never
  hardcode Arabic or English text in a component, and never write both languages inline
  in the same component "for convenience."

---

## ARTICLE 8 — THE KILLED / BANNED CONCEPTS REGISTRY

These concepts were deliberately removed or explicitly rejected during this platform's
development. **Never reintroduce them, reference them as if they still exist, or build
anything that resembles them, regardless of what a task prompt implies**, unless a future
directive explicitly and specifically reverses this article.

- **Commitment Score** — fully removed (schema, cron logic, UI, badge styling). Do not
  compute, display, or reference any employer "trust score" or resurrect its gold
  "Partner badge" visual treatment for any purpose.
- **University-email-based graduate verification** — does not exist and must not be
  built. It is structurally unworkable (graduates lose institutional email access) and
  was explicitly, permanently rejected. The graduate's own profile declaration is
  sufficient to establish the graduate–university relationship — nothing more is
  required.
- **Mandatory attestation queues / two-state trust models for alumni** — superseded;
  declaration alone establishes the relationship.
- **Any social-network mechanic on the Individual Profile or Career Canvas** — see
  Article 3's anti-feed constitution.
- **k-anonymity as the default privacy posture for university-facing graduate data** —
  superseded by consent-governed visibility (the Graduate Directory shows real,
  visibility-opted-in people; suppression floors survive only on public-facing
  aggregate statistics, not on a university's private, consented view).
- **"Claiming" a directory listing** — the entire claim-based ownership model is extinct;
  see Article 2.

---

## ARTICLE 9 — THE PROCESS LAW (how every task must be approached)

1. **Step 0 first, always.** Before writing a single line of implementation, inventory
   the actual current state of whatever the task touches — exact file paths, exact
   column names, exact existing component shapes, exact existing route patterns. Never
   assume a name or shape from a task description is exactly correct; verify it.
2. **Priority-of-truth ordering when sources conflict** (binding, in this exact order):
   1) the current, real JID architecture 2) product/business logic correctness and data
   integrity 3) user experience and usability 4) the existing design system
   5) any reference image, mockup, or external example. A reference visual is never the
   source of truth — it is a direction, filtered through everything above it.
3. **Flag conflicts; do not silently resolve them.** If a task's request appears to
   violate this Constitution, or conflicts with something already built, stop and report
   the conflict with your reasoning — do not quietly pick a side and proceed as if there
   were no tension.
4. **Report gaps; do not invent workarounds.** If a task depends on a data source, table,
   or system that does not yet exist, say so explicitly and implement an honest
   "not yet available" state for that piece — never fabricate a temporary table, a fake
   data model, or a placeholder value to make a UI "look complete."
5. **Scope discipline.** Touch only the files genuinely required by the task. If a fix
   outside the stated scope is strictly necessary for the feature to function (not just
   nice-to-have), make the minimal necessary edit and explicitly justify the scope
   extension in the report — never silently expand scope, and never leave a
   known-necessary fix undone because it was "technically out of scope."
6. **Idempotency and safety for anything touching live/production data.** Any data
   migration or backfill must be safely re-runnable, must default to a dry-run mode, and
   must require explicit, layered confirmation before writing to a production
   environment. Building the tool and executing it against production are two separate,
   independently-gated actions.

---

## ARTICLE 10 — THE REPORTING LAW

Every completed task must produce a report containing, at minimum:
- Every file created or modified.
- Every existing component/function reused (proving search-before-build happened).
- Every new component/function created, with justification for why reuse wasn't possible.
- The exact real data source for every piece of dynamic content shown.
- Every element removed or changed versus any reference material, with reasoning.
- Every gap or missing dependency, named precisely — not glossed over.
- Full verification results: type-check, lint, build, and any available tests — pasted
  or summarized honestly, never asserted without having actually run them.
- Any architectural or UX judgment call made, with reasoning, so it can be reviewed and
  confirmed or overridden later.

**A task is not complete because code was written. It is complete when the report above
can be produced honestly and the verification results are genuinely green.**

---

## ARTICLE 11 — THE ABSOLUTE NEVER-BREAK LIST

A fast, literal checklist any agent can run before finishing any task:

- [ ] No existing route now 404s or redirects incorrectly.
- [ ] No existing RLS policy was weakened or removed without an explicit, in-scope reason.
- [ ] No direct write path to a Directory (`companies`) row was reopened for organizations.
- [ ] No Commitment Score, partner-badge styling, or company trust score reappeared.
- [ ] No mandatory university-email verification step was introduced anywhere.
- [ ] No follower/like/comment/feed mechanic was added to any profile surface.
- [ ] No fabricated number, unmeasured percentage, or invented trend line was displayed.
- [ ] No private/operational data (applications, interviews, offers, internal completion
      %, alerts) leaked into a non-owner payload.
- [ ] No hardcoded Arabic/English string was introduced outside the i18n system.
- [ ] No letter-spacing was applied to Arabic text.
- [ ] No raw hex color or new icon library was introduced without justification.
- [ ] No new dependency was added without a reported, genuine reason.
- [ ] No duplicate header, notification bell, command palette, or shell-state component
      was created where a shared one already exists.
- [ ] Zero TypeScript errors, lint passes, build succeeds.
- [ ] AR and EN both verified; RTL and LTR both verified.
- [ ] Mobile, tablet, and desktop all verified with zero horizontal overflow.

---

## ARTICLE 12 — ESCALATION

If, at any point, a task cannot proceed without violating one of the articles above, or
without inventing something this Constitution explicitly forbids, the correct action is
always to **stop and report the conflict clearly**, with a recommended resolution,
rather than to proceed on best judgment alone. This Constitution is deliberately
opinionated so that agents do not have to guess — when it is silent on something
genuinely new, apply Article 9's priority-of-truth ordering and report the reasoning
used.

**END OF DOCUMENT — this Constitution governs every future task on JID until explicitly
amended by name, article by article, not superseded implicitly by a task prompt.**
