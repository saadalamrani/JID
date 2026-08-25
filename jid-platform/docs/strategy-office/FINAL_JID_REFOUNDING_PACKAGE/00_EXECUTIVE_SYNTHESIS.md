# JID Re-Founding — Executive Synthesis

**Study date:** 2026-08-25
**Status:** Proposed strategy; not adopted; no implementation authority
**Execution boundary:** Documentation and read-only research only. No production, database, deployment, or product-code change was authorized or performed.

## Executive decision

JID should become **Saudi Arabia's career evidence and opportunity operating system**: a consent-governed infrastructure layer that helps people understand and prove their capabilities, discover and act on trustworthy opportunities, helps employers run higher-signal early-career hiring, and helps universities understand graduate outcomes without pretending incomplete data represents the whole population.

This is narrower than “everything in employment” and larger than a job board. The coherent system has five connected products:

1. **Career Record** — the Individual-owned, reusable source of truth for identity, education, experience, skills, credentials, projects and evidence.
2. **Opportunity Graph** — native and external opportunities with source, freshness, organization identity, deduplication and lifecycle truth.
3. **Hiring Workspace** — verified employer identity, native opportunities, consented candidate projections, pipeline, structured screening, communication and decisions.
4. **Outcomes Exchange** — coverage-labeled, consented graduate outcomes and employer-demand intelligence for universities and, only through formal arrangements, public institutions.
5. **Guidance Network** — mentors as an Individual capability, structured professional knowledge, and bounded conversations attached to a purpose rather than an engagement-maximizing feed.

Three named experiences sit on top of the shared data layers:

- **Lammah / لمّاح:** governed external-opportunity intelligence and reusable opportunity inventory.
- **Abhathli / ابحث لي:** an Individual-controlled search copilot that monitors, explains, prepares and tracks; it does not mass-apply or fabricate fit.
- **Radar:** the person's private action and outcome tracker across saved, applied, interviewing, offered, rejected and closed opportunities.

## Why this direction

- **[FACT]** The current non-production repository already contains substantial reusable assets: 174 App Router pages, 61 API route handlers, 28 action files, 136 migrations, 19 Edge Functions, 53 unit-test files, 11 RLS-test files and 3 E2E-test files at the locked remote baseline. Catalog and Lammah ingestion boundaries, actor identity, organization verification/profile separation, bilingual infrastructure and security tests represent expensive learning that a clean slate would throw away.
- **[RESEARCH FINDING]** The World Economic Forum's 2025 employer survey reports that direct skills assessments are expected to be used by 48% of surveyed employers through 2030, while work experience remains the most common signal. This supports better evidence and structured assessment, but not replacing human judgment with opaque matching.
- **[RESEARCH FINDING]** Handshake demonstrates the strategic value of connecting individuals, employers and career services in one network, while its privacy controls and employer/university workflows show that the moat is the connected system—not a standalone dashboard.
- **[RESEARCH FINDING]** Graduate-outcome systems such as HESA and NACE explicitly define eligible populations, response/knowledge rates and collection windows. University intelligence is credible only when JID reports coverage, denominator and bias—not merely an employment percentage.
- **[MARKET SIGNAL]** Founder and attached research report dissatisfaction with LinkedIn's performative incentives and Jadarat's perceived usefulness. The sources do not prove a national rejection of either platform. JID should validate the problem through behavioral pilots rather than build its thesis on anecdotes.
- **[RESEARCH FINDING]** LinkedIn itself documents a feed ranked using hundreds of profile, network, content and activity signals and includes sponsored content. JID can differentiate structurally by optimizing for completed career tasks, evidence quality and purposeful exchange rather than public reach and engagement volume.
- **[RESEARCH FINDING]** AI-assisted recruiting is growing, but LinkedIn, ILO, NIST and SIOP evidence all point to privacy, validity, objective-definition, accuracy, explainability and human-governance risks. JID should use AI to assist drafting, search and review—not to issue unappealable automated employment decisions.

## The strategic wedge

JID cannot create all five products at once. The recommended first wedge is:

> **A trusted Career Record connected to a truthful Saudi Opportunity Graph, Radar, and a small verified-employer hiring loop.**

This wedge produces value before network scale:

- an Individual gets a reusable record, a truthful CV renderer, curated discovery and one place to track actions;
- an employer gets structured opportunities, a consented candidate view, a simple pipeline and better evidence;
- JID learns which opportunity sources, evidence fields and workflow steps predict completed hiring processes;
- a university pilot can later receive coverage-labeled outcomes only after consent, cohort identity and methodology are proven.

Do not make social publishing, proprietary psychometrics, autonomous application submission, broad government dashboards, mentor payments, or enterprise ATS replacement part of the first 90-day build.

## Build decision

**Choose a hybrid rebuild.**

Preserve and harden:

- Supabase Auth/Postgres/RLS and audit boundaries;
- the separation of platform Directory records from organization-authored Profiles;
- the three public actor identities: Individual, Business and University;
- the Individual-owned career-record direction and consent boundaries;
- Catalog and Lammah ingestion/provenance foundations;
- Arabic-first internationalization, shared design tokens, CI and test infrastructure.

Rebuild or replace progressively:

- actor home information architecture and navigation;
- fragmented feature presentation and static dashboard grammar;
- Career Record authoring and projection model where duplicate truth remains;
- opportunity discovery around a single graph and state model;
- employer workflow around a validated early-career use case;
- university surfaces around explicit data contracts and methodology;
- product packaging, entitlement vocabulary and analytics instrumentation.

A clean-slate rebuild is not recommended because it increases identity migration, RLS, audit, data continuity and release risk without evidence that the trusted foundations are the cause of JID's product problem. Pure incremental evolution is also rejected because current surface and navigation assumptions constrain the new system.

## Product choices

### Individual

Keep the core career identity, record, evidence, CV, discovery, Radar and privacy controls free. JID Plus may charge for recurring active utility—Abhathli monitoring, bounded tailored drafts, advanced preparation and premium mentor services—but never for factual visibility or a secretly boosted profile.

### Employer

Own organization verification, opportunity creation, candidate permissions, workflow, structured interview kits, communication and audit. Integrate or partner for psychometrics, proctored language/coding tests, identity verification and high-risk assessment science until JID has licensed content, local norming, qualified psychometric governance and legal defensibility.

### University

Sell an outcomes and employability operating workflow, not a screen named “dashboard.” Start with a design-partner pilot covering cohort definition, consent, destination collection, data quality and program-level action. Never show an outcome without the eligible population, known-outcome count, collection window and representativeness warning.

### Government and national ecosystem

Treat government as a partner/customer class, not a fourth self-service public actor. JID may provide contracted program evaluation, aggregated skills-demand intelligence or public-interest infrastructure only when scope, authority, lawful basis and statistical coverage are explicit. Do not imply endorsement, integrate restricted systems without agreement, or market JID data as national truth.

## Professional interaction decision

Do not launch a general infinite feed. Test a **Purposeful Professional Layer** in this order:

1. profile-bound projects, credentials and structured achievements;
2. mentor articles and topic collections;
3. cohort/event/opportunity-specific questions and discussions;
4. limited comments with reporting, moderation and finite pagination;
5. only after evidence, an optional finite home digest.

No public like count, follower race, paid organic reach, engagement leaderboard or virality objective is recommended. Quality signals should come from evidence, relevance, completion, peer review and moderation—not popularity. This reopens useful interaction without recreating LinkedIn's incentive system.

## Assessment decision

Use a four-way rule:

- **Build:** structured application questions, interview scorecards, work-sample workflow and job-specific knowledge checks where the employer owns the content and scoring rubric.
- **Partner/integrate:** validated language, coding, cognitive and professionally developed skills assessments.
- **Pilot under governance:** asynchronous video and AI-assisted transcript/rubric support with consent, retention limits and human decision authority.
- **Avoid for now:** personality/culture-fit rejection, emotion inference, facial/voice scoring, black-box match percentages and fully automated selection.

## 90-day sequence

### Days 0–30 — prove the system

- Freeze the proposed product thesis and success measures.
- Run 25–30 Individual interviews, 12–15 employer interviews and 3–5 university discovery sessions with consistent scripts.
- Select 3–5 verified employer design partners and one university design partner.
- Map Career Record, Opportunity Graph and application state contracts against current schema.
- Prototype and test the Arabic-first Individual home, Career Record, opportunity detail and Radar journey.
- Qualify two lawful/reliable Saudi opportunity sources; do not expand scraping before source review.

### Days 31–60 — ship one closed loop in non-production

- Implement the new journey behind flags using existing identity/security foundations.
- Deliver Career Record editing, truthful CV rendering, governed opportunity discovery, save/track and employer native opportunity/pipeline basics.
- Instrument real events and denominators.
- Establish AI model cards, prompt/data boundaries and human-override rules before any AI-assisted feature pilot.

### Days 61–90 — validate repeat value

- Run a bounded pilot with real consenting users and design partners.
- Measure activation, opportunity freshness, save-to-action, employer response time, pipeline completion, user-reported usefulness and trust incidents.
- Test Abhathli as monitor/explainer/drafter—not auto-apply.
- Complete a university data-contract prototype using synthetic or explicitly consented pilot data.
- Decide go/iterate/stop for each capability from evidence, not sunk cost.

## What JID must not become

- a translated LinkedIn clone;
- a low-trust scraper or mass-application bot;
- a general-purpose ATS competing feature-for-feature with mature enterprise suites;
- a proprietary psychometric publisher without science, local norms and governance;
- a dashboard factory that treats missing data as zero;
- an advertising network selling attention or personal data;
- a government-data proxy without formal authority;
- a content feed whose business model rewards performance over professional utility.

## Moat thesis

The defensible compound is not a single AI model. It is the combination of:

- **career evidence:** longitudinal, Individual-controlled and increasingly verifiable records;
- **opportunity truth:** normalized Saudi source provenance, organization resolution, freshness and outcomes;
- **workflow outcomes:** consented signals from discovery through decision;
- **institutional trust:** verified organizations, university methodology and auditable permissions;
- **Saudi operating knowledge:** bilingual titles, sectors, regions, programs, employment context and partner integrations;
- **execution:** a privacy-preserving product that repeatedly completes high-value tasks.

This moat must be earned. No current dataset size, national coverage or outcome advantage is claimed.

## Decisions awaiting founder adoption

1. Adopt the Career Evidence & Opportunity Operating System definition.
2. Approve the hybrid rebuild and protected foundation list.
3. Approve the 90-day wedge and defer the non-wedge products.
4. Keep exactly three public actors; treat mentor as Individual capability and government as partner/customer.
5. Approve the Purposeful Professional Layer experiment instead of a general feed.
6. Approve Abhathli's no-mass-apply, explainable-assistance boundary.
7. Approve assessment integration-first policy.
8. Approve the university design-partner and coverage-first methodology.
9. Approve value-based monetization principles and pricing discovery.
10. Explicitly adopt the proposed new Constitution and retire/supersede the current one through a named governance decision before implementation.

## Adoption warning

The attached founder brief states that the old Constitution is no longer strategic authority, while the repository Constitution requires explicit named, article-level amendment. This study therefore explores new options but does not treat them as implementation permission. Until the founder explicitly adopts a replacement and authorizes an execution packet, current repository constraints remain the operating boundary.

## Key public sources

- [World Economic Forum — Future of Jobs Report 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/)
- [LinkedIn — Future of Recruiting 2025](https://business.linkedin.com/talent-solutions/resources/future-of-recruiting)
- [LinkedIn Help — How the Feed ranks content](https://www.linkedin.com/help/linkedin/answer/a9554004)
- [Handshake — Terms of Service and platform definition](https://joinhandshake.com/legal/tos/)
- [HESA — Graduate Outcomes definitions](https://www.hesa.ac.uk/support/definitions/graduates)
- [NACE — First-Destination Standards and Protocols](https://www.naceweb.org/job-market/graduate-outcomes/first-destination/development-of-the-first-destination-survey-standards-and-protocols)
- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [SIOP — AI-Based Assessments for Employee Selection](https://www.siop.org/wp-content/uploads/legacy/SIOP%20Considerations%20and%20Recommendations%20for%20the%20Validation%20and%20Use%20of%20AI-Based%20Assessments%20for%20Employee%20Selection%20010323.pdf)
