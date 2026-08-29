# WAVE 6 — CURRENT TRUTH

**Wave:** 6 — Hiring Evidence
**Timezone:** Asia/Riyadh
**Generated:** 2026-08-29
**Phase:** A (research + architecture). Phase B is contract-gated — see §8.

---

## 1. Git / environment

| Key | Value |
| --- | --- |
| `RESEARCH_BASE_BRANCH` | `integration/wave3-final-closure` |
| `RESEARCH_BASE_SHA` | `c51d7d39688e74d62406aaf2ff5636c5ddd55128` (docs-only tip after Wave 3 product `FINAL_SHA` `7740328`) |
| `WORK_BRANCH` | `claude/wave6-hiring-evidence` (worktree off the research base) |
| `NONPROD_REF` | `hmjuijmaefajdjrjdsxu` (shared nonprod — Wave 4 + Wave 5 concurrent) |
| `PRODUCTION_REF` | `znfhladafpajyjwcfzvv` — **forbidden, not touched** |
| `PRODUCTION_TOUCHED` | `NO` |
| `MIGRATION_COUNT_AT_BASE` | 146 (`supabase/migrations/`), newest `20260828120000_wave2_create_application_cv_snapshot.sql` |

### Do not touch

- `main`
- `Production` / production project `znfhladafpajyjwcfzvv`
- Cursor Wave 4 branch (Radar + Abhathli)
- Codex Wave 5 branch (Employer Foundation + Hiring Workspace)
- Any protected JID-107 suspended-profile migration/RLS file

---

## 2. Wave map position (`MASTER_PLAN.md`)

| Wave | Scope | Status vs Wave 6 |
| --- | --- | --- |
| 2 | Career Record + CV/projection system | **CLOSED** — substrate Wave 6 builds on (evidence, disclosure, snapshots, audit) |
| 3 | Opportunity Graph + Lammah source/provenance | **CLOSED** — research base |
| 4 | Radar + Abhathli career-search copilot | concurrent (Cursor) — no shared surface with Wave 6 |
| 5 | Employer Foundation + Hiring Workspace + first economic loop | **concurrent (Codex) — hard dependency** |
| **6** | **Hiring Evidence: structured screening, work samples, structured interviews, anchored scorecards** | **this wave** |
| 7 | Assessment orchestration + recorded-interview/provider layer | **out of scope** — do not pull forward |
| 8 | Talent sourcing + candidate evidence comparison + hiring intelligence | later |

Wave 6 owns the **method → rubric → observation → human decision** layer on top of whatever
application/pipeline model Wave 5 freezes. Wave 6 does not define the pipeline; it attaches
structured evidence to it.

---

## 3. What exists today for hiring (proven from the tree)

### 3.1 Jobs + applications (`supabase/migrations/048`, `114`–`117`, `20260828120000`)

| Object | Shape (relevant columns) | Notes |
| --- | --- | --- |
| `public.jobs` | `id, company_id, business_profile_id, title_ar/en, description_*, experience_level, status(job_status_enum), application_deadline, applicant_count, created_by` | Anchored to owned `business_profiles` (Layer 3). `company_id` retained for taxonomy/display only. `business_profile_id` NULL only for legacy pre-P110 rows. |
| `public.applications` | `id, job_id, applicant_id, company_id, status(application_status_enum), cover_letter, resume_url, contact_email, submitted_at, last_company_action_at, expires_at, cv_snapshot_id` | One row per `(job_id, applicant_id)`. `company_id` synced from job by trigger. |
| `application_status_enum` | `draft | submitted | under_review | shortlisted | rejected | invited | withdrawn | expired` | Coarse pipeline. No stage/criterion/evaluation concept. |
| `public.application_intents` | `job_id, user_id` | Pre-application interest only. |
| `create_application_cv_snapshot(...)` | RPC | Atomic, fail-closed: creates one immutable `APPLICATION` CV projection snapshot and links `applications.cv_snapshot_id`; no silent overwrite; requires an ACTIVE `disclosure_authorizations` row with `recipient_type = BUSINESS` matching the application company. |

### 3.2 Employer-side access (`src/lib/applications/triage-access.ts`, RLS `115`/`116`)

- Employer identity today = **single owner**: `business_profiles.owner_user_id = auth.uid()` (+ `status <> 'suspended'`).
- Transitional fallback: `companies.claimed_by = auth.uid() AND entity_state = 'approved'` for pre-Profile jobs.
- **There is no multi-user hiring team, evaluator seat, interviewer, or role-scoped employer membership model in the repo at base.** Any such model is expected from Wave 5. Wave 6 must not invent it unilaterally.
- Staff bypass: `public.is_privileged_staff()`.
- Application read/update for employers is gated through `jobs` ownership (`applications_owner_read`, `applications_owner_update_status`).

### 3.3 Wave 2 substrate Wave 6 will reuse (`20260827120000`, `20260828120000`)

| Capability | Object | Reuse intent for Wave 6 |
| --- | --- | --- |
| Candidate-owned evidence | `public.career_evidence` (+ revisions, `career_evidence_category_enum`, `_source_class_enum`, `_state_enum`, `_lifecycle_enum`) | **Naming boundary:** `career_evidence` is the *candidate's own record*. Wave 6 employer-side evaluation data must NOT reuse this table or the `career_evidence*` prefix. Use a distinct namespace (§ architecture draft). |
| Purpose-bound disclosure | `public.disclosure_authorizations` (`recipient_type`, `purpose_code`, `basis_type`, `state`, `effective_at`, `expires_at`, `revoked_at`, `object_ref`, `retention_policy_ref`) | Wave 6 evidence that references candidate-disclosed material must ride existing authorizations; never widen them. |
| Immutable snapshots | `create_cv_projection_snapshot(...)`, `cv_snapshot_purpose_enum` | Pattern for immutable, manifest-backed evidence snapshots (screening packet, scorecard freeze). |
| Audit | `public._write_audit_log(actor uuid, action text, entity_type text, entity_id uuid, old jsonb, new jsonb, meta jsonb, ip inet, ua text)` | Wave 6 writes an audit row on every consequential evaluation event. |
| Reference-object guard | `private.jid_is_reference_json(jsonb)` | Versioned policy/reference fields (`retention_policy_ref`, `rubric_ref`). |
| Immutable-policy successor pattern | `advance_career_evidence_disclosure_policy` | Pattern for "policies never mutate; a change appends a successor and advances a pointer" — directly applicable to rubric versioning. |
| `private` schema | present, `USAGE` to `authenticated`/`service_role` only | Home for deterministic Wave 6 helpers. |

### 3.4 Platform conventions (must match)

- Next.js 14.2.15 App Router, `src/app/[locale]/…`, `server-only` libs under `src/lib/**`.
- Supabase Postgres; **RLS on every table**, `anon` denied, `authenticated` scoped by `auth.uid()`, staff via `is_privileged_staff()`.
- Migrations forward-only, additive, `IF NOT EXISTS` / `DO $$ … duplicate_object` idioms; timestamp prefix `YYYYMMDDHHMMSS_*.sql`.
- Bilingual AR/EN, RTL/LTR; enum values match frozen TS contracts exactly.
- `DATA_LOSS=0`. One remote DB writer at a time; check `supabase/migrations` history before any nonprod apply.
- Gates: `pnpm lint` (zero warnings), `pnpm type-check`, focused tests, `pnpm build`, runtime/browser where relevant; **one** independent review for high-risk security/privacy/RLS.

---

## 4. Reality drift (ADAPT / PRESERVE)

| Finding | Class |
| --- | --- |
| `applications` pipeline is a single coarse status enum; no stage graph | PRESERVE at base; **Wave 5 owns** any stage model — Wave 6 consumes it |
| Employer = single `owner_user_id`; no evaluator/interviewer identity | ADAPT — Wave 6 needs multi-evaluator authorization; **must come from or be reconciled with Wave 5** |
| `create_application_cv_snapshot` already encodes disclosure-gated employer access to candidate material | PRESERVE + extend pattern |
| No rubric / criterion / observation / scorecard tables anywhere | PRESERVE (greenfield within Wave 6 namespace) |
| Wave 2 `career_evidence` naming collision risk | PRESERVE Wave 2; Wave 6 uses separate namespace |
| Abhathli / match % / commitment_score ranking | Wave 6 must not consume or reproduce as evaluation signal |
| `companies.commitment_score` drives application SLA | PRESERVE (unrelated to evaluation evidence) |

**REALITY_DRIFT:** `MODERATE` — the hiring domain below Wave 6 is thin and Wave-5-owned; the
evaluation-evidence layer is genuinely greenfield and can be designed cleanly, but its
foreign keys and authorization model cannot be frozen until the Wave 5 hiring contract lands.

---

## 5. Wave 6 binary outcomes (target)

| Token | Meaning |
| --- | --- |
| `STRUCTURED_SCREENING` | Criterion-based screening with evidence-requested / evidence-found / evaluator observation / anchored decision support / audit trail |
| `WORK_SAMPLES` | Employer-defined task → instructions → expected evidence → deadline → submission → rubric → observations → result; no invasive proctoring |
| `STRUCTURED_INTERVIEWS` | Interview plan → criterion/question mapping → consistent core questions → optional follow-ups → interviewer assignment → evidence notes → anchored rubric → independent inputs → final human review |
| `ANCHORED_RUBRICS` | Criterion + method-scoped anchored scales; employer-defined; versioned/immutable |
| `HIRING_EVIDENCE` | Every rating traces to an observation, a criterion, a method, and a rubric anchor; comparison view; full auditability |
| `HUMAN_DECISION_AUTHORITY` | No autonomous score-as-truth, no autonomous reject/hire; AI is assistive and bounded |

---

## 6. Front budget (proposed, Phase A)

**1 FRONT** for Phase B implementation. Rationale: one coherent closure unit —
schema + services + RLS + product surface for evaluation evidence on a frozen Wave 5
contract. Escalate to 2 Fronts only if the Wave 5 contract forces a genuine
backend/experience split with non-overlapping ownership. Reuse gate + architecture are
performed in Phase A by this owner (no separate research Front).

---

## 7. Explicit non-goals (quality/evidence principles)

Wave 6 will **not** create: universal candidate score, match %, culture-fit score,
personality score, facial/voice/emotion/attractiveness/body-language inference, autonomous
rejection, autonomous hiring, or hidden model-based ranking presented as objective truth.
Assessment evidence is always contextual to **ROLE + CRITERION + METHOD**. A person is not
"82/100". Missing evidence is not automatic failure. No protected-attribute inference.

---

## 8. Dependency gate

Wave 5 (Employer Foundation + Hiring Workspace) is executing concurrently under Codex.

Wave 6 **must not** implement database/application-workflow assumptions until Codex publishes:

```
WAVE_5_HIRING_CONTRACT_FROZEN <SHA>
```

Wave 6 does **not** redefine: Application, Applicant, Hiring Role, Hiring Criteria,
Hiring Stage, Outcome. Wave 6 **extends** that model with evidence.

At Phase-A close, if the checkpoint is absent:
`STOP IMPLEMENTATION CLEANLY` → emit `WAITING_FOR_WAVE_5_HIRING_CONTRACT`.

Checked at Phase-A completion: **no `wave-5` / hiring-contract branch or checkpoint exists
on `origin`** (`git ls-remote origin | grep -iE 'wave-?5|hiring'` → empty).
