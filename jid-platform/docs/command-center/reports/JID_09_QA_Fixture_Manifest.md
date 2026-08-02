# JID Spec 09 — QA Fixture Manifest

**Session:** 09-A
**JID09_RUN_ID:** `jid09-20260801-7d956c`
**Created (UTC):** `2026-08-01T22:17:31.406Z`
**Environment:** non-production only
**Supabase project ref:** `hmjuijmaefajdjrjdsxu`
**Deployment URL:** `https://jid-dev.vercel.app`
**Credentials committed:** no
**Real personal/organizational data used:** no

## Creation mechanism

Run-scoped SQL applied through the repository non-production seed contract:

- Local ignored file: `jid-platform/.env.seed.nonprod`
- Affirmative class: `SEED_ENV=nonprod`
- Database path: `SEED_DATABASE_URL` (session-mode pooler for the approved project)
- Confirmation flag: `--i-confirm-non-production`
- Helper (local only, gitignored): `scripts/.tmp/jid09-setup-fixtures.mjs`

Passwords, tokens, cookies, recovery codes, and MFA secrets are **not** recorded in this manifest. Local operator secrets remain under gitignored `scripts/.tmp/jid09-secrets.json`.

## Fixture ownership / cleanup

Owned by Specification 09. Session **09-E** may remove or retire only fixtures tagged with this `JID09_RUN_ID`. Shared pre-existing `jidseed.test` friend accounts are out of scope for cleanup.

## Synthetic actors (aliases only)

| Alias | Email alias | User ID | Purpose |
|---|---|---|---|
| bizApplicant | `qa-biz-applicant-jid09-20260801-7d956c@jid09.test` | `bc19af98-4980-4dec-a40c-0e5ccaf28730` | Business applicant (pending verification) |
| uniApplicant | `qa-uni-applicant-jid09-20260801-7d956c@jid09.test` | `38a57154-a68e-4456-bd32-0cbe6ed63d6f` | University applicant (pending verification) |
| bizOwnerNoProfile | `qa-biz-noprofile-jid09-20260801-7d956c@jid09.test` | `352a8e00-727c-4e74-8a34-493613156b2f` | Approved business owner without Profile |
| bizOwnerDraft | `qa-biz-draft-jid09-20260801-7d956c@jid09.test` | `474fc107-ec97-4766-a641-731cec4f9fc2` | Business owner + draft Profile |
| bizOwnerPublished | `qa-biz-pub-jid09-20260801-7d956c@jid09.test` | `98d9a4fa-d0e5-40e3-9b51-8dfe7c92401d` | Business owner + published Profile |
| bizOwnerSuspended | `qa-biz-susp-jid09-20260801-7d956c@jid09.test` | `94a3f2a1-d683-443d-8cb6-02743ec7d8cb` | Business owner + suspended Profile |
| uniOwnerNoProfile | `qa-uni-noprofile-jid09-20260801-7d956c@jid09.test` | `92e6e708-9929-4b22-9e62-218217d0cc67` | Rejected university path / reapply state |
| uniOwnerDraft | `qa-uni-draft-jid09-20260801-7d956c@jid09.test` | `31c55b01-e2e6-407c-92d0-b8bcd706077b` | University owner + draft Profile |
| uniOwnerPublished | `qa-uni-pub-jid09-20260801-7d956c@jid09.test` | `b3a58500-eb8c-4c69-b34f-ef9429696eb3` | University owner + published Profile |
| uniOwnerSuspendedAbsentSnap | `qa-uni-susp-jid09-20260801-7d956c@jid09.test` | `60c7aff9-4b15-4c49-a54f-1020c71efd59` | University suspended + snapshot-absent path |
| uniOwnerPresentSnap | `qa-uni-snap-jid09-20260801-7d956c@jid09.test` | `6443c8c2-5e38-41d0-9885-5df4352ea0d9` | University owner for snapshot-present path |
| staffA | `qa-staff-a-jid09-20260801-7d956c@jid09.test` | `f7a4d98d-d37c-40a4-9bb1-f9578794b739` | Ordinary staff reviewer A |
| staffB | `qa-staff-b-jid09-20260801-7d956c@jid09.test` | `2390830b-5d80-4f1b-b16d-5f900ddc86b3` | Ordinary staff reviewer B |
| superAdmin | `qa-super-admin-jid09-20260801-7d956c@jid09.test` | `907110a9-def2-4bfc-862b-4f43ab4d7705` | Super Admin override actor |
| individual | `qa-individual-jid09-20260801-7d956c@jid09.test` | `70485eac-f022-440b-9482-468981a317fb` | Individual negative actor |
| staffSelfReviewApplicant | `qa-staff-self-jid09-20260801-7d956c@jid09.test` | `9afb3d54-9254-4e26-8cc0-9f3262264ec4` | Staff self-review denial fixture |
| correctionSuggester | `qa-corrector-jid09-20260801-7d956c@jid09.test` | `ddcf46b7-0bcc-4702-ad62-49a55c171d1e` | Directory correction suggester |
| assignApplicantA | `qa-asgn-a-jid09-20260801-7d956c@jid09.test` | `fccec4fc-c0c6-478b-8baf-abb122f6c086` | Applicant for Staff-A assigned request |
| assignApplicantB | `qa-asgn-b-jid09-20260801-7d956c@jid09.test` | `8a1c2ec1-da9a-43cd-b07c-182e76c06350` | Applicant for Staff-B assigned request |
| anon | _(no account)_ | — | Anonymous visitor |

## Synthetic states (object IDs)

### Verification requests

| Scenario ID | Verification ID | State |
|---|---|---|
| `vr-unassigned` | `a1d75d24-520f-496e-8277-bdde5b9bc7cc` | pending_review, unassigned (biz applicant) |
| `vr-assigned-a` | `d8c0209c-504e-4ead-aaf3-260357f9bdf8` | pending_review, assigned to staffA |
| `vr-assigned-b` | `7b145168-aaf6-408a-9f30-195cc858a1a8` | pending_review, assigned to staffB |
| `vr-self-review` | `6e239a7e-3343-46fa-a5c8-8655c6cd6d99` | pending_review, assigned to same staff applicant |
| `vr-approved-terminal` | `ac76d46a-062a-48ec-a3b4-779791dec0e2` | approved terminal (no auto Profile) |
| `vr-rejected-terminal` | `c453bc36-d8e2-46a5-bd0f-b99989312095` | rejected terminal with reapply window |
| `vr-uni-applicant-pending` | `bc81de91-8ae6-470f-bdd5-b848fa5629b7` | university applicant pending |

### Profiles

| Scenario ID | Profile ID | Kind | Status |
|---|---|---|---|
| `profile-biz-draft` | `3005b7b3-04da-4c7d-94e3-91dad3c5bce8` | business | draft |
| `profile-biz-published` | `453f05c4-ae04-4c3c-8436-0b3cbcc73d5a` | business | published |
| `profile-biz-suspended` | `d836c008-606c-40c4-b10b-0b4e10eb605b` | business | suspended |
| `profile-uni-draft` | `1363b626-3951-4147-afe6-72d3644ec20f` | university | draft |
| `profile-uni-published` | `59b94438-dc51-482c-8843-8982e01bf85a` | university | published |
| `profile-uni-suspended` | `411c0de5-a4c0-4c10-ae1d-3074f5c9ac6b` | university | suspended |
| `profile-uni-snap` | `f5248ca1-542c-4955-b2ac-85c850b3a9cb` | university | draft (snapshot-present attempt) |

### Directory / correction / dashboard support

| Scenario ID | Object ID | Notes |
|---|---|---|
| `dir-correction-target` | `b17d5770-44f5-43fb-8f12-4460ca536382` | Directory row for pending correction |
| `correction-pending` | `ac7fba8b-84bb-42ee-8f2c-d261175a6237` | Pending `city` correction suggestion |
| `job-published` | `5feb0d31-dfa7-4198-89f6-19bf9172910b` | Published job under biz published Profile |
| `application-one` | `93cdf558-ed0d-453d-9183-0d86e826abd7` | Application from individual actor |
| `notif-approved` | `957d6ad3-0e20-4e00-b3f0-cc5ba4c598db` | In-app approval notification fixture |
| `notif-rejected` | `91d7dc5e-e486-4d6e-9975-c9b0d4be92a2` | In-app rejection notification fixture |

## Session 09-B continuity updates (non-secret)

| Field | Value |
|---|---|
| continuity check (UTC) | 2026-08-02 |
| actors authenticating | 19/19 synthetic aliases (plus anon) |
| verification rows present | unassigned, assignedA, assignedB, selfReview, approvedTerminal, rejectedTerminal, uniApplicantPending |
| business_profiles present | draft / published / suspended for RUN_ID owners |
| university_profiles present | draft / published / suspended / snap-attempt for RUN_ID owners |
| Staff MFA | enrolled for `staffA`, `staffB`, `superAdmin`, `staffSelfReviewApplicant` (secrets remain gitignored; not recorded here) |
| app-layer read health | FAIL — authenticated reads hit missing relation `public.claim_requests` (see Defect Register DEF-09B-002) |
| destructive cleanup | none (reserved for 09-E) |
| preserved for 09-C | Directory correction pending; approval/rejection notification fixtures; Business published/suspended public cells; University profile rows; Staff assignment/self-review/terminal verifications |

## Known gaps for later sessions

1. Staff / Super Admin MFA — enrolled during 09-B (secrets local only).
2. University snapshot-present still depends on catalog linkage + dashboard refresh; owner dashboard surfaces blocked in 09-B by DEF-09B-002.
3. Anonymous actor needs no account; exercise via logged-out browser only.
4. Non-prod RLS references missing `public.claim_requests` — blocks trustworthy owner/applicant/Staff data reads until repaired outside 09-B.

## Session 09-C continuity updates (non-secret)

| Field | Value |
|---|---|
| continuity check (UTC) | 2026-08-02 |
| correction-pending | still `pending` (Staff apply not completed - Staff surface blocked) |
| directory correction target | present; `city` still null |
| notif-approved / notif-rejected | present; destinations Spec 03-compatible |
| Business public published | operable anonymously |
| University public published | still 404 at directory slug |
| app-layer read health | still FAIL (`public.claim_requests` missing) |
| destructive cleanup | none (reserved for 09-E) |
| preserved for 09-D / 09-E | all RUN_ID actors/objects retained; CLASS_A defects open for micro-fix |
