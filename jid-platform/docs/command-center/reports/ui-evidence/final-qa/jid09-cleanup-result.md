# JID09 Fixture Cleanup Result (Session 09-E)

**JID09_RUN_ID:** `jid09-20260801-7d956c`
**Project ref:** `hmjuijmaefajdjrjdsxu`
**Completed (UTC):** `2026-08-02T06:02:35.520Z`
**Result:** **PASS**

Only IDs from the gitignored RUN_ID secrets manifest were selected. Every auth email and Directory slug/name was checked for the run marker before deletion. Shared `jidseed.test` accounts were not selected.

## Verify before
```json
{
  "authUsers": 19,
  "profilesOwned": 3,
  "uniProfilesOwned": 4,
  "verifications": 7
}
```

## Actions
- DELETE `applications` rowCount=1
- DELETE `jobs` rowCount=1
- DELETE `notifications` rowCount=2
- DELETE `directory_correction_suggestions` rowCount=1
- DELETE `verification_requests` rowCount=7
- DELETE `business_profiles` rowCount=3
- DELETE `university_profiles` rowCount=4
- DELETE `companies` rowCount=17
- DELETE `mfa_factors` rowCount=4
- DELETE `auth.identities` rowCount=19
- DELETE `public.profiles` rowCount=19
- DELETE `audit_logs (run-scoped)` rowCount=0
- DELETE `notifications (recipient-scoped remainder)` rowCount=0
- DELETE `auth.users` rowCount=19
- DROP `_jid09_seed_auth_user` rowCount=1

## Verify after
```json
{
  "authUsers": 0,
  "profilesOwned": 0,
  "uniProfilesOwned": 0,
  "verifications": 0,
  "directories": 0,
  "sharedFriendAccounts": 10
}
```

## Retained
- none

## Safety
- production: not accessed
- historical mirror: not updated
- shared fixtures: not deleted
