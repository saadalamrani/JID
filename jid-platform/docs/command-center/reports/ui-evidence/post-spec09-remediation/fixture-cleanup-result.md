# Fixture cleanup / retention — Post-Spec 09 Remediation

**RUN_ID:** `jid-rem-20260802-7535ec`
**At:** `2026-08-02T08:05:00Z`

## Decision

**RETAINED** (explicit reason) — not deleted at program end.

## Reason

Zero-defect live gate against `https://jid-dev.vercel.app` is blocked: alias still serves pre-remediation behavior after promote of `fdaf5d1a1d6325073b890bffdbbfdbf1765893f5`.

Retained synthetic published university/business Profiles and draft/suspended counterparts are required for immediate re-verification once the non-production alias serves the promoted SHA (university public 200 + draft/suspended denial + `/sys/claims` hard 404).

## Ownership

- Synthetic only; non-production `hmjuijmaefajdjrjdsxu` only
- Credentials remain gitignored under `scripts/.tmp/jid-rem-secrets.json`
- Cleanup script ready: `scripts/.tmp/jid-rem-cleanup.mjs` (run after alias flip)
- Shared seed accounts untouched

## Must delete after alias verification

All `jidrem-*%jid-rem-20260802-7535ec%` directory/profile rows and run-owned verification/correction fixtures.
