# WAVE 6 — REUSE GATE

**Question:** For structured screening, work samples, structured interviews, anchored
rubrics, scorecards, evidence comparison, and evidence auditability — do we ADOPT / FORK /
INTEGRATE / EXTRACT_PATTERN / BUY-PARTNER / BUILD / REJECT?

**Method:** Internal-first, then serious OSS/market survey. Candidates assessed on license,
maintenance, architecture fit, extensibility, security, privacy, fairness, hiring-domain
quality, API/data model, localization, and integration cost — **not stars**. Proprietary
products and research are used as conceptual benchmarks only; no proprietary implementation
is copied.

**Date:** 2026-08-29 · **Base:** `c51d7d3` (`integration/wave3-final-closure`)

---

## 1. Internal-first

JID already owns most of the substrate:

| Stage | Existing JID asset |
| --- | --- |
| Employer identity / owned profile | `business_profiles.owner_user_id`, `src/lib/applications/triage-access.ts`, RLS `115`/`116` |
| Application object + pipeline status | `public.applications`, `application_status_enum`, triggers (`048`) |
| Disclosure-gated access to candidate material | `disclosure_authorizations`, `create_application_cv_snapshot` (`20260828120000`) |
| Immutable, manifest-backed snapshots | `create_cv_projection_snapshot`, `cv_snapshot_purpose_enum` |
| Immutable-policy successor pattern | `advance_career_evidence_disclosure_policy` |
| Audit trail | `public._write_audit_log(...)`, `governance` / `staff` libs |
| Reference/version guard | `private.jid_is_reference_json` |
| RLS + staff bypass conventions | `is_privileged_staff()`, per-table policies, `anon` denied |
| Bilingual + RTL infra | `src/lib/i18n`, `messages/*` |

**What is genuinely missing:** a multi-evaluator authorization model (Wave 5), and the
entire method → rubric → observation → decision layer (Wave 6).

**Decision for the internal hiring substrate:** **INTEGRATE / EXTEND** — build Wave 6
evidence tables and services against the frozen Wave 5 contract; reuse Wave 2 disclosure,
snapshot, audit, and immutability patterns verbatim in shape. Do **not** rebuild
applications, jobs, or disclosure.

---

## 2. OSS candidates surveyed

### 2.1 Full open-source ATS / recruitment platforms

| Candidate | License | Stack | Maintenance | Evaluation model | Verdict |
| --- | --- | --- | --- | --- | --- |
| **OpenCATS** (`opencats/OpenCATS`) | MIT | PHP + MySQL, legacy MVC | Active (~929 commits, CI) | CRM/pipeline + attachments; **no anchored rubric / criterion evidence**; free-text notes | **REJECT** as dependency; **EXTRACT_PATTERN** (pipeline stages, candidate–job join, activity log) |
| **FreeATS** (`freeats/freeats`) | MIT | Ruby on Rails 7.1 + Postgres | Active but small (~140 commits, 45★) | Candidate "feedback + rating" = free-text + simple score; no criterion/method scoping | **REJECT** as dependency; **EXTRACT_PATTERN** (scorecard-per-interviewer, visibility-after-submit) |
| **Horilla HRMS** (`horilla-opensource/horilla`) | LGPL-2.1 | Django 5 + Postgres + HTMX | Active (large) | Recruitment module: pipeline stages, interview scheduling; evaluation infra shallow / undocumented | **REJECT** — full HRMS, wrong stack, LGPL coupling risk for embedded reuse; **EXTRACT_PATTERN** (drag-drop stage config UX only) |
| **SpotAxis** (`Assystant/SpotAxis`) | Open source (GPL-family) | Django | Sporadic | End-to-end ATS; no serious structured-evaluation layer | **REJECT** |
| **Reqcore** (`reqcore-inc/reqcore`) | *was* AGPLv3 | (was) full ATS | **Dead** — "no longer maintained as open source; moved to private codebase", 0★, 2 commits | Marketed transparent per-criterion AI scoring w/ override + audit | **REJECT** (unavailable); keep the *concept* — per-criterion breakdown + mandatory human override + decision audit — as a design target we already intend to exceed |

**Common reasons full ATS platforms fail the gate:** wrong runtime (PHP/Ruby/Django vs
JID's Next.js + Supabase/Postgres + RLS), their own auth/tenant model (incompatible with
JID owned-profile + RLS), no anchored/behaviorally-anchored rubric model, shallow
free-text evaluation, and prohibitive integration cost (re-platforming, not embedding).
Forking any of them = owning a second product. **No ADOPT, no FORK, no INTEGRATE.**

### 2.2 Competency-framework / rubric standards & engines

| Candidate | License | Notes | Verdict |
| --- | --- | --- | --- |
| **1EdTech / IMS CASE** (Competencies & Academic Standards Exchange, v1.1) | Open specification | JSON data model with exactly `CFRubric` / `CFRubricCriterion` / `CFRubricCriterionLevel` + framework/definition/association; REST binding | **EXTRACT_PATTERN** — adopt the *shape* (framework → criterion → anchored level, stable identifiers, versioned documents) and interoperability vocabulary for a future Wave 13 export. Do **not** adopt the service, JSON-LD stack, or EdTech semantics. |
| **CaSS** (`cassproject/CASS`) | Apache-2.0 | Full platform: Node/Express + Vue + **Elasticsearch**; competency frameworks, assertions, rubrics, learner profiles | **REJECT** as dependency (Elasticsearch, full platform, EdTech assertion model); **EXTRACT_PATTERN** (framework authoring + assertion-of-attainment separation mirrors our observation vs rating split) |
| **STRIDE matrix** (`stride-so/matrix`) | Open | JSON-encoded software-eng competency matrix (role expectations by level) | **EXTRACT_PATTERN** — example of criterion-by-level anchoring in JSON; content is domain-specific, not a framework we adopt |
| **DIRECT framework** | Open (JSON/CSV) | Digital-research competency taxonomy | Reference only |

### 2.3 Autonomous LLM resume/interview scorers — **negative benchmark**

| Candidate | License | Notes | Verdict |
| --- | --- | --- | --- |
| **HackerRank hiring-agent** (`interviewstreet/hiring-agent`) + forks (`todddong/hackerrank-resume-ats`, `elroy-jahja-loo/hackerrank-ats-optimizer`) | Open | Python CLI: LLM parses resume → sectioned JSON → 4-category "objective evaluation" with scores, bonuses, deductions; augments with GitHub signal; 6 LLM calls/resume | **REJECT + prohibited pattern.** Independent analysis found subjective category scores "swing wildly" between runs while being presented as objective. This is precisely JID's forbidden zone: universal score, hidden model ranking as truth, autonomous evaluation. |

**Extract only** the two useful lessons, both of which JID's design already encodes:
1. Show *evidence, bonuses, and deductions* transparently rather than a bare number.
2. A single LLM-generated numeric verdict is non-reproducible → never authoritative.

### 2.4 Work-sample / take-home platforms

Market is commercial (CodeSubmit, CoderPad, CodeSignal, Coderbyte, TestGorilla). No
credible embeddable OSS. Repo-based take-home (clone → real commits → reviewer sees history)
is a good UX pattern. Several vendors lean on proctoring/anti-cheat that **JID explicitly
forbids** (camera/voice/keystroke surveillance).

**Verdict:** **BUILD** a minimal, rights-respecting work-sample lifecycle (task → submission
→ rubric → observation → result). **EXTRACT_PATTERN**: async task definition, expected-evidence
declaration, reviewer rubric attached to the task, submission artifact links. **REJECT**:
all proctoring, camera/voice analysis, plagiarism-as-verdict.

### 2.5 Structured-interview methodology (research, not code)

| Source | Use |
| --- | --- |
| US OPM — *Structured Interviews* guidance | Job-analysis → criteria → consistent questions → BARS → independent ratings → combine. Design authority. |
| ETS Research Report (Kell et al., 2017) — developing BARS for structured interviews | Anchor construction methodology (behavioral, level-distinct, evidence-referenced). |
| Schmidt & Hunter; structured-interview meta-analyses | Structure raises validity (~.20 → ~.51+, BARS higher) **and lowers adverse impact** (Black–White d≈0.23 structured vs ≈0.56 unstructured). Justifies the whole wave. |
| EEOC / Uniform Guidelines | Retain scorecards (≥1 yr; 2 yr federal contractors); documented evidence per rating is what makes a decision defensible → drives our immutable audit requirement. |

**Verdict:** **ADOPT methodology**, cite as authority in the evidence contract. No code.

---

## 3. Outcome summary

| Candidate | Decision |
| --- | --- |
| JID internal hiring substrate (applications, disclosure, snapshots, audit) | **INTEGRATE / EXTEND** |
| Wave 5 hiring contract (Application/Applicant/Role/Criteria/Stage/Outcome) | **CONSUME — do not redefine** (contract-gated) |
| OpenCATS / FreeATS / Horilla / SpotAxis | **REJECT** as dependency · **EXTRACT_PATTERN** (pipeline, per-interviewer scorecard, visibility rules) |
| Reqcore | **REJECT** (dead) · keep concept: per-criterion breakdown + human override + audit |
| IMS CASE spec | **EXTRACT_PATTERN** (framework → criterion → anchored level model; export vocab for later) |
| CaSS | **REJECT** as dependency · **EXTRACT_PATTERN** (authoring vs assertion separation) |
| STRIDE matrix / DIRECT | **EXTRACT_PATTERN** / reference |
| HackerRank hiring-agent & forks | **REJECT + PROHIBITED PATTERN** (negative benchmark) |
| Commercial work-sample/proctoring platforms | **EXTRACT_PATTERN** (async take-home UX) · **REJECT** proctoring |
| Structured-interview / BARS research (OPM, ETS, EEOC) | **ADOPT METHODOLOGY** |
| Greenfield rewrite of applications/jobs/disclosure | **REJECT** — extend, don't rebuild |
| Any third-party runtime dependency for evaluation logic | **REJECT** — keep it in-repo, RLS-governed, auditable |

**Bottom line:** **BUILD** the Wave 6 evidence layer inside JID, on JID's own Postgres/RLS
substrate and Wave 2 patterns, against the frozen Wave 5 contract — informed by the CASE
rubric shape and the structured-interview research, and deliberately *not* resembling the
autonomous-scoring products in the market.

---

## 4. Integration-cost note (why not adopt a platform)

Adopting any surveyed ATS would require: a second auth/tenant system reconciled with JID
owned profiles + RLS; a data bridge between two application tables; a second deployment
target and language runtime; loss of RLS as the enforcement boundary; and re-implementing
AR/EN + RTL. The evaluation-evidence schema itself (the actual Wave 6 value) is ~6–10
tables and a handful of fail-closed RPCs — smaller than the bridge code alone. Build is
cheaper, safer, and auditable.
