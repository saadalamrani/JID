# JID — Wave 1 Shared Contract Specification

**Version:** 1.0-draft-frozen-for-implementation  
**Authority:** adopted Constitution + Founder Decisions + Wave 1 task packet  
**Purpose:** minimum shared semantics only. Physical storage may adapt to current schema through expand/contract.

## Global contract rules

Every shared object uses:

- stable opaque ID;
- explicit version where semantics can change;
- `created_at` / `updated_at` where mutable;
- source/authority metadata when the object is sourced or consequential;
- no UI label as database truth;
- no fake precision or implied verification;
- no hidden upgrade from declared/sourced/inferred to verified;
- no private-data disclosure based only on client-side rendering rules.

Timestamps are stored as timezone-aware instants. Display uses the relevant locale/timezone. IDs and contract values are locale-neutral.

---

# C1 — Actor & Authority Contract

## C1.1 AccountIdentity

| Field | Required | Meaning |
|---|---:|---|
| `account_id` | yes | authenticated user/account identity |
| `account_state` | yes | active/suspended/deleted-equivalent account state |
| `internal_role` | yes | privilege role for Staff/Admin/Super Admin or ordinary account role; not public actor identity |
| `locale` | yes | user UI locale preference |

## C1.2 PublicActorContext

`actor_type` is exactly:

- `INDIVIDUAL`
- `BUSINESS`
- `UNIVERSITY`

A user account may act as `BUSINESS` or `UNIVERSITY` only through a valid `OrganizationAuthority`; the account itself is not converted into an organization.

Government is represented as institutional/partner/program context, never as a fourth public actor. Mentor is an Individual capability.

## C1.3 OrganizationReference

| Field | Required | Meaning |
|---|---:|---|
| `organization_ref_id` | yes | Directory/reference identity |
| `organization_type` | yes | business or university |
| `reference_state` | yes | active/inactive or equivalent Directory lifecycle |
| `source/provenance_ref` | when sourced | how the Directory identity is supported |

**Invariant:** a Directory identity is not owned authority.

## C1.4 OrganizationAuthority

| Field | Required | Meaning |
|---|---:|---|
| `authority_id` | yes | stable authority grant |
| `account_id` | yes | human/account receiving authority |
| `organization_ref_id` | yes | organization represented |
| `owned_profile_id` | when created | Layer-3 authored Profile identity |
| `authority_role` | yes | owner/admin/member or later approved role |
| `verification_ref` | yes for initial authority | evidence/workflow establishing representation |
| `state` | yes | active/suspended/revoked/expired |
| `effective_at` | yes | start |
| `ended_at` | if ended | revocation/expiry time |

**Invariants**

1. `companies.claimed_by` is not a target authority source.
2. Verification never grants Directory write authority.
3. Staff/Super Admin privilege is separate from organization authority.
4. Organization authority is auditable and revocable.

---

# C2 — Canonical Career Evidence Contract

## C2.1 CareerEvidenceObject

| Field | Required | Meaning |
|---|---:|---|
| `evidence_id` | yes | stable canonical object ID |
| `subject_id` | yes | Individual owner/subject |
| `category` | yes | education/experience/skill/project/credential/award/language/volunteering/publication/other governed type |
| `fact_payload` | yes | category-specific structured fact values |
| `source_class` | yes | provenance class |
| `source_ref` | when applicable | issuer/organization/user/system/external source |
| `verification_state` | yes | declared/verified/confirmed/sourced/derived/disputed/revoked-or-expired equivalent |
| `effective_from` | when meaningful | when fact became true |
| `effective_to` | when meaningful | fact end/expiry |
| `observed_at` | when sourced/observed | observation/ingestion time |
| `revision_no` | yes | monotonic revision identity |
| `supersedes_id` | if correction | prior object/revision relationship |
| `evidence_artifact_ref` | optional | proof/work artifact where lawful |
| `disclosure_policy_ref` | yes | visibility/disclosure handling |
| `market_context_ref` | optional | only when fact is jurisdiction-specific |

Recommended source classes:

- `SELF_DECLARED`
- `ISSUER_VERIFIED`
- `ORGANIZATION_CONFIRMED`
- `SYSTEM_OBSERVED`
- `THIRD_PARTY_SOURCED`
- `DERIVED_EXPLAINABLE`

`DISPUTED` and `REVOKED_OR_EXPIRED` are lifecycle/verification states and must remain visible in provenance history.

## C2.2 Projection rule

CV, public Profile, employer application projection, AI context, social evidence references and University disclosures are **projections/references** to canonical evidence under a disclosure purpose. They may snapshot rendered wording, but cannot become silent parallel canonical facts.

**Wave 2 requirement:** existing Profile/CV records are reconciled with zero silent data loss before old truth writes are retired.

---

# C3 — Opportunity Core Contract

## C3.1 Opportunity

| Field | Required | Meaning |
|---|---:|---|
| `opportunity_id` | yes | canonical opportunity identity |
| `opportunity_type` | yes | typed opportunity category |
| `source_ref` | yes | native or external governed source |
| `source_record_ref` | when external | original identity/locator/hash |
| `organization_ref_id` | when resolvable | Directory organization identity |
| `owned_profile_id` | when native/owned | organization Profile anchor |
| `title` | yes | localized/source-backed title |
| `description` | when available | source-backed content |
| `requirements` | when available | structured/source-linked claims |
| `location_context` | when applicable | country/subdivision/city/work-mode |
| `published_at` | when known | authoritative publication date |
| `last_confirmed_at` | yes for external | freshness evidence |
| `expires_at` | when known/derived by approved rule | expiry/deadline |
| `apply_authority` | yes | native / official external / redirect-only / unavailable equivalent |
| `apply_destination` | when applicable | authoritative destination |
| `lifecycle_state` | yes | draft/review/published/closed/expired/removed/superseded equivalent |
| `supersedes/opportunity_lineage_ref` | when applicable | duplicate/supersession history |
| `jurisdiction_ref` | when applicable | market context |

Baseline types may include:

`JOB`, `INTERNSHIP`, `COOP`, `GRADUATE_PROGRAM`, `TRAINING`, `FELLOWSHIP`, `SCHOLARSHIP`, `GOVERNMENT_PROGRAM`, `CAREER_INITIATIVE`, with governed extension rather than UI-invented values.

**Invariants**

- Job is a subtype, not the universal model.
- source provenance is never discarded during normalization.
- external/public visibility does not imply redistribution permission.
- paid boost does not alter organic relevance.
- eligibility is a sourced/rule-backed claim, not an AI guess.

---

# C4 — Journey / Action / Outcome Event Contract

## C4.1 JourneyEvent

| Field | Required | Meaning |
|---|---:|---|
| `event_id` | yes | immutable stable event |
| `event_type` | yes | namespaced domain event |
| `event_version` | yes | semantic version |
| `subject_id` | yes | Individual or workflow subject |
| `opportunity_id` | if opportunity-related | linked opportunity |
| `organization_ref_id` | if organization-related | linked organization |
| `origin_class` | yes | who/what establishes the event |
| `actor_id/source_ref` | yes | responsible actor/source |
| `occurred_at` | yes | business occurrence time |
| `recorded_at` | yes | platform ingestion time |
| `payload` | yes | event-specific bounded values |
| `corrects_event_id` | if correction/reversal | prior event being corrected |
| `evidence_ref` | when available | supporting source/receipt |
| `visibility/purpose_ref` | when restricted | disclosure boundary |

Origin classes:

- `USER_DECLARED`
- `SYSTEM_OBSERVED`
- `EMPLOYER_CONFIRMED`
- `THIRD_PARTY_SOURCED`
- `INSTITUTION_CONFIRMED`
- `ADMIN_CORRECTION`

**Invariant:** missing status produces no outcome event. Rejection, offer, employment, withdrawal, unemployment and success are never inferred from absence.

Mutable `applications`/Radar states may be projections over these events during migration.

---

# C5 — Purpose / Disclosure / Authorization / Retention / Audit Contract

## C5.1 DisclosureAuthorization

| Field | Required | Meaning |
|---|---:|---|
| `authorization_id` | yes | stable authorization record |
| `subject_id` | yes | data subject |
| `object_ref` or `data_category` | yes | what may be disclosed/used |
| `recipient_type` | yes | public/employer/university/mentor/vendor/system/other approved recipient class |
| `recipient_ref` | when specific | exact recipient/organization/provider |
| `purpose_code` | yes | explicit approved purpose |
| `basis_ref` | yes | consent/contract/legal/other reviewed authority reference; not a legal conclusion by the schema itself |
| `state` | yes | active/revoked/expired/superseded |
| `effective_at` | yes | start |
| `expires_at` | when bounded | end |
| `revoked_at` | if revoked | revocation time |
| `retention_policy_ref` | yes | retention/deletion rule |
| `created_by` | yes | subject/system/authorized operator |

## C5.2 AccessAuditEvent

Material reads/disclosures use the existing audit plane or a compatible immutable event with:

recipient/actor, subject/object, purpose, authorization/basis ref, result, time, and relevant request context.

**Invariants**

- one vague global consent does not authorize all purposes;
- consent is not assumed to be the only lawful basis;
- RLS/server authorization enforces read boundaries;
- owner payload is never fetched to another client and hidden;
- revocation/expiry must affect future reads/actions and downstream retention handling as applicable.

---

# C6 — University Affiliation & Cohort Linkage Contract

## C6.1 UniversityAffiliation

| Field | Required | Meaning |
|---|---:|---|
| `affiliation_id` | yes | stable relation |
| `individual_id` | yes | Individual |
| `university_catalog_ref` | yes | academic institution reference |
| `college_ref` | optional | college |
| `program_or_major_ref/text` | optional | program/major |
| `degree_ref/text` | optional | degree |
| `graduation_year` | optional | year |
| `person_status` | yes | student/graduate/other approved status |
| `institution_person_identifier` | optional/private | student/alumni identifier, protected separately |
| `state` | yes | `DECLARED`, `VERIFIED`, `NEEDS_REVIEW` |
| `declared_at` | yes | declaration time |
| `verification_method` | if verified/reviewed | roster/invite/code/SSO/email/API/manual-reviewed equivalent |
| `verification_source_ref` | if verified/reviewed | institution/source evidence |
| `verified_at` | if verified | verification time |
| `dispute/revocation_state` | when applicable | correction lifecycle |
| `audit_ref` | yes for verification changes | audit evidence |

University email is one optional verification method, never mandatory.

## C6.2 CohortLink

Separate relation:

`cohort_link_id`, `affiliation_id`, `cohort_id`, `link_source`, `link_state`, `linked_at`, `ended_at`, `audit_ref`.

**Invariants**

- self-declared affiliation is not institution-verified affiliation;
- cohort linkage is not private Career Record access;
- institution ownership/Profile identity and academic catalog identity remain separate until a reviewed mapping exists;
- named-person visibility requires its own purpose/authorization.

---

# C7 — Assessment Evidence Contract

## C7.1 AssessmentInstrument

Required semantics: provider, instrument ID/name, version, construct/purpose, supported language, target role/population context, scoring interpretation reference, validity/governance dossier reference, retention/sharing restrictions, active/review state.

## C7.2 AssessmentAttempt

Required semantics: attempt ID, instrument/version, candidate/subject, role/use context, invitation/authorization, start/completion state, accommodation state, technical incident state, timestamps, provenance.

## C7.3 AssessmentResultEvidence

Required semantics: attempt ID, result payload, optional score only with scale/rubric meaning, evaluator/provider/model reference when applicable, generated_at, limitations, sharing/portability rule, retention policy, dispute/appeal state.

## C7.4 AssessmentDecisionUse

Required semantics: result evidence ref, opportunity/role, stated decision purpose, human reviewer, use time, reviewer judgment/reason, override/challenge state, audit ref.

**Invariants**

- no universal JID Candidate/Employability/Potential/Culture Fit score;
- a score is not portable outside its stated instrument/purpose without explicit validity/right basis;
- assessment result is not public Career Record truth by default;
- emotion/facial/voice inference is excluded;
- final consequential decision remains attributable to an authorized human.

---

# C8 — AI / Automation Authority Contract

## C8.1 AutomationAuthority

| Field | Required | Meaning |
|---|---:|---|
| `automation_id` | yes | use-case execution/authority identity |
| `requesting_actor_id` | yes | human/system actor requesting assistance |
| `purpose_code` | yes | approved use case |
| `input_data_classes` | yes | allowed data categories |
| `provider_ref` | when external | provider |
| `model_or_engine_version` | when material | traceable version |
| `permitted_output_class` | yes | retrieve/summarize/compare/draft/recommend/propose-change/prepare/monitor/track/etc. |
| `permitted_action_class` | yes | none/internal-proposal/external-action after confirmation/etc. |
| `source_evidence_required` | yes | whether/source requirements |
| `human_review_state` | yes | not-required/review-required/approved/rejected/corrected |
| `external_confirmation_ref` | required for consequential external action | explicit human authorization receipt |
| `fallback_state` | yes | deterministic fallback behavior |
| `kill_state` | yes | enabled/paused/disabled |
| `audit_ref` | yes | traceability |

**Invariants**

- generative output is not verified truth;
- canonical Career Record change is a proposal until explicitly authorized;
- external application/message/offer/rejection/disclosure is never authorized merely by model output;
- explainability must expose material source/reason context appropriate to the use.

---

# C9 — Market / Jurisdiction Portability Contract

## C9.1 LocationContext

Minimum representation when location matters:

- `country_code` — ISO 3166-1 alpha-2 representation pattern;
- `subdivision_code` — ISO 3166-2-style code where relevant;
- `city_text/ref` — localized place;
- `work_mode` — onsite/hybrid/remote/other governed value;
- `timezone` — only when workflow timing needs it.

## C9.2 MarketContext

Optional per object/use:

- `jurisdiction_code`;
- `currency_code` where financial values exist;
- `locale/language` where content/source needs it;
- `policy_or_taxonomy_ref` with version/effective date;
- `market_adapter_ref` for later country-specific source/rule connector.

**Invariants**

- Saudi Arabia remains the operating default, not a universal schema assumption;
- nationality and work authorization are not interchangeable with location;
- work eligibility, if required, is private/purpose-bound and must not become an organic ranking proxy;
- no foreign tax/regulatory engine is built in Wave 1.

---

# C10 — Metric / Event Definition Contract

## C10.1 MetricDefinition

| Field | Required | Meaning |
|---|---:|---|
| `metric_id` | yes | stable semantic ID |
| `version` | yes | definition version |
| `name/description` | yes | human meaning |
| `eligible_population_definition` | yes | denominator universe |
| `numerator_definition` | when ratio/rate | numerator |
| `denominator_definition` | when ratio/rate | denominator |
| `window/period` | yes | time basis |
| `source_refs` | yes | source data/events |
| `missing_unknown_policy` | yes | how absent/unknown is treated |
| `coverage_definition` | when applicable | known/eligible coverage |
| `privacy_suppression_ref` | when applicable | privacy/small-cell/export policy |
| `owner` | yes | accountable definition owner |
| `state` | yes | draft/active/deprecated/retired |
| `effective_at` | yes | activation |
| `retired_at` | if retired | retirement |
| `supersedes_version` | when changed | lineage |

**Invariants**

- metric definition is separate from metric value;
- no percentage without a defined denominator;
- no University/institutional KPI without population, coverage, period, source and methodology;
- missing is never silently converted to zero/success/failure;
- a current UI calculation does not become a trusted KPI until registered and approved.

---

# Cross-contract references

- C2 evidence disclosures use C5 authorization.
- C3 opportunity actions generate C4 events.
- C6 affiliation verification changes are audited through C5 and do not expose C2 without separate C5 authorization.
- C7 assessment use is governed by C5 and C8 when AI assists.
- C8 cannot override C5 authorization or C1 authority.
- C9 context may attach to C2/C3/C6/C7 only where materially needed.
- C10 metrics consume source events/records but never weaken C5 privacy or C2/C4 provenance.

# Compatibility principle

These are **semantic contracts**, not permission to create ten new tables immediately. Front 2 must map the minimum required primitives onto existing tables/types where safe and introduce new storage only where the invariant cannot otherwise be enforced cleanly.
