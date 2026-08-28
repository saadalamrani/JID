# WAVE 2 CLOSEOUT REPORT

**Status:** WAVE_2_CLOSED  
**Branch:** `integration/wave2-final-closure`  
**Timezone:** Asia/Riyadh  
**Generated:** 2026-08-28

This is the Wave 2 final closeout. It is not another audit/review packet.

---

## SHAs

| Key                       | Value                                          |
| ------------------------- | ---------------------------------------------- |
| `WAVE_2_START_SHA`        | `e60c2bbc8787d3b0ffaaf75f89c4c5d703a16c8c`     |
| `CORE_IMPLEMENTATION_SHA` | `968c5c8f14224f4663d894f9412c5743b6db7484`     |
| `DB_VALIDATION_SHA`       | `fe4feca01840a096c95a8b333ba07785ba704282`     |
| `EXPERIENCE_SHA`          | `b489e3bbb0d06273691dd03f5a05a3f964df7841`     |
| `EXPERIENCE_MERGE_SHA`    | `28015bb9c4d3df7f32b729feecab8e693240fdad`     |
| `FINAL_SHA`               | recorded at the closeout commit on this branch |

Wave 3 canonical starting SHA = `FINAL_SHA` of this branch after the closeout commit.

---

## Experience merge

`EXPERIENCE_MERGED=YES`

Normal Git merge of `b489e3bbb0d06273691dd03f5a05a3f964df7841` into `integration/wave2-final-closure` starting from `fe4feca`. Ort strategy, no semantic conflict resolution. Cursor Experience/Harness work was not recreated manually.

---

## Atomic application snapshot (P1)

`ATOMIC_APPLICATION_SNAPSHOT=PASS`

Forward-only additive migration:

`jid-platform/supabase/migrations/20260828120000_wave2_create_application_cv_snapshot.sql`

Governed operation: `public.create_application_cv_snapshot`

It authenticates, row-locks the application, proves `applicant_id = auth.uid()`, proves CV ownership matches the same subject, uses `APPLICATION` purpose, preserves C5 BUSINESS recipient/purpose rules from `create_cv_projection_snapshot`, creates the immutable snapshot, and sets `applications.cv_snapshot_id` in the same function call. Existing non-null `cv_snapshot_id` fails closed (`unique_violation` / 409). No application-code two-step create-then-update.

Also added in the same additive migration:

- `advance_career_evidence_disclosure_policy` (immutable PRIVATE successor)
- `resolve_authorized_career_evidence_disclosure` (fail-closed + audit ALLOWED/DENIED)

---

## DB patch — non-production only

`DB_PATCH_NONPROD=PASS`  
`PRODUCTION_TOUCHED=NO`

| Item                                  | Result                                                |
| ------------------------------------- | ----------------------------------------------------- |
| Target ref proven                     | `hmjuijmaefajdjrjdsxu`                                |
| `current_database()` / `current_user` | `postgres` / `postgres`                               |
| Production `znfhladafpajyjwcfzvv`     | not contacted                                         |
| Dry-run                               | function created inside `BEGIN` then rolled back      |
| Applied                               | `20260828120000 wave2_create_application_cv_snapshot` |

### MIGRATION_HISTORY_AFTER (tail)

```
20260823181000  lammah_staff_auth_uid_bridge
20260827120000  wave2_career_record_core_expand
20260827120001  wave2_career_record_core_backfill
20260828120000  wave2_create_application_cv_snapshot
```

### Transactional proofs (rolled back; no durable test rows)

| Proof                     | Result                                                                     |
| ------------------------- | -------------------------------------------------------------------------- |
| SUCCESS                   | PASS — snapshot created and `applications.cv_snapshot_id` equalled that id |
| ROLLBACK / no orphan      | PASS — failed second link left snapshot count unchanged                    |
| CROSS USER                | PASS — other user received not-found/insufficient                          |
| EXISTING SNAPSHOT         | PASS — no silent overwrite                                                 |
| AUTHORIZATION fail-closed | PASS — expired grant; snapshot count unchanged                             |

`DATA_LOSS=0` evidence remains the DB-validation closeout at `fe4feca` (20 legacy source units, backfill idempotent, no fabricated verification/authorization). This patch is additive RPC/functions only; it does not rewrite legacy facts.

`RLS=PASS` and `PRIVACY=PASS` inherit the validated EXPAND/BACKFILL matrix at `fe4feca`. New functions are SECURITY DEFINER, execute revoked from `PUBLIC`/`anon`, granted to `authenticated`/`service_role`, and check `auth.uid()` internally. University affiliation, business actor type, and staff/admin role do not grant Career Record access.

---

## Career Record services

`CAREER_RECORD_SERVICES=COMPLETE`  
`DISCLOSURE_RESOLUTION=COMPLETE`

Implemented in `src/lib/career-record/service.ts` and adapters:

- list / get / create declared / revise / lifecycle
- get / update disclosure policy (append PRIVATE successor)
- authorize disclosure (full reviewed basis only; slim UI path fail-closes rather than inventing basis)
- resolve authorized disclosure (subject, object/category, recipient, purpose, ACTIVE, effective, not expired, not revoked)
- CV projection load / presentation / selection / preview / snapshot
- `createApplicationCvSnapshot` → `create_application_cv_snapshot` only

---

## API adapters

`API_ADAPTERS=COMPLETE`

Authenticated routes call the service layer; they do not duplicate business logic or expose raw SQL/PostgREST errors.

- `/api/me/career-record` and nested revise / lifecycle / disclosure-policy
- `/api/me/career-record/disclosure`
- `/api/me/cv-projection`, `/selection`, `/snapshot`
- `/api/me/applications/[id]/cv-snapshot`

Status mapping used: 401 / 403 / 404 / 409 / 422.

---

## Legacy compatibility

`LEGACY_COMPATIBILITY=COMPLETE`

`/profile/cv` and `/api/me/cv/**` remain. New education/experience factual edits also create/revise canonical Career Record evidence via `legacy-mirror.ts`. Legacy journey stays operational if the mirror cannot complete. No CONTRACT removal.

---

## Real frontend port binding

`REAL_FRONTEND_PORTS_BOUND=YES`

- `boundCareerRecordPort.availability = 'ready'`
- `boundCvProjectionPort.availability = 'ready'`
- Methods lazy-import server actions wrapping Core
- Unavailable seams remain for harness injection
- Share is `authorized` only when Core returns a valid active authorization
- Selection, verification, affiliation, and staff role do not imply share

---

## Generated types

`src/lib/supabase/types.ts` regenerated from non-production `hmjuijmaefajdjrjdsxu` after the new migration. Includes `career_evidence*`, `create_application_cv_snapshot`, and `applications.cv_snapshot_id`. Temporary `LooseClient` / `any` table surface removed from the Career Record service.

---

## AR / EN / RTL / LTR / accessibility

Inherited from Experience SHA `b489e3b` and re-verified by the injected-port harness after Core binding:

`ARABIC=PASS` `ENGLISH=PASS` `RTL=PASS` `LTR=PASS` `ACCESSIBILITY=PASS`

---

## Tests / typecheck / lint / build

Focused Vitest (`--pool=forks --maxWorkers=2`): **73 passed / 12 files** (`tests/unit/career-record`, `tests/unit/cv-projection`).

Default worker-pool mode was hung with no test output after >2 minutes and was stopped. Bounded forks mode passed. Recorded as infrastructure flake, not product failure.

| Check                                    | Result                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm type-check`                        | PASS                                                                                   |
| `pnpm lint` (`next lint`)                | PASS — No ESLint warnings or errors                                                    |
| `pnpm build` (`next build` 14.2.15)      | PASS — compiled, linted/typed, 313 static pages generated                              |
| `git diff --check`                       | PASS — no whitespace errors                                                            |
| scoped Prettier                          | applied to changed Core/test/script/closeout files (generated `types.ts` left as-is) |

---

## Runtime validation

Authenticated SQL proofs on non-production with `auth.uid()` JWT claims:

- Arabic/English projection locales are stored as `ar`/`en` and assembled by the snapshot RPC
- Career Record / CV Core paths are bound; empty vs populated is owner-scoped live data
- Add declared / fact correction / CV selection / presentation update exist as Core operations
- Privacy default remains PRIVATE; unauthorized share fail-closes
- Browser Vercel Preview SSO was not used in this closure. Limitation: no live browser walkthrough of logged-in AR/EN Career Record and CV Projection pages. Do not treat browser PASS as fabricated. Authenticated integration evidence is the SQL proofs + Vitest harness + typecheck/build.

---

## P0 / P1 / deferred

| Severity | Status                                    |
| -------- | ----------------------------------------- |
| P0       | NONE                                      |
| P1       | NONE — atomic application snapshot closed |

Deferred P2/P3:

- P3: `career-evidence` Storage bucket does **not** exist; zero artifact rows; no artifact-upload product in Wave 2. Not implemented. Do not claim Storage capability.
- P2: broader legacy dual-write (skills/additional/languages) and recipient-side Career Record read path beyond owner-facing resolve
- P2: repeatable committed RLS harness for the new RPCs (proofs ran as transactional SQL on nonprod)
- P3: destructive CONTRACT removal of `/profile/cv` and `/api/me/cv/**`

---

## Production

`PRODUCTION_TOUCHED=NO`

Production system `znfhladafpajyjwcfzvv` was not contacted, queried, migrated, or written.

---

## Wave 3

Canonical starting SHA = this branch `FINAL_SHA` after the closeout commit (do not start Wave 3 from `main` until this branch is integrated by founder decision).

`PRODUCTION_TOUCHED=NO` remains binding for Wave 3 start: production `znfhladafpajyjwcfzvv` was not contacted during Wave 2 closure.
