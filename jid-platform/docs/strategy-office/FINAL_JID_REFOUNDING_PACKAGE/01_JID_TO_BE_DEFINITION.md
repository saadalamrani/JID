# JID TO-BE Definition

## One-sentence definition

JID is an Arabic-first, consent-governed career evidence and opportunity operating system that connects Individuals, verified employers and universities through a shared career record, opportunity graph, hiring workflow and outcomes methodology.

## Category

JID is not positioned as a job board, social network, generic ATS, university ERP, assessment publisher or government platform. Its category is **career and employment infrastructure** with four commercial layers:

1. Individual career utility.
2. Employer hiring workflow.
3. University outcomes intelligence.
4. Contracted ecosystem/public-interest intelligence.

## Governing actor model

- **Individual:** owns the career record and consent grants. Mentor is an approved capability on this actor.
- **Business:** a verified organization representative operating an authored employer Profile and hiring workspace.
- **University:** a verified institution representative operating an authored institutional Profile and outcomes workflow.
- **Government/public institution:** partner or customer context, not a new default account actor in the initial architecture.
- **Staff/internal roles:** operational identities, not external market actors.

## The core system of record

The system of record is the **Career Evidence Graph**, supported by connected domain records rather than one giant profile table:

- verified/self-declared identity attributes with provenance;
- education, experience, skills, credentials, projects and evidence;
- privacy and purpose-specific consent grants;
- organization Directory identity and authored organization Profiles;
- opportunity source/provenance/freshness and normalized identity;
- applications, declarations, interactions and outcomes as state transitions;
- assessment instruments, attempts, rubrics and validity metadata;
- graduate cohort definitions, known-outcome coverage and aggregation rules;
- immutable audit events for privileged actions.

CVs, public Profiles, employer views, university views and AI context are projections from authorized canonical data. They are not parallel truth stores.

## Product engines

### 1. Career Record Engine

The Individual authors, imports, verifies and selectively shares professional facts. Every item records source type, confidence/provenance status and visibility. Evidence is private by default. Derived CVs and applications cannot silently modify canonical facts.

### 2. Opportunity Graph Engine

Native and approved external opportunities map to verified/resolved organizations, sources, locations, occupations, skills and deadlines. Every external record carries provenance, fetch time, last verified time, expiry rule, normalized identity and duplicate relationships.

### 3. Hiring Workflow Engine

Employers publish opportunities, define evidence and screening requirements, receive purpose-limited candidate projections, manage stages, communicate decisions and preserve auditability. JID integrates high-risk assessments unless it can meet scientific and legal ownership obligations itself.

### 4. Outcomes Methodology Engine

Universities define cohorts, collect consented/self-reported and partner-provided outcomes, see response/coverage quality and use program-level insights. Every percentage declares denominator, known-outcome coverage, collection window and caveat.

### 5. Guidance and Knowledge Engine

Mentor services, career guidance and professional knowledge are structured around topics, evidence and tasks. Interaction is finite and purpose-bound. JID does not optimize the system around public engagement volume.

### 6. Trust and Governance Engine

Verification, consent, RLS, purpose limitation, retention, provenance, moderation, assessment governance, AI evaluation and audit apply across every product engine.

## Named product architecture

```text
Trusted sources + native opportunities
                │
                ▼
      Opportunity ingestion boundary
                │
                ▼
      Lammah Opportunity Intelligence
          │             │
          │             └── Employer / University / ecosystem insights
          ▼
Career Record ─── Abhathli personal search copilot
     │                      │
     ├── CV / profile       ├── reasons, gaps, constraints
     ├── evidence           ├── alerts and preparation
     └── consent            └── explicit user actions
                    │
                    ▼
                  Radar
                    │
                    ▼
         Hiring workflow and outcomes
                    │
                    └── consented aggregate learning loop
```

## Return loops

An Individual returns to JID for:

- new relevant opportunities and deadlines;
- record/evidence updates;
- application and interview actions;
- mentor or topic guidance;
- credential/skill milestones;
- labor-market changes relevant to an explicit goal.

An employer returns for active pipelines, candidate communication, structured decisions, recurring programs and evidence about channel/process quality. A university returns for cohort workflows, outcome-collection progress, employer feedback and program actions—not passive dashboard viewing.

## Value loops

### Career loop

Record → discover → act → outcome → reflect/update → better future discovery.

### Employer loop

Verified identity → publish → receive consented evidence → structured decision → communicate → improve role/rubric.

### University loop

Cohort definition → consent/collection → coverage quality → outcome insight → program/career-service action → later follow-up.

### Ecosystem loop

More legitimate source/partner coverage → better opportunity truth → more useful Individual actions → stronger employer participation → richer consented outcomes → more institutional value.

## Saudi-native requirements

- Arabic-first authoring and search, not translated UI only.
- Arabic/English title and skill normalization with Latin digits.
- Saudi regions, cities, sectors, graduate programs, internships, training and public-program context.
- PDPL-aligned purpose, minimization, consent, retention and cross-border processing controls.
- organization and source provenance appropriate to Saudi market fragmentation.
- institutional procurement and pilot paths compatible with Saudi universities and public bodies.
- culturally credible, direct product copy and restrained national context without decorative claims.

## Global expansion logic

The globally portable layer is the architecture: user-owned career evidence, source-traceable opportunity intelligence, explainable assistance, structured hiring and coverage-honest outcomes. Saudi taxonomies, partners, program types and legal controls are adapters. JID should prove one market deeply before claiming global fit.

## Non-goals

- autonomous mass applications;
- selling personal data;
- public popularity as professional value;
- proprietary psychometric scoring without validation;
- replacement of enterprise HRIS/payroll;
- national statistics claims without representative methodology;
- forced disclosure from Individuals to employers or universities;
- feature breadth as the primary success measure.

## North-star outcome

The north-star is not time spent or content engagement. It is **the number of consented career journeys that advance through a verifiable, useful next step**—for example a completed record, qualified opportunity action, employer response, structured interview, decision, or known graduate outcome. Every reported measure must expose its denominator and event definition.
