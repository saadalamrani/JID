# JID — Wave 1 Front 1 Risk & Decision Log

**Status:** architecture decisions frozen; implementation risks handed to Front 2/3  
**Scope:** no production authority

## 1. Decision log

| ID | Decision | Basis | Owner next |
|---|---|---|---|
| D1 | Keep current Supabase/PostgreSQL/RLS/audit foundation; adapt contracts in place. | Current repo + non-prod runtime show meaningful mature controls; no measured replacement need. | Codex |
| D2 | Separate public actor context, account privilege and organization authority. | Current role enum mixes generations; founder fixed exactly three public actors. | Codex |
| D3 | Introduce canonical Career Evidence semantics; treat CV/Profile stores as migration/compatibility sources. | Current CV is an independent truth store; founder approved canonical Career Record direction. | Wave 2 after Wave 1 primitives |
| D4 | Generalize Opportunity beyond Job while preserving Lammah source/provenance operations. | Founder Government/Opportunity decision + current Lammah multi-type evidence. | Codex contract layer; Wave 3 product |
| D5 | Journey truth is append-only event semantics; mutable states are projections. | Current applications/Radar have partial mutable/declarative state only. | Codex shared event primitive |
| D6 | Add purpose-specific authorization envelope while preserving RLS/read-path enforcement. | Current privacy controls are strong but coarse and use-specific. | Codex |
| D7 | University affiliation becomes a separate relation with `DECLARED / VERIFIED / NEEDS_REVIEW`; cohort link is separate and grants no Career Record access. | Explicit founder adoption; current direct FKs do not support it. | Codex contract + later University waves |
| D8 | Replace legacy SSIS generic composite/recommendation semantics with purpose-bound assessment evidence + human decision-use audit. | Explicit founder Hiring Evidence decision. | Codex later assessment wave; Wave 1 shared types only |
| D9 | Every AI use consumes a shared authority envelope; no point feature may self-authorize consequential action. | Adopted AI authority. | Codex |
| D10 | Use ISO country/subdivision identifier pattern and future Market Adapter boundary; no GCC infrastructure now. | Adopted Saudi-first/GCC-ready decision. | Codex shared types |
| D11 | Metric definitions require version/population/denominator/window/source/missingness/coverage/privacy metadata. | Constitution truth rule + University methodology decision. | Codex |
| D12 | Preserve current brand fonts/colors/tokens and adapt design foundations; do not greenfield redesign the system. | Repo current truth + UI Audit/Anti-Slop + Brand. | Cursor |
| D13 | Original Claude front handoff's stale C-number order is superseded by canonical Wave 1 packet numbering. | Documentation conflict, not founder decision conflict. | Control Tower |

## 2. Material risks

### R1 — Legacy authority residue

**Severity:** P1 architecture / migration risk  
**Evidence:** `companies.claimed_by`, claim-era fields and generic `entity` role still exist while current Profile/Verification architecture uses owned Profiles and explicit org-admin roles.

**Risk:** new code could accidentally restore the retired claim model or use two competing organization authority sources.

**Control:** Front 2 must prohibit new reads/writes that treat `claimed_by` as target authority. Introduce adapters/guards around current Profile authority. Do not destructively drop legacy columns in the first packet.

### R2 — Canonical Career Record absent

**Severity:** P1 product/data architecture risk

**Risk:** new waves could continue adding facts independently to Profile, CV, Social, application or AI stores.

**Control:** freeze C2 now; Wave 2 cannot add another truth store. Any migration uses reconciliation and zero-silent-loss evidence.

### R3 — Paid priority visibility residue

**Severity:** P1 trust/business-model conflict  
**Evidence:** current `jobs` has boost fields and legacy `priority_visibility` entitlement machinery.

**Risk:** later code could reactivate paid organic ordering, violating adopted no-pay-to-win policy.

**Control:** target Opportunity contract excludes paid boost from organic relevance. Front 2 should add a safe contract-level prohibition/test or quarantine path without destructive retirement unless separately scoped.

### R4 — SSIS recommendation conflict

**Severity:** P1 hiring/fairness risk  
**Evidence:** current schema contains `composite_score` and `advance/review/decline_recommend`; repository evaluator computes these using model scores.

**Runtime note:** SSIS tables exist in connected non-prod, but the current Edge Function inventory does not show SSIS functions deployed there.

**Risk:** a future deployment could treat legacy model recommendation as an authorized hiring decision signal.

**Control:** C7/C8 supersede those semantics for future implementation. Do not delete current data blindly; prevent new target features from relying on the legacy recommendation as truth.

### R5 — University identity split unresolved

**Severity:** P1 institutional correctness/privacy risk

**Evidence:** academic affiliation references `universities_catalog`; owned University Profiles are anchored through the Directory/`companies` identity. Current safe University analytics fail closed where a trusted bridge does not exist.

**Risk:** automatic/name-based mapping could attach cohorts or disclose individuals to the wrong institution.

**Control:** no automatic matching. C6 keeps affiliation verification and cohort link independent from Profile ownership. Any future bridge requires an explicit auditable mapping contract/sub-packet.

### R6 — Purpose grants are not generalized

**Severity:** P1 privacy architecture risk

**Risk:** feature teams may keep adding coarse booleans and inconsistent consent semantics.

**Control:** C5 shared authorization envelope becomes the only new cross-actor disclosure primitive; existing toggles remain compatibility inputs until migrated.

### R7 — Event fragmentation

**Severity:** P2 now / P1 before Radar+Hiring integration

**Risk:** applications, Radar, Lammah and later employer events can disagree about outcome truth.

**Control:** C4 event contract must be implemented before Wave 4/Employer outcome unification.

### R8 — Saudi assumptions embedded in current tables

**Severity:** P2 now / strategic debt later

**Evidence:** current native job model and region table are Saudi-centric; Lammah already has country context.

**Control:** use C9 identifiers/adapters only where touched. Do not create speculative foreign infrastructure.

### R9 — Typography tracking defect risk

**Severity:** P1 design/accessibility/Arabic quality risk

**Evidence:** raw typography tokens apply negative letter spacing at larger sizes while Arabic must have zero tracking.

**Control:** Cursor must create language-safe typography semantics before broad rollout. No mass visual refactor required.

### R10 — Runtime/documentation stack drift

**Severity:** P2 documentation risk

**Evidence:** connected `jid-nonprod` currently reports PostgreSQL 17.x, while historical JID docs described PostgreSQL 15.

**Control:** current runtime truth wins. Front 2 must avoid assumptions tied to PG15 unless explicitly validated. Do not upgrade/downgrade as part of Wave 1.

## 3. Claim verification status

### VERIFIED

- Wave 1 prep branch lineage and current front branch exist.
- Directory/Profile/Verification separation exists in repo and non-prod schema.
- RLS is enabled on reviewed public domain tables in non-prod.
- CV data is stored independently today.
- Lammah source/provenance structures exist in repo and non-prod.
- legacy boost fields exist in non-prod.
- legacy SSIS assessment/recommendation tables exist in non-prod.
- University affiliation is currently direct Profile fields, not the adopted first-class relation.
- non-prod current database engine reports PostgreSQL 17.x.
- current non-prod Edge Function inventory does not list SSIS evaluator/generator.
- adopted typography files load IBM Plex Sans Arabic and Manrope.

### UNVERIFIED

- production schema parity;
- production database engine/version;
- production deployment of any reviewed legacy SSIS/boost behavior;
- real-user demand/retention/revenue impact of these architecture choices;
- any second-country market adapter need.

These are not Front 1 blockers because production access and market validation are outside Front 1 authority.

### CONTRADICTED / SUPERSEDED FOR TARGET ARCHITECTURE

- paid organic relevance via priority boost;
- legacy SSIS generic composite/AI recommendation as target hiring decision contract;
- `companies.claimed_by` as target owned-profile authority;
- Profile university FK as sufficient verified affiliation;
- one universal Job model as the whole Opportunity domain;
- CV-local storage as future canonical Career Record truth.

## 4. Front 2 stop conditions

Codex must stop before implementation and return `BLOCKED_WITH_EXACT_CAUSE` if:

1. re-verification shows non-prod schema materially differs from this evidence map;
2. enforcing C1–C10 requires a destructive migration rather than expand/contract;
3. a new shared dependency is required but lacks reuse/license/security decision;
4. a proposed contract would grant University/Government/employer broader personal-data access than C5 permits;
5. implementation requires deciding Wave 2+ product behavior rather than shared semantics;
6. implementation would restore paid organic ranking or legacy automated candidate recommendation;
7. a current runtime policy cannot be preserved safely without founder/legal/security decision.

## 5. Front 3 stop conditions

Cursor must stop if a visual component requires an enum, metric, permission or data state absent from the frozen contracts. It may not invent backend truth to complete UI.

## 6. Founder blockers

**None identified in Front 1.**

The material conflicts found are implementation/compatibility risks already resolved directionally by adopted founder decisions. They do not require reopening strategy before Front 2.

## 7. Production boundary

No production write, deployment, SQL, schema inspection or parity claim was performed. Production remains a separate explicit founder gate.
