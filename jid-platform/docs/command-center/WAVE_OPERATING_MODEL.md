# JID Wave Operating Model

**Authority date:** 2026-08-26 (Asia/Riyadh)
**Status:** Active operating doctrine for all JID delivery work
**Scope:** Product direction, delivery governance, agent ownership, and reuse gates

This document records founder-approved strategy and replaces conflicting product or
delivery instructions in older operating documents. It does not replace law, privacy,
security, user rights, RLS boundaries, truth requirements, or the requirement for an
explicitly adopted final Trust & Rights Constitution.

## Authority order

1. Law, privacy, security, user rights, and explicit production authorization.
2. Dated founder decisions, including the decisions recorded here.
3. Current verified repository and runtime truth.
4. Approved wave packet and frozen contracts for the active wave.
5. Strategy Office evidence and recommendations.
6. Historical operating documents where not superseded.
7. External references and OSS patterns.

When sources conflict, record the conflict. Do not silently combine incompatible rules.

## Founder-approved product doctrine

### Definition

> جِد منصة مهنية سعودية تربط الفرد بالفرصة، وجهة التوظيف بالكفاءة، والجامعة بمخرجاتها.

- Individual -> Opportunity.
- Employer -> Talent / capability.
- University -> Graduate outcomes and graduates in the labor market.

### Actors and initial segment

JID has exactly three public actors: Individual, Business / Employer, and University.
Mentor is an Individual capability. Government is a partner, customer, or authority
context, not a fourth public actor.

The initial segment is Saudi final-year students, recent graduates, and early-career
professionals, together with employers hiring graduate and early-career talent. This is
a starting segment, not a permanent market boundary.

### Build and delivery strategy

JID uses a Hybrid Rebuild. Preserve trustworthy technical, security, privacy, data,
Arabic/English, and test foundations when current evidence supports them. Rebuild
journeys, information architecture, domain experiences, and systems where evidence
supports replacement.

There is no binding 90-day roadmap. Delivery proceeds through successive governed waves:

`Research/Reuse Gate -> Architecture -> Build -> Validate -> Close -> Next Wave`

A later wave may be researched early but cannot mutate foundations owned by an open
earlier wave.

### AI authority

AI is assistive, explainable, and human-authorized. It may search, retrieve, summarize,
compare, draft, prepare, rehearse, monitor, explain, recommend, and track within granted
permissions. It must not:

- fabricate match percentages or evidence;
- make autonomous consequential hiring decisions;
- mass-apply;
- use emotion, face, or voice inference for employment scoring;
- silently mutate canonical Career Record facts; or
- take consequential external action without an authorized human boundary.

### Monetization

The current principle is Free Core + Paid Intelligence & Workflow. JID does not sell
personal data, create pay-to-win organic ranking, fake verification, fabricate match
scores, or place essential privacy controls behind a paywall. Exact prices and packages
remain unadopted hypotheses.

### Professional / Social Layer

The Professional / Social Layer is approved. JID may support posts, comments, follows,
reactions, articles, professional achievements, mentor content,
organization/university publishing, and a professionally relevant feed.

The approved post-context metadata is:

- مشاركة
- إنجاز
- مشروع
- مقال
- سؤال
- شهادة
- فرصة

Post context is lightweight metadata, not seven separate publishing workflows. Relevant
professional evidence may be offered for addition to the Career Record only through
explicit user choice. Ordinary social content never becomes Career Record evidence
automatically.

The product must not optimize for vanity, addictive engagement, fabricated achievement,
or pay-to-win organic visibility. Metrics must remain real and traceable.

### University direction

The University product is a governed workflow, not a dashboard:

`Cohorts -> Graduate Outcomes -> Program Intelligence -> Employer Alignment -> Career Readiness -> Employer Engagement -> Institutional Reporting`

Individual visibility is purpose- and permission-governed. Institutional metrics require
a source, definition, denominator, coverage, period, and methodology.

## Multi-agent ownership

- **ChatGPT / Nebras:** strategy, founder decisions, orchestration, task decomposition,
  synthesis, and verification.
- **Claude Code:** deep research, OSS/GitHub intelligence, architecture, algorithms,
  assessment/data methodology, and technical design.
- **Codex:** core engineering, backend, canonical domain contracts, APIs, database/RLS,
  integrations, workflows, tests, and repository integration.
- **Cursor:** product UI/UX, frontend, Arabic-first responsive experience,
  accessibility, interaction design, and visual-system execution.
- **GitHub:** shared source of truth and handoff evidence.

No agent owns JID independently. Parallel work is allowed only with frozen interfaces and
non-overlapping file/domain ownership. Codex must not spawn subagents unless the active
task packet explicitly authorizes it.

## Mandatory OSS / existing-system reuse gate

Before greenfield implementation of a substantial subsystem, the assigned research owner
must assess existing repositories, systems, standards, APIs, libraries, academic/industry
methods, and relevant commercial patterns. The packet must evaluate license, security,
maintenance, tests, architecture, privacy, Arabic/Saudi fit, integration cost, and exit
risk, then record exactly one or a bounded combination of:

`ADOPT / FORK / INTEGRATE / EXTRACT PATTERN / BUY-PARTNER / BUILD / REJECT`

This gate applies especially to CV systems, ATS, sourcing, screening, assessments,
interviews, Lammah, Abhathli, Radar, professional/social systems, University intelligence,
analytics, skills systems, reporting, and integrations. Public code is not automatically
licensed, safe, valid, or suitable.

## Non-negotiable safeguards

- Supabase RLS remains the security boundary; private data is excluded on the read path.
- Directory records and owned organization Profiles remain separate.
- No Claim Existing Profile or Commitment Score restoration.
- No fabricated metric, percentage, badge, outcome, or verification claim.
- Career Record remains canonical; CV and other expressions are projections/snapshots.
- Consequential decisions remain attributable to accountable humans.
- No production SQL, production deployment, or production write without explicit founder
  approval.
- Arabic-first delivery preserves English parity, accessibility, RTL/LTR, Latin digits,
  and the no-letter-spacing rule for Arabic.

## Founder Decision Queue

Only genuinely founder-owned unresolved decisions belong here:

1. Adopt the exact final compact Trust & Rights Constitution text and formally retire the
   interim product-heavy Constitution. The direction is approved; no final text is yet
   adopted.
2. Adopt exact pricing and packaging. Free Core + Paid Intelligence & Workflow is the
   governing principle, but specific prices and bundles remain hypotheses.

Until item 1 closes, the existing Constitution supplies interim trust and rights
safeguards, while product-specific clauses conflicting with this dated doctrine are
superseded by this record. Production approvals remain release-specific founder gates,
not standing authorization.
