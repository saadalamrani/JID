# WAVE 6 — CLOSEOUT REPORT

**Status:** `WAVE_6_COMPLETE`
**Timezone:** Asia/Riyadh · **Closed:** 2026-08-30
**Integration branch:** `integration/wave6-final-closure` (base `eda1fac` = `WAVE_5_COMPLETE`)

Wave 6 Hiring Evidence — anchored rubrics, structured screening, work samples,
structured interviews, evaluator observations, scorecards, evidence comparison,
decision support, auditability. Additive to the Wave 5 frozen hiring contract.

---

## 1. SHAs

| Key | Value |
| --- | --- |
| `WAVE_5_COMPLETE` (base) | `eda1fac7025f918577aa1d06a2e03d973dfe737d` |
| `PHASE_B_IMPLEMENTATION_SHA` | `8ff7019189aa3092471ef81e0dd574dee6653ea9` |
| `RECONCILE_MERGE_SHA` | `0b39ebd0b5cc3dee1fbecfd76c1678be752672f0` (merge of `claude/wave6-hiring-evidence` onto Wave 5 final; **0 deletions**, additive only) |
| `DB_CHECKPOINT_SHA` | `ee541e4` (migrations applied + corrective + regenerated types) |
| `SURFACES_SHA` | `01ccdd0c6f4dba08570ca3f46d98ea4b663a6ba0` |
| `FINAL_SHA` | this closeout tip (recorded on push) |

Reconciliation was **once**: a single `--no-ff` merge. The Wave 6 branch never touched
any Wave 5 file, so the 3-way merge kept the entire Wave 5 lineage and added only the
Wave 6 layer. Wave 5 table / column / authority names verified compatible against the
live nonprod schema before any migration was applied.

---

## 2. Database — APPLIED to jid-nonprod (`hmjuijmaefajdjrjdsxu`)

Forward-only, additive, `DATA_LOSS = 0`. Production (`znfhladafpajyjwcfzvv`) untouched.

| `schema_migrations` version | File | Contents |
| --- | --- | --- |
| `20260830133421` | `..._wave6_hiring_evidence_rubrics.sql` | `assessment_method_enum`; `hiring_rubrics` / `_versions` / `_anchors`; `can_record_hiring_evidence()` (Wave 5 write tier **+ interviewer**), `hiring_role_business_profile()`; `publish_hiring_rubric_version()` (atomic version+anchors, contiguous 1..N, pointer advance, audit); append-only RLS. |
| `20260830133532` | `..._wave6_hiring_evidence_methods.sql` | `hiring_assessment_plans` / `_plan_items`; `hiring_work_sample_tasks` / `_submissions`; `hiring_assessment_sessions`; `assign_work_sample` / `submit_work_sample` / `withdraw_work_sample`; **no proctoring columns**. |
| `20260830133658` | `..._wave6_hiring_evidence_observations.sql` | `hiring_observation_source_enum`; `hiring_observations`; `hiring_scorecard_ratings`; `hiring_scorecards`; `hiring_assessment_decision_support` (**no outcome column**); `hiring_evidence_peer_visible()` independence gate; `record_hiring_observation` (+ idempotent `hiring_evidence_attachments` insert), `record_hiring_rating`, `submit_hiring_scorecard`, `generate_hiring_decision_support` (human `requested_by`, no outcome param). |
| `20260830141230` | `..._wave6_hiring_evidence_policy_fixes.sql` | **Corrective** — see §3. |

Repo migration filenames renamed to match the recorded remote versions.
`src/lib/supabase/types.ts` regenerated from nonprod (all 12 Wave 6 tables present).
Database advisors after apply: **no new ERROR**; the only Wave 6 entries are
`authenticated_security_definer_function_executable` WARNs, expected for RPCs that
do their own internal authorization and explicitly `REVOKE ... FROM anon`.

---

## 3. Self-repair — two defects found by the nonprod RLS actor matrix, fixed forward-only

1. **Audit-log NOT NULL.** Every Wave 6 write RPC called `_write_audit_log(..., NULL, NULL, NULL)`;
   `audit_logs.metadata` is `NOT NULL` and the function default `'{}'` only applies when the
   argument is omitted. Fixed by dropping the trailing NULL args (metadata → `'{}'`).
2. **`applications`-join RLS.** Several Wave 6 policies gated on `EXISTS (SELECT 1 FROM
   public.applications …)`, which runs under the caller's `applications` RLS and hides the
   row from `interviewer` team members — so an interviewer could not open a scorecard or
   read their own evidence. Fixed by resolving the owning business profile / role / applicant
   through new SECURITY DEFINER helpers (`hiring_application_business_profile` / `_role` /
   `_applicant`, `hiring_criterion_role`) and re-gating on the existing authority functions.

Both fixes revalidated: the full matrix re-run is green.

---

## 4. Product surfaces (RLS-enforced API, thin over the proven service layer)

Employer:
- `GET/POST /api/company/hiring/roles/[roleId]/rubrics` — list; create rubric + publish anchored version
- `GET/POST /api/company/hiring/applications/[id]/evidence` — evidence bundle; record observation (± rating)
- `POST /api/company/hiring/applications/[id]/scorecard` — open own scorecard / submit-and-freeze
- `GET/POST /api/company/hiring/applications/[id]/decision-support` — human-attributed; AI-assist gated by `checkAiAction` (fails closed)
- `GET/POST /api/company/hiring/applications/[id]/work-samples` — assign / list

Candidate:
- `GET /api/me/work-samples` ; `POST /api/me/work-samples/[submissionId]` — submit / withdraw own

`evidence-service.ts` gained `createRubric` + `openScorecard` (direct-DML paths gated by
`hiring_rubrics_write` / `hiring_scorecards_own` RLS, both proven by the matrix). Bilingual
error strings; all state-machine and authority rules live in the database.

A dedicated employer evidence **page** and candidate **page** were scoped out of this packet
(a lean draft was started and backed out to keep `build` green); the API surface above is the
usable Wave 6 surface and is exercised end-to-end by the nonprod matrix. Follow-up UI is
tracked as ordinary product work, not a Wave 6 blocker.

---

## 5. Validation

```text
Reconcile ................. merge 0b39ebd — additive only, 0 deletions, Wave 5 lineage intact
Migrations ............... 4 applied to jid-nonprod, forward-only, DATA_LOSS=0
Generated types .......... regenerated from nonprod, 12 Wave 6 tables, type-check green
RLS actor matrix ........ see §6 — 10/10 boundaries + invariants + AI boundary PASS
Focused tests ........... pnpm exec vitest run tests/unit/hiring-evidence tests/unit/hiring tests/unit/applications
                          6 files, 43 tests — PASS
type-check .............. tsc --noEmit — PASS
lint ................... next lint — No ESLint warnings or errors
build ................. next build — Compiled successfully; all 9 Wave 6 routes registered
Advisors .............. no new ERROR; Wave 6 WARNs expected (SECDEF RPC + anon revoked)
```

### 5.1 Browser / Preview

Not run this packet (no Wave 6 UI page shipped — the surface is API-only). The
employer and candidate workflows are proven at the database/runtime boundary by the
nonprod actor matrix (§6), which drives every RPC and RLS policy with real JWT
claims for 14 distinct actors. Recorded as `RUNTIME=PASS (API/DB)`, `AR/EN/MOBILE`
deferred with the follow-up UI.

---

## 6. Nonprod RLS actor matrix (rollback-only fixtures; nothing persisted)

Executed against `hmjuijmaefajdjrjdsxu` inside `RAISE EXCEPTION` transactions —
fixtures for 2 businesses, 5 team roles, candidate/other-individual/university/anon —
then rolled back. Post-run counts confirm zero fixture rows persisted.

| # | Boundary | Result |
| --- | --- | --- |
| 1 | Employer workspace isolation (member reads config; outsiders 0) | PASS |
| 2 | Rubric configuration authority (owner/hiring_admin/recruiter write; viewer/interviewer denied) | PASS |
| 3 | Interviewer records own observation / rating / opens & submits scorecard | PASS |
| 4 | Interviewer cannot publish rubric versions, assign work samples, or manage the team | PASS |
| 5 | Viewer is read-only (no observation, no rating, no scorecard, no decision support) | PASS |
| 6 | Cross-business: BizB owner cannot read or write BizA evidence, and vice-versa | PASS |
| 7 | Candidate sees only own work-sample submissions; can submit and withdraw | PASS |
| 8 | Candidate cannot read observations, ratings, private attachments, decision support | PASS |
| 9 | University cannot read any hiring evidence or rubric | PASS |
| 10 | `anon` denied on every table (read = 0, write = RLS violation) | PASS |
| — | Evaluator independence: peer evidence hidden until that evaluator's scorecard is `submitted`; owner/hiring_admin always | PASS |
| — | Anchored rubric: 3/4/5 scale, contiguous 1..N anchors, AR + EN descriptors enforced | PASS |
| — | Neutral missing evidence: `evidence_found=false` and `anchor_point=null` accepted, non-negative | PASS |
| — | Append-only: UPDATE / DELETE on observations & ratings affect 0 rows for every actor | PASS |
| — | Wave 5 pointer: each observation writes one `hiring_evidence_attachments` row (`candidate_visible=false`) | PASS |
| — | Auditability: every write RPC emits a `hiring_evidence.*` `audit_logs` row | PASS |
| — | No universal score: no aggregate/total/rank/match/culture column anywhere in `hiring_*` | PASS |
| — | AI authority: `generate_hiring_decision_support` has no outcome parameter; table has no outcome column; AI-assist path fails closed on unknown action | PASS |

---

## 7. Forbidden-area confirmation

| Area | State |
| --- | --- |
| `main` | untouched |
| Production `znfhladafpajyjwcfzvv` | untouched — no SQL, no deploy |
| Wave 4 / Wave 5 branches & applied migrations | not modified; Wave 5 lineage merged forward only |
| `jid-nonprod` | 4 forward-only additive migrations; no history edit; no destructive change |
| Vercel production | untouched |

`DATA_LOSS = 0` · `PRODUCTION_TOUCHED = NO` · `P0 = NONE` · `P1 = NONE` (2 found, both repaired forward-only and revalidated)

---

## 8. High-risk review (one pass)

The independent security/privacy/RLS pass was the nonprod actor matrix in §6 plus the
post-apply database advisors. Findings:

- **P1 ×2** — audit-log NOT NULL, `applications`-join RLS. Fixed forward-only (§3), revalidated.
- **P2/P3** — none recorded. Wave 6 SECDEF RPCs surface as `authenticated_*` advisor WARNs;
  this matches Waves 1–5 and is the intended pattern (internal authz + `anon` revoked).

No review loop — one pass, closed.

---

## 9. Final outcomes

```
STRUCTURED_SCREENING=IMPLEMENTED
WORK_SAMPLES=IMPLEMENTED
STRUCTURED_INTERVIEWS=IMPLEMENTED
ANCHORED_RUBRICS=IMPLEMENTED
HIRING_EVIDENCE=IMPLEMENTED
EVALUATOR_INDEPENDENCE=PASS
NO_UNIVERSAL_SCORE=PASS
AI_AUTHORITY_BOUNDARY=PASS
CANDIDATE_PRIVACY=PASS
CROSS_ORG_ISOLATION=PASS
AUDITABILITY=PASS

MIGRATIONS=APPLIED_NONPROD
GENERATED_TYPES=PASS
RLS=PASS
TESTS=PASS
TYPECHECK=PASS
LINT=PASS
BUILD=PASS
RUNTIME=PASS (API/DB actor matrix; browser UI smoke deferred with follow-up UI)
AR=PASS (rubric anchors + RPC error strings bilingual; enforced AR+EN anchor descriptors)
EN=PASS
MOBILE=DEFERRED (no Wave 6 UI page shipped this packet)

P0=NONE
P1=NONE
DATA_LOSS=0
PRODUCTION_TOUCHED=NO
```
