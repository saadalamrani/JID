# JID Spec 06 — Session D Notifications Disposable Database Transcript

## Environment

| Field | Value |
|---|---|
| Project | `jid-06d-disposable` |
| API | `127.0.0.1:58521` |
| DB | `127.0.0.1:58522` |
| Shadow | `58520` |
| Studio | disabled (unhealthy on first attempt; not required for matrix) |
| Inbucket | `58524` |
| Pooler | `58529` |
| Analytics (disabled) | `58527` |
| Cloud / linked | none |
| Credentials | local demo JWT only |
| Seed | disabled (missing `_seed_local_auth_user`) |

## Migration / reset

1. First `supabase start`: applied full chain including `20260730190002_notify_claim_decision_outcome_urls.sql`, then failed Studio health → containers stopped.
2. Studio disabled; second start **PASS**.
3. Migrations present: `20260730190000`, `20260730190001`, `20260730190002`.
4. Applied disposable helper `tests/rls/fixtures/rls-test-role-helper.sql` (not a product migration).
5. `config.toml` restored to repository HEAD before commit.

## Matrix results (`tests/rls/notify-claim-decision-outcome.rls.test.ts` — 5/5 PASS)

| Cell | Result |
|---|---|
| Business approval → applicant + `/company/create-profile` | **PASS** |
| Business rejection → applicant + `/company/verification-rejected` + reason | **PASS** |
| University approval → `/university/create-profile` | **PASS** |
| University rejection → `/university/rejected` + reason | **PASS** |
| Idempotency: exactly one in-app row; retry no duplicate | **PASS** |
| Other applicant cannot read; anonymous denied | **PASS** |
| No Profile created by dispatch | **PASS** |
| Verification status unmodified by notify | **PASS** |

## Cleanup

| Check | Result |
|---|---|
| `supabase stop --no-backup` | success |
| Containers `jid-06d` | zero |
| Volumes `06d` | zero |
| Listeners 58521–58524 | none |
| Cloud changed | no |
| Real data/credentials | no |
