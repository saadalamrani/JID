# JID CTO Strategy Report 2026

**Role:** Chief Technology Officer
**Study date:** 2026-08-25
**Status:** Independent technology recommendation; not adopted; no implementation, production, database, or deployment authority
**Evidence labels:** `FACT`, `RESEARCH FINDING`, `MARKET SIGNAL`, `HYPOTHESIS`, `OPINION`, `RECOMMENDATION`, `EVIDENCE GAP`

## 1. Executive Summary

**[RECOMMENDATION]** Choose a **hybrid rebuild**: preserve the proven security, identity, database, internationalization, and opportunity-governance foundations; progressively replace the product model, actor journeys, Career Record projections, workflow boundaries, and instrumentation behind feature flags. A clean-slate rewrite would discard expensive trust learning and raise migration risk. Pure evolution would preserve fragmented surfaces and constrain the new architecture.

The target technology is not “a bigger Next.js app.” It is a modular career infrastructure with seven JID-owned contracts:

1. actor and organization identity;
2. canonical Career Record with evidence and disclosure policy;
3. Opportunity Graph with provenance, source rights, freshness, and deduplication;
4. application/hiring state machine and audit;
5. assessment/work-sample result contract;
6. outcome event and coverage methodology;
7. automation authority, evidence, review, and correction.

**[FACT]** The specified current remote snapshot contains reusable non-production foundations: Next.js 14.2/TypeScript, Supabase/PostgreSQL with RLS, bilingual infrastructure, Directory/Profile separation, governed Catalog/Lammah publication, bounded opportunity-source controls, test/release discipline, and known defect evidence. It does not prove production reliability, scale, adoption, or the new product architecture. [S01–S05]

**[RECOMMENDATION]** Remain open-source-informed but not open-source-defined. First evaluate PostgreSQL FTS/trigram and `pgvector`, PGMQ/Supabase Queues, SurveyJS Form Library, JSON Resume compatibility, ESCO/O*NET reference taxonomies, and OpenTelemetry. Keep them behind adapters, pin exact versions, and complete license/security/SBOM review before production. Do not replace JID with a generic ATS, CRM, HRIS, crawler, social platform, resume app, or autonomous job agent. [S14]

Artificial intelligence must remain inside deterministic authority boundaries. Models may retrieve, summarize, explain, draft, and propose. They may not bypass RLS/purpose, turn untrusted job text into instructions, fabricate Career Record facts, silently rank people, change employment states, disclose data, or submit applications without explicit authority and an audit trail.

## 2. CTO Mandate

The CTO must determine which foundations to preserve, which domains to rebuild, where integration is safer than ownership, how to keep privacy and security enforceable, and how the architecture supports rapid field learning without creating irreversible data or migration harm.

The mandate is not to defend existing code. The old Constitution is current-state evidence, not the new strategic authority. However, identity boundaries, RLS, provenance, data minimization, consent, truthful claims, cybersecurity, accessibility, and rollback remain engineering obligations because they protect people and enterprise viability, not because an old document said so. [S01–S02]

The CTO’s core question is:

> What is the smallest architecture that can validate JID’s new evidence–opportunity–action–outcome loop in 90 days and grow into trusted Saudi infrastructure without forcing a dangerous rewrite later?

## 3. What I Learned

**[FACT]** JID has a meaningful non-production base, but the checked-out worktree was behind the specified current remote. Current-reality claims in this report use `origin/agent/nonprod-signup-fix` at `e876060706abd6c8fbb12d6a5f05df679d49632e`. [S03]

**[FACT]** Lammah already implements a bounded source adapter, source evidence, normalization, candidate/review states, dead-letter governance, entitlement-gated inventory, unsafe URL quarantine, source precedence, freshness/expiry, kill switches, and staff review. It prohibits Profile, Verification, communication, ownership, or application side effects. [S04]

**[FACT]** The former Search-for-Me/Abhathli schema and triggers were deliberately removed while Lammah was retained. A new Abhathli should be designed, not switched back on accidentally. [S05]

**[RESEARCH FINDING]** Popular open-source projects are often poor product foundations for JID because license, architecture, security, source rights, or product shape conflict. OpenCATS has service-use licensing concerns; Frappe/Horilla/Twenty create broad HR/CRM and copyleft/duplicate-plane risk; AIHawk promotes auto-apply/evasion; Crawl4AI carried a material 2026 advisory surface. [S14]

**[RESEARCH FINDING]** The strongest reusable choices are narrow, permissive or standards-based primitives: Postgres-native retrieval/queues, JSON Resume compatibility, SurveyJS’s MIT form renderer, ESCO/O*NET reference concepts, OpenTelemetry, and Schema.org `JobPosting`. Even these require exact-package, data-license, security, and localization review. [S14–S21]

## 4. Saudi Current State

Saudi deployment requirements are architectural, not cosmetic:

- Arabic-first product behavior with English parity and correct RTL/LTR composition;
- Saudi cities, regions, program types, employment contexts, and occupation/skill terms;
- PDPL-aligned purpose, disclosure, rights, retention, impact assessment, and cross-border controls; [S09]
- complementarity with Jadarat and formal public integrations rather than assumed access; [S06]
- enterprise procurement expectations for security, data location, incident response, audit, continuity, and support;
- variable employer maturity and existing ATS/HRIS systems;
- university cohort, consent, coverage, and representativeness needs.

**[EVIDENCE GAP]** No measured production load, data-volume forecast, latency/SLO target, RPO/RTO, hosting residency decision, vendor architecture, or cost envelope was provided. Scaling technology beyond Postgres cannot be justified yet.

## 5. Global Benchmark

- **LinkedIn** shows the scale possible from identity, graph, content, recruiting, and recommendation; it also shows the complexity and incentives JID should not copy blindly. [S11]
- **Handshake** shows a three-sided institutional network; JID should learn the actor topology and distribution, not its exact data model. [S10]
- **MadsLorentzen/ai-job-search** shows a portable workflow of setup, search, dedupe, preparation, review, interview, and outcomes. Its 0–100 fit scoring conflicts with JID’s evidence standard, and its security policy says instruction defenses are not a sandbox. [S13]
- **Temporal, Hatchet, Trigger.dev** show durable workflow patterns, but their operational surface is premature before queue/state-machine limits are measured. [S14]
- **Reactive Resume and JSON Resume** show portable resume schema/rendering, but JID’s Career Record must hold provenance, visibility, verification, and time beyond resume presentation. [S14]
- **Fairlearn/AIF360** help evaluate allocation harms offline; they do not certify a hiring model or local legal/linguistic validity. [S14]

## 6. Jobs to Be Done

### Technology jobs for the Individual

- safely create, import, correct, version, and project career evidence;
- discover native and authorized external opportunities with source/freshness cues;
- save, track, prepare, apply with explicit authority, and understand status;
- receive explainable assistance without fabricated fit;
- control audiences, revoke access, and exercise data rights.

### Technology jobs for the Business

- verify organization authority;
- create/import opportunities and maintain one workflow state;
- receive purpose-limited candidate evidence;
- coordinate review, interview, assessment, communication, offer, rejection, and closure;
- integrate with existing systems without losing audit or duplicating truth.

### Technology jobs for the University

- define cohorts and instruments;
- collect consented outcomes;
- compute only qualified aggregates with coverage and methodology;
- act on program/employer signals without broad individual disclosure.

### Platform jobs

- provide stable contracts, policy enforcement, observability, queueing, search, evidence lineage, deletion propagation, feature flags, and reversible migrations.

## 7. Pain Points

The current risk is domain fragmentation: profile versus CV, native versus external opportunities, saving versus applying, employer workflow versus messaging, survey responses versus outcomes, and new AI features versus deterministic policy. A screen-by-screen rewrite would move the fragmentation into a new UI.

External content creates a hostile-input boundary. Job postings, CVs, PDFs, webhooks, partner payloads, messages, and model output can contain malformed data, malware, prompt injection, stored XSS, spoofed URLs, stale facts, or hidden instructions. The reviewed PDF.js advisory and Crawl4AI advisories show that parsers/crawlers are active attack surfaces. [S14]

The engineering organization also faces evidence debt: a shipped route or migration is easy to count, while repeat user value, source correctness, closure, and trust incidents require deliberately designed events and operations.

## 8. Unmet Needs

1. A canonical Career Record domain independent of any one CV/profile view.
2. An Opportunity Graph that unifies native and governed external listings without erasing provenance.
3. Purpose/audience authorization that is enforceable server-side and portable across projections.
4. A hiring state machine with append-only transition evidence and correction.
5. A trusted automation envelope for AI and workflows.
6. A metric registry and event contracts aligned with real actor outcomes.
7. A safe incremental migration plan that keeps identity, URLs, and data continuity.
8. A component/adaptor inventory with license, version, security, owner, exit, and kill-switch evidence.
9. A bilingual relevance, duplicate-resolution, taxonomy, and accessibility test corpus.

## 9. Market Structure

JID is technically a multi-tenant, multi-sided workflow and data system. Its architecture must separate:

- public directory/reference data;
- owned actor accounts and organization authority;
- private canonical records;
- purpose-specific disclosures;
- employer workflow records;
- institution/cohort data;
- public/native opportunities and licensed external evidence;
- aggregate analytics;
- operational logs that must not become a shadow personal-data lake.

**[OPINION]** The core system of record is not one table or graph database. It is the coherent set of JID-owned domain contracts plus Postgres-enforced relationships and policies. “Graph” describes the data relationships; it does not justify a new database.

## 10. Competitors and Substitutes

- Generic ATS/HRIS/CRM products and open-source foundations: OpenCATS, Frappe HRMS, Horilla, Twenty. They are useful domain references but poor foundations due scope, licensing, security, and duplicate identity/data planes. [S14]
- Job crawlers/agents: JobSpy, Scrapy/Crawlee, Crawl4AI, AIHawk. Only bounded patterns are reusable; source permission, security, and anti-evasion rules dominate. [S14]
- Search engines: Meilisearch, OpenSearch, Qdrant, Typesense, Vespa. Powerful but premature before Postgres fails a measured requirement. [S14]
- Resume apps/parsers: Reactive Resume, OpenResume, Resume Matcher. Useful presentation/parsing patterns, not canonical truth. [S14]
- Workflow engines: Temporal, Hatchet, Trigger.dev, Inngest. Defer until named durability requirements exceed Postgres queue/state-machine capability. [S14]
- Build-from-scratch: maximum theoretical freedom, maximum migration and revalidation cost.

## 11. Opportunities

- Reuse the existing RLS/audit/identity learning as a durable trust moat.
- Turn Lammah’s evidence/review model into the source adapter standard for the Opportunity Graph.
- Make Career Record projections power CV, profile, applications, mentor context, and university/employer disclosures without duplicate facts.
- Use Postgres-native search and queues to keep the first architecture understandable.
- Create bilingual structured reason codes rather than unsupported fit percentages.
- Make workflow closure and outcome events the common substrate for employer and university value.
- Use feature flags, expand/contract migrations, backfills, shadow reads, and compatibility tests to validate the new product without a big-bang cutover.
- Build a Purposeful Professional Layer as finite, evidence-linked objects if validated; do not import a generic social platform merely because the founder reopened social options.

## 12. Risks

- **Migration risk:** changing canonical records or identity relationships without safe dual compatibility.
- **RLS risk:** new projections, analytics, search indexes, or workers bypass tenant/purpose rules.
- **Integration risk:** vendor becomes a second source of truth or receives excessive data.
- **Hostile-input risk:** SSRF, prompt injection, malicious PDF, XSS, credential exfiltration, queue poisoning.
- **AI risk:** fabricated facts, covert scoring, automation bias, model drift, external action without authority.
- **License risk:** GPL/AGPL/SSPL/service restrictions or mixed CE/EE files enter production unnoticed.
- **Operational risk:** queues, schedules, webhooks, deletions, and source expiry fail silently.
- **Complexity risk:** microservices, vector stores, durable workflow engines, and event buses added before the team can operate them.
- **Product risk:** architecture optimized for the full vision before the first loop is validated.

## 13. What JID Should Do

**[RECOMMENDATION]** Approve a hybrid rebuild with a protected-foundation list and an explicit replacement map.

### Preserve initially

- Supabase/PostgreSQL, RLS and audit approach;
- authentication and actor/organization authority where current review supports it;
- Directory/Profile conceptual separation as current-state learning, subject to new product validation;
- Catalog/Lammah evidence, review, kill-switch and publication controls;
- i18n, Arabic/English route and test infrastructure;
- CI/release evidence practices.

### Rebuild progressively

- Career Record authoring and projection model;
- actor homes/navigation;
- Opportunity Graph and Radar experience;
- employer workflow and application state;
- outcome/cohort methodology;
- automation envelope and analytics events;
- purposeful professional knowledge/interaction after product validation.

**[RECOMMENDATION]** Write architecture decision records for every strategic boundary, not every code detail. Each ADR should identify user job, authority, source of truth, data classification, alternatives, reversibility, observability, and kill condition.

## 14. What JID Should Not Do

- Start a clean-slate repository as the default solution.
- Preserve every existing table, route, or actor surface because it exists.
- Introduce a graph database, vector database, workflow engine, or crawler without a measured requirement.
- Restore removed Abhathli tables/triggers without a new domain and authority design.
- Fork a generic ATS, HRIS, CRM, community, or resume application into JID.
- Let client-side hiding stand in for authorization.
- Turn embedding similarity into a match percentage.
- Run untrusted candidate code or document parsing in the main application boundary.
- Use anti-bot evasion or assume OSS code license grants source data rights.
- Allow AI to send applications, messages, rejections, offers, or disclosures by default.

## 15. Product and Service Implications

The technical product map should expose five coherent experiences over shared contracts:

1. **Career Record:** evidence, projects, skills, credentials, preferences, visibility, CV/profile projections.
2. **Opportunity Graph + Radar:** native and authorized external inventory, dedupe, provenance, relevance reasons, saved/action/status journey.
3. **Employer Hiring Workspace:** opportunities, candidate projections, stages, structured review, interview/assessment, communication, closure.
4. **Guidance and Purposeful Professional Layer:** mentor capability, knowledge, structured achievements and bounded conversations linked to actors and evidence.
5. **Outcomes Exchange:** cohort collection, coverage, aggregate analytics, corrections, program actions.

Services are necessary around source onboarding, employer pilots, university methodology, assessment integration, and security/data review. Service work must use the same contracts; otherwise it becomes an unscalable parallel system.

## 16. Data Implications

Technology must implement the CDO-defined model, but the CTO is accountable for enforceability:

- facts have subject, type, value, source, evidence, time, verification state, owner, visibility, purpose and correction history;
- projections are generated from versioned canonical facts and disclosure policy;
- opportunities retain raw evidence, normalized values, source terms/version, fetch time, expiry, duplicate lineage and application authority;
- workflow states change through validated commands and append-only events;
- outcomes distinguish missing, unknown, declined, unreachable and known values;
- metrics reference a registry with denominator, population, window, coverage and version;
- derived vectors/indexes are disposable projections with deletion/correction propagation.

No analytics vendor, search engine, notification platform, assessment system, or partner receives broad canonical access.

## 17. Technology Implications

### Recommended near-term stack

- Continue Next.js/strict TypeScript and Supabase/PostgreSQL while validating the new domains.
- PostgreSQL FTS and trigrams first; evaluate `pgvector` for semantic candidate retrieval after bilingual offline tests. [S18]
- Evaluate PGMQ/Supabase Queues for durable background work; choose one queue abstraction. [S19]
- Evaluate SurveyJS Form Library for bounded forms; keep scoring and authority server-side. [S20]
- Use JSON Resume as compatibility influence and Reactive Resume rendering/parseability patterns, not a second application. [S14]
- Version ESCO/O*NET reference concepts and JID Saudi extensions. [S16–S17]
- Instrument services using OpenTelemetry with data minimization. [S14]

### Defer

- external vector/search clusters;
- Temporal/Hatchet/Trigger.dev;
- self-hosted Jitsi/OpenVidu unless economics/data sovereignty justify operations;
- self-operated code execution unless a dedicated sandbox owner exists;
- generalized crawler/browser automation;
- model fine-tuning before retrieval/prompt/process baselines.

### Delivery method

Use domain seams, contract tests, feature flags, migration rehearsal, synthetic partner fixtures, shadow comparisons, backfill reconciliation, rollback, and staged non-production pilots. Do not run production SQL or deploy without later explicit approval.

## 18. Privacy and Legal Implications

PDPL obligations must become technical controls, not only policies: field minimization, purpose/audience grants, rights request workflows, retention/deletion jobs, disclosure receipts, export/correction, vendor/subprocessor registry, cross-border configuration, breach evidence, and impact-assessment triggers. [S09]

High-impact automated employment processing requires deterministic eligibility rules, traceable reasons, human review, correction/appeal paths, model/data/version evidence, drift monitoring, and legal approval. NIST AI RMF provides a lifecycle governance reference but not Saudi legal advice. [S12]

Security boundaries include:

- server-side RLS/purpose authorization;
- untrusted-content isolation;
- SSRF/DNS/public-IP defenses for source access;
- patched, sandboxed document parsing;
- no secrets in clients or workflow definitions;
- signed/idempotent webhooks;
- least-privilege workers and BI roles;
- tenant-isolation tests;
- deletion propagation to caches, indexes, vendors, and backups under policy.

## 19. Business Model

Technology choices should protect gross margin and strategic control:

- build only the contracts and workflows that differentiate JID;
- use managed partners for assessment, proctoring, video, messaging, and code execution until scale or sovereignty justifies ownership;
- keep external services replaceable and measure per-workflow cost;
- avoid infrastructure whose fixed operating burden precedes revenue;
- expose enterprise integration/security features only after the employer workflow proves payment;
- charge for workflow, services, assessment/integration usage, and institutional methodology—not hidden ranking or personal-data access.

The CTO must provide cost attribution by capability and partner, but no current unit economics are claimed.

## 20. Partnerships

Technology diligence is required before commercial signature:

- exact product/package and license scope;
- architecture, data flow, hosting/residency, subprocessors and model providers;
- authentication, least privilege, encryption, logging and incident record;
- availability, backup, recovery and support;
- export/deletion/termination and vendor failure behavior;
- accessibility, Arabic/RTL, localization and versioning;
- assessment validation or source-rights evidence where applicable;
- API rate limits, idempotency, webhooks, sandbox and test data;
- security advisories, SBOM, patch SLA and kill switch.

Preferred first integrations: authorized opportunity feed, enterprise calendar/video or managed meeting, delivery providers, selected assessment vendor. Avoid deep ATS integration until the JID application/workflow contract stabilizes.

## 21. Validation Plan

### Architecture validation

- Trace each first-wedge journey through source of truth, authorization, state changes, events, and failure recovery.
- Prototype Career Record → CV/profile/application round-trip without fact divergence.
- Compare FTS/trigram against pgvector-assisted retrieval on a bilingual gold set using recall, constraint violations and reviewer usefulness.
- Evaluate deterministic versus probabilistic dedupe with false-merge and unmerge tests.
- Test queue visibility, retries, idempotency, dead letters and deletion propagation.

### Security/privacy validation

- RLS/tenant/purpose negative tests;
- hostile job text and prompt-injection tests;
- SSRF/redirect/content-type/size/time limits;
- malicious PDF/parser isolation;
- webhook replay/signature tests;
- vendor minimization and revocation;
- audit completeness and data-rights rehearsal.

### Operational validation

Measure error budget, source freshness, queue lag, publication/review time, broken apply URLs, notification delivery, workflow closure, and incident recovery. No performance or reliability claim precedes evidence.

## 22. First 90 Days

### Days 0–30: contract and baseline

- Freeze no product; instead map current domains to the target seven contracts.
- Produce architecture/data/security decision records and a dependency/license register.
- Define the first thin-slice sequence and event/metric contracts.
- Build bilingual test corpora for search, dedupe, occupation/skill terms, CV output, and accessibility.
- Verify target Supabase support/version for pgvector and PGMQ; complete threat models for source, parser, queue, AI, partner, and analytics boundaries.

### Days 31–60: non-production thin slice

- Implement later, under a separately approved task, new Career Record projection, Opportunity/Radar, and employer closure paths behind flags.
- Preserve Lammah evidence controls and connect only one authorized source.
- Evaluate SurveyJS forms and Postgres-native search/queue in isolated branches/environments.
- Add observable automation proposals with no external action.

### Days 61–90: bounded pilot and decision

- Run a closed, consented non-production/approved pilot with selected actors.
- Rehearse migration, rollback, rights requests, partner failure and incident response.
- Review architecture complexity, defects, trust events, workflow utility and cost.
- Choose continue/iterate/stop per component; do not call the architecture production-ready.

## 23. Twelve-Month Direction

- Stabilize Career Record, Opportunity Graph/Radar, and employer workflow contracts.
- Expand authorized source adapters with source-health governance.
- Add selected assessments and scheduling/messaging through replaceable adapters.
- Establish data-quality, security, privacy, accessibility and SRE operating reviews.
- Pilot university cohort/outcome contracts after methodology readiness.
- Migrate old surfaces through expand/contract; remove redundant truth stores only after reconciliation.
- Decide on external search/workflow infrastructure using measured volume and complexity.
- Publish internal platform standards, threat models, component register, and incident learnings.

## 24. Three-Year Direction

By year three, a successful JID technology platform should support a Saudi Career Evidence and Opportunity network with stable domain contracts, high-quality authorized source coverage, enterprise integrations, defensible university outcomes, resilient operations, and a governed professional knowledge layer.

Globalization should use adapters for jurisdiction, taxonomy, language, source, program, and law. The core remains portable: evidence, purpose-bound disclosure, opportunity provenance, workflow closure, outcome methodology, and bounded automation. Infrastructure splits into services only when team ownership, scale, reliability, or security isolation makes the boundary real.

## 25. Saudi Leadership Path

Technology leadership means being best at Saudi career infrastructure requirements:

- Arabic-first semantics and UX, not translated leftovers;
- public/private, graduate, internship, training, and program opportunity types;
- provenance and freshness for Saudi sources;
- PDPL-enforced purpose, rights and vendor controls;
- enterprise-grade security and operations;
- complementary interoperability with national and institutional systems;
- evidence-based assessments and outcome methodology.

It does not mean claiming national coverage or authority without agreements and data.

## 26. Global Leadership Path

JID’s globally distinctive architecture could be an alternative to profile/feed-centric professional networks: canonical user-controlled evidence, finite purposeful interaction, source-traceable opportunity intelligence, explicit workflow states, honest outcome coverage, and explainable assistants.

The technical moat would come from accumulated high-quality schemas, mappings, source reliability, workflow outcome evidence, privacy controls, and operational trust—not proprietary infrastructure for its own sake. Open standards and replaceable components improve global portability.

## 27. Disagreements and Dissent

- **CEO:** I support the thesis but reject any roadmap that calls the platform unified before canonical contracts and migration tests exist. A coherent narrative does not reconcile data.
- **Chair:** Alternative-thesis testing is necessary, but architecture decisions for the first thin slice cannot wait for full strategic certainty; choose reversible defaults.
- **Business & Partnerships:** A partner pilot should not drive direct database/API shortcuts. I will provide thin adapters quickly, but no second identity, data, or workflow truth plane.
- **CPO:** UX freedom is not a reason for clean slate. New journeys can be built over preserved trust foundations; migration evidence decides replacement.
- **CDO:** Perfect ontology and metric governance cannot precede all product learning, but any temporary field/event must have an owner, definition, and retirement path.
- **COO:** Manual pilot operations are acceptable as a learning tool, not as hidden production architecture. Every manual step needs queue, owner, SLA and error record.
- **CFO:** Lowest short-term cloud cost is not the same as lowest risk. Conversely, premature microservices and managed platforms are unjustified fixed costs.
- **UX/CX:** The founder reopened professional/social mechanics; I do not oppose them constitutionally. I oppose importing Discourse/Forem or building an infinite feed before the purpose and moderation model are validated.

## 28. Founder Decisions Required

1. Approve hybrid rebuild as the provisional architecture direction.
2. Approve the protected-foundation and progressive-replacement lists.
3. Approve the seven JID-owned domain contracts as the design center.
4. Approve Abhathli as a newly designed capability with no mass auto-apply.
5. Approve “Postgres-native first” for search and queues until measured limits.
6. Approve build/partner boundaries for assessment, proctoring, code execution, video, messaging, and source feeds.
7. Approve a no-copyleft/no-source-restricted production import default without written legal exception.
8. Approve AI external-action and employment-decision authority boundaries.
9. Approve a later implementation program using feature flags, expand/contract migration, and no production changes without explicit authorization.

## 29. Research Appendix

### Build-versus-rebuild assessment

| Criterion | Evolve current | Hybrid rebuild | Clean slate |
|---|---|---|---|
| Time to first validated loop | medium | **best** | weak |
| Reuse of identity/RLS/Lammah learning | strong | **strong** | weak |
| UX/domain freedom | weak-medium | **strong** | strongest |
| Migration risk | medium | **controlled** | high |
| Duplicate-system period | low | medium, managed | high |
| Reversibility | medium | **high with flags/contracts** | low after cutover |
| Long-term maintainability | uncertain | **best if old paths retire** | uncertain until rebuilt |
| Testing burden | medium | high but focused | very high |

**[RECOMMENDATION]** Hybrid rebuild wins provisionally. Change this decision if current schema/identity mapping proves more expensive or unsafe than estimated, or if a thin slice cannot be isolated cleanly.

### Component decision rules

- `pgvector`: evaluate after FTS baseline; retrieval only, patched exact version. [S18]
- PGMQ/Supabase Queues: evaluate first for background work; one queue abstraction. [S19]
- SurveyJS: bounded form renderer; server authority and package-scope review. [S20]
- ESCO/O*NET: attributed reference taxonomies; version and Saudi mapping. [S16–S17]
- JSON Resume/Reactive Resume: interchange/rendering patterns; canonical Career Record remains JID-owned. [S14]
- Temporal/Hatchet/Trigger.dev: defer until multi-day cross-service requirements are explicit.
- Crawl4AI/AIHawk/JobSpy direct production use: reject/hold for security, evasion, rights, and product reasons.

### Architecture change conditions

Move to an external search engine only when measured index size, query complexity, latency, recall, tenant filtering, or operational requirements exceed Postgres. Move to durable workflow infrastructure only when queues plus a state machine cannot meet timers, signals, replay, compensation, and ownership requirements. Split services only when isolation or ownership improves reliability/security more than it adds coordination cost.

## 30. Source Ledger

All web sources accessed **2026-08-25**. Internal/repository sources read **2026-08-25**.

| ID | Source | Claim mapping |
|---|---|---|
| S01 | `FOUNDER_DECISIONS_AND_REFOUNDING_BRIEF.md` | New strategic authority, rebuild freedom, actor/product ambition, preserved trust principles. |
| S02 | `MASTER_CODEX_COMMAND.md` | Research standard, build/evolve/rebuild comparison, specialist mandate, no implementation authority. |
| S03 | JID remote `e876060706abd6c8fbb12d6a5f05df679d49632e`, release/defect reports | Current non-production foundations and limits. |
| S04 | Same remote, `JID_LAMMAH_PHASE1_FINAL_SHIPPING_REPORT.md` | Existing source/evidence/review/security/kill-switch control plane. |
| S05 | Same remote, `20260805120000_remove_deferred_search_product_artifacts.sql` | Old Abhathli/Search-for-Me artifacts deliberately removed. |
| S06 | [HRDF — Jadarat](https://www.hrdf.org.sa/en/products-and-services/programs/establishments/other/jadarat/) | National employment-platform role and integration context. |
| S07 | [HCDP delivery plan](https://www.vision2030.gov.sa/media/pgid4z3t/2021-2025-human-capability-development-program-delivery-plan-en.pdf) | Saudi human-capability, skills, career and data priorities. |
| S08 | [GASTAT labor-market releases](https://www.stats.gov.sa/en/statistics-tabs/-/categories/417515?category=124074&tab=436312) | Official Saudi labor-data source requirement. |
| S09 | [SDAIA/DGP — PDPL](https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL) | Purpose, rights, security, retention, DPIA and transfer obligations. |
| S10 | [Handshake — About](https://joinhandshake.com/about/) and [Career Centers](https://joinhandshake.com/career-centers/) | Three-sided early-career/institutional network benchmark. |
| S11 | [LinkedIn feed ranking](https://www.linkedin.com/help/linkedin/answer/a9554004) and [feed overview](https://www.linkedin.com/help/linkedin/answer/a523360/linkedin-feed-overview?lang=en) | Global professional-network architecture and recommendation incentives. |
| S12 | [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) | Lifecycle AI governance reference. |
| S13 | [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search), [security](https://github.com/MadsLorentzen/ai-job-search/blob/main/SECURITY.md), [license](https://github.com/MadsLorentzen/ai-job-search/blob/main/LICENSE) | Workflow patterns, MIT license, PII/untrusted-content and no-sandbox warnings. |
| S14 | `.strategy-work/github_osint.md`, primary links therein | Full OSS candidate evaluation, licenses, activity, security, architecture and dispositions. |
| S15 | [Schema.org JobPosting](https://schema.org/JobPosting) | Opportunity interchange vocabulary. |
| S16 | [ESCO use/reuse](https://esco.ec.europa.eu/en/use-esco) | Multilingual/Arabic reference concepts, reuse/attribution and versioning. |
| S17 | [O*NET 30.3](https://www.onetcenter.org/database.html) | CC BY 4.0 occupation/skill reference data. |
| S18 | [pgvector](https://github.com/pgvector/pgvector) | Postgres vector retrieval; version/security pinning. |
| S19 | [PGMQ](https://github.com/pgmq/pgmq) | Postgres-native queues and Supabase fit. |
| S20 | [SurveyJS Form Library](https://github.com/surveyjs/survey-library) | MIT JSON forms, RTL/localization, application-owned storage. |
| S21 | [PDF.js advisory GHSA-hq66-cqwq-w95j](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j) | Malicious-document parser risk. |
