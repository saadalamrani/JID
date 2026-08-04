# JID Lammah Phase 1 — Final Shipping Report

Date: 2026-08-04

Status: release candidate complete; validation CI, canonical fast-forward, and completion token are reported in the final response.

Source branch: `codex/jid-lammah-phase1-final-shipping`

Integrated validation branch: `codex/jid-lammah-phase1-final-shipping-ci-validation`

Canonical target: `agent/nonprod-signup-form`

Checkpoint preserved: `ff9ac38`

Base before checkpoint: `e461ad8`

Final promoted SHA: emitted by `JID_LAMMAH_PHASE1_SHIPPED <promoted SHA>` after remote gates pass.

## Outcome

Lammah Phase 1 now has one bounded EU Careers connector, adjacent evidence/candidate/review/run/dead-letter governance, Staff review surfaces, entitlement-gated public Jobs/Lammah inventory, unsafe apply-URL quarantine, native-precedence supersede path, operational kill switches that do not hide already-published inventory, and a completed non-production schema pilot matrix.

The implementation creates no applications, communications, Profiles, Verification requests, ownership links, or `claimed_by` assignments. Production, `main`, and the frozen production candidate were not touched.

## Delivered scope

- Migrations `20260803120100_lammah_phase1_foundations.sql` and `20260803120200_lammah_phase1_workflows.sql` (timestamped after GLEIF `20260803120000`)
- EU Careers connector shared module and crawler updates
- Staff Lammah operations, review, mapping, dead-letters, and runs surfaces
- Public Opportunities Lammah feed/card/report actions behind server entitlement boundary
- Out-of-band worker provision script (LOGIN not created by migration)
- Disposable matrix `tests/rls/lammah-phase1-final-shipping.disposable.sql`
- Focused unit/connector/entitlement tests

## Mechanical repairs after checkpoint

- Nested native-matcher helper EXECUTE grants to `lammah_function_owner`
- Regions SELECT policy/grant for supersede path
- Explicit `GRANT SELECT` on `lammah_sources` / `lammah_opportunities` to `authenticated`
- `REVOKE SELECT` from `anon` / `service_role` / worker on those inventory tables
- Cron EXECUTE grants to `postgres` for expiry/retention
- `report_lammah_problem` uses JWT `sub` (no `auth` schema dependency on function owner)
- Async Staff server actions
- Spec 07 migration allowlist updated for the two Lammah migrations
- Disposable auth.users fixtures and `server-only` test mock

## Validation

| Gate | Result |
|---|---|
| Static review | PASS after mechanical repairs |
| Disposable migration replay | PASS through `20260803120200` |
| Disposable matrix | `LAMMAH_PHASE1_DISPOSABLE_PASS` / `LAMMAH_PHASE1_DISPOSABLE_CLEAN` |
| Focused Lammah tests | PASS |
| Lint | PASS |
| Type-check | PASS |
| Full suite | 445 passed / 101 skipped |
| Build | PASS |

## Non-production

Project: `jid-nonprod` (`hmjuijmaefajdjrjdsxu`)

Applied versions:

- `20260803120100` `lammah_phase1_foundations`
- `20260803120200` `lammah_phase1_workflows`

Non-production matrix: `LAMMAH_PHASE1_DISPOSABLE_PASS` / `LAMMAH_PHASE1_DISPOSABLE_CLEAN`

Proven on non-production schema:

- manual Staff publication path
- earned automatic publication when gates pass
- kill switches stop ingestion/auto-publish without deleting published inventory
- unentitled authenticated users receive zero protected Lammah rows
- anon has no inventory table privilege
- zero side effects on profiles, verification_requests, applications, communication tables, and `claimed_by`
- fixture residue cleaned; all four Lammah flags remain OFF after pilot

## Architecture invariants

- No applications / communications writes from Lammah paths
- No Profile / Verification / ownership / `claimed_by` mutation
- Kill switches do not hide already-published inventory
- Entitlement server boundary returns empty feed before querying protected rows
- Unsafe apply URLs quarantine and never publish

## Production / protected refs

Untouched: production, `main`, frozen production candidate. Canonical promotion is clean fast-forward onto `agent/nonprod-signup-form` only after green CI.
