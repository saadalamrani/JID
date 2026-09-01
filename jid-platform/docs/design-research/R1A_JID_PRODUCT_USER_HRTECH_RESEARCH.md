# R1-A — JID Product, User, Behavior & HR Tech Intelligence

**Phase:** R1-A (Research only — no design, no UI implementation, no frontend code)
**Status:** Complete
**Companion file:** `R1A_SOURCE_LEDGER.md` (every `[Sx]`/`[Rx]` citation below is defined there)
**Next phase (not started here):** R1-B — Saudi Content & Product Language Intelligence, then D1 — Experience Architecture / Design synthesis

This report answers what JID is, who it is for, what those people are trying to
do, where the current build makes that difficult, how the wider market solves
adjacent problems, and what JID should learn versus reject. It does not choose a
visual direction, propose a navigation structure, or write copy. Those belong to
D1, after this report is combined with R1-B.

---

## 1. EXECUTIVE FINDING

The Founder's rejection is correct, and it is not a styling problem.

The repository evidence shows a product that is architecturally still governed
by an older mental model — **"verify and claim a database row"** — while its own
constitution (`JID_Agent_Operating_Constitution.md`, R1) has already moved to a
newer, more honest model — **"build a professional identity or an organizational
workspace, backed by evidence, governed by consent."** The two models coexist in
the live code today: the staff portal runs a full parallel "Claims queue" system
alongside a "Verification requests" queue (R5); 31+ migrations still carry
`claim_requests` / `claimed_by` / `entity_state` machinery gating jobs,
applications, screening, billing, and team invitations (R3); a `commitment_score`
concept the Constitution explicitly bans still appears in five historical
migrations (R3). A prior remediation pass (`DESIGN_CONFORMANCE_REPORT.md`, R4)
already fixed the surface-level symptoms — raw hex colors, `jid-*` utility
classes, stray `letter-spacing` on Arabic text — and explicitly declared
structural change out of scope. That pass could not have fixed what the Founder
is reacting to, because it was never asked to.

What is actually wrong is **structural, not decorative**:

1. **Two eras of the same product are running at once.** The claim-based
   ownership model and the verification/reconciliation model both exist,
   gating different surfaces inconsistently (R3, R5). A user or an agent
   working on JID cannot currently tell, from the UI alone, which model is
   "real."
2. **The product organizes around database entities, not user intent.** The
   Individual actor's constitutional seven-layer profile model (Core Identity,
   Career Record, Evidence Vault, Career Timeline, Career Canvas, Expression,
   Governance — R1 Article 3) is not yet how the routes or navigation are
   organized; several of its layers are marked "not live yet" directly in the
   product's own copy (R5). The public nav lists "Explore opportunities" and
   "Jobs" as two separate items, and "Mentorship" and "Mentors" as two more —
   fragments of one job-to-be-done presented as four destinations (R5, R6).
3. **What JID is *for* is already well-specified and well-differentiated on
   paper.** Article 0 of the Constitution states each actor's governing
   question in one line and is more disciplined than most HR-tech product
   documentation reviewed for this report. The gap is between that written
   intent and what the current routes/nav/dashboards actually deliver.
4. **The market is moving toward exactly the terrain JID's constitution
   already claims** — verified/evidence-backed professional identity over
   self-reported resumes (S16), structured and auditable hiring decisions
   over ad hoc screening (S14), AI that stages and explains rather than
   decides (S2, S18), and outcomes-accountable institutions over
   annual-report-only universities (S6, S20). JID does not need a new
   positioning. It needs an experience that actually embodies the positioning
   it already wrote down.

**The core executive conclusion:** this is not a "make it prettier" problem
or a "pick a nicer reference product" problem. It is a **coherence problem** —
between two competing internal architectures, and between a written product
doctrine and an implemented one. D1's job is to resolve that coherence gap
around user intent, not to reskin either existing model.

---

## 2. JID PRODUCT MODEL

From a user-experience perspective — not an engineering perspective — JID is:

**A shared record of truth for the Saudi employment relationship**, sitting
between three parties who each need a different, honest view into it:

- An **Individual** needs one place where what is true about their
  professional life accumulates, so they don't have to re-explain themselves
  from zero every time an opportunity appears.
- An **Employer** needs a way to see evidence about a person's capability that
  is more defensible than a resume, and a way to run a hiring process they can
  justify afterward.
- A **University** needs to know, with honesty about what is and isn't known,
  what happens to its graduates — and to use that to improve, not just to
  report.

JID is **not** a job board (a job board's job-to-be-done ends at "get me an
application"), not an ATS (an ATS's job-to-be-done ends at "get this requisition
filled"), not a CV builder (a CV is one disposable projection, never the
source of truth per R1 Article 3), and not a social network (Article 3's
anti-feed constitution is a hard, permanent constraint, not a phase-one
omission). Every one of those adjacent categories solves a narrower problem
than JID's own constitution claims to solve. That is JID's real position: **it
is infrastructure that those categories sit downstream of**, not a competitor
inside any one of them.

The product's own internal law for this is Article 2's Directory ≠ Profile
distinction (R1): a **Directory record** is what JID knows about an
organization whether or not that organization ever shows up; an **owned
Profile** is what an organization says about itself after it proves it is who
it claims to be. This single distinction — reference data vs. self-authored
identity — is the most JID-specific architectural idea in the whole
Constitution, and it does not yet consistently show up in the live UI (Section
10, Section 11).

---

## 3. ACTOR MODEL

**Public actors** (from the Constitution and confirmed against the live route
tree, R1/R6):

| Actor | Governing question (R1 Article 0) | Core relationship |
|---|---|---|
| Individual | "Who am I, and where am I going?" | → opportunity |
| Employer / Business | "Who are we, and why should graduates trust applying to us?" | → talent, capability, evidence |
| University | "How are our graduates performing after graduation?" | → graduate outcomes / employability intelligence |

**Internal actors:** Staff (verification, moderation, reconciliation, audit)
and Super Admin/Sys (platform governance, danger-tier operations).

**One actor the task brief does not name but the live product already has:**
**Mentor**, exposed as its own route group `(mentor)`, its own onboarding
("become a mentor"), its own public directory (`/mentors`), and its own staff
review queue (mentor applications, kept explicitly distinct from entity claims
per R5's staff-dashboard copy). This is worth flagging now rather than
discovering it in D1: Mentorship is currently modeled as a fourth, semi-peer
public destination rather than a capability layered onto the Individual actor
(an experienced Individual who also mentors). Whether that is correct is an
open question for Section 18/19, not something this research resolves — but
it must be named as part of the actor model, because it is real in the
running product.

**Internal reconciliation:** the Founder Decision governing organization
onboarding (task brief) replaces the old `search → select catalog row → claim`
flow with `account → email verification → organization details →
representative verification → internal reconciliation → authorized workspace`.
The live product still runs the old flow's machinery end-to-end (R3, R5) even
though it is current product direction, not merely legacy code sitting unused
— it actively gates jobs, screening, billing, and comms today (R3 §2.1–2.3).
This is the single largest gap between stated direction and shipped reality
found in this research pass.

---

## 4. USER SEGMENTS

### Individual

| Segment | Primary JTBD-flavored need | Distinguishing anxiety |
|---|---|---|
| University student | Build a record before there's much to record | "I have nothing to show yet" |
| Fresh graduate | Convert study into a legible professional claim | "Will anyone believe what I say I can do?" |
| Early-career professional | Keep the record current without re-entering it everywhere | "I don't have time to maintain three profiles" |
| Employed, passively open | Be discoverable without signaling to their current employer | "What if my employer finds out I'm looking?" |
| Active job seeker | Move fast, know where they stand on live applications | "Did anyone even see my application?" |
| Career changer | Reframe evidence from one field as relevant to another | "My history reads as the wrong category" |

Across segments (S1, S17, R1 Article 3): tolerance for forms is low and
falling — an onboarding form cut from 7 to 3 fields cut abandonment ~45% in
independently cited research (S17); tolerance for a dashboard with nothing to
decide on it is low (S12); trust in AI rises sharply when it explains itself
and falls when it looks like a black box (S2). What individuals want AI to
help with converges on *drafting, surfacing, and explaining* (turn scattered
evidence into a coherent claim; tell me what's missing; draft a CV variant).
What they do **not** want AI deciding, and what JID's own constitution already
forbids AI or anyone else from fabricating, is anything that looks like a
score, a ranking, or a claim about them that they did not author or evidence
(R1 Article 4's data-truth doctrine is, functionally, an anti-hallucination
rule for the whole platform, not just an AI rule).

### Employer / Business

| Segment | Primary need | What breaks trust in the category |
|---|---|---|
| Recruiter / TA | Fill volume without re-entering the same candidate data across tools | Tool-stitching: the average team already runs ~7 tools (S19) |
| Hiring manager | Decide between finalists without doing the recruiter's job | Decision paralysis — 81% report it in cited research (S19) |
| HR generalist / SME owner | Hire well without a dedicated recruiting function | Category tools built for enterprise TA teams, not for one person wearing five hats |
| Recruitment operations | Prove the process was fair and defensible after the fact | No structured, auditable trail — Greenhouse's whole differentiator is exactly this gap (S14) |

Employers converge on wanting AI to **triage and summarize**, not to decide —
the same tiered-approval logic independent research documents for AI-agent UX
generally (S18): low-stakes, reversible groupings (initial sourcing filters)
can run with light oversight; anything that ends a candidate's chances needs a
visible, inspectable, human-approved step. What causes "hiring-tool fatigue"
in the category is not too little AI — it's re-entering the same signal in
three different tools with three different views of the same candidate (S19).

### University

| Segment | Primary need | Failure mode to avoid |
|---|---|---|
| Career center | Show impact, place students, evidence institutional value | Coverage gaps silently treated as "the number" instead of stated alongside it |
| Employability leadership | Decide where career-support investment goes | A metric with no way to see what's behind it |
| Academic/program leadership | Understand real outcomes per program, not anecdote | Confusing "who declared this university" with "who is verified/employed" |
| Institutional-quality / accreditation stakeholders | External-facing credibility signal | A number that cannot survive being drilled into |

This matches both established university practice (Cornell, Johns Hopkins,
Jisc all publish outcomes dashboards with explicit survey-coverage caveats —
S20) and JID's own Article 4 data-truth doctrine (R1): an aggregate must state
which honest metric it represents, and a stat with no real source behind it
must not render at all rather than render as zero or a placeholder.

---

## 5. JOBS TO BE DONE

Organized by **intent**, not by current page. This is deliberately a small,
durable set — not a one-JTBD-per-feature list.

**Individual**
- *"When I'm asked 'tell me about yourself professionally,' help me answer
  once, well, and reuse that answer everywhere I need it — instead of
  re-typing my history into a new form every time."* (→ Career Record as the
  one spine, Article 3's "one fact lives in exactly one place")
- *"When I don't know where I stand, help me see what evidence I actually
  have and what's missing, so I know what to do next."* (→ read-only
  self-assessment, not a manufactured score)
- *"When an opportunity needs a specific version of my story, help me project
  the right one without editing my underlying record."* (→ CV Builder as a
  pure, disposable L6 renderer, never a second source of truth)
- *"When I apply somewhere, tell me honestly what happened, even if the
  answer is silence — don't fabricate motion I can't verify."*

**Employer**
- *"When I define a role, help me define what evidence would actually prove
  someone can do it — not just a keyword list."*
- *"When I have several candidates, help me compare the same evidence against
  the same criteria, so my decision is defensible afterward, not just fast."*
- *"When I've made a hiring decision, let the evidence that justified it stay
  attached to the decision — don't make me reconstruct 'why' from memory in
  three weeks."*

**University**
- *"When I look at a graduating cohort, tell me clearly what is known, what
  is unknown, and what changed — don't let a partial number pretend to be a
  complete one."*
- *"When I see where our graduates end up, help me connect that back to
  something a program or career-support decision can act on — not just a
  report that gets filed."*

These are the load-bearing JTBDs this research surfaced; a fuller enumeration
belongs to D1, once it can be checked against real navigation decisions.

---

## 6. BEHAVIORAL FINDINGS

Evidence separated from inference, per the brief's own discipline.

**Evidence (converging across 3+ independent sources):**
- Mobile is the default surface for younger professional users, not a
  secondary one; slow or clunky flows are read as disrespect, not patience
  (S1).
- Long, unskippable onboarding drives abandonment; shortening a signup form
  materially reduces drop-off (7→3 fields cut abandonment ~45% in cited
  research) (S17).
- More than 3-4 simultaneous choices during onboarding measurably increases
  abandonment (S17); decision fatigue in hiring specifically affects the
  majority of hiring managers surveyed (81%, cited) (S19).
- Dashboards fail from undifferentiated clutter, not from missing features;
  the fix pattern the industry converges on is progressive disclosure plus
  role-based defaults, not more customization knobs handed to the user (S12).
- Trust in AI output rises when the system shows its reasoning or confidence
  and falls when it is opaque; tone and clarity of AI language measurably
  affect trust (S2).
- Command palettes / keyboard-first navigation are now a standard, expected
  pattern for professional/power-user tools, not a novelty (S7) — but only
  where the audience is dense-workflow professionals (staff, TA, recruiter
  actors), not necessarily the general public actor.
- Even LinkedIn's own 2026 direction is explicitly moving *away* from vanity
  engagement metrics toward depth-of-attention signals (S15) — the
  vanity-metric era of professional platforms is contracting industry-wide,
  not just being avoided by JID's own policy choice.

**Inference (plausible, JID-specific, not independently verified in this
pass):**
- Saudi professionals likely bring the same mobile-first, low-form-tolerance
  expectations as the broader Gen Z/young-professional evidence base, filtered
  through a stronger baseline expectation of formal identity verification
  (from Absher/Tawakkalna/NAFATH-style government experience — S5). This is
  treated as a hypothesis for R1-B to test more rigorously, not a conclusion
  this pass can fully support with Saudi-specific data.
- University staff and employer users, being professionally obligated rather
  than optionally engaged, likely have *higher* tolerance for information
  density and lower tolerance for onboarding friction than the Individual
  actor — informed by the general fintech/dev-tool density research (S7, S8)
  but not confirmed with JID-specific user research.

---

## 7. HR TECH LANDSCAPE

For each reference, what problem it solves, what JID should learn, and what
JID should reject.

**Ashby** (S3) — Consolidates ATS + CRM + scheduling + analytics into one
dense, analytics-first surface for TA teams.
*Learn:* consolidation reduces the tool-fatigue problem employers report
(S19) when done well. *Reject:* reviewers converge on "too many steps to
configure" — consolidation without a simplified setup path just moves the
fatigue from "too many tools" to "too many settings screens."

**Greenhouse / Lever / SmartRecruiters** (S14) — Greenhouse's differentiator
is "Structured Hiring": interview kits, scorecards, and approval workflows
that force a consistent, auditable process. Lever pairs ATS with CRM in one
system. SmartRecruiters optimizes for scale and marketplace breadth.
*Learn:* "structured and auditable" is precisely the register JID's hiring
evidence and rubric surfaces should target — it is the category-standard
articulation of what Article 4's data-truth doctrine looks like applied to
hiring decisions. *Reject:* SmartRecruiters is explicitly described in
industry coverage as feeling "like a social network" for engagement — that
register is wrong for a decision-support tool and wrong for JID's anti-feed
constitution.

**Eightfold / Beamery / Gem / Gloat** (S4) — Talent-intelligence platforms;
categories converged in 2025-2026. Eightfold's internal career-pathing UX is
repeatedly called out as best-in-class *because employees actually return to
it voluntarily*. Eightfold has also moved toward autonomous agentic screening
in 2026.
*Learn:* career pathing that people return to on their own is the clearest
existing proof that a "recurring professional utility" surface (Part 10) can
work without social mechanics. *Reject:* fully autonomous candidate screening
conflicts directly with JID's "AI is assistive, explainable, and
human-authorized" doctrine (R1) and with the action-approval research pattern
(S18) — this is a capability to note, not one to import.

**Metaview / BrightHire** (S9) — Turn hiring conversations into structured,
searchable evidence automatically, without asking interviewers to do manual
data entry.
*Learn:* this is a strong precedent for how JID's Evidence Vault / hiring
evidence architecture could generate evidence as a byproduct of the process
that's already happening, rather than as a separate chore employers have to
remember to do. *Reject:* nothing structural — the caution is privacy/consent
scope (recording conversations), which JID's own consent-governed visibility
model (Article 5) would need to govern explicitly if anything like this is
ever built.

**Workday + Paradox** (S10) — Enterprise HR consolidating conversational AI
("Olivia") directly into the ATS/HCM core for high-volume, frontline
candidate conversations (scheduling, screening).
*Learn:* the direction of travel across the whole category is AI moving from
bolt-on chatbot to embedded, first-class interaction layer. *Reject:* JID's
candidate-facing register is identity-and-evidence, not high-volume frontline
conversational funnel management — importing a Paradox-style chat-first
candidate experience would be solving a different company's problem.

**Handshake** (S6) — University career-center platform; 2025 roadmap
explicitly shifts toward outcomes-data integration (First Destination Survey)
as the retention lever, not job-posting volume.
*Learn:* corroborates that "outcomes intelligence" is where a university
product's real, durable value sits — directly supports Part 13. *Reject:*
Handshake's core UX is still job-board-shaped for the student side; that
shape is explicitly the wrong reference for JID's Individual actor per
Article 0/3.

**General category pattern (all of the above, converging):** the entire HR
tech category in 2025-2026 is moving toward *evidence* (verified skills,
structured interview data, outcomes data) as the unit of trust, replacing
self-reported claims (S16). JID's constitutional bet on evidence-backed
professional identity is not a contrarian position in this market — it is
where the market is already heading. The differentiation is not the bet
itself; it's building the coherent experience around it before the category
catches up.

---

## 8. NON-HR PRODUCT LESSONS

Each reference answers one specific JID question, not a general "be more
like X."

**Linear / Raycast** (S7) — *How can dense professional work feel fast
without becoming visually noisy?* Answer: hierarchy through focus/recede, not
through removing information — what's central to the current task stays in
full detail, what's orientation-only recedes visually rather than being
deleted. Transferable to JID's staff/employer dense surfaces; not a mandate
to add a command palette everywhere (JID already has four fragmented
palette implementations per R3 — the lesson here is *consolidate the pattern
JID already reached for*, not add a fifth).

**Stripe / Mercury / Ramp** (S8) — *How can complex, high-trust data remain
understandable and feel serious without becoming decorative?* Answer: show
the real number instead of a badge standing in for it (processing state,
fees, policy state shown plainly), and calibrate density to the user's role
rather than using one density for everyone. This is the clearest external
validation available for JID's own Article 4 doctrine — "evidence before
decoration" is not a JID invention, it is observed practice in the highest-
trust B2B category outside HR tech.

**Notion** (S11) — *How can structure remain flexible without losing
hierarchy?* Answer: flexibility needs strong default paths (guided first-run,
templates) or it just reads as an empty blank canvas. Directly relevant to
JID's seven-layer Individual Profile model (R1 Article 3): a structure that
flexible needs opinionated defaults for a first-time Individual, not a blank
"add sections" builder.

**Deel / Gusto contrast** (S21) — *Does "more complete" always win?* Answer:
no — Gusto is rated highly precisely for staying simple and domestic-focused;
Deel is respected for handling more complexity at the cost of a steeper
learning curve. Both are legitimate strategies. Relevant because it gives D1
permission to choose *deliberate* complexity per actor (dense for Staff/TA,
minimal for a first-time graduate) rather than defaulting to one uniform
information density platform-wide.

---

## 9. SAUDI / ARABIC DIGITAL CONTEXT

Scoped to UX findings only — full content/language research is R1-B's job.

**What Saudi users already expect, from government-platform habits** (S5,
R1): Absher and Tawakkalna between them reach tens of millions of users with
biometric/eID-based identity verification, and NAFATH-style federated
identity that lets one verified identity carry across services. This sets a
**baseline trust expectation** JID's verification flows (for all three
actors) are implicitly compared against, whether or not JID uses the same
mechanisms. Notification design in these platforms is also purpose-tailored
(a document-renewal notice looks and behaves differently from a
health-update), which is a pattern worth noting for JID's own notification
system rather than one generic notification type for everything.

**What Arabic-first actually requires, beyond translation** (S13, corroborating
R1's typography rules): RTL-aware spacing and icon-mirroring as first-class
design tokens (not a mirrored-at-the-end pass); Arabic content at equal depth
to English, never a thinner Arabic version; typography and line-height tuned
for Arabic glyph density rather than reusing Latin-tuned values; and explicit
support for **mixed-script input** — Saudi users commonly switch between
Arabic and English keyboards within the same field, which is a real
interaction case to design for, not an edge case to ignore. R1's own
non-negotiable rule (zero `letter-spacing`/`tracking-*` on Arabic text) is
consistent with and reinforced by this independent practitioner consensus.

**Strong patterns to hold onto:** government-platform-grade identity
verification vocabulary (the user already knows what "verification" should
feel like); notification specificity by purpose rather than one generic
alert type; equal-depth bilingual content as a baseline, not an aspiration.

**Weak legacy patterns to notice but not copy:** many Saudi/Arabic digital
products still visibly started as a translated English product (asymmetric
information density between locales, RTL as an afterthought skin rather than
a structural default) — this is exactly the failure mode R1's typography and
i18n rules already guard against, and this research corroborates that
guarding against it is the right call, not overcaution.

---

## 10. CURRENT JID EXPERIENCE DIAGNOSIS

Each finding below follows: current pattern → why it's weak → user impact →
system cause → strategic opportunity.

**10.1 Two organization-onboarding models running simultaneously**
- *Current pattern:* Staff nav and dashboard carry a live "Claims queue"
  (`claimsCard`, `claims_approved_today`, `claims_rejected_today` metrics) in
  parallel with a "Verification requests" queue and its own history/my-queue
  views (R5). Route tree still has `(company)/company/claim`,
  `(company)/company/claim/reapply`, and `(staff)/staff/claims/*` alongside
  `(company)/company/verification/*` (R6).
- *Why it's weak:* two names for what should be one process is a coherence
  failure, not a feature gap. It means the org-onboarding flow the Founder
  has already decided on (account → email verification → org details →
  representative verification → reconciliation → workspace) is competing
  with a still-live "search a catalog row, claim it" flow for the same real
  estate.
- *User impact:* a staff reviewer works two queues that may represent the
  same underlying decision; a Business/University signing up may hit
  claim-flow copy ("claim," "reapply") that the Constitution has explicitly
  banned as user-facing language (R1 Article 6).
- *System cause:* 31+ migrations wire `claimed_by`/`entity_state` into jobs,
  applications, screening, billing, and comms RLS (R3 §2.1–2.3) — this is not
  a copy-only leftover, it is load-bearing in the current schema.
- *Strategic opportunity:* this is the single highest-leverage fix available
  — collapsing two onboarding mental models into the one the Founder has
  already authorized removes a whole category of user and staff confusion at
  once, and it is a decision that is already made, not one D1 needs to
  relitigate.

**10.2 Feature-island navigation**
- *Current pattern:* public nav lists "Explore opportunities" and "Jobs" as
  two separate items, and "Mentorship" and "Mentors" as two more (R5);
  Career Canvas and Evidence Vault exist in copy but are explicitly marked
  "not live yet" (R5) rather than not shown at all.
- *Why it's weak:* a user does not think in terms of "Explore opportunities"
  vs. "Jobs" as two different intents — this is the same job-to-be-done
  presented twice because two different build efforts each got their own
  nav slot.
- *User impact:* redundant destinations increase the number of choices a
  user has to resolve before doing anything (directly counter to the
  documented decision-fatigue evidence past 3-4 choices, S17).
- *System cause:* features appear to have shipped as independent workstreams
  (R3's P-1xx execution-log structure shows dozens of narrowly-scoped
  remediation passes) without a later IA pass to merge overlapping surfaces.
- *Strategic opportunity:* Section 11 below treats this in depth — it is an
  information-architecture diagnosis, not a navigation-labeling fix.

**10.3 A prior remediation pass already proved styling isn't the issue**
- *Current pattern:* `DESIGN_CONFORMANCE_REPORT.md` (R4) already replaced
  128 files' worth of raw `jid-*` classes with semantic tokens and removed
  ~28 Arabic `tracking-*` violations, explicitly scoping out "layout
  restructuring" and "logic changes."
- *Why it's weak:* this proves the Founder's rejection survived a real,
  completed token-conformance pass — the problem this research phase exists
  to address is definitionally not fixable by another token pass.
- *User impact:* none directly (this is evidence about the diagnosis, not a
  live user-facing defect).
- *System cause:* the P-002 pass was correctly scoped to what it was asked to
  do; the gap is that no phase after it was asked to touch structure until
  now.
- *Strategic opportunity:* this research (R1-A/B → D1) is that missing phase
  — it should explicitly not repeat token-only work.

**10.4 Technical architecture leaking into UX**
- *Current pattern:* four separate command-palette implementations exist in
  the codebase (R3 gap list, P-608); 200+ files carry hardcoded Arabic
  strings outside the i18n system (R3); at audit time there was zero
  automated test suite and no CI pipeline (R3 §8).
- *Why it's weak:* fragmentation at the component level (four palettes) is
  usually a visible symptom of fragmentation at the product level (four
  teams/sprints solving the same UX need independently, per Article 7's
  "exactly one command palette" rule already existing and already being
  violated).
- *User impact:* inconsistent keyboard/search behavior across portals; a
  Staff user's `⌘K` may behave differently in different sections.
- *System cause:* rapid, workstream-by-workstream feature delivery without a
  cross-cutting component-reuse gate at merge time (Article 7's "search
  before building" rule exists specifically because this already happened).
- *Strategic opportunity:* this is exactly the kind of finding D1 needs
  handed to it explicitly, since architecture like this is invisible from a
  screen-by-screen visual review.

**10.5 Dashboard-first, decision-absent surfaces (inferred, needs D1
verification)**
- *Current pattern:* Individual/Business/University all route through a
  `dashboard` landing surface as the default authenticated destination
  (R6).
- *Why it's weak, per general evidence:* dashboards fail from
  undifferentiated widgets more than from missing features, and the fix
  pattern the industry has converged on is decision-oriented, role-based
  defaults rather than a static grid (S12).
- *User impact:* without D1-stage screen-level review this is not yet
  confirmed as a live JID defect — flagged as a hypothesis for D1 to verify
  against the actual dashboard content, not asserted as fact here.
- *System cause:* unknown without deeper screen inventory (out of this
  phase's scope).
- *Strategic opportunity:* if confirmed, reframing "dashboard" surfaces
  around "what does this person need to decide right now" rather than "what
  data do we have to show" is a low-risk, high-leverage direction for D1.

---

## 11. INFORMATION ARCHITECTURE FINDINGS

**Does an Individual think in "features" or in professional goals?** The
Constitution's own seven-layer model (R1 Article 3) already answers this
correctly on paper: Career Record, Evidence Vault, Career Timeline, Career
Canvas, and Expression are described as *layers of one identity*, explicitly
not separate products. But the live nav and route structure still expose
several of them as independent destinations (`/profile`, `/profile/cv`,
`/radar`, `/screenings` as siblings — R6), and two of the layers are
literally marked as not-yet-built inside the copy meant to represent them
(R5). The user-facing risk is that even once every layer *is* built, if they
remain siblings in the nav rather than facets of one identity, the product
will still feel like "multiple products joined together" — which is the
Founder's stated complaint.

**What should be primary vs. contextual (diagnosis, not redesign):** Career
Record is constitutionally "the canonical spine" (R1) — every other surface
should reference it, not duplicate it. That suggests Career Record behaves as
the *one* persistent destination for an Individual, with CV Builder,
Evidence, Timeline, and Canvas as *views onto* that spine rather than peer
nav items — but this research does not prescribe the exact IA; it identifies
that the current sibling-route structure conflicts with the constitutional
spine doctrine and that this conflict is worth resolving deliberately in D1.

**What creates cognitive load today, evidenced:** redundant nav entries
("Explore opportunities" / "Jobs"; "Mentorship" / "Mentors" — R5) force a
user to resolve which of two similar-sounding destinations is the one they
want, which is exactly the kind of unnecessary decision the cited
decision-fatigue research flags (S17). Four separate command-palette
implementations (R3) mean "search/jump to anything" does not behave
consistently as a platform-wide capability, undermining Article 7's own
"exactly one command palette" rule.

**Business and University IA (same diagnosis, less route-level evidence
gathered in this pass):** the route tree shows Business/University onboarding
still forking into claim vs. verification variants (Section 10.1), which is
itself an IA-level problem — a user should not be able to land on two
structurally different onboarding paths for the same real intent. A deeper
per-surface IA audit (which route is primary, which is contextual, what
belongs behind search) is explicitly D1's task, once R1-B's terminology
findings are also in hand — this report's job was to establish that the
current structure does not yet match the actor's mental model, not to
redesign that structure.

---

## 12. AI EXPERIENCE FINDINGS

JID's own constitutional rule — "AI is assistive, explainable, and
human-authorized" — is, on independent review, well ahead of where most of
the category still operates (S10 shows the market's dominant move is still
embedding *more* autonomous conversational AI into core flows), and
well-aligned with where user trust research says the category needs to go
(S2's finding that AI adoption is rising while trust is falling industry-
wide; S18's tiered-approval pattern).

**Where JID AI should be VISIBLE:** drafting and summarization the user
explicitly asked for (draft a CV variant from the Career Record; summarize
what's missing from a profile) — visible, attributable, and always
inspectable before being treated as final (S2's confidence/reasoning-display
finding; S18's action-preview pattern).

**Where JID AI should be CONTEXTUAL:** surfaced inline at the moment it's
useful rather than as a standalone "Ask AI" destination — e.g., Abhathli
(ابحثلي/"Search-For-Me," R5) monitoring opportunities in the background and
surfacing matches inside the Radar/opportunities context the user already
uses, not as a separate chat product competing for nav space.

**Where JID AI should stay BACKGROUND SUPPORT:** anything that turns
unstructured signal into structured evidence without asking the user to do
manual data entry — the Metaview/BrightHire precedent (S9) for hiring
evidence generalizes to JID's own Evidence Vault concept: evidence should be
capturable as a byproduct of things the user is already doing, with the AI's
role limited to organizing what already exists, never inventing what
doesn't.

**Where JID AI should be ABSENT:** anything that produces a score, ranking,
"visibility chance," or trend a genuine measurement system doesn't back —
this is already forbidden by Article 4's data-truth doctrine independent of
whether AI or a human produced it, and independent trust research confirms
users specifically distrust exactly this kind of unexplained number (S2).
Fully autonomous candidate screening or hiring decisions (the direction
Eightfold and Paradox are both moving toward, S4/S10) should also stay
absent — not because the technology can't do it, but because it directly
conflicts with the human-authorization rule and with the tiered-approval
research consensus for consequential, people-facing actions (S18).

---

## 13. RETURN-VALUE MODEL

**Individual — what creates recurring, non-addictive utility:** the closest
external validation is Eightfold's internal career-pathing UX, called out
specifically because employees return to it *voluntarily*, without any
feed/engagement mechanic (S4). Applied to JID: a Career Record that stays
current with minimal re-entry, evidence that accumulates value the longer
it's maintained, and an honest view of "what's missing to reach X" are
recurring-utility mechanics that do not require social features. This is
consistent with, not in tension with, Article 3's anti-feed constitution
(R1) — the two are the same design direction, evidenced independently.

**Employer — what makes JID useful after publishing a role:** not "more
candidates," but decision support under the volume/tool-fatigue conditions
independently documented for this segment (S19: ~56% more open roles, ~2.7x
more applications per recruiter than three years ago, ~7 tools stitched
together on average). The category's own structured-hiring pattern
(Greenhouse, S14) and evidence-generation-as-byproduct pattern (Metaview/
BrightHire, S9) both point toward "the evidence that justified a decision
stays attached to the decision" as the return-value hook — an employer comes
back not because JID nagged them, but because the last hiring decision's
record is genuinely useful the next time a similar decision comes up.

**University — what creates recurring institutional value, not just annual
reporting:** Handshake's own 2025 roadmap shift toward outcomes-data
integration as the retention lever (S6) and established university
dashboard practice (Cornell, Johns Hopkins, Jisc — S20) both point the same
direction: outcomes intelligence that a program or career-support decision
can actually act on, refreshed continuously rather than delivered once a
year, is what makes a university return between reporting cycles.

**Explicitly rejected as return-value mechanics for any actor:** vanity
counters, follower/like/feed mechanics (already permanently banned per R1
Article 3/8, and independently validated as a *declining* pattern even on
the platform most associated with it — S15), and any dashboard that shows
data with no implied next decision (S12).

---

## 14. DIFFERENTIATION

| Capability | Tier |
|---|---|
| Evidence-based professional identity (Career Record + Evidence Vault as the spine, never duplicated) | **Core differentiator** |
| Directory ≠ Profile architecture (reference data vs. self-authored, verified identity, never conflated) | **Core differentiator** |
| Consent-governed, per-purpose visibility (not forced anonymity, not forced exposure) | **Core differentiator** |
| University graduate-outcomes intelligence with honest coverage/missingness disclosure | **Core differentiator** |
| Hiring evidence that stays attached to the decision it justified | **Supporting capability** |
| Structured, auditable hiring process (rubrics, comparison against criteria) | **Supporting capability** — category-standard (Greenhouse et al., S14), executed with JID's evidence model it becomes distinctive |
| AI-assisted drafting/summarization/matching (Abhathli, Lammah) | **Supporting capability** |
| Opportunity discovery / job listings | **Commodity feature** — table stakes across the whole category, not a place to differentiate |
| CV export/formatting | **Commodity feature** — necessary, replicable, not a moat |
| Mentorship | **Currently a distraction from the core three-actor model as a peer nav destination** (Section 3) — may be a legitimate capability layered onto the Individual actor, but as a fourth standalone public actor it dilutes rather than sharpens what JID is for. Flagged as an open question, not a verdict (Section 18). |
| Any social/feed/engagement mechanic | **Explicit distraction, permanently rejected** (R1 Article 3/8, corroborated S15) |

The question that actually locates JID's differentiation is not "how does
JID out-feature LinkedIn or an ATS" — it's **"what product experience could
only make sense for an infrastructure layer that all three sides of the
Saudi employment relationship already trust with the truth about
themselves?"** Nothing in the HR tech landscape reviewed here occupies that
position end-to-end; most products are single-actor tools (ATS = employer-
only, Handshake = mostly-individual-and-university, Eightfold = mostly-
employer). JID's constitutional three-actor, one-source-of-truth model is
genuinely uncommon — the work is making the experience live up to it.

---

## 15. PATTERNS TO ADOPT

1. **Structured, auditable decision surfaces** for Employer hiring evidence
   (Greenhouse's category-defining pattern, S14) — applied through JID's own
   evidence model rather than copied wholesale.
2. **Evidence generated as a byproduct of work already happening**, not as a
   separate data-entry chore (Metaview/BrightHire precedent, S9) — directly
   applicable to Evidence Vault.
3. **Focus/recede density hierarchy** for dense professional surfaces (Linear
   pattern, S7) — what's central to the current task stays detailed, what's
   orientation-only recedes, rather than either flattening everything or
   hiding it behind extra clicks.
4. **"Show the real number instead of the badge that stands in for it"**
   (Stripe/Mercury/Ramp pattern, S8) — directly reinforces and gives external
   proof for Article 4's own data-truth doctrine.
5. **Role-calibrated information density** rather than one density for every
   actor (fintech Role-Metric-Density-Action framing, S8; Deel/Gusto
   contrast, S21) — dense is correct for Staff/TA-style professional users,
   minimal is correct for a first-time graduate.
6. **Tiered AI action-approval by reversibility** (S18) — the concrete
   mechanism to implement JID's existing "assistive, explainable, human-
   authorized" AI rule, not a new principle.
7. **Strong guided defaults inside a flexible structure** (Notion pattern,
   S11) — relevant to how the seven-layer profile model is presented to a
   first-time user so flexibility doesn't read as an empty canvas.
8. **Staged, short onboarding steps** rather than one long form (S17
   quantified evidence) — directly applicable to the Founder-decided org-
   onboarding sequence (account → verification → details → representative
   verification → reconciliation → workspace) as a paced sequence, not one
   screen.
9. **Outcomes data with coverage/missingness stated alongside the headline
   number** (established university dashboard practice, S20) — already
   required by Article 4; independently confirmed as real institutional
   practice, not overcaution.

---

## 16. PATTERNS TO REJECT

Each with the JID-specific reasoning the brief requires — not a reflexive
"no."

- **Job-board homepage as the front door.** JID's own governing questions
  (Article 0) start with identity and trust, not with a search box over
  listings — leading with a job-board frame would misrepresent what JID
  actually is on first contact, and Handshake's continuing job-board-shaped
  student UX is explicitly the wrong reference here even for a product JID
  otherwise learns from (S6).
- **"Claim organization" flows, in any form.** Not a style preference — this
  is a Founder Decision already made and a Constitutional ban already written
  (R1 Article 2/6/8). The live product still runs this flow (Section 10.1);
  rejecting it in any new experience is not optional.
- **A generic "Ask AI" chatbot as its own destination.** Every AI pattern
  reviewed that succeeds does so *contextually*, inline with the task it
  supports (S4's Eightfold career-pathing, S9's evidence-from-conversation) —
  a standalone chat surface would also cut against Article 4's data-truth
  doctrine the moment it's asked something the platform can't honestly
  answer.
- **Card-soup dashboards with no implied decision.** Directly evidenced as a
  category-wide failure mode, not a hypothetical one (S12) — every dashboard
  JID ships should be checked against "does this surface point at a
  decision," not "do we have data for this."
- **Vanity engagement mechanics (views, followers, streaks, "profile
  strength" gamification bars).** Already permanently banned (R1 Article
  3/8) and independently confirmed as a declining pattern even on the
  platform most associated with it (S15) — there is no version of this that
  is now "safe" to add.
- **Fake/approximated personalization or metrics** ("visibility chance,"
  invented trend arrows). Already forbidden by Article 4; independently,
  users specifically distrust unexplained numbers more than an honestly
  absent one (S2).
- **Excessive enterprise sidebar navigation copied wholesale from ATS
  products for the Individual or public actor.** Dense sidebar navigation is
  a legitimate, evidenced pattern for Staff/TA-dense workflows (S7, S8) —
  but importing it wholesale into the Individual or public-facing surfaces
  would apply Ashby/Greenhouse-grade density to an audience the evidence
  base says needs the opposite (S1, S17).
- **Mobile-as-shrunken-desktop.** Directly contradicted by the mobile-first
  evidence base for the individual/younger-professional audience (S1) — a
  responsive squeeze of a dense desktop layout is not the same thing as a
  mobile-considered information hierarchy.
- **An onboarding wizard that front-loads every field a workspace will ever
  need.** Directly contradicted by the quantified form-length/abandonment
  research (S17) — the Founder-decided org-onboarding sequence should be
  staged, not collapsed into one long form for expedience.

---

## 17. EXPERIENCE PRINCIPLES

Ten, JID-specific, each derived from a finding above — not generic advice.

1. **One spine, many views, never two truths.** Every fact the platform shows
   about a person or organization must trace to exactly one place it lives;
   every surface that shows it is a view, never a second copy (R1 Article 3's
   spine doctrine, reinforced by S8's "show the real number" pattern).
2. **Evidence before decoration.** When JID presents a professional or
   hiring claim, the interface must make the underlying evidence easier to
   find and understand than any badge, score, or status pill standing in for
   it (R1 Article 4; independently observed as the trust pattern in the
   highest-stakes fintech UX reviewed, S8).
3. **One onboarding model per relationship, staged, never duplicated.** An
   Individual, Business, or University must never be able to land on two
   structurally different paths to the same outcome (Section 10.1's claim-vs-
   verification finding), and that one path must be paced across small steps,
   not front-loaded (S17).
4. **A dashboard earns its place only if it points at a decision.** Every
   persistent landing surface must answer "what does this person need to
   decide or do next," not "what data do we have available to show" (S12).
5. **Density is chosen per actor, on purpose.** Staff, recruiters, and
   TA-style professional users can and should get dense, fast, keyboard-
   capable surfaces (S7); a first-time Individual or a public visitor should
   not be handed that same density by default (S1, S17).
6. **AI drafts, explains, and stages — it never quietly decides.** Every AI
   action with real consequence for a person's opportunities or an
   employer's decision must be inspectable and require explicit
   authorization before it takes effect; only low-stakes, reversible AI
   actions may apply automatically and visibly (S2, S18 — this is the
   concrete mechanism behind JID's own written AI rule).
7. **A missing number is more honest than an approximate one.** If a stat's
   real, traceable source does not exist yet, it must not render — not as a
   zero, not as a placeholder — and every number that does render must be
   drillable to its explanation wherever privacy allows (R1 Article 4;
   independently confirmed as established university-outcomes-reporting
   practice, S20).
8. **Consent is specific, revocable, and never inferred from silence.**
   Visibility to any non-owner actor is a named, purpose-specific grant the
   owner can see and revoke, never a blanket toggle and never assumed from
   the absence of an objection (R1 Article 5).
9. **No mechanic exists to keep someone scrolling.** Every recurring-use
   surface must be justified by utility that compounds the more honestly it's
   maintained (a Career Record, an evidence trail, an outcomes picture) —
   never by a feed, a streak, a counter, or anything whose only job is
   attention (R1 Article 3/8; independently, the category's own reference
   platform for this mechanic is now moving away from it, S15).
10. **Flexibility needs a floor.** Any surface built to accommodate many
    different professional stories (the seven-layer profile model, a
    university's many programs, an employer's many role types) must ship
    with strong, opinionated defaults for the first-time case — flexibility
    without a guided floor reads as emptiness, not power (S11).

---

## 18. OPEN QUESTIONS / CONFLICTS

Genuine unresolved issues only — not a restated TODO list.

1. **Mentorship's place in the actor model.** It is currently a fourth,
   near-peer public destination in the live product (Section 3), which this
   research flags as diluting the three-actor model, but whether Mentorship
   should become a capability layered onto the Individual actor, remain a
   distinct actor, or be scoped down is a genuine open decision this phase
   does not have grounds to resolve — it needs an explicit Founder call, not
   an inferred one.
2. **How much of the seven-layer Individual Profile model is actually load-
   bearing today versus aspirational.** Career Canvas and Evidence Vault are
   explicitly marked "not live yet" in the product's own copy (R5). D1 needs
   to know, before designing around the full seven-layer model, which layers
   are real enough to design for now versus which are directional and should
   be designed for gracefully-absent states.
3. **Whether the claim-model removal (Founder Decision) is a full schema
   migration or a UI-and-gating change on top of existing tables.** This
   research found the claim machinery deeply wired into RLS across jobs,
   applications, screening, billing, and comms (R3 §2.1–2.3) — resolving
   "how deep does this removal go" is an engineering-architecture decision
   outside this research's scope, but D1/engineering needs to know it exists
   before scoping the org-onboarding redesign.
4. **What Saudi-specific behavioral evidence exists beyond inference.** This
   pass could ground global Gen Z/professional behavior in strong evidence
   (S1, S17) but could only *infer*, not verify, how Saudi users specifically
   differ — R1-B is the right place to close this gap with more targeted
   Saudi/Arabic-market research.
5. **Whether a public "Mentors" directory and "Catalog" (organization
   directory) should be understood by users as the same kind of thing
   (browsable reference lists) or genuinely different — this affects IA, not
   just labeling, and needs D1-stage user-mental-model testing rather than a
   research-desk answer.

---

## 19. IMPLICATIONS FOR D1

What the Experience Architecture / Design phase must resolve, informed but
not pre-decided by this report:

- **Resolve the actor model's edge case (Mentorship) before designing
  navigation** — Section 18.1 is a precondition, not a detail to patch in
  later.
- **Design the organization-onboarding sequence as the single, staged path**
  the Founder Decision already specifies — this is not a choice D1 makes, it
  is a specification D1 implements, informed by the staged/short-step
  evidence in Section 6/15.
- **Re-derive the Individual actor's navigation from the spine doctrine, not
  from the current sibling-route list** — Career Record as the persistent
  center, with CV/Evidence/Timeline/Canvas as views onto it rather than
  co-equal nav items (Section 11), respecting which layers are real today
  versus aspirational (Section 18.2).
- **Design dashboards actor-by-actor against "what decision does this point
  at,"** not as a single dashboard template reused across Individual/
  Business/University/Staff (Section 10.5, Section 17.4).
- **Specify AI touchpoints against the tiered-approval model concretely** —
  which actions are auto-apply-with-visible-undo versus which require an
  inspectable preview and explicit approval — for Abhathli, Lammah, and any
  hiring-evidence assistance (Section 12, Section 17.6).
- **Consolidate the command-palette fragmentation** into the single
  platform-wide instance Article 7 already mandates, rather than letting D1
  design a fifth implementation on top of the four that exist (Section
  10.4).
- **Carry Section 15's adopted patterns and Section 16's rejected patterns
  as explicit constraints into D1's option-generation**, not as background
  reading — several of them (structured/auditable hiring surfaces, evidence-
  as-byproduct, role-calibrated density) are specific enough to shape actual
  screen decisions, not just tone.
- **Wait for R1-B before finalizing any Saudi-specific behavioral claim** —
  this report's Saudi/Arabic findings are UX-structural (Section 9) and
  evidence-graded (Section 6/18.4); the terminology and content-register
  work belongs to R1-B and should not be improvised inside D1.

---

*End of R1-A. No product code, database, or UI was changed to produce this
report. No visual direction, navigation structure, or copy was chosen. Ready
for synthesis with R1-B ahead of D1.*
