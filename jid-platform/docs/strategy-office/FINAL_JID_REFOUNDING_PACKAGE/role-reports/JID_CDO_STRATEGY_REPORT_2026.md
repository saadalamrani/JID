# JID CDO Strategy Report 2026

**Role:** Chief Data Officer
**Study date:** 2026-08-25
**Status:** Independent data recommendation; not adopted; no implementation, production, database, or disclosure authority
**Evidence labels:** `FACT`, `RESEARCH FINDING`, `MARKET SIGNAL`, `HYPOTHESIS`, `OPINION`, `RECOMMENDATION`, `EVIDENCE GAP`

## 1. Executive Summary

**[RECOMMENDATION]** JID should organize its data strategy around a **Career Evidence Graph, Opportunity Graph, and Outcome Ledger**, governed by purpose-bound disclosure and a metric registry. These are related domain records in the existing PostgreSQL direction, not a mandate for a graph database or a giant analytics warehouse.

The canonical Career Record must distinguish self-declared, organization-attested, platform-observed, and external-official assertions. Every material fact needs subject, source, evidence, time, verification state, owner, visibility, purpose, correction history, and confidence semantics where justified. CVs, profiles, applications, mentor views, employer candidate packets, and university disclosures are versioned projections—not parallel truths.

The Opportunity Graph must preserve source rights, raw evidence, normalization, freshness, expiry, organization resolution, duplicate lineage, and application authority. The Outcome Ledger must distinguish known outcomes from unknown, declined, unreachable, not-yet-eligible, and missing data. Institutional metrics must carry population, numerator, denominator, period, coverage, source, methodology version, suppression, and representativeness warnings.

**[FACT]** No supplied evidence proves that JID currently has representative Saudi labor data, a validated skills ontology, university outcome coverage, employer quality-of-hire labels, model fairness, or a proprietary data moat. Current repository capability and seed data cannot be converted into market or outcome claims. [S01–S05]

**[RECOMMENDATION]** Use ESCO and O*NET as attributed, versioned reference taxonomies while building JID Saudi extensions and crosswalks from evidence. Use Postgres FTS/trigram before semantic retrieval; evaluate `pgvector` only on bilingual relevance tests. Use Fairlearn/AIF360 for governed offline evaluation, never as proof of fairness. OpenTelemetry is for operations, not a shadow behavioral profile. [S15–S20]

The first 90 days should produce a data charter, canonical contracts, source/metric registries, bilingual gold sets, partner data schedules, data-quality controls, coverage methodology, and a thin instrumented pilot. No percentage, “match,” “skills gap,” university outcome, or national insight may be published without its claim contract.

## 2. CDO Mandate

The CDO must decide what data JID may truthfully call canonical, how evidence and source quality are represented, how actors control disclosure, how missingness and bias are surfaced, which metrics are decision-grade, how external taxonomies and vendors are governed, and how data compounds without becoming covert brokerage.

The CDO does not maximize data collection. The role maximizes **decision usefulness per unit of justified data and trust risk**. It cannot grant lawful basis, certify psychometric validity, or infer population representativeness from platform coverage. Qualified legal, research, security, product, and domain owners share those decisions.

## 3. What I Learned

**[FACT]** JID’s current remote evidence includes controlled Catalog/Lammah publication and opportunity provenance/freshness foundations. Lammah separates evidence, normalization, review, entitlement, source precedence, and dead letters. This is more valuable for data trust than raw crawler breadth. [S03–S04]

**[FACT]** Old Abhathli/Search-for-Me matching artifacts were removed. A new recommendation system has no inherited right to recreate numeric scores or use private data. [S05]

**[RESEARCH FINDING]** Official graduate-outcome methodologies such as HESA and NACE make eligible population, timing, known-outcome/knowledge rate, collection protocol, and coverage explicit. A dashboard without these is decoration. [S10–S11]

**[RESEARCH FINDING]** ESCO provides versioned multilingual occupation/skill concepts including Arabic, with reuse/attribution conditions; O*NET provides rich occupation/skill/task data under CC BY 4.0. Neither is Saudi labor-market truth without local validation. [S15–S16]

**[RESEARCH FINDING]** Semantic vectors, probabilistic linkage, and fairness libraries can assist retrieval/evaluation. They do not create ground truth. Similarity is not suitability; a duplicate probability is not permission to merge; group metrics are not a legal or ethical certificate. [S14, S17–S20]

**[MARKET SIGNAL]** Founder materials and prior research perceive mismatch, poor job discovery, fragmented records, and weak university/employer intelligence. These justify measurement design, not an unsupported “very high mismatch” statistic. [S01–S02]

## 4. Saudi Current State

Saudi data strategy for JID must operate within an ecosystem of GASTAT official statistics, MHRSD/HRDF/Jadarat employment programs, Vision 2030/HCDP objectives, education and accreditation bodies, employer HR systems, universities, and SDAIA’s personal-data regime. [S06–S09]

This creates four necessary separations:

1. **Official national statistics versus JID platform observations.** JID may analyze its defined population; it cannot imply national representation.
2. **Public opportunity information versus collection/redistribution rights.** Public visibility is not a data license.
3. **Institution-held graduate data versus JID permission.** A university relationship does not automatically authorize broad individual disclosure or secondary use.
4. **Arabic availability versus Saudi semantic validity.** Translated taxonomy labels need local role, sector, region, program, and colloquial synonym validation.

**[EVIDENCE GAP]** No signed government/university data agreement, public Jadarat API contract, Saudi occupation crosswalk, labeled relevance set, outcome cohort, or lawful sensitive-attribute evaluation plan was supplied.

## 5. Global Benchmark

- **LinkedIn** demonstrates the compounding value and governance risk of identity, graph, content, recruiting, and behavior data. JID should avoid making engagement behavior the dominant professional truth. [S12]
- **Handshake** demonstrates the analytical possibilities of a three-sided early-career network, but vendor claims and institution coverage must not be generalized to Saudi outcomes. [S13]
- **HESA/NACE** demonstrate denominator, eligible-population, collection-period, and coverage discipline. [S10–S11]
- **ESCO/O*NET** demonstrate stable reference identifiers, hierarchy, relationships, multilingual labels, rich attributes, and reuse conditions. [S15–S16]
- **Splink/dedupe** demonstrate auditable entity-resolution methods; human review and reversible merge remain necessary. [S14]
- **Fairlearn/AIF360** demonstrate harm-aware metrics and mitigation tools; their documentation does not validate a particular JID model, population, or decision. [S14]
- **NIST AI RMF** demonstrates lifecycle governance and evaluation rather than one-time model approval. [S09]

## 6. Jobs to Be Done

### Individual data jobs

- maintain one accurate, correctable, portable evidence record;
- know which facts are self-declared, attested, verified, inferred, or external;
- choose which projection is shared for which purpose and audience;
- understand why an opportunity appears without an invented fit percentage;
- see and correct application/outcome history;
- exercise access, correction, deletion, withdrawal, and export rights as applicable.

### Employer data jobs

- receive consistent, purpose-specific evidence;
- compare candidates using job-relevant, structured facts without hidden proxy discrimination;
- record decisions and reasons;
- close statuses and measure workflow, not surveil individuals;
- integrate necessary data with an ATS while maintaining lineage.

### University data jobs

- define an eligible cohort;
- collect or reconcile outcomes lawfully;
- know coverage and bias;
- analyze program/employer/sector destinations at safe aggregation;
- improve programs/career services without treating missing as zero.

### Platform data jobs

- govern schemas, sources, quality, metadata, metrics, retention, access, lineage, models, and data products through accountable owners.

## 7. Pain Points

Career data is repeatedly copied into CVs, profiles, forms, ATSs, spreadsheets, university surveys, and vendor systems. Copies diverge; source and time disappear; self-assertion can look like verification; missing outcomes become false negatives; taxonomies create an illusion of comparability; dashboards reward countable activity; and AI can transform similarity into unjustified certainty.

Opportunity data is especially unstable: titles, descriptions, deadlines, locations, employer identities, apply URLs, and eligibility change. Aggregation introduces duplicates, stale listings, inconsistent Arabic/English fields, redirects, source conflicts, and terms risk.

Data teams can worsen the problem by centralizing raw personal behavior in a warehouse, adopting third-party analytics/session replay broadly, or allowing product teams to invent events and KPIs without ownership or denominator rules.

## 8. Unmet Needs

1. Canonical assertion/evidence/projection semantics for Career Record.
2. Opportunity provenance, freshness, duplicate and source-rights contracts.
3. Purpose/audience disclosure grants enforceable across actors and vendors.
4. Saudi Arabic/English occupation/skill concepts with mapping evidence and versioning.
5. A metric registry that blocks fake percentages and denominator drift.
6. Coverage/readiness gates for universities and public insight.
7. Outcome closure that separates workflow status from labor-market fact.
8. Data-quality incident, correction, unmerge, and backfill processes.
9. Model/retrieval evaluation datasets, cards, versions, and change control.
10. Privacy-preserving analytics with event minimization and retention.

## 9. Market Structure

Data rights, authority, and value differ by source:

| Data class | Typical authority | JID treatment |
|---|---|---|
| Individual assertion | Individual | canonical claim with source class; not verified by default |
| Evidence artifact | Individual/issuer | access controlled; malware/validity review; derive only needed facts |
| Organization attestation | authorized organization | signed/attributed statement with scope and revocation |
| Platform-observed workflow | JID within defined service | event with product context; not universal career truth |
| External official/reference | authority or licensed dataset | version, attribution, rights and mapping |
| Opportunity source evidence | source under terms | immutable evidence plus normalized projection and expiry |
| Assessment result | provider/instrument | version, validity scope, accommodations, visibility; no universal trait |
| University outcome | individual/institution/source | purpose, cohort, collection method, verification, coverage |
| Derived analytics/model output | JID process | reproducible version, inputs, limitations, expiry; never masquerades as fact |

**[OPINION]** JID’s data moat, if it emerges, will be the lawful linkage of evidence, opportunity, action, employer closure, and outcomes with superior semantics and trust—not volume of scraped profiles.

## 10. Competitors and Substitutes

- LinkedIn/profile networks hold broad professional and behavioral graphs. [S12]
- Job platforms and Jadarat hold opportunity/application data in their own contexts. [S06]
- ATS/HRIS vendors hold employer workflow truth.
- Universities hold enrollment, program, alumni and some outcome data.
- Official statistics and labor observatories hold population-level authority JID lacks.
- Resume parsers, AI agents, and assessment vendors derive signals with varying evidence and portability.
- ESCO/O*NET provide reference taxonomies; neither supplies JID-specific outcomes. [S15–S16]
- Spreadsheets, surveys and data warehouses substitute operationally but often lose lineage, consent, and semantics.

JID should interoperate, not claim all truth. Its canonical scope is the JID-mediated record and workflow under explicit authority.

## 11. Opportunities

- Create a user-controlled Career Evidence Graph that reduces repetitive entry and makes truth status visible.
- Establish the most source-transparent Saudi Opportunity Graph, using native records and governed Lammah evidence.
- Develop Arabic/English Saudi mapping assets as a reusable product capability.
- Make employer response and closure a differentiated data contribution.
- Offer universities readiness, collection, and coverage-honest outcomes rather than decorative dashboards.
- Produce better relevance explanations from constraints, evidence, and reason codes.
- Build sector/program insight once coverage and representativeness conditions are met.
- Enable global expansion through jurisdiction/taxonomy mappings over stable data contracts.
- Create trustworthy research collaborations with de-identified/aggregate outputs under explicit governance.

## 12. Risks

- **False authority:** JID data presented as national or verified when it is not.
- **Purpose creep:** career evidence collected for an application reused for ranking, marketing, or institutional analytics.
- **Missingness bias:** nonresponse or absence interpreted as unemployment or lack of skill.
- **Proxy discrimination:** school, location, language, gaps, names, or behavior used as unexamined proxies.
- **Model leakage:** embeddings or vendor prompts expose personal or proprietary data.
- **Entity-resolution harm:** people, organizations, or opportunities merged incorrectly.
- **Taxonomy colonialism:** global concepts overwrite Saudi terminology/context.
- **Metric gaming:** partners optimize reported counts rather than real outcomes.
- **Warehouse sprawl:** broad copies weaken RLS, deletion, and purpose control.
- **Data lock-in:** provider controls schema, history, or export.
- **Small-sample disclosure:** institution/program breakdown identifies individuals.

## 13. What JID Should Do

**[RECOMMENDATION]** Adopt the following data principles:

1. collect for a named job and purpose;
2. represent source/evidence/time and truth status;
3. keep canonical facts separate from projections and model output;
4. preserve missingness and uncertainty;
5. enforce audience/purpose server-side;
6. make corrections and revocations propagate;
7. require denominator and coverage for metrics;
8. evaluate relevance/fairness on local data before product claims;
9. treat external vendors and indexes as disposable processors/projections;
10. publish only claims that pass a claim contract.

**[RECOMMENDATION]** Establish a Data Council with CDO chair, product-domain owners, CTO/security, GRC/legal/privacy, UX, operations, and the relevant actor representative. It approves canonical definitions, high-risk derived signals, institutional metrics, sensitive attributes, and external data use—not routine field changes.

## 14. What JID Should Not Do

- Build one universal “employability,” “quality,” “fit,” or “commitment” score.
- Present embedding similarity or heuristic weights as a percentage match.
- Treat self-declared data as verified or directory data as owned.
- infer unemployment, skill absence, or program failure from missing records.
- sell personal data, raw behavior, or hidden audience segments.
- expose individual graduates by default to universities.
- import full partner datasets “for future use.”
- use session replay on authentication, Career Record, application, assessment, or hiring surfaces.
- auto-merge uncertain people/organizations/opportunities without review and undo.
- deploy a taxonomy/model because it supports Arabic labels without Saudi validation.
- claim bias mitigation merely because Fairlearn/AIF360 was run.

## 15. Product and Service Implications

### Career Record

Each user-facing item should show its status: self-declared, evidence attached, attested by named issuer, verified under defined process, or derived. Editing a CV/profile/application should either update canonical facts through an explicit flow or change presentation preferences only.

### Opportunity and Abhathli

Opportunity detail shows source, last verified time, expiry/deadline, organization identity, duplicate/source variants, and application authority. Abhathli returns constraints and reason codes such as location compatible, required skill evidence present/unknown, deadline fresh, or eligibility unknown—not a “92% fit.”

### Employer

Candidate views are purpose-specific projections. Comparison supports job-relevant evidence and structured review; sensitive/proxy attributes are minimized. Stage and decision data are auditable and correctable.

### University

The first product is cohort/readiness/collection methodology. Dashboards unlock by metric readiness and aggregation thresholds. Every display includes eligible population, known outcomes/coverage, period, source, update and limitation.

## 16. Data Implications

### Canonical contracts

**Career assertion:** `subject`, `assertion_type`, `value`, `locale`, `effective_period`, `source_class`, `source_ref`, `evidence_ref`, `verification_state`, `owner`, `visibility_policy`, `purpose_constraints`, `created_at`, `supersedes`, `correction_state`.

**Opportunity:** `source`, `source_record_id`, `rights_version`, `raw_evidence_ref`, `normalized_fields`, `organization_resolution`, `published_at`, `fetched_at`, `verified_at`, `expires_at`, `duplicate_group`, `precedence`, `apply_authority`, `review_state`.

**Workflow event:** `aggregate`, `prior_state`, `new_state`, `actor`, `authority`, `reason`, `evidence`, `occurred_at`, `recorded_at`, `idempotency_key`, `correction_of`.

**Outcome event:** `subject/cohort`, `event_type`, `event_time`, `source`, `collection_method`, `evidence/verification`, `purpose`, `audience`, `instrument_version`, `unknown_reason`, `correction/revocation`.

**Metric definition:** `name`, `decision_job`, `population`, `numerator`, `denominator`, `exclusions`, `window`, `source`, `owner`, `coverage_threshold`, `suppression`, `bias_warning`, `update`, `version`, `status`.

### Data products

- Career Record projection service;
- Opportunity normalization/source-health product;
- actor-safe workflow event product;
- outcomes and coverage mart;
- metric registry;
- taxonomy/mapping registry;
- model/retrieval evaluation registry.

## 17. Technology Implications

Use Postgres constraints, RLS, immutable/audited events where appropriate, policy functions, versioned schemas, data-quality tests, and lineage metadata. A “graph” should initially be implemented through relational entities and edges, not a new database.

**[RECOMMENDATION]** Search progression:

1. structured filters and exact identifiers;
2. PostgreSQL full text/trigrams;
3. evaluated pgvector-assisted semantic retrieval;
4. external engine only after measured need. [S17]

Embeddings must record model/version, source text version, locale, creation time, purpose, retention and deletion propagation. They are derived personal data when built from personal records and require matching controls.

Use PGMQ/Supabase Queues or one Postgres-native abstraction for quality checks, source refresh, backfills, deletion, notifications and partner synchronization after target verification. [S18]

Use SurveyJS only as a bounded renderer; instrument definitions, scoring and authority remain versioned JID data. [S19]

## 18. Privacy and Legal Implications

**[FACT]** Saudi PDPL requires data governance across collection, purpose/lawful basis, rights, security, retention, impact assessment and transfer. [S09]

The data program needs:

- a processing activity and data asset register;
- purpose/lawful-basis documentation with counsel;
- consent and withdrawal receipts where consent applies;
- data subject access/correction/deletion/export workflows;
- retention schedules by domain and evidence class;
- privacy impact triggers for new matching, assessment, recording, institutional sharing, sensitive data, and cross-border vendors;
- aggregation/suppression standards;
- processor/subprocessor and transfer controls;
- breach/incident data maps;
- research governance for secondary analysis.

Sensitive attributes for fairness analysis may be important, but collection can itself create risk. The Data Council, privacy/legal, and statistical owner must approve purpose, access isolation, minimum cell sizes, retention, and publication. Operational decision systems should not receive those attributes merely because evaluation does.

## 19. Business Model

Data monetization must be tied to legitimate actor value:

- Individuals pay, if at all, for advanced utility—not access to or visibility of their own facts.
- Employers pay for workflow, evidence requests, structured assessment/integration, communication and qualified intelligence—not private-data access or hidden ranking.
- Universities pay for readiness, collection, methodology, outcomes workflow, and sufficiently covered aggregate intelligence.
- Public institutions contract bounded services or research under formal authority.

Do not sell datasets of personal records. Aggregate/benchmark products require sufficient coverage, comparability, suppression, methodology and contract rights. Data moat and monetization are future hypotheses, not current assets.

## 20. Partnerships

Every data partnership must have a schedule covering fields, source/owner, purpose, authority, subjects, direction, frequency, quality, corrections, retention, deletion, transfers, subprocessors, aggregation, derived data, model use, audit, incident, exit and public claims.

Priority data partnerships:

1. employer-direct opportunity and workflow closure;
2. authorized national/local opportunity sources;
3. one university cohort/outcomes methodology partner;
4. assessment vendors with item/result/validity semantics;
5. official/reference taxonomy owners or lawful datasets;
6. later, research/sector bodies for qualified aggregate studies.

No partner becomes owner of JID’s canonical Career Record or gets secondary AI-training rights by default.

## 21. Validation Plan

### Gold sets

- bilingual opportunity duplicate pairs and hard negatives;
- Arabic/English occupation and skill mappings with Saudi expert review;
- opportunity relevance judgments by persona and constraints;
- Career Record → CV/profile/application round-trip cases;
- university outcome classifications and missingness scenarios;
- fairness/adverse-impact evaluation design where lawful and statistically viable.

### Data quality dimensions

Completeness, validity, consistency, timeliness, uniqueness, lineage, authority, rights status, correction latency and deletion propagation. Set thresholds by decision use, not a universal score.

### Claim contracts

Before a claim is shown, record definition, population, method, source, period, limitations, reviewer, expiry and required disclosure. Test this for source freshness, employer response, application closure, assessment use, university outcomes, and any AI/relevance statement.

### Falsification

Reject or narrow the strategy if individuals do not maintain/reuse records, sources are not authorized/fresh, employer closure is sparse, university coverage remains biased, semantic retrieval does not beat simpler baselines, or privacy cost exceeds actor value.

## 22. First 90 Days

### Days 0–30

- Publish an internal data charter and canonical-term glossary.
- Inventory current tables/events/sources against proposed contracts without production changes.
- Define source, partner, taxonomy, metric, model and data-asset registries.
- Select initial cohorts and build bilingual gold-set protocols.
- Create data schedules for proposed employer/source/university partners.
- Define event minimization, retention and claim-contract templates.

### Days 31–60

- Validate one Career Record projection round trip.
- Baseline opportunity freshness, field quality and duplicates from one authorized source.
- Compare FTS/trigram, structured constraints and pgvector-assisted retrieval offline.
- Pilot ESCO/O*NET mapping with Saudi expert adjudication.
- Configure a coverage-aware university instrument in non-production.
- Rehearse correction, revocation, unmerge and deletion propagation.

### Days 61–90

- Instrument a bounded actor pilot with approved events.
- Produce weekly quality/coverage/trust reports without unsupported percentages.
- Review employer closure and university readiness.
- Approve, revise or reject each metric and derived feature.
- Document what is still unknown; do not convert pilot data into national claims.

## 23. Twelve-Month Direction

- Stabilize Career Record, Opportunity, workflow, outcome and metric contracts.
- Establish data stewardship by domain with quality SLOs and incident review.
- Expand authorized sources while measuring provenance/freshness and dependence.
- Grow Saudi taxonomy extensions and publish mapping/version policy.
- Launch employer workflow analytics using defined, non-discriminatory measures.
- Run one coverage-qualified university outcomes program.
- Establish privacy-preserving research/aggregate release review.
- Develop model/retrieval cards, change control and periodic bias/performance evaluation.
- Remove redundant fields/events/warehouses that lack purpose.

## 24. Three-Year Direction

If evidence supports it, JID can become the trusted Saudi data infrastructure for career evidence, opportunity movement and education-to-work outcomes. The mature data layer would link versioned evidence, opportunities, actions, employer decisions and outcomes while preserving purpose and actor rights.

Global expansion should keep the contracts and governance while adapting taxonomy, language, law, source rights, programs and metrics. Cross-market comparison should occur only after mapping quality and population comparability are established.

## 25. Saudi Leadership Path

JID can lead Saudi career data practice through:

- Arabic-first occupation/skill semantics;
- traceable opportunity provenance and freshness;
- user-controlled evidence portability;
- respectful employer closure data;
- denominator/coverage-honest graduate outcomes;
- PDPL-native disclosure and rights;
- clear separation of platform observations from national statistics.

This would complement official data and programs, not impersonate them. [S06–S09]

## 26. Global Leadership Path

The global opportunity is a professional data model that values evidence and purpose over engagement exhaust. A portable Career Evidence Graph, Opportunity Graph, Outcome Ledger, and metric/claim contract could help JID differentiate from profile/feed platforms and siloed ATSs.

Open standards and attributed taxonomies improve interoperability. JID’s proprietary advantage should reside in validated mappings, workflow semantics, source reliability, outcome linkages, and governance performance—not in trapping users or partners.

## 27. Disagreements and Dissent

- **CEO:** The Career Evidence & Opportunity OS is plausible, but it should not be called a data moat until lawful longitudinal coverage, correction quality and repeated use exist.
- **Business & Partnerships:** I oppose signing data-rich pilots based on logo value. Partner contribution and data schedules precede integration. I support selling readiness/service before a dashboard.
- **CTO:** I agree with Postgres-first and hybrid rebuild, but data contracts and metric definitions are not optional “later hardening.” Thin slices need minimum semantics on day one.
- **CPO:** Product teams may need flexible experimentation, but uncontrolled event/property creation produces permanent ambiguity. Use provisional namespaces with expiry and owner.
- **COO:** Manual collection can generate evidence, but spreadsheets must not become an undocumented shadow system. Record source, operator, purpose, QA and reconciliation.
- **CMO:** No “largest,” “most accurate,” “representative,” “AI match,” “skills gap,” or outcome percentage without an approved claim contract.
- **CFO:** Monetizing aggregate insight before coverage is dangerous. Readiness/methodology service is the earlier revenue path.
- **GRC/CLO:** Legal review is necessary, but risk language alone cannot define product behavior; data controls and measurable tests must operationalize it.

## 28. Founder Decisions Required

1. Approve the Career Evidence Graph, Opportunity Graph, and Outcome Ledger as the data design center.
2. Approve canonical-fact versus projection versus derived-output separation.
3. Approve purpose/audience grants and correction/deletion propagation as platform requirements.
4. Approve a prohibition on unsupported match/employability/commitment scores.
5. Approve the metric registry and claim-contract gate for all external percentages/claims.
6. Approve ESCO/O*NET as references with JID Saudi extensions, not final truth.
7. Approve a Postgres-first search/data architecture and offline evaluation before semantic product claims.
8. Approve university outcome readiness and coverage thresholds before dashboards.
9. Approve no personal-data sale and no default partner AI-training rights.
10. Establish a cross-functional Data Council and named data stewards in the later execution phase.

## 29. Research Appendix

### Proposed metric readiness levels

- **R0 — prohibited:** undefined population/source or harmful/unjustified signal.
- **R1 — exploratory internal:** definition exists; quality/coverage inadequate for decisions.
- **R2 — operational internal:** owned, tested, sufficient for workflow monitoring; not an external claim.
- **R3 — partner-qualified:** contract/methodology/coverage supports bounded sharing with limitations.
- **R4 — public claim:** source, period, denominator, coverage, comparability, review and disclosure approved.

### University metric example template

`Metric`: known employment outcome rate
`Eligible population`: explicitly defined graduating cohort
`Numerator`: graduates with a known qualifying outcome under the instrument
`Denominator`: eligible population or knowledge-rate denominator as defined; never silently changed
`Source/method`: versioned survey/verified administrative source
`Coverage`: response/known-outcome counts and rate
`Warnings`: nonresponse, timing, self-report, cohort exclusions, small cells
`Status`: readiness-gated; no value invented

### Relevance explanation example

Allowed: “The opportunity requires Arabic and English; your Career Record contains self-declared English and an issuer-attested Arabic credential. Riyadh matches your selected locations. The posting does not state salary.”

Not allowed: “You are a 94% match” or “JID predicts you will be hired.”

### Entity-resolution rule

Use deterministic source identifiers and canonical URLs first, normalized exact fingerprints second, probabilistic candidate pairs third, and human review for uncertain or high-impact merges. Preserve original evidence and support unmerge. Never use entity resolution to establish profile ownership.

## 30. Source Ledger

All web sources accessed **2026-08-25**. Internal/repository sources read **2026-08-25**.

| ID | Source | Claim mapping |
|---|---|---|
| S01 | `FOUNDER_DECISIONS_AND_REFOUNDING_BRIEF.md` | Re-founding ambition, evidence/trust continuity, hypotheses requiring validation. |
| S02 | `MEETING_RECORD_2026-08-25.md` | Actor journeys, mismatch/job-search/data observations treated as signals. |
| S03 | JID remote `e876060…`, Catalog/release reports | Current provenance/publication capability and absent adoption proof. |
| S04 | Same remote, `JID_LAMMAH_PHASE1_FINAL_SHIPPING_REPORT.md` | Source evidence, review, normalization, freshness, entitlement and dead-letter controls. |
| S05 | Same remote, `20260805120000_remove_deferred_search_product_artifacts.sql` | Old Abhathli matching artifacts removed. |
| S06 | [HRDF — Jadarat](https://www.hrdf.org.sa/en/products-and-services/programs/establishments/other/jadarat/) | Official national platform role and authority boundary. |
| S07 | [GASTAT labor-market releases](https://www.stats.gov.sa/en/statistics-tabs/-/categories/417515?category=124074&tab=436312) | Official national data source versus JID observations. |
| S08 | [HCDP delivery plan](https://www.vision2030.gov.sa/media/pgid4z3t/2021-2025-human-capability-development-program-delivery-plan-en.pdf) | Skills, career and labor-market data priorities. |
| S09 | [SDAIA/DGP — PDPL](https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL) and [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) | Privacy/data rights and lifecycle AI governance. |
| S10 | [HESA Graduate Outcomes definitions](https://www.hesa.ac.uk/support/definitions/graduates) | Eligible population, timing and known-outcome methodology. |
| S11 | [NACE First-Destination standards](https://www.naceweb.org/job-market/graduate-outcomes/first-destination/standards-and-protocols) | Knowledge rate, denominator and collection protocol. |
| S12 | [LinkedIn feed ranking](https://www.linkedin.com/help/linkedin/answer/a9554004) and [feed overview](https://www.linkedin.com/help/linkedin/answer/a523360/linkedin-feed-overview?lang=en) | Behavioral/recommendation data benchmark. |
| S13 | [Handshake — About](https://joinhandshake.com/about/) and [Career Centers](https://joinhandshake.com/career-centers/) | Three-sided early-career/institutional data benchmark; vendor claims treated cautiously. |
| S14 | `.strategy-work/github_osint.md`, primary links therein | OSS/data/search/dedupe/fairness/analytics components, licenses, limitations and dispositions. |
| S15 | [ESCO use/reuse](https://esco.ec.europa.eu/en/use-esco) and [copyright](https://esco.ec.europa.eu/en/copyright-notice-esco-skills-competences) | Arabic multilingual concepts, stable URIs, attribution and adaptation conditions. |
| S16 | [O*NET 30.3](https://www.onetcenter.org/database.html) | CC BY 4.0 occupation/skills/tasks reference dataset. |
| S17 | [pgvector](https://github.com/pgvector/pgvector) | Semantic retrieval primitive and version/security considerations. |
| S18 | [PGMQ](https://github.com/pgmq/pgmq) | Postgres-native background queue candidate. |
| S19 | [SurveyJS Form Library](https://github.com/surveyjs/survey-library) | MIT form renderer, RTL/localization and application-owned storage. |
| S20 | [Fairlearn](https://github.com/fairlearn/fairlearn) and [AIF360](https://github.com/Trusted-AI/AIF360) | Offline fairness assessment methods; not certification. |
