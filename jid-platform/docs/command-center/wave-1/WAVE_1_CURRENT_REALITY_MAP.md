# JID — Wave 1 Current Reality Map

**Front:** Wave 1 / Front 1 — Current Reality + Contract Architecture  
**Evidence date:** 2026-08-26 (Asia/Riyadh)  
**Repository branch:** `nebres/wave1-front1-contract-architecture`  
**Runtime checked:** connected `jid-nonprod` Supabase only; production intentionally not accessed

## Evidence labels

- **VERIFIED-REPO:** directly inspected in the current repository branch.
- **VERIFIED-NONPROD:** directly confirmed through read-only connected Supabase metadata/SQL.
- **UNVERIFIED:** not directly confirmed in the relevant runtime.
- **CONTRADICTED:** current implementation conflicts with an adopted founder decision or target contract.

## Executive map

| Contract | Current state | Classification | Core finding |
|---|---|---|---|
| C1 Actor & authority | Strong but mixed-generation | **ADAPT** | Auth/RBAC, Verification and Directory/Profile separation are reusable; legacy `entity` / claim-era residue remains. |
| C2 Canonical Career Evidence | Fragmented across Profile and CV stores | **REPLACE / MISSING CANONICAL** | No canonical fact/evidence record with provenance, revision, dispute and disclosure semantics exists. |
| C3 Opportunity core | Strong external provenance; native model is Job-centric | **ADAPT** | Lammah source/evidence controls are reusable; canonical Opportunity must generalize beyond `jobs`. |
| C4 Journey/action/outcome event | Mutable states and partial declarations | **MISSING / ADAPT** | No common append-only event contract distinguishes declared, observed, employer-confirmed, third-party and corrected outcomes. |
| C5 Purpose/disclosure/retention/audit | Strong read-path/RLS and audit foundations | **ADAPT** | Fine-grained reusable authorization/purpose envelope is missing. |
| C6 University affiliation/cohort | Direct Profile FKs only | **REPLACE / MISSING RELATION** | No `Declared / Verified / Needs Review` affiliation record or separate cohort-link contract exists. |
| C7 Assessment evidence | Legacy SSIS schema exists | **REPLACE DECISION SEMANTICS** | Rubrics/attempt/consent primitives are reusable; generic composite + AI recommendation semantics conflict with adopted hiring policy. |
| C8 AI/automation authority | Point implementations only | **MISSING SHARED ENVELOPE** | No cross-capability deterministic authority/explanation/audit contract exists. |
| C9 Market/jurisdiction portability | Partially local-aware | **ADAPT** | Lammah has country context; native jobs/regions remain Saudi-shaped and lack governed market-adapter semantics. |
| C10 Metric/event definition | Individual metrics exist without registry | **MISSING SHARED REGISTRY** | No common metric definition/version/denominator/coverage/missingness contract exists. |
| Design foundations | Meaningful reusable base | **ADAPT** | IBM Plex Sans Arabic, Manrope, i18n/layout primitives and components exist; shared states/tokens need consolidation, not greenfield replacement. |

---

## C1 — Actor and authority

### VERIFIED-REPO

- `public.profiles` is the account-linked profile identity and carries the account role.
- repository RBAC recognizes `individual`, `entity`, `company_admin`, `university_admin`, `staff`, `admin`, `super_admin`.
- `business_profiles` and `university_profiles` are separate owned Layer-3 records anchored to the Layer-1 `companies` Directory by `directory_id` and to an owner by `owner_user_id`.
- `verification_requests` is the Layer-2 verification workflow and its current comments/contracts explicitly state that verification proves representation and does not grant Directory-row edit rights.
- current middleware separately protects Staff and Super Admin surfaces and retires `/sys/claims`.

### VERIFIED-NONPROD

- `companies`, `verification_requests`, `business_profiles`, and `university_profiles` exist with RLS enabled.
- `companies` still contains legacy columns including `claimed_by`, `claim_requested_at`, and `entity_state` even though the newer ownership model is Profile-based.
- `user_role_enum` still contains both generic `entity` and the later `company_admin` / `university_admin` roles.

### Assessment

**ADAPT.** Preserve account identity, staff roles, verification workflow, Directory/Profile split, organization owner authority and RLS. Treat generic `entity`, `claimed_by`, and claim-era fields as compatibility residue, not target semantics.

---

## C2 — Canonical Career Evidence

### VERIFIED-REPO

- `profiles` stores personal/profile fields, career preferences, skills linkage and simple education affiliation fields.
- the CV subsystem independently stores person/contact fields plus `cv_education`, `cv_experience`, `cv_skills`, `cv_additional` and CV-local language/skill content.
- current TypeScript CV types mirror these independent CV stores.
- no repository-level `career_record` or equivalent canonical career-fact/evidence contract was found in focused search.

### VERIFIED-NONPROD

- `profiles`, `cvs`, `cv_education`, `cv_experience`, `cv_skills`, and `cv_additional` all exist with RLS.
- existing CV records are therefore a real current truth store, not merely a renderer.

### Gap

There is no generic canonical career fact/object identity carrying source class, verification/claim state, observed/effective time, correction/dispute/revocation, evidence link and disclosure-policy reference.

### Assessment

**REPLACE / MISSING CANONICAL.** Existing Profile/CV facts are migration inputs and compatibility surfaces. They must not define the future canonical contract. Wave 1 freezes semantics only; Wave 2 owns implementation/migration and CV projection behavior.

---

## C3 — Opportunity core

### VERIFIED-REPO

- native opportunity storage remains `jobs` and is Job-specific.
- Lammah has a governed external source registry, source approval, licence/terms/robots evidence, parser/version, authoritative fields, supported opportunity types, source health, raw evidence, review and lifecycle structures.
- Lammah already carries `location_country`, `opportunity_type`, source/freshness and supersession concepts.
- frontend types still expose a primarily `Job` product shape.
- legacy priority-visibility code contains paid boost fields and entitlement machinery.

### VERIFIED-NONPROD

- `jobs` and `lammah_opportunities` both exist.
- `lammah_opportunity_type_enum` currently supports `job`, `co_op`, `internship`, `fellowship`, `scholarship`.
- `jobs` contains `is_boosted`, boost dates, tier and `business_profile_id`.
- Lammah evidence/review/lifecycle tables are present with RLS.

### CONTRADICTED

Any use of paid boost to change **organic relevance/order** conflicts with the adopted no-pay-to-win organic-ranking rule. The legacy columns may remain during compatibility work, but they are excluded from the target Opportunity relevance contract.

### Assessment

**ADAPT.** Preserve Lammah provenance/source/review/freshness patterns and native Profile anchoring. Define one neutral `Opportunity` contract with typed subcategories, source authority and application destination. Do not force all future opportunities into `jobs`.

---

## C4 — Journey / action / outcome event

### VERIFIED-REPO / VERIFIED-NONPROD

- `applications` stores mutable state plus timestamps and actor metadata for some transitions.
- `application_intents` records intent.
- `lammah_radar_items` records a `self_declared` application flag and declaration time.
- a separate generic `radar_items` table also exists.

### Gap

No common event contract records a stable event ID/version plus origin class (`USER_DECLARED`, `SYSTEM_OBSERVED`, `EMPLOYER_CONFIRMED`, `THIRD_PARTY_SOURCED`, `CORRECTION/REVERSAL`) and preserves lineage without converting missing data into an outcome.

### Assessment

**MISSING / ADAPT.** Existing mutable states become projections of an event history over time; do not build Radar or Hiring Workspace in Wave 1.

---

## C5 — Purpose / disclosure / consent-authority / retention / audit

### VERIFIED-REPO

- security/privacy Gate A introduced server/database read-path helpers and safe public/business projections.
- University named-person access is intentionally absent/fail-closed in the reviewed security contract.
- legacy Profile privacy remains coarse (`visibility`, company discovery, university statistics and related toggles).
- `audit_logs` is append-only/immutable by trigger and records actor/action/entity/old/new/metadata/context/time.

### VERIFIED-NONPROD

- reviewed domain tables have RLS enabled.
- `audit_logs` is active and materially used.
- there is no obvious reusable table representing subject + object/category + recipient + purpose + authority/basis + expiry + revocation + retention reference as one general authorization grant.

### Assessment

**ADAPT.** Keep RLS, server-computed projections and immutable audit. Add a versioned purpose/disclosure authorization envelope; do not replace all legal bases with one generic consent flag.

---

## C6 — University affiliation and cohort linkage

### VERIFIED-REPO / VERIFIED-NONPROD

- `profiles` currently carries direct `university_id`, `college_id`, `major_id`, `graduation_year`, and `student_status` fields.
- current University owner analytics intentionally fail closed where owned University Profile identity cannot safely resolve to the academic catalog identity.
- no current public table provides the founder-adopted relationship states `Declared / Verified / Needs Review` plus verification method/source/time and a separate cohort link.

### Assessment

**REPLACE / MISSING RELATION.** Define a first-class affiliation relation independent of full Profile visibility. Verification proves affiliation/cohort only. University email is an optional method, never a mandatory gate. Cohort membership is a separate relationship and never an implicit grant to the full Career Record.

---

## C7 — Assessment evidence

### VERIFIED-REPO

- legacy SSIS stores screenings, blocks/rubrics, invitations with consent, responses, evaluations, model version and retention-oriented response fields.
- the repository SSIS evaluator asks an AI model to score criteria 0–100, calculates a composite score and emits `advance`, `review`, or `decline_recommend` based on a threshold.

### VERIFIED-NONPROD

- SSIS tables/enums exist with RLS.
- `ssis_recommendation_enum` contains `advance`, `review`, `decline_recommend`.
- the connected non-production Edge Function inventory currently shows only `catalog-gleif-sync`; SSIS generator/evaluator functions are not shown as deployed there.

### CONTRADICTED

The legacy generic composite/recommendation mechanism is not the adopted target. JID now owns evidence-based selection workflow and human-accountable decisions; it does not create a universal candidate/employability/culture-fit score or autonomous progression/rejection system.

### Assessment

**REPLACE DECISION SEMANTICS.** Reuse/adapt instrument/version, rubric, attempt, consent, answer/result, retention and human-approval patterns. Replace generic candidate recommendation semantics with purpose-bound assessment evidence and explicit decision-use audit.

---

## C8 — AI / automation authority

### VERIFIED-REPO

AI exists as point functionality (for example CV assistance and legacy SSIS generation/evaluation). Point functions know their provider/model but there is no single reusable authority envelope governing input classes, purpose, allowed action class, human confirmation, source evidence, fallback and kill state.

### Assessment

**MISSING SHARED ENVELOPE.** Define the common deterministic authority contract in Wave 1. Later capabilities must consume it rather than encode their own consequential-action policy.

---

## C9 — Market / jurisdiction portability

### VERIFIED-REPO / VERIFIED-NONPROD

- native jobs carry `region_id`, city and currency, with historical default assumptions centered on Saudi use.
- `regions` is a generic slug/name table without explicit country/subdivision code semantics.
- Lammah already carries `location_country` and source-specific geography.

### Assessment

**ADAPT.** Keep Saudi as the operating default but represent country/jurisdiction and subdivision through stable codes when a domain needs them. Market-specific policies/taxonomies/connectors belong behind a future Market Adapter reference. Do not build foreign infrastructure in Wave 1.

---

## C10 — Metric / event definition

### VERIFIED-REPO / VERIFIED-NONPROD

- product-specific metrics exist, including profile completion and a `metric_thresholds` table.
- some University snapshot logic computes aggregate values for limited current operational surfaces.
- no general registry defines metric ID/version, eligible population, numerator/denominator, time window, source, missingness, coverage, privacy rule, owner and retirement history.

### Assessment

**MISSING SHARED REGISTRY.** Freeze the definition envelope only. Existing metrics do not become approved institutional KPIs merely because they exist in code or the database.

---

# Design foundations — current reality

### VERIFIED-REPO

- Arabic font: IBM Plex Sans Arabic.
- Latin font: Manrope.
- mono: JetBrains Mono.
- locale-grouped App Router surfaces and `next-intl` infrastructure exist.
- reusable brand, layout, Smart Header, language switcher, auth, profile, filters and other shared components already exist.
- the repository still contains multiple actor/legacy route groups and component generations.

### Assessment

**ADAPT.** Preserve proven typography/i18n/layout primitives and consolidate shared semantic tokens, states, accessibility and anti-slop rules. Wave 1 does not redesign final feature screens.

---

# Runtime truth notes

1. Connected non-production project: `jid-nonprod` / `hmjuijmaefajdjrjdsxu`.
2. Supabase currently reports PostgreSQL **17.x** for this project. Older documentation that hard-locks PostgreSQL 15 is therefore historical, not runtime truth.
3. Relevant migrations through the August 2026 security/Lammah work are present in non-production migration history.
4. Production schema/runtime parity is **UNVERIFIED BY DESIGN** because no production access is authorized for Front 1.

# Front 2 implication

Codex must treat this map as current baseline evidence, re-verify the exact non-production schema immediately before any migration sub-packet, and use expand/contract compatibility rather than destructive replacement.
