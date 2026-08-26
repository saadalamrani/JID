# JID — Wave 1 Architecture & Reuse Packet

**Status:** FROZEN FOR FRONT 2 HANDOFF  
**Scope:** shared contracts and design foundations only; no Wave 2+ feature implementation

## 1. Architecture decision

Wave 1 adopts a **contract-first modular monolith** over the existing Next.js + Supabase/PostgreSQL foundation.

Do **not** introduce a graph database, event bus, external workflow engine, new search cluster, generic ATS/HRIS foundation, new identity plane, or new product repository in Wave 1.

The target system is a set of JID-owned versioned contracts implemented over the current relational/security foundation. External standards influence interoperability at the edges; they do not become JID's canonical truth model by default.

## 2. Shared architectural layers

```text
Identity / Authority
  ├─ Account identity
  ├─ Public actor classification
  ├─ Organization Directory identity
  └─ Owned organization authority

Canonical Evidence
  ├─ Career evidence objects
  ├─ provenance / verification / revision
  └─ disclosure-policy reference

Opportunity
  ├─ neutral Opportunity identity
  ├─ native + governed external source adapters
  └─ source / freshness / apply authority

Journey & Outcomes
  ├─ append-only action/outcome events
  └─ mutable product state as a projection

Governance
  ├─ purpose/disclosure authorization
  ├─ retention
  ├─ audit
  ├─ AI authority envelope
  └─ assessment evidence / decision-use audit

Institutional Relations
  ├─ University affiliation
  ├─ verification
  └─ cohort linkage

Portability
  ├─ jurisdiction/country/subdivision identifiers
  └─ future Market Adapter reference

Measurement
  └─ metric/event definition registry
```

## 3. Reuse decisions

| Existing asset / external standard | Decision | Rationale |
|---|---|---|
| Supabase/PostgreSQL + RLS | **KEEP / ADAPT** | Current non-prod shows broad RLS coverage and mature security work; no measured requirement justifies replacement. |
| Existing immutable `audit_logs` | **KEEP / ADAPT** | Useful shared audit primitive; extend semantics rather than create a second audit plane. |
| Directory + Verification + Owned Profile model | **KEEP / ADAPT** | Strong current trust/authority boundary; legacy claim fields remain compatibility residue only. |
| Lammah source/evidence/review/freshness operations | **KEEP / ADAPT** | Strongest current Opportunity provenance foundation. |
| Native `jobs` model | **ADAPT** | Reusable job subtype/storage, but it cannot remain the universal Opportunity contract. |
| Legacy `priority_visibility` organic boost | **REJECT FROM TARGET CONTRACT** | Conflicts with no-pay-to-win organic relevance. Preserve only temporarily for compatibility until safely retired/quarantined. |
| Existing CV independent truth store | **MIGRATION SOURCE / PROJECTION TARGET** | Real current data must be preserved, but future CV is derived from canonical Career Evidence. |
| Legacy SSIS composite/recommendation semantics | **REJECT / REPLACE** | Generic threshold recommendations conflict with adopted evidence-based human-accountable selection. |
| SSIS rubric/attempt/consent/response/version patterns | **EXTRACT PATTERN / ADAPT** | Some mechanics are useful when separated from generic candidate scoring. |
| Existing typography/i18n/layout primitives | **KEEP / ADAPT** | IBM Plex Sans Arabic + Manrope and reusable layout components already exist. |
| JSON Resume | **EXTRACT PATTERN / COMPATIBILITY TARGET** | MIT/open schema gives useful resume projection vocabulary (`basics`, work, education, skills, projects), but lacks JID provenance/rights/revision semantics and must not be the Career Record. |
| Schema.org `JobPosting` | **EXTRACT PATTERN / INTEROPERABILITY MAPPING** | Useful public job-subtype mapping for job location, hiring organization, employment type, qualifications and salary; too narrow for JID's wider Opportunity concept. |
| ISO 3166 country/subdivision identifiers | **ADOPT IDENTIFIER PATTERN** | Stable country/subdivision representation; ISO permits free use of country codes. Store codes, not copied standard prose. |
| W3C Verifiable Credentials | **DEFER** | Potential future issuer/credential interoperability, but premature for Wave 1 without a concrete issuer/credential use case. |
| New generic ATS/community/resume OSS foundation | **REJECT FOR WAVE 1** | Would import a second identity/data/workflow plane and increase migration/operating cost. |

### External diligence sources

- JSON Resume schema / monorepo — community open standard, MIT license: `https://jsonresume.org/schema`
- Schema.org JobPosting: `https://schema.org/JobPosting`
- ISO 3166 country/subdivision identifiers: `https://www.iso.org/iso-3166-country-codes.html`

No new dependency is approved by this packet. Reuse here means contract/pattern compatibility unless a later task packet explicitly approves installation/integration.

## 4. C1–C10 target decisions

### C1 — Actor and authority

Use separate concepts:

- `AccountIdentity` — authenticated user/account.
- `PublicActorType = INDIVIDUAL | BUSINESS | UNIVERSITY` — product actor classification, not staff role.
- `InternalRole` — Staff/Admin/Super Admin privilege.
- `OrganizationReference` — Directory identity.
- `OrganizationAuthority` — verified authorization for a user to act for an organization/Profile.
- `MentorCapability` — capability on an Individual.
- `InstitutionalContext` — Government/program/partner context; not public actor.

Do not use one enum to carry all of public actor, account privilege and organization authority semantics.

### C2 — Canonical Career Evidence

Introduce a canonical object contract in Wave 2 implementation. Minimum semantics are frozen in `WAVE_1_CONTRACT_SPEC.md`. Existing Profile/CV facts must migrate/reconcile into it without data loss. All renderers and applications consume projections/references.

### C3 — Opportunity

Define `Opportunity` as neutral core + typed subtype. `JOB` is one subtype. Lammah/native source adapters map into the same public/core semantics while retaining raw source provenance and authoritative destination.

Paid placement must never modify organic relevance. If sponsored placement is ever introduced, it is a clearly separate labeled surface/field and requires a later explicit product packet.

### C4 — Journey events

Use an append-only `JourneyEvent` semantic contract. Product-specific mutable rows remain operational projections/cache while migration occurs. Corrections are new events linked to prior events, not silent history rewrites.

### C5 — Authorization / disclosure / retention / audit

Use one shared `DisclosureAuthorization` envelope that can reference consent **or another lawful/authorized basis**. RLS remains the enforcement boundary. Authorization records do not replace legal review; they make purpose/recipient/object/time enforceable and auditable.

### C6 — University affiliation

Create a separate `UniversityAffiliation` relation with explicit state and verification evidence. Create a separate `CohortLink`. Neither relation grants private Career Record visibility. Existing direct Profile education fields become compatibility/read-model data until reconciled.

### C7 — Assessment evidence

Use `AssessmentInstrument`, `AssessmentAttempt`, `AssessmentResultEvidence`, and `AssessmentDecisionUse` concepts. A score is allowed only when the instrument/rubric defines its meaning for the stated purpose. JID has no global candidate score.

### C8 — AI authority

Every AI/automation use consumes an `AutomationAuthority` envelope. Consequential or external actions must resolve to an explicit human authorization state before execution. Model/provider version is traceable where material.

### C9 — Market portability

Use stable country/subdivision identifiers and explicit jurisdiction/source-market references only where relevant. Saudi is the default operating market; the core must not assume `SAR`, Saudi region IDs, or Saudi rules as universal facts. Future market-specific rules live behind a `MarketAdapterRef`, not branches/forks of the application.

### C10 — Metrics

Use a `MetricDefinition` registry contract. A number may be calculated/displayed only under a defined versioned metric and source. Institutional percentages require denominator/coverage/window/missingness/privacy semantics. Existing tables/queries do not receive approval merely because they exist.

## 5. Migration strategy for Front 2 and later waves

Use **expand → dual compatibility/projection → reconcile → contract**.

Rules:

1. never rewrite old applied migrations;
2. before any non-prod data migration, record PRE_COUNTS and reconciliation checks;
3. no destructive migration in the first contract-introduction packet;
4. old columns/tables can remain while new contracts are introduced;
5. new write paths must not create a second independent truth indefinitely;
6. deletion/retirement occurs only after read/write parity and rollback evidence;
7. production remains separately founder-authorized.

## 6. Specific legacy hazards to quarantine

1. **`companies.claimed_by` / claim-era semantics** — compatibility only; do not use for new authority checks.
2. **generic `entity` role** — compatibility only; target authority is explicit actor + organization authority.
3. **CV-local career truth** — do not add new canonical semantics to it.
4. **paid `priority_visibility` organic boost** — excluded from target relevance contract.
5. **SSIS `composite_score` + threshold recommendation** — excluded from target hiring decision contract.
6. **Profile direct university relationship as proof** — self-declaration only until explicit affiliation verification exists.
7. **Saudi-only region/currency assumptions** — may remain current defaults but not shared-contract invariants.

## 7. Explicit non-decisions

Wave 1 does not decide:

- physical table names for all Wave 2+ domains beyond shared contract primitives;
- final Career Record UI;
- CV templates/renderers;
- opportunity ranking algorithm;
- Radar workflow UX;
- screening test vendor;
- assessment scoring methodology;
- social ranking;
- University KPI catalog values;
- government product;
- second GCC country;
- exact pricing;
- production migration timing.

## 8. Architecture acceptance gate

Front 2 may begin only if it implements these contracts without smuggling Wave 2+ product behavior. Any database DDL must be split into an explicit non-production migration sub-packet and re-verified against live non-prod schema immediately before execution.
