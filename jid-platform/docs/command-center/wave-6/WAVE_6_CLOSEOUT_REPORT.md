# WAVE 6 — CLOSEOUT REPORT

**Status:** `IMPLEMENTED_IN_BRANCH` — **NOT `WAVE_6_COMPLETE`.**
**Terminal token:** `BLOCKED_WITH_EXACT_CAUSE` (see §9).
**Timezone:** Asia/Riyadh · **Generated:** 2026-08-29
**Branch:** `claude/wave6-hiring-evidence`

Wave 6 Hiring Evidence — anchored rubrics, structured screening, work samples,
structured interviews, scorecards, evidence comparison, evidence auditability.
Additive to the Wave 5 frozen hiring contract.

---

## 1. SHAs

| Key | Value |
| --- | --- |
| `RESEARCH_BASE_SHA` | `c51d7d39688e74d62406aaf2ff5636c5ddd55128` (`integration/wave3-final-closure` docs tip) |
| `WAVE_5_CONTRACT_CHECKPOINT` | `70cbc302a024258789fe5621cc47825b4f58b1b7` (user-authorised as `WAVE_5_HIRING_CONTRACT_FROZEN`) |
| `PHASE_A_SHA` | `2f09851a15bface130d684901b5fb9014fd0f5fa` (`WAVE_6_PHASE_A_COMPLETE`) |
| `WAVE_5_MERGE_SHA` | `a70019f7f7a31ee0a25982683c2f59f78feac1e0` (merge of `70cbc30` contract-freeze only) |
| `PHASE_B_IMPLEMENTATION_SHA` | `8ff7019189aa3092471ef81e0dd574dee6653ea9` |
| `FINAL_SHA` | docs tip of this closeout (recorded on push) |

Ancestry verified: `70cbc30` parent = `c51d7d3` (research base) and `70cbc30` is a clean
ancestor of the live Wave 5 branch tip. Only the contract-freeze commit was merged; Wave 5's
in-progress implementation commits were **not** pulled in.

---

## 2. Phase A (research + architecture) — COMPLETE

| Deliverable | File |
| --- | --- |
| Current truth | `WAVE_6_CURRENT_TRUTH.md` |
| Reuse gate (OSS/market survey) | `WAVE_6_REUSE_GATE.md` |
| Evidence architecture draft + Phase B reconciliation | `WAVE_6_EVIDENCE_ARCHITECTURE_DRAFT.md` |

Reuse-gate outcome: **BUILD** in-repo on JID's Supabase/RLS substrate + Wave 2 patterns +
the Wave 5 contract; **EXTRACT_PATTERN** from IMS/1EdTech CASE (rubric → criterion → anchored
level) and structured-interview/BARS research; **REJECT** every OSS ATS platform as a
dependency (OpenCATS, FreeATS, Horilla, SpotAxis — wrong stack, no anchored-rubric model,
prohibitive integration cost) and **REJECT + name as anti-pattern** all autonomous LLM
scorers (HackerRank `hiring-agent`).

---

## 3. Phase B — reconciliation against the frozen Wave 5 contract

See `WAVE_6_EVIDENCE_ARCHITECTURE_DRAFT.md` §10. Summary:

- All dependency needs D1–D7 resolved against Wave 5 frozen objects; **no Wave 6-owned
  duplicate of Application / Role / Criteria / Stage / Outcome / team model**.
- Namespace reconciled from the draft's `assessment_*` to the **`hiring_*`** family, because
  Wave 5 ships `hiring_evidence_attachments` as the Wave 6 extension point and Wave 1
  `contracts/assessment.ts` owns `Assessment*` for the Wave 7 provider model.
- Wave 6 records attach through the Wave 5 `hiring_evidence_attachments` pointer table; Wave 6
  adds no column to any Wave 5 table.
- One additive authority helper: `can_record_hiring_evidence()` = Wave 5 write tier **+
  interviewer**. No redefinition of Wave 5 helpers.
- **No genuine conflict with Wave 5.** The frozen contract explicitly reserves this extension.

---

## 4. Implemented in branch

### 4.1 Contracts — `src/types/contracts/hiring-evidence.ts` (+ `index.ts`)

`ASSESSMENT_METHODS`, `METHOD_TO_EVIDENCE_KIND`, rubric/version/anchor, plan/plan-item,
work-sample task/submission, session, observation, rating, scorecard, comparison grid,
decision-support, and `AI_PERMITTED_ACTIONS` / `AI_FORBIDDEN_ACTIONS` / `AI_WRITABLE_TARGETS`.

### 4.2 Migrations (forward-only, additive; **remote apply NOT authorized** — see §9)

| File | Contents |
| --- | --- |
| `20260830120000_wave6_hiring_evidence_rubrics.sql` | `assessment_method_enum`; `hiring_rubrics` / `_versions` / `_anchors`; `can_record_hiring_evidence()`, `hiring_role_business_profile()`; `publish_hiring_rubric_version()` (atomic version+anchors, contiguous 1..N validation, pointer advance, audit); RLS (read = workspace member, write = write tier, versions/anchors append-only). |
| `20260830120100_wave6_hiring_evidence_methods.sql` | `hiring_assessment_plans` / `_plan_items`; `hiring_work_sample_tasks` / `_submissions`; `hiring_assessment_sessions`; `assign_work_sample` / `submit_work_sample` / `withdraw_work_sample`; RLS (employer config + candidate-owned submission access); **no proctoring columns**. |
| `20260830120200_wave6_hiring_evidence_observations.sql` | `hiring_observation_source_enum`; `hiring_observations`; `hiring_scorecard_ratings`; `hiring_scorecards`; `hiring_assessment_decision_support` (**no outcome column**); `hiring_evidence_peer_visible()` independence gate; `record_hiring_observation` (also idempotent `hiring_evidence_attachments` insert), `record_hiring_rating`, `submit_hiring_scorecard` (freeze rating set), `generate_hiring_decision_support` (human `requested_by`, no outcome param); append-only RLS (no UPDATE/DELETE for non-service actors). |

### 4.3 Services + pure logic — `src/lib/hiring-evidence/`

| File | Role |
| --- | --- |
| `rubric-validation.ts` | `validateRubricAnchors`, `isAnchorPointInScale` — mirrors the RPC guards |
| `evidence-authority.ts` | `canRead/Write/RecordHiringWorkspace`, `canSeePeerEvidence` (independence), `checkAiAction` (fail-closed AI boundary) |
| `evidence-comparison.ts` | `buildEvidenceComparisonGrid` (distinct anchors side-by-side, **no aggregation**), `assertNoAggregate` guard |
| `evidence-service.ts` | `server-only` RPC wrappers; `generateDecisionSupport` runs `checkAiAction` before any AI-assist ref is attached |

---

## 5. Validation

```text
pnpm exec vitest run tests/unit/hiring-evidence tests/unit/hiring tests/unit/applications
  PASS — 6 files, 43 tests
    rubric-validation.test.ts        7
    evidence-authority.test.ts      13
    evidence-comparison.test.ts      8
    hiring-evidence-contract.test.ts 4
    hiring-contract.test.ts (Wave 5) 3  (inherited, unchanged)
    triage-access.test.ts (Wave 4)   8  (inherited, unchanged)

pnpm type-check   PASS  (tsc --noEmit, strict, noUncheckedIndexedAccess)
pnpm lint         PASS  (next lint — No ESLint warnings or errors)
pnpm build        PASS  (next build — compiled, all routes generated)
```

### 5.1 Behaviour proven by focused tests

| Requirement | Test evidence |
| --- | --- |
| Anchored rubric: 3/4/5 scale, exactly N contiguous anchors, AR+EN descriptors | `validateRubricAnchors` — accept/reject count, gaps, duplicates, empty descriptor |
| "Insufficient evidence to rate" is first-class | `isAnchorPointInScale(null, n) === true` |
| Evaluator authorization: interviewer records but cannot configure; viewer read-only; non-member denied | `evidence-authority.test.ts` |
| Evaluator independence: peer hidden until scorecard submitted; owner/admin always | `canSeePeerEvidence` cases |
| No universal score: comparison grid has no total/rank/match; `assertNoAggregate` throws on `score`/`rank`/`match_percentage`/`cultureFit` | `evidence-comparison.test.ts` |
| AI boundary: permitted actions need a human requester; all forbidden actions refused; unknown fails closed | `evidence-authority.test.ts` |
| Method → Wave 5 evidence-kind mapping stays within the frozen `HIRING_EVIDENCE_KINDS` | `hiring-evidence-contract.test.ts` |

### 5.2 NOT executed this session (blocked — see §9)

Disposable PG17 migration replay; RLS actor/cross-org/anon/candidate-isolation negative
matrix against a live DB; generated `Database` types for the new tables; authenticated
browser smoke (AR/EN, RTL/LTR, mobile) of Wave 6 surfaces; database advisors. The one
independent security/privacy/RLS review is also pending (high-risk gate).

---

## 6. Quality / evidence principles — confirmed in design

Not created: universal candidate score, match %, culture-fit, personality, facial/voice/
emotion/attractiveness/body-language inference, autonomous rejection, autonomous hiring,
hidden model ranking as truth. Invasive proctoring not built (no camera/mic/keystroke/
plagiarism columns). Missing evidence (`evidence_found = false`, `anchor_point = null`) is a
neutral state. Evidence is always ROLE + CRITERION + METHOD scoped. See
`WAVE_6_EVIDENCE_CONTRACT.md` §2 for the enforced invariant table.

---

## 7. Fairness / privacy posture (design intent, not a legal claim)

Data minimization (evidence stores judgement + citations, not PII copies); purpose limitation
(rides Wave 2 `disclosure_authorizations`, never widened); candidate rights (own work-sample
submissions visible + withdrawable, consent recorded); retention (`retention_policy_ref`
pattern + audit log as durable record); explainability (rating → observation → citation →
anchor is walkable); evaluator accountability (`evaluator_id` + append-only corrections +
audit); no protected-attribute inference; AR/EN + RTL + a11y on all surfaces; consistent
method (`is_core` prompts, pinned rubric version per rating); evidence-based comparison (no
summed ranking). Adverse-impact statistics are Wave 8, not Wave 6. **No compliance claim.**

---

## 8. Forbidden-area confirmation

| Area | State |
| --- | --- |
| `main` | untouched |
| Production project `znfhladafpajyjwcfzvv` | untouched — no SQL, no deploy, no write |
| Cursor Wave 4 branch | untouched |
| Codex Wave 5 branch | not modified; only the frozen contract commit `70cbc30` was merged in (read-forward) |
| Applied migrations / Wave 5 migration files | unedited |
| `jid-nonprod` (`hmjuijmaefajdjrjdsxu`) | **no migration applied, no remote mutation** |

`DATA_LOSS = 0` · `PRODUCTION_TOUCHED = NO` · `P0 = NONE` · `P1 = NONE within Wave 6 scope`

---

## 9. Exact blocker & remaining work

`BLOCKED_WITH_EXACT_CAUSE`: Wave 6 cannot reach `WAVE_6_COMPLETE` because —

1. **Wave 5 is not complete.** Its own closeout ends `BLOCKED_WITH_EXACT_CAUSE`: the shared
   `jid-nonprod` migration history diverges from the canonical repository (remote-only
   versions `024`–`028`, `20260718063438`, `20260803001636`, `20260803054613` vs local-only
   historical versions); the Supabase CLI refuses even a dry-run; Docker Desktop is stopped
   so no disposable local database is available. The Wave 5 P1 runtime/DB-validation blocker
   is unresolved.
2. **The Wave 6 migration lane inherits that exact blocker.** Per operator instruction, no
   Wave 6 remote nonprod migration may be applied while the shared DB/migration lane is
   unresolved and Wave 4/Wave 5 hold the single-writer lock.
3. **The independent high-risk review** (security/privacy/RLS) has not been run.

### Path to `WAVE_6_COMPLETE`

1. Wave 5 produces its final integration lineage / SHA (P1 resolved: migration history
   reconciled without `migration repair`, disposable replay green, forward-only apply to
   `jid-nonprod`, `DATA_LOSS = 0`, types regenerated).
2. Reconcile Wave 6 ancestry **once** onto that lineage (contract already frozen; no Phase A
   restart). Re-run reconciliation §10 against Wave 5's final table/column names; fix any
   drift additively.
3. Apply the three Wave 6 migrations forward-only to `jid-nonprod` in a disposable replay
   first; run the RLS negative matrix (role criterion ownership, evaluator authorization,
   candidate isolation, other-Business isolation, Individual boundaries, screening lifecycle,
   work-sample lifecycle, interview plan, rubric anchors, evaluator evidence, immutable/
   audited history, AI-authority boundary, no autonomous decision, no universal score).
4. Regenerate `src/lib/supabase/types.ts`; wire the employer + candidate product surfaces
   (`WAVE_6_EVIDENCE_ARCHITECTURE_DRAFT.md` §7) and run the AR/EN + RTL/LTR + mobile browser
   smoke.
5. One independent security/privacy/RLS review; fix any P0/P1.
6. Push, record `FINAL_SHA`, set the outcome tokens, emit `WAVE_6_COMPLETE <FINAL_SHA>`.

---

## 10. Tokens

```
WAVE_6_PHASE_A_COMPLETE 2f09851a15bface130d684901b5fb9014fd0f5fa
WAVE_5_HIRING_CONTRACT_ADOPTED 70cbc302a024258789fe5621cc47825b4f58b1b7
WAVE_6_PHASE_B_IMPLEMENTED_IN_BRANCH 8ff7019189aa3092471ef81e0dd574dee6653ea9

STRUCTURED_SCREENING=IMPLEMENTED_IN_BRANCH
WORK_SAMPLES=IMPLEMENTED_IN_BRANCH
STRUCTURED_INTERVIEWS=IMPLEMENTED_IN_BRANCH
ANCHORED_RUBRICS=IMPLEMENTED_IN_BRANCH
HIRING_EVIDENCE=IMPLEMENTED_IN_BRANCH
HUMAN_DECISION_AUTHORITY=VERIFIED (static + focused tests; DB negative matrix pending)
P0=NONE
P1=NONE (within Wave 6 scope; Wave 5 P1 is the external blocker)
PRODUCTION_TOUCHED=NO
```

```
BLOCKED_WITH_EXACT_CAUSE: Wave 5 P1 unresolved (jid-nonprod migration history diverges
from the canonical repository; Supabase refuses dry-run/apply; no disposable local DB
because Docker is stopped). Wave 6 schema, contracts, services, and focused tests are
implemented and green in claude/wave6-hiring-evidence; remote migration apply, the RLS
negative matrix, generated types, browser smoke, and the one independent review are held
until Wave 5's final integration lineage is available. Reconcile ancestry once from that
lineage, then complete steps 3–6 in §9 to emit WAVE_6_COMPLETE.
```
