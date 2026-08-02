# Fixture cleanup / retention — Post-Spec 09 Remediation

**RUN_ID:** `jid-rem-20260802-7535ec`
**At:** `2026-08-02T08:28:21Z`
**Result:** `CLEAN_PROFILES_AUTH_RETAINED_AUDIT`

## Deleted (verified count 0)

- companies with slug `jidrem-*%jid-rem-20260802-7535ec%`
- business_profiles / university_profiles linked to those directories

## Retained with explicit reason

- 7 synthetic `auth.users` with `@jidrem.test` RUN_ID emails

**Reason:** `audit_logs` immutability trigger blocks `actor_id` nulling / user delete after remediation audit rows were written. Users are synthetic-only, non-production, not shared seed accounts.

## Not touched

- Shared jidseed / friend accounts
- Production
- Historical mirror

See `fixture-cleanup-result.json`.
