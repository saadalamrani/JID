# JID CPO Strategy Report 2026

**Role:** Chief Product Officer
**Study date:** 2026-08-25
**Status:** Independent product recommendation; not adopted; no implementation authority
**Evidence labels:** `FACT`, `RESEARCH FINDING`, `MARKET SIGNAL`, `HYPOTHESIS`, `OPINION`, `RECOMMENDATION`

## 1. Executive Summary

JID’s product problem is not a shortage of capabilities. It is the absence of one visible, measurable journey that turns career evidence into a trustworthy next step.

**[RECOMMENDATION]** Organize the product as a **Career Evidence & Opportunity OS** with four primary records: Career Record, Opportunity Graph, action/outcome state (Radar), and verified organization/hiring workflow. University outcomes and professional knowledge are downstream services, not 90-day prerequisites.

**[RECOMMENDATION]** The 90-day product is one closed loop: an Individual builds/imports a useful Career Record, receives source-traceable opportunities, understands relevance without a fake percentage, saves or acts through Radar, and receives a bounded employer response/decision. Abhathli may monitor, explain, draft, and prepare; it must not mass auto-apply. The professional layer begins with profile-bound evidence, mentor knowledge, and finite contextual conversations—not a general infinite feed.

**[RECOMMENDATION]** Select hybrid rebuild. Reuse the current identity, RLS, audit, Directory/Profile, Catalog, Lammah, i18n, and testing foundations; replace fragmented truth, actor-home information architecture, opportunity state, static dashboards, and packaging through flagged thin slices. [S01–S04]

## 2. Mandate

The CPO owns problem definition, actor value exchange, product boundaries, portfolio decisions, discovery quality, sequencing, and kill criteria. The CPO must not use competitor checklists as a roadmap, treat route count as value, or let the shared academy thesis substitute for independent validation.

## 3. What I Learned

**[FACT]** JID’s current non-production system contains real identity, organization, Catalog, opportunity-ingestion, workflow, privacy, i18n, and test assets. It also contains documented partial release, unresolved evidence gaps, and prior navigation/route defects. [S01–S04]

**[RESEARCH FINDING]** Jadarat already unifies Saudi job-seeker and employer employment journeys under a national mandate, so “Saudi job board” is not a sufficient product category. [S06]

**[RESEARCH FINDING]** Handshake validates that individuals, employers, and institutions can be connected in one early-career network, but JID must earn its own Saudi value and cannot import Handshake’s scale claims. [S11–S12]

**[RESEARCH FINDING]** LinkedIn explicitly ranks its feed with hundreds of signals and includes sponsored/recommended content. JID can differentiate at the objective-function level: task completion, evidence quality, freshness, and closure rather than engagement reach. [S09–S10]

**[RESEARCH FINDING]** The open-source ai-job-search project validates a coherent assistant workflow spanning profile, discovery, deduplication, tailoring, preparation, and outcomes; it also makes clear that untrusted job content plus personal data creates a security boundary and that its current portal model is not Saudi-ready. [S16–S18]

## 4. Saudi Current State

Saudi product reality includes:

- a formal national employment platform (Jadarat); [S06]
- current official labor-market statistics and Vision/HCDP priorities around employment, skills, career choice, and foresight; [S05, S07]
- a legal regime that makes purpose, consent/lawful basis, data rights, minimization, impact assessment, retention, and disclosure product requirements; [S08]
- Arabic/English occupational ambiguity, multiple opportunity types, and institution-led distribution that global defaults do not solve automatically.

**[MARKET SIGNAL]** Founder and attached research describe application noise, ghosting, weak closure, performative professional content, and static JID UX. The product must test these pains with behavior, not copy their conclusions. [S19–S21]

## 5. Global Benchmark

| Benchmark | Product lesson | What not to infer |
|---|---|---|
| LinkedIn | Identity, graph, content, jobs, and recruiters can form a powerful system. | A personalized sponsored feed is not required for professional utility. [S09–S10] |
| Handshake | Three-sided early-career distribution and institution-employer connectivity can compound. | US network scale or university adoption transfers to Saudi Arabia. [S11–S12] |
| HESA/NACE | Outcomes products require population, window, coverage/knowledge rate, and denominator definitions. | A dashboard can compensate for missing cohorts. [S13–S14] |
| WEF | Work experience and direct skills assessment both matter in hiring. | JID should publish proprietary fit probabilities. [S15] |
| ai-job-search | Search, dedupe, tailoring, interview prep, and outcome tracking form a coherent assistant loop. | Local scripts, portal scraping, fit scoring, or instruction-only security are production architecture. [S16–S18] |

## 6. User/Customer Jobs-to-be-Done

### Individual

- Capture a credible career fact once and reuse it.
- Understand sectors, organizations, roles, and constraints.
- Find fresh relevant opportunities across trusted sources.
- Know why an opportunity may fit and what is missing.
- Prepare truthfully, act deliberately, and track status.
- Learn from outcomes and maintain identity beyond active job search.

### Employer

- Establish verified identity and authored presence.
- Publish a real opportunity with explicit requirements.
- Receive purpose-limited candidate evidence.
- structure review/interviews/work samples, communicate, and close.

### University

- Define cohorts and collect lawful outcomes.
- See coverage quality before insight.
- connect outcome/employer evidence to an actionable program or service decision.

## 7. Pain Points

- Career facts live in multiple surfaces and must be re-entered.
- A profile can become a long form with deferred value.
- External opportunity inventory can be duplicated, stale, or unauthorized.
- Search produces lists, not a decision path.
- Employer intake can maximize volume rather than intent and evidence.
- Candidate silence leaves Radar incomplete.
- University “dashboard” language can hide absent denominators.
- General feeds reward content performance and add moderation cost.

## 8. Unmet Needs

The primary unmet product need is a **closed career action loop** with five properties:

1. facts are reusable and source-labeled;
2. opportunities are traceable and fresh;
3. recommendations provide reasons/gaps, not fake certainty;
4. action states are owned and correctable by the Individual;
5. employers create closure events that improve future utility.

Secondary needs: structured mentor knowledge, finite contextual discussion, accessible Arabic-first interaction, and outcomes methodology.

## 9. Market Structure

JID spans identity, opportunity aggregation, job board, hiring workflow, guidance, content, and outcomes categories. A product that launches every category simultaneously will have seven cold starts and no clear success event.

**[OPINION]** Product architecture can be broad; market entry must be narrow. The initial product should target Saudi early-career/transition users and employers willing to complete a structured response loop.

## 10. Competitors/Substitutes

- Jadarat: official discovery/application channel. [S06]
- LinkedIn: identity, content, recruiter distribution, jobs. [S09–S10]
- Handshake: early-career network and institutional workflow. [S11–S12]
- Employer career sites/ATS: authoritative submission and pipeline.
- CV builders/LLM tools/open-source agents: drafting and search support.
- Assessment vendors: validated instruments JID should often integrate.
- University spreadsheets/surveys and career-center systems.
- Human referrals, mentors, recruiters, email, and personal trackers.

## 11. Opportunities

### Product opportunity stack

1. **Career Record:** canonical fact/evidence authoring and import.
2. **Opportunity Graph:** native/external source normalization, organization resolution, freshness, duplicates, deadlines.
3. **Radar:** personal state, next action, communication, and outcome.
4. **Employer Loop:** opportunity, candidate projection, structured review, communication, decision.
5. **Abhathli:** monitored search, explanation, truthful tailoring, preparation; explicit user actions.
6. **Purposeful Professional Layer:** achievements/evidence, mentor articles, topic/event/opportunity conversations, finite digest.
7. **Outcomes Exchange:** later, after readiness.

## 12. Risks

- Product sprawl and unclear home/navigation.
- Canonical Record becoming high-friction data collection for other actors.
- Opportunity Graph becoming a low-trust scraper.
- Radar becoming an anxiety dashboard.
- AI explanation becoming an ungrounded score.
- Employer workflow creating discriminatory or opaque decisions.
- Content/community creating spam, vanity, and moderation burden.
- University metrics becoming decorative.
- Hybrid rebuild accidentally creating parallel truth.

## 13. What JID Should Do

**[RECOMMENDATION]** Adopt these portfolio states:

| Capability | State | Product decision |
|---|---|---|
| Career Record | Rebuild around canonical contract | 90-day core |
| CV Builder | Keep as projection; redesign journey | 90-day core |
| Opportunity Graph/native opportunities | Consolidate | 90-day core |
| Lammah | Keep as governed ingestion/intelligence layer | 90-day input, limited sources |
| Radar | Consolidate application/action/outcome state | 90-day core |
| Employer opportunity/pipeline/comms | Narrow and validate | 90-day bounded loop |
| Abhathli | Validate as copilot | 90-day prototype/pilot; no auto-apply |
| Purposeful Professional Layer | Validate in finite forms | Later pilot, not general feed |
| Mentors | Keep as Individual capability | Later pilot |
| University intelligence | Validate after readiness | Later design partner |
| Proprietary psychometrics | Defer/avoid | Integrate validated providers |
| Full ATS replacement | Avoid | Integrate instead |

## 14. What JID Should Not Do

- Use competitor parity, route count, or stakeholder enthusiasm as prioritization.
- Launch a feed and then hope moderation/incentives can be repaired.
- Auto-submit applications or send messages without explicit action.
- Display a match percentage without a validated measurement contract.
- Copy AI-generated claims into Career Record.
- Build university KPI visuals before source, owner, coverage, denominator, and use decision.
- maintain duplicate career facts for CV, Profile, Timeline, Radar, or AI context.

## 15. Product/Service Implications

### Information architecture

**Individual navigation:** Home, Record, Opportunities, Radar, Guidance. Abhathli is an assistant across these surfaces, not a separate universe. Profile/CV are Record outputs.

**Employer navigation:** Home, Opportunities, Candidates, Communication, Settings/Team. Assessment appears inside a role workflow, not as a marketplace of tests.

**University navigation (later):** Cohorts, Collection, Outcomes, Employer Signals, Actions, Methodology.

### Home model

Home is a prioritized finite agenda: one next action, relevant opportunities with source/freshness, Radar changes, record/evidence gaps tied to a benefit, and purpose-bound guidance. It is not a widget dashboard or infinite feed.

## 16. Data Implications

- Career facts require stable IDs, provenance class, timestamps, evidence link, privacy, purpose, and revision history.
- CV/Profile/employer/university views are projections, never independent stores.
- Opportunity records require source authority, fetch/verify times, expiry, apply authority, duplicate graph, organization identity, and status.
- Radar stores user action and observed/confirmed employer outcomes separately.
- AI inputs/outputs are logged with source and cannot silently mutate canonical truth.
- Metrics require event definition, denominator, time window, and missing state.

## 17. Technology Implications

**[RECOMMENDATION]** Hybrid rebuild with vertical slices:

1. Map current tables/routes to proposed contracts.
2. Add canonical interfaces/projections around current data before migration.
3. Build the new Arabic-first flow behind flags.
4. Migrate one user cohort with reconciliation and rollback.
5. retire old duplicate surfaces only after parity and validation.

Current Catalog and Lammah reports show reusable provenance/review/kill-switch patterns. [S02–S03] The open-source job-search project is a product pattern source, not production code approval. [S16–S18]

## 18. Privacy/Legal Implications

PDPL means the product must explain why data is collected, who can see it, how consent/lawful basis works, how it is corrected/deleted, and when it expires. [S08]

- No default university named-person access.
- Employer access is per opportunity/purpose.
- Abhathli must show what leaves JID and require explicit action for submissions/communications.
- External source access must respect API/feed/terms and avoid deceptive automation.
- High-impact assessment or automated decisioning requires qualified legal and scientific review.

## 19. Business Model

The product should monetize repeated outcome value:

- **Individual free:** Record, Profile/CV projections, core Opportunities/Radar, privacy.
- **Individual paid hypothesis:** recurring Abhathli monitoring/preparation, advanced tools, mentor transactions.
- **Employer:** opportunity/workflow subscription, communication, structured interviews/work samples, integrations, programs, service.
- **University:** readiness, outcome-collection workflow, methodology/reporting, later intelligence.

Paid reach, personal-data sale, secret ranking, and guaranteed outcomes are excluded.

## 20. Partnerships

- Employer design partners that commit to response/closure behavior.
- Opportunity sources with authorized access and source-health expectations.
- One university willing to define cohort, consent, methodology, and action.
- Assessment providers with validity evidence and Arabic/Saudi applicability.
- Mentors and professional associations for finite knowledge pilots.

## 21. Validation Needed

### Discovery evidence

- Can Individuals complete the first useful record in minutes, and does each added fact return value?
- Do they reuse the record for discovery, CV, and application preparation?
- Are reasons/gaps understandable and trusted?
- Will employers change workflow and close states?
- Are authorized sources sufficiently fresh and complete?

### Product evidence

- task completion and time;
- redundant-entry reduction;
- record reuse across outputs;
- opportunity freshness/dedup precision;
- save-to-action and employer-response/closure;
- trust, privacy comprehension, accessibility, error and harm incidents;
- repeat utility after active search.

## 22. 90-Day Actions

### Days 0–30 — contract and prototype

- Interview/observe Individuals, employer users/buyers, and university stakeholders.
- Define canonical record, opportunity, and Radar state contracts.
- Prototype Arabic-first mobile flows and validate information architecture.
- qualify two source paths and 3–5 employer partners.

### Days 31–60 — closed-loop thin slice

- Ship flagged Record authoring/import, truthful CV projection, opportunity detail/source/freshness, save/track, employer response, and notifications.
- instrument events and denominators.
- Prototype Abhathli reasons, gaps, drafting, and preparation.

### Days 61–90 — bounded pilot

- Run real consenting journeys.
- audit source quality, accessibility, privacy, AI outputs, and employer closure.
- decide keep/iterate/defer/retire per capability.

## 23. 12-Month Roadmap

- Harden Career Record and Opportunity Graph quality.
- Expand authorized Saudi sources and native employer inventory.
- Add employer work samples, interview kits, communication, and selected assessment integrations.
- Pilot finite mentor knowledge and context discussions.
- Convert Abhathli from prototype to governed recurring copilot only if trusted and useful.
- Launch one coverage-first university cohort workflow.
- retire fragmented legacy surfaces after migration evidence.

## 24. 3-Year Direction

Build a modular career operating system where evidence, opportunity, action, employer decision, and institution-level outcomes form a lawful learning loop. The third-year product may support additional countries through legal/taxonomy/source adapters, but the core interaction and data contracts remain portable.

## 25. Contribution to Saudi Leadership

The product can provide Saudi-native career navigation, Arabic/English normalization, trusted organization/opportunity links, graduate-program and training context, employer closure, and outcomes methodology. It complements official infrastructure instead of asserting authority. [S05–S07]

## 26. Contribution to Global Potential

JID’s globally differentiated product principle is a professional network organized around evidence and completed tasks rather than popularity. Abhathli can demonstrate user-agency-first AI; Radar can demonstrate closed-loop career operations; the outcomes layer can demonstrate statistical honesty.

## 27. Disagreements with Other Strategy Office Roles

- **Chairman:** require governance, but do not wait for exhaustive certainty before a reversible thin slice.
- **CEO:** category narrative should follow observable product value; “OS” must not become an excuse for breadth.
- **UX/CX:** immediate utility is mandatory, but the experience cannot hide necessary provenance, consent, or employer-state complexity; progressive disclosure is the answer.
- **Business/CFO:** employer asks do not automatically enter the product; only repeated, cross-customer jobs with sound incentives do.
- **CTO:** ontology must be sufficient for the thin slice, not perfect for the eventual platform.
- **CMO:** no general content feed for acquisition; distribution must lead to a purposeful task.

## 28. Decisions Required from Founder

1. Approve the product portfolio states above.
2. Approve the new Individual/Employer information architecture direction.
3. Approve hybrid rebuild and canonical migration guardrails.
4. Approve the 90-day closed loop and exclusion list.
5. Approve Abhathli copilot/no-auto-apply policy.
6. Approve Purposeful Professional Layer sequence and no infinite feed.
7. Approve integration-first assessments and no full ATS replacement.
8. Approve outcome coverage rules before university product claims.

## 29. Research & Learning Appendix

### Prioritization rule

A capability enters delivery only if it has:

- a named actor and repeated job;
- standalone value and a measurable event;
- required data and a lawful source;
- privacy/AI risk boundary;
- operational owner;
- payer or strategic funding logic;
- kill criterion and reversible rollout.

### North-star hypothesis

**[HYPOTHESIS]** Count consented career journeys that advance through a verifiable useful next step—not time spent, posts, applications, or dashboard visits. Component events remain separate; no composite score is published until validated.

## 30. Source Ledger with Access Date and Claim Mapping

All web sources accessed **2026-08-25**; local/repository sources read **2026-08-25**.

| ID | Source | Claims mapped |
|---|---|---|
| S01 | JID remote `e876060…`, `JID_Final_Release_Report.md` | Partial shipping, current actor/privacy/i18n foundations and defects. |
| S02 | Same remote, `JID_CATALOG_PHASE1_FINAL_SHIPPING_REPORT.md` | Provenance/review/publication patterns worth reusing. |
| S03 | Same remote, `JID_LAMMAH_PHASE1_FINAL_SHIPPING_REPORT.md` | Governed opportunity ingestion, unsafe URL quarantine, kill switches. |
| S04 | Same remote, `JID_FRIENDS_FAMILY_RELEASE_DEFECT_LEDGER.md` | Route/navigation/i18n defects; need for product-layer replacement. |
| S05 | [Vision 2030 Annual Report 2025](https://www.vision2030.gov.sa/media/ecdjfopq/vision2030_annual_report_2025_en.pdf) and [HCDP plan](https://www.vision2030.gov.sa/media/pgid4z3t/2021-2025-human-capability-development-program-delivery-plan-en.pdf) | Saudi skills, career choice, data and labor-market alignment context. |
| S06 | [HRDF — Jadarat](https://www.hrdf.org.sa/en/products-and-services/programs/establishments/other/jadarat/) | National unified-employment product and target actors. |
| S07 | [GASTAT labor-market releases](https://www.stats.gov.sa/en/statistics-tabs/-/categories/417515?category=124074&tab=436312) | Official source for current Saudi labor claims. |
| S08 | [Saudi PDPL](https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL) | Product privacy/data rights and processing constraints. |
| S09 | [LinkedIn feed ranking](https://www.linkedin.com/help/linkedin/answer/a9554004) | Ranking uses hundreds of signals. |
| S10 | [LinkedIn feed overview](https://www.linkedin.com/help/linkedin/answer/a523360/linkedin-feed-overview?lang=en) | Sponsored and recommended content; differentiation target. |
| S11 | [Handshake About](https://joinhandshake.com/about/) | Three-sided career network benchmark; vendor claims. |
| S12 | [Handshake Career Centers](https://joinhandshake.com/career-centers/) | Institution/employer/student workflows; vendor claims. |
| S13 | [HESA Graduate Outcomes definitions](https://www.hesa.ac.uk/support/definitions/graduates) | Population, 15-month window, response/known outcome definitions. |
| S14 | [NACE First-Destination standards](https://www.naceweb.org/job-market/graduate-outcomes/first-destination/standards-and-protocols) | Knowledge and career-outcome denominator discipline. |
| S15 | [WEF Future of Jobs 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/4-workforce-strategies/) | Employer reliance on work experience and skills assessments. |
| S16 | [ai-job-search repository](https://github.com/MadsLorentzen/ai-job-search) | Profile/search/dedupe/tailor/prep/outcome product pattern. |
| S17 | [ai-job-search MIT License](https://github.com/MadsLorentzen/ai-job-search/blob/master/LICENSE) | Open-source license; no direct reuse decision. |
| S18 | [ai-job-search Security Policy](https://github.com/MadsLorentzen/ai-job-search/blob/master/SECURITY.md) | Personal data + untrusted posting threat; instruction-only defense limit. |
| S19 | `FOUNDER_DECISIONS_AND_REFOUNDING_BRIEF.md` and meeting record | Reopened product options, sequencing, founder hypotheses. |
| S20 | Labor-market research package reports 01–05 | Secondary problem synthesis; hypotheses and design cautions. |
| S21 | Academy reports/registry and `.strategy-work/academy_synthesis.md` | Prior role questions and consensus-bias caution; not product proof. |
| S22 | [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) | AI lifecycle risk, testing, transparency, fairness and governance. |
