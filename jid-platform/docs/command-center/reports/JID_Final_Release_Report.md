# JID Final Release Report — Specifications 02 through 09

**Session:** 09-E  
**JID09_RUN_ID:** `jid09-20260801-7d956c`  
**Canonical integration branch:** `agent/nonprod-signup-fix`  
**Approved non-production Supabase project:** `hmjuijmaefajdjrjdsxu`  
**Deployed non-production app:** `https://jid-dev.vercel.app`  
**Report date (UTC):** 2026-08-02  

---

## 1. Declaration

**PROGRAM_PARTIALLY_SHIPPED**

Specification 09 (QA / release program) completed durable audit, reporting, evidence indexing, RUN_ID fixture cleanup, local validation, and closeout. This declaration is **not** `PRESENTABLE_MILESTONE_SHIPPED`.

## 2. Justification

Named blocker chains remain after honest Session 09-D CLASS_A closure:

1. **DEF-09C-015** — OPEN CLASS_B — self-review functional deny cell inconclusive in negative matrix evidence.
2. **DEF-09C-016** — OPEN CLASS_B — `/sys/claims` redirects to sys login rather than hard 404 / absence.
3. **DEF-09C-017** — OPEN CLASS_B — apply / publish audit-row proofs incomplete for release confidence.
4. **University public alias CDN residual** — sticky `X-Matched-Path: /404` HIT observed on alias after 09-D; local `next start` against same DB returned 200 (infrastructure / CDN limitation, not closed as product defect).
5. **Accessibility / Staff keyboard decision** — full keyboard-only Staff decision walk was PARTIAL FAIL under 09-C environment; not re-declared complete for presentable milestone.
6. **Deferred capabilities** still absent by design (evidence viewer, request-more-information, persisted checklist, Profile analytics, snapshot generation pipeline, broader theming, codebase-wide locale sweep).

Session 09-D ended **COMPLETE** (not BLOCKED). Partial shipping is driven by open CLASS_B + incomplete demonstrability, not by a 09-D BLOCKED outcome.

## 3. Starting SHA

Canonical tip at Session 09-E entry / closeout baseline:

`1438f437af964aa96a22e0cae7cf8cac4fe86a5e`

Session 09-D promoted implementation SHA (ancestral):

`396b86b09a6af8e46dc1d297eb544dcb1f1d857b`

## 4. Final promoted SHA note

Session 09-E produces a documentation / cleanup-evidence commit on `cursor/jid-09e-release-closeout`, validated on `codex/jid-09e-ci-validation`, then fast-forward promoted to `agent/nonprod-signup-fix`.

- Spec 09 **SHIPPED** as QA-release program closeout at the 09-E promoted SHA.
- Presentable milestone remains **partial** per section 1.
- Intervening commit after 09-D promote before 09-E work: `1438f43` — documentation-only Session 09-D CI/Vercel closeout.

## 5. Per-specification summary 02–09

| Spec | Status | Final session | Effective promoted / closeout SHA | Validation CI | Target CI | Evidence |
|---|---|---|---|---|---|---|
| 02 | SHIPPED | closeout (via Spec 03 gate) | `ed5bc4048733a654b72d544b38248e3854481540` | (ledger sparse) | (ledger sparse) | Spec 03 gate + Staff contracts |
| 03 | SHIPPED | 03-D | `548b40a8563ac22130d44c055c5eae2c638f4fb7` | `30168421689` | `30168577485` | `ui-evidence/spec-03/` |
| 04 | SHIPPED | 04-C | `68c656d7d01578a1eafb98a2f82d6819d3c63500` | PENDING in-ledger | PENDING in-ledger | `ui-evidence/spec-04/` |
| 05 | SHIPPED | 05-D (05-C SKIPPED) | `958ebf074a78d9883209fe4b63c844c77a37cce2` | PENDING in-ledger | PENDING in-ledger | `ui-evidence/spec-05/` |
| 06 | SHIPPED | 06-E | `760b86ade93469fc67ff61d0d95201ae771ee421` | `30595421094` | `30595593660` | `ui-evidence/spec-06/` + disposable transcripts |
| 07 | SHIPPED | 07-E | tip at 08-A entry `4214040ad2f058af88280a9a7cee7767ef9d89fa` (07-D `b77fca0…`) | PENDING in-ledger | PENDING in-ledger | `ui-evidence/spec-07/` + disposable transcript |
| 08 | SHIPPED | 08-E | `e65134c1dc0fc7b3798650a2f2c8ae7dd8842e11` | `30716480280` | `30716895763` | `ui-evidence/SPEC_08_CONSOLIDATED_INDEX.md` |
| 09 | SHIPPED (QA program) | 09-E | *(this session promote)*; 09-D impl `396b86b09a6af8e46dc1d297eb544dcb1f1d857b` | 09-D `30734152499`; 09-E recorded at promote | 09-D `30734274685`; 09-E recorded at promote | Defect Register + `ui-evidence/final-qa/` |

All listed SHAs verified as commits ancestral to tip `1438f43…` at 09-E entry.

## 6. Working route map (non-exhaustive, locked program)

- Public Directory / Catalog: `/catalog`, `/catalog/[slug]`
- Public Profiles: `/companies/[slug]/profile`, `/universities/[slug]/profile`
- Business lifecycle: pending / rejected / reapply / create-profile / profile / edit / suspended / dashboard
- University lifecycle: pending-review / rejected / reapply / create-profile / profile edit+preview / suspended / dashboard
- Staff Verification: `/staff/verification*`
- Directory corrections: Catalog entry + `/staff/directory/suggestions`
- Notifications: in-app inbox + Spec 03 outcome action URLs
- Sys: Staff/Super Admin internal surfaces; historical `/sys/claims` residual noted OPEN CLASS_B

## 7. Actor matrix

| Actor | Boundary |
|---|---|
| Individual | Public actor; cannot enter Staff / owner privileged routes |
| Business | Public actor; owner-scoped Profiles / dashboards |
| University | Public actor; owner-scoped Profiles / dashboards |
| Staff | Internal; assignment + review; no invented Admin authority |
| Super Admin | Internal override only where explicit; self-review still denied |
| Admin | No invented Staff decision authority |
| Anonymous | Public published-only; privileged denied |

Exactly three public actors preserved. Staff / Super Admin remain internal.

## 8. Negative authorization summary

Session 09-C matrix (`JID_09_Negative_Authorization_Matrix.md`): 28 cells; 20 PASS; 8 FAIL at capture time.

Session 09-D closed middleware empty-body FAILs (DEF-09C-008…013) and residue-driven owner/Staff shell failures (DEF-09B-002 family). Remaining open negative-facing CLASS_B: N10 / DEF-09C-015 (self-review inconclusive), N26 / DEF-09C-016 (`/sys/claims`).

## 9. Privacy

- Queue PII minimization and public published-only reads retained as Spec 08/09 evidence.
- Draft / suspended public denial evidenced.
- No owner-only fields on public Profiles in walked captures.
- No individual graduate data surfaces.
- Synthetic RUN_ID screenshots only; no secrets committed.
- Fixture cleanup verified; shared `jidseed.test` accounts retained (count 10).

## 10. Accessibility

- Notification surfaces: PASS (labels, unread not color-only).
- Staff keyboard-only full decision walk: not complete for presentable milestone (historical PARTIAL FAIL; see DEF-09C-014 closed with residue family; walk not re-certified as complete).
- Focus / semantic / touch-target expectations preserved in Spec 08 waves; 09-E does not invent new a11y gate closure beyond honest carry-forward.

## 11. AR/EN and RTL/LTR

- Spec 08 touched namespaces: AR/EN parity PASS; RTL/LTR logical properties PASS; Latin digits PASS; no Arabic letter-spacing on touched surfaces.
- Spec 09 entity-type source strings Verification / تحقق; alias stale مطالبة residual closed as deploy freshness (DEF-09B-001 CLOSED) with post-promote caveat.

## 12. Desktop / 375px

- Spec 08 wave evidence + Spec 09 final-qa captures include desktop and 375px for key journeys.
- No presentable claim that every blocked 09-B/09-C surface was re-captured at 375 after 09-D.

## 13. Dashboard honesty

- Business: real owner-scoped counts; zeros ≠ errors (Spec 08-B).
- University: present / absent / error honesty; snapshot pipeline deferred.
- No placeholder metrics / fake percentages / charts invented in this program.

## 14. Directory / Profile separation

- Directory records remain references; owned Profiles separate.
- Verification grants representation, not Directory ownership.
- Approval does not auto-create or auto-publish Profile.
- Creation deliberate; Profiles start draft; resources attach to Profiles.
- Corrections update permitted Directory fields only.
- Public links target published owned Profiles only (CDN residual noted for University alias).

## 15. Verification terminology / external contracts

- Visible journeys use Verification / تحقق.
- Visible Claim / مطالبة treated as defect when observed; closed at source tip.
- External schema-bound strings unchanged: `claim.*`, `claim_id`, `claimId`, `send-claim-approval`, `send-claim-rejection`, `staff.claim_reviewed`.

## 16. Publication

- Owner self-publication RPCs / UI preserved (Spec 07/08).
- Draft + suspended non-public.
- Suspension precedence retained.
- Publish audit completeness: OPEN CLASS_B DEF-09C-017.

## 17. Notifications

- One in-app notification per decision path (Spec 06).
- Approval / rejection destinations Spec 03-compatible.
- Email path intact per Spec 06 evidence.
- AR/EN parity on notification render.
- Recipient isolation retained; no cross-tenant visibility evidenced.

## 18. Directory correction

- Corrections update Directory only (Spec 06).
- Staff approve/reject RPCs; audit + suggester notification.
- 09-C Staff apply blocked by residue; 09-D repaired residue helpers; apply audit completeness remains CLASS_B (DEF-09C-017).

## 19. Defect outcome

| Class | Count | Outcome |
|---|---|---|
| CLASS_A | 12 | CLOSED in Session 09-D |
| CLASS_B | 3 | OPEN (carried through 09-E; not closed by program end) |
| Linked symptoms of DEF-09B-002 | — | CLOSED with DEF-09B-002 |

Open: DEF-09C-015, DEF-09C-016, DEF-09C-017.  
Closed: DEF-09B-001…005, DEF-09C-001, DEF-09C-008…013 (+ linked symptoms).

## 20. Known limitations

- University public alias CDN sticky 404 residual.
- Preview Vercel SSO-gated URLs.
- Ledger PENDING CI rows for Specs 04/05/07 final sessions (effective SHAs recovered from successor gates / commits).
- Spec 02 lacks dedicated ledger section (status via Spec 03 gate).
- Accessibility Staff decision walk not presentable-complete.
- Self-review cell inconclusive (CLASS_B).

## 21. Deferred capabilities

- Real evidence viewer
- Request-more-information workflow
- Persisted Staff checklist
- Profile analytics
- Snapshot generation pipeline
- Broader theming
- Codebase-wide locale sweep
- `university_dashboard_view` claimed_by residue (view untouched)
- Broader `viewer_approved_*` / claim_requests residue cleanup beyond 09-D helper repair

## 22. Standalone future tracks (not absorbed)

This program did **not** absorb:

- Catalog automated ingestion
- Lammah external-opportunity ingestion
- ابحث لي

## 23. CI / Vercel

Local Session 09-E validation (from `jid-platform/`):

- `git diff --check` PASS
- `corepack pnpm install --frozen-lockfile` PASS (package.json / pnpm-lock.yaml unchanged)
- `corepack pnpm lint` PASS
- `corepack pnpm type-check` PASS
- `corepack pnpm test` PASS — 382 passed / 100 skipped
- `corepack pnpm build` PASS

Session 09-D CI/Vercel (implementation):

- Validation CI PASS run `30734152499` @ `396b86b…`
- Target CI PASS run `30734274685` @ `396b86b…`
- Vercel READY for `396b86b…` (jid-dev + jid-platform)

Session 09-E CI/Vercel: recorded in ledger at promote time.

## 24. Rollback points

| Point | SHA |
|---|---|
| Pre-08-E tip | `8bf6bac76198533a5bff84dca24465ca4459368a` |
| Spec 08 SHIPPED | `e65134c1dc0fc7b3798650a2f2c8ae7dd8842e11` |
| Session 09-D implementation | `396b86b09a6af8e46dc1d297eb544dcb1f1d857b` |
| Tip at 09-E entry | `1438f437af964aa96a22e0cae7cf8cac4fe86a5e` |
| Session 09-E promote | *(final SHA after FF)* |

## 25. Fixture cleanup

**Result: PASS** — evidence `ui-evidence/final-qa/jid09-cleanup-result.md` (+ `.json`).

| Fixture class | Action | Verify |
|---|---|---|
| 19 RUN_ID auth users + identities + MFA | DELETE | auth users with email `%jid09-20260801-7d956c%` = 0 |
| public.profiles for those users | DELETE | 0 remaining |
| business_profiles / university_profiles (owned IDs) | DELETE | 0 / 0 |
| companies Directory rows (owned IDs) | DELETE | 0 |
| verification_requests (owned IDs) | DELETE | 0 |
| jobs / applications / notifications / correction | DELETE | removed |
| `_jid09_seed_auth_user` helper | DROP | dropped |
| Shared `jidseed.test` accounts | RETAIN | count remains 10 |
| Production data | never selected | n/a |

Retained fixtures: **none** for RUN_ID-owned objects after cleanup. Shared pre-existing friend accounts retained by policy (not RUN_ID-owned).

## 26. Production / branch safety

- `main` not used as promotion target
- Production not accessed; production ref refused by cleanup gates
- Historical mirror `agent/nonprod-signup-form` unchanged at `b29846b644ab2d94ec1d88b3a0954f2f30276452`
- No force-push; no merge commit; no `git reset --hard`
- No unauthorized cloud migration in 09-E (docs + cleanup evidence only)
- No secrets / real personal data committed
- No package / lockfile / schema / RLS / RPC / grant / view / trigger change in 09-E

## 27. Next action

**One post-program Fable audit** (not executed in Session 09-E).
