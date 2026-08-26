# JID GitHub and Open-Source Intelligence

**Run date:** 2026-08-25
**Mode:** Read-only current-remote inspection and public primary-source review; no clone, install, code, production, database, or deployment mutation
**Repository baseline:** `origin/agent/nonprod-signup-fix` at `e876060706abd6c8fbb12d6a5f05df679d49632e`

## Executive decision

No reviewed open-source HR product is an acceptable foundation for the re-founded JID. Open source should accelerate standards, algorithms, rendering, forms, search, queues, and observability behind JID-owned contracts. Build JID's differentiating trust domains natively; partner for authorized inventory and scientifically/operationally specialized capabilities.

## Current repository intelligence

The current remote static inventory observed:

- 174 pages;
- 61 API routes;
- 28 action files;
- 136 migrations;
- 19 Edge Functions;
- 53 unit-test files;
- 11 RLS-test files;
- 3 E2E-test files;
- 2,248 files under `jid-platform/`.

Counts demonstrate breadth, not quality or production readiness. Command-center evidence nevertheless supports preserving identity/RLS/audit, Directory/Profile separation, Arabic/English infrastructure, Catalog, Lammah, CI/tests, and selected hardening.

### Lammah boundary

Current repository evidence shows a bounded opportunity ingestion/review control plane: allowlisted source adapter, source evidence, normalization, candidate/review/publish states, native-posting precedence, apply-URL quarantine, freshness/expiry, dead letters, kill switches, and staff governance. The crawler boundary includes SSRF/public-IP controls, redirects/size/type caps, backoff, checksums, hostile-content/prompt-injection markers, and no application/Profile/ownership side effects.

**Decision:** Preserve and extend this control plane through source-specific adapters. Do not replace it with a general crawler.

### Abhathli boundary

Migration `20260805120000_remove_deferred_search_product_artifacts.sql` removed the old Search-for-Me/Abhathli artifacts while retaining Lammah.

**Decision:** Abhathli is a newly authorized product consuming published JID opportunity inventory and permitted Career Record projections. It must not restore deleted schema silently, crawl without permission, or auto-submit.

## Capability decisions

| Capability | Posture | Shortlist/reference | Boundary/gate |
|---|---|---|---|
| Lammah aggregation | Build on current | Existing adapters; Schema.org `JobPosting` | Authorized sources only; immutable evidence/review |
| Dedup/entity resolution | Adapt algorithms | Splink, dedupe | Deterministic first; suggestion/review/unmerge; bilingual gold set |
| Abhathli | Build unique | `ai-job-search` workflow patterns | No auto-apply, hidden crawl or numeric fit score |
| Sourcing | Partner + controls | Official feeds/APIs, employer native publishing | Signed source terms and provenance SLA |
| ATS/hiring workflow | Build unique | JID state machine/event ledger | Do not import generic CRM/HRIS identity plane |
| Forms/scorecards | Integrate bounded | SurveyJS Form Library | Exact MIT package, server policy, Arabic/a11y proof |
| Coding assessment | Partner or isolated pilot | Piston reference | Dedicated sandbox; never main app boundary |
| CV/record | Build unique; adapt rendering | JSON Resume, Reactive Resume patterns | Canonical record remains JID; parsing is suggestion |
| Booking/video | Buy/partner | Enterprise calendar APIs, Jitsi/JaaS option | Consent, meeting auth, recording/retention; no inference |
| University outcomes | Build unique | SurveyJS; ODK only for separate research | Native outcome events/consent/methodology |
| BI/observability | Integrate internally | OpenTelemetry; Superset staff-only | Least-privilege aggregate views; no sensitive replay |
| Knowledge/community | Build curated | Learn moderation patterns | No Discourse/Forem foundation or engagement feed |
| Search | Integrate incrementally | Postgres FTS/trigram, then pgvector | Bilingual benchmark; no fit percentage |
| Queue/workflow | One abstraction | Supabase Queues/PGMQ first | Availability, privileges, RLS, DLQ, idempotency |
| Notifications | Buy/partner | Existing providers; Novu subset review | JID owns policy/preference/audit |
| Fairness evaluation | Offline assistive | Fairlearn, AIF360 reference | Not proof of fairness or runtime decision engine |

## Mandatory reference: `MadsLorentzen/ai-job-search`

Primary sources: [repository](https://github.com/MadsLorentzen/ai-job-search), [README](https://github.com/MadsLorentzen/ai-job-search/blob/main/README.md), [security](https://github.com/MadsLorentzen/ai-job-search/security), [license](https://github.com/MadsLorentzen/ai-job-search/blob/main/LICENSE), [changelog](https://github.com/MadsLorentzen/ai-job-search/blob/master/CHANGELOG.md), and [community forks](https://github.com/MadsLorentzen/ai-job-search/discussions/78).

At review it was an active MIT local-first workflow covering profile setup, multi-portal collection, normalization/deduplication, ranking, truthful CV/cover-letter preparation with human review, PDF/ATS checks, interview preparation, outcome tracking, and optional integrations. Its source guidance prefers APIs, checks terms/robots/auth walls, uses backoff, and does not auto-send applications. Its security guidance explicitly recognizes the risk of untrusted job text beside PII and says instruction defenses are not a sandbox.

**Reuse:** workflow separation, source-adapter contracts, immutable evidence, truthful drafting, review-before-send, outcome feedback, threat candor.
**Reject:** weighted `0–100` fit scores, local personal files as a SaaS data model, and wholesale fork as a regulated multi-actor foundation.

## Opportunity collection and source compliance

- [JobSpy](https://github.com/speedyapply/JobSpy), MIT: useful normalization reference; reject production use because broad third-party scraping/proxy guidance does not establish source rights.
- [AIHawk](https://github.com/feder-cr/Jobs_Applier_AI_Agent_AIHawk), AGPL-3.0: reject autonomous high-volume application, fingerprint/stealth/CAPTCHA evasion, source risk, and copyleft fit.
- [Crawl4AI](https://github.com/unclecode/crawl4ai), [security](https://github.com/unclecode/crawl4ai/security): hold outside production trust boundary; 2026 advisories observed across SSRF, RCE/deserialization/AST, arbitrary write/path traversal, auth bypass, credential exfiltration and bypass classes. Reassess only fixed/pinned in isolated service with proven need.
- [Scrapy](https://github.com/scrapy/scrapy), BSD-3-Clause, and [Crawlee Python](https://github.com/apify/crawlee-python), Apache-2.0: learn; adapt only for a contracted source in an isolated service with stealth/evasion disabled.
- [Schema.org JobPosting](https://schema.org/JobPosting) and [Google job structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/job-posting): use as interchange/freshness reference, not the whole canonical evidence model.

An OSS license never grants the right to collect a target site's data.

## Entity resolution

[dedupe](https://github.com/dedupeio/dedupe) and [Splink](https://github.com/moj-analytical-services/splink) offer permissive learned/probabilistic matching patterns. Use source ID/canonical URL and normalized fingerprints first; probabilistic pairs are reviewed. Store feature/version/evidence, retain originals, allow unmerge, and set false-merge budgets. Entity resolution never creates Profile ownership.

## ATS/HR/CRM foundations rejected

- [OpenCATS](https://github.com/opencats/OpenCATS): legacy PHP/MySQL and mixed/service-provider-sensitive licensing.
- [Frappe HRMS](https://github.com/frappe/hrms): broad GPL HR/payroll monolith; additional architecture/security surface.
- [Horilla](https://github.com/horilla-opensource/horilla): LGPL/Django HRMS boundary and duplicated identity/domain.
- [Twenty](https://github.com/twentyhq/twenty): AGPL CRM, not JID's actor/hiring model; imports a second permission plane.

Learn conventional domain states, but JID owns requisition, application, stage, interview, assessment, offer, outcome, and append-only reason/override/correction events.

## Assessment, interview, and document tools

- [SurveyJS Form Library](https://github.com/surveyjs/survey-library): shortlist exact MIT library for questionnaires/scorecards/surveys; do not assume paid Creator/Dashboard/PDF share that license.
- Moodle/H5P/TAO: learn QTI, attempt, rubric, accommodation and result semantics; do not embed GPL product foundations.
- [Piston](https://github.com/engineer-man/piston): only code-execution pilot candidate, self-hosted/contracted and isolated after threat review; public API terms are not a commercial production plan.
- Jitsi/OpenVidu: credible meeting infrastructure, not interview validity systems.
- JSON Resume: interchange influence only; JID evidence/visibility/provenance exceeds a résumé schema.
- [Reactive Resume](https://github.com/amruthpillai/reactive-resume): learn rendering, export, ATS-text and accessibility patterns; never create a second résumé truth store.
- PDF/document parsing: pin patched parsers, isolate, limit size/page/time, disable network/macros, scan, sanitize, and require confirmation. A 2026 PDF.js advisory reinforces the boundary: [GHSA-hq66-cqwq-w95j](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j).

## Taxonomies and credentials

- [ESCO](https://esco.ec.europa.eu/en/use-esco): versioned multilingual concepts including Arabic; preserve attribution, adaptation and exact license conditions.
- [O*NET](https://www.onetcenter.org/database.html): CC BY 4.0 reference for occupations/tasks/skills; not Saudi demand truth.
- JSON Resume and Europass digital credentials: interoperability references.

Create JID mappings/namespaces for Saudi-specific terms instead of overwriting upstream concepts. Arabic availability is not proof of Saudi terminology quality.

## Search, queues, analytics, and workflow

- [pgvector](https://github.com/pgvector/pgvector): first semantic candidate because JID uses Postgres; pin a patched version, benchmark Arabic/English relevance, and treat vectors as retrieval—not truth or fit.
- External engines (Meilisearch, OpenSearch, Qdrant, Typesense, Vespa): defer until measured Postgres limits; each adds auth/deletion/sync/operations and license considerations.
- [PGMQ](https://github.com/pgmq/pgmq): evaluate Supabase Queues/PGMQ first; confirm extension, privileges, RLS, retention, retry, idempotency, dead-letter, observability.
- Temporal/Trigger.dev/Hatchet: defer until named durable multi-day/replay/compensation needs exceed a queue plus state machine.
- [OpenTelemetry JS](https://github.com/open-telemetry/opentelemetry-js): shortlist operational traces/metrics/logs; package maturity varies.
- Superset: staff-only BI with read-only aggregate role; it is not a database firewall.
- PostHog/Metabase/Novu: require exact CE/EE/package license and data-feature review; no sensitive replay or imported social inbox.

## AI agent boundary

Agents may propose queries, summaries, drafts, reason codes, or next actions. They may not bypass RLS/entitlement, follow instructions embedded in source content, send applications/messages, mutate Career Record facts, change hiring state, or disclose data without deterministic policy and explicit human authority. Model/tool/input/output versions are auditable for employment-affecting actions.

## License and security adoption gate

Before any reuse:

1. pin repository/tag/commit and exact package;
2. verify license and NOTICE/attribution, including non-code assets and enterprise folders;
3. produce dependency/SBOM and transitive-license review;
4. review advisories and project security policy;
5. threat-model data, execution, network, tenant and update boundaries;
6. prove Arabic/English, accessibility, RLS/authorization, deletion and export;
7. benchmark operational cost and exit/replaceability;
8. legal-review source terms and data rights separately from code license;
9. authorize through an ADR/task packet.

## 90-day OSS evidence plan

- Benchmark Postgres FTS/trigram on bilingual opportunities before semantic search.
- If needed, run an offline pgvector evaluation with patched version and gold set.
- Prototype SurveyJS exact MIT library for one scorecard; test RTL/accessibility and server-side authority.
- Verify target Supabase PGMQ/Queues availability in a non-production packet.
- Define JSON Resume import/export compatibility tests without changing the canonical model.
- Build source-rights inventory and pursue direct employer/official/contracted feeds.
- Do not introduce a new service or dependency merely because it is shortlisted here.

## Final OSINT judgment

Preserve Lammah's evidence/review control plane; build Abhathli as a new gated read/recommend capability; build JID-native Career Record, hiring, privacy, and outcomes; prefer Postgres-native increments; partner for specialized science/infrastructure; and reject evasion, autonomous application, opaque decisioning, social foundations, and generic HR-suite forks.
