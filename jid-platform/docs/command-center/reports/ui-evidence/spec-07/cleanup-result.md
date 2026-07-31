# Spec 07-E cleanup result

Run: `jid07e-1785524038244`
Completed: 2026-07-31T19:23:48.998Z

Result: **PASS**

Only IDs from the gitignored run secrets manifest were considered. Every extant row was checked for the run marker before deletion; no shared fixture was selected.

## Deleted owned Profiles and Directory rows
- Business Profile: `17ce8106-1e41-4de3-aa4c-afff8688b855`
- University Profile: `84e2321d-76a3-4688-b82e-255aaaab0589`
- Business Directory row: `57d46abb-7559-49e3-8b92-7deea6a02abd`
- University Directory row: `6d8c8e07-0b83-4f93-b74b-5a71c4831a6c`

## Auth users and audit-log handling
- businessOwner `18d544d7-cbfa-47ce-ada6-50d0de0819d2`: deleted; audit helper used=yes; initial delete error: Database error deleting user
- universityOwner `147f0668-2f2b-4504-909a-b7725ff89c0e`: deleted; audit helper used=yes; initial delete error: Database error deleting user
- staff `a83a91d7-adc3-4cb4-ae93-c1883615fcbd`: deleted; audit helper used=yes; initial delete error: Database error deleting user

Immutable `audit_logs` rows/FK handling blocked or accompanied the initial auth-user deletion. On this disposable stack only, `rls_test_clear_user_audit` removed audit rows for the exact synthetic actor ID before one retry. Shared actors and shared audit rows were not selected.

## Leftovers
- Owned Profiles: 0
- Directory rows: 0
- Auth users: 0

## Disposable environment (post-capture)
- Fixture cleanup completed while disposable `jid-07e-disposable` was still running.
- After evidence pack finalization: `supabase stop --no-backup` for the disposable project; `supabase/config.toml` restored to HEAD (`jid-platform` defaults).
- No linked cloud database used; no shared QA accounts deleted; secrets remain under gitignored `scripts/.tmp/` only.
