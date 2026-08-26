# JID TO-BE Product Architecture

**Nature:** Strategic logical architecture. It does not authorize schema, migration, code, vendor, or deployment changes.

## System shape

```text
                         approved institutions / sources
                                       |
                  source terms + provenance + freshness
                                       v
Individual <-> Career Record <-> Opportunity Graph <-> Business Hiring Workspace
     |              |                    |                       |
 Abhathli        CV projection          Lammah                decisions
     |              |                    |                       |
     +-----------> private Radar <-------+<------ outcome events+
                    |
             Outcomes Exchange <-> University intervention/workspace
                    |
             Guidance Network (bounded, later)
```

## Five products, one evidence system

| Product | Primary actor(s) | Owns | Does not own |
|---|---|---|---|
| Career Record | Individual | Canonical career evidence, source/state, visibility grants, projections | Opportunity inventory or institutional authority |
| Opportunity Graph | All through scoped views | Normalized opportunity entities, source evidence, freshness, constraints, lifecycle | User Profile facts or application authority |
| Hiring Workspace | Business + participating Individual | Requisition, application, structured review, interview, decision and closure events | Private Career Record outside grant; automatic final decision |
| Outcomes Exchange | University + consented Individuals/Businesses | Cohorts, instruments, outcome events, methods, coverage-aware aggregates | National-statistics authority; unsupported causal attribution |
| Guidance Network | Individuals with scoped capabilities | Evidence-linked knowledge, mentorship/Q&A/cohort/event workflows | General social graph/feed or public popularity market |

## Named capabilities

- **Lammah:** governed external opportunity ingestion, evidence, normalization, deduplication suggestion, review, publish/expire, dead-letter and source operations.
- **Abhathli:** Individual retrieval/guidance over permitted Career Record projection and published Opportunity Graph; explain, compare, prepare, draft, monitor, track.
- **Radar:** private action and outcome ledger with user-controlled reminders.
- **CV Builder:** a renderer/editor of canonical Career Record facts and presentation preferences, never a parallel fact store.

## Core domain contracts

### Identity and actor authority

User identity, exactly one or more actor memberships/capabilities, workspace roles, delegated authority, revocation, and audit. Directory entity records remain separate from actor-owned Profiles.

### Evidence object

Minimum fields: subject; assertion type/value; source/issuer; evidence link or reference; evidence state; verification method/scope/time; locale; valid time; visibility/purpose grants; correction/revocation; created/updated actor; audit lineage.

Evidence states should distinguish at least: self-asserted, source-linked, issuer-confirmed, platform-verified, expired, revoked, and disputed. "Verified" without scope/method/date is forbidden.

### Opportunity object

Source/source ID; immutable retrieval evidence; normalized employer/directory reference; title/description; location/mode; type; criteria/skills; compensation when available; published/valid/observed times; apply route safety; review/publish/expire state; duplicate relationships; correction history.

### Requisition and application

Requisition owner/version/criteria/evidence requests; application as an Individual-authorized projection; stage transitions with actor/time/reason; assessment/interview artifacts; human decision; communication; closure; retention and correction.

### Outcome event

Subject, actor, event type/time, source, evidence/verification state, purpose/audience, collection instrument/version, correction/revocation, and provenance. Unknown remains unknown.

### Cohort/metric contract

Eligible cohort `E`, known status `K`, numerator `N`, coverage `K/E`, explicitly named rate denominator, period, source, exclusions, deduplication, refresh, uncertainty/limitation.

## Trust control plane

Every domain crosses deterministic controls before AI or UI:

1. Authentication and actor/workspace authority.
2. Purpose/entitlement/consent or other lawful basis.
3. RLS and server-side policy.
4. Data classification/minimization.
5. Source/evidence and freshness.
6. Human authority for consequential transitions.
7. Audit, incident, retention and reversal.

AI may propose retrieval, explanation, summaries, drafts, questions, or next actions. It may not bypass controls, treat source text as system instruction, mutate canonical facts, send applications/messages, disclose data, or make the final employment decision.

## Retrieval architecture

Start with structured constraints plus PostgreSQL full-text/trigram. Evaluate `pgvector` only after a bilingual gold-set benchmark. Return reason codes and evidence, not a match percentage. Add an external search engine only after measured Postgres limits and with deletion/authorization synchronization proven.

## Workflow architecture

Use JID-owned domain state machines and append-only transition/audit events. Evaluate Supabase Queues/PGMQ for asynchronous work behind an owned queue interface. Introduce a durable workflow platform only when named multi-day/replay/compensation needs exceed that boundary.

## Integration zones

- **Authorized source adapters:** terminate at Lammah evidence/candidate/review.
- **Assessment providers:** return scoped instrument/result evidence; never control stage automatically.
- **Calendar/video:** scheduling/meeting only; consent/recording/retention stay in JID policy.
- **Credential/taxonomy:** preserve upstream identifier/version/license/attribution and adaptation.
- **Analytics/observability:** staff-only least-privilege governed views; no sensitive session replay.
- **Notifications:** JID owns eligibility, purpose, audience, preferences, digesting, idempotency, and audit.

## Preserve, rebuild, defer

| Preserve and prove | Rebuild behind migration/flags | Defer |
|---|---|---|
| Auth, RLS, audit, Directory/Profile separation, i18n, Catalog, Lammah control plane, CI/tests | Information architecture, Career Record contract, Opportunity Graph views/APIs, Radar, employer workflow packaging, University methodology, analytics/entitlements | General social, auto-apply, proprietary psychometrics, full ATS replacement, broad government dashboards, mentor payments, external search infra |

## Architecture decision records required

Actor/authority; canonical Career Record/evidence; disclosure grants; Opportunity Graph/Lammah; Abhathli policy; Radar events; hiring state machine; assessment governance; outcome/cohort metrics; AI evaluation; queue/search choices; data retention; migration/rollback. Each ADR names alternatives, evidence, threat model, exit, and founder gate where applicable.
