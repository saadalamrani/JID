# JID Task Board

Generated from JID-000. Work packages are journey-sized, dependency-aware, and limited to three non-conflicting packages in Wave 1. No production write is included.

## Wave 1 — maximum three parallel packages

| Package | Scope and acceptance | Dependencies | Parallel safety | Owner / verifier |
|---|---|---|---|---|
| JID-101 Reproducible Quality Gate — COMPLETE | Corepack + checkout-local cache pins pnpm 9.15.4; frozen install, type-check, lint, network-enabled build, and 29 safe tests pass. RLS suites deferred because fixtures write to a database. Evidence: `JID-101_QUALITY_GATE_REPORT.md` | None | Infrastructure/docs only; no app-domain files changed | Codex / ChatGPT |
| JID-102 Constitutional Organization Lifecycle | Remove public/code “claim existing profile” paths and Directory ownership writes; preserve verification then deliberate Business/University Profile creation; re-anchor billing/jobs/access; add lifecycle/RLS tests and AR/EN parity | JID-101; JID-107 local RLS gate is green | Owns auth/org/catalog/profile operational paths and migrations queue | Codex / security reviewer |
| JID-103 Individual Privacy & Canonical Projection Audit | Prove owner/public/recruiter/university payload separation; reconcile CV to canonical Career Record; add RLS/projection tests; keep missing Evidence Vault scoped as design gap | JID-101; JID-107 local RLS gate is green | Owns individual/profile/privacy/CV paths; no org lifecycle overlap | Codex / security reviewer |

## Wave 2

| Package | Scope | Depends on | Priority |
|---|---|---|---|
| JID-201 Opportunity-to-Decision Journey | Owned-profile opportunity creation, Normal/Plus entitlements, application/declaration, radar, pipeline, zero-document privacy, cross-tenant denial | JID-102, JID-103 | P0 |
| JID-202 Honest Surface Closure | Hide/remove Lammah fake cards, Career Canvas/CV placeholders, dead controls; fix hardcoded i18n; verify real-data cards disappear cleanly | JID-101 | P0 |
| JID-203 Staff Security and Financial Boundaries | Role approval, self-role denial, security-definer/audit coverage, founder-only finance boundary, emergency controls | JID-101 | P0 |
| JID-104 React Hook Warning Closure | Resolve and test four existing `react-hooks/exhaustive-deps` warnings in mentor filters, opportunity filters, verification review, and glow state without broad behavior changes | JID-101 | P1 |
| JID-105 Disposable RLS Gate — COMPLETE / RED | Isolated local stack applied all 120 migrations; profiles RLS passed 2 assertions; ownership/jobs suites skipped 12 assertions because fixture enum value `complete` is invalid; disposable resources fully removed | JID-101; evidence in `JID-105_DISPOSABLE_RLS_GATE_REPORT.md` | P0 |
| JID-106 RLS Fixture/Schema Drift Closure — BLOCKED / RED | Fixture drift closed with valid `active` enum, safe teardown, and final-schema job fixtures. All 14 assertions executed: 13 passed, 1 proved an owner can self-unsuspend a Business Profile by direct UPDATE. Evidence: `JID-106_RLS_FIXTURE_SCHEMA_DRIFT_REPORT.md` | JID-105; blocks JID-102/JID-103 until JID-107 is green | P0 |
| JID-107 Suspended Profile Transition Boundary — COMPLETE / GREEN | Forward-only migration blocks direct owner moderation changes and suspended-row updates for Business and University Profiles; staff audited suspend/reinstate preserved; all previous 14 plus 10 new assertions pass with zero skipped. Evidence: `JID-107_SUSPENDED_PROFILE_BOUNDARY_REPORT.md` | JID-106 exact policy evidence | P0 |

## Wave 3

| Package | Scope | Depends on | Priority |
|---|---|---|---|
| JID-301 Communications & Notifications | Auto-reply disclaimer lock, smart batches, conversations/scheduling, preferences, quota/bounce/digest behavior | JID-201 | P1 |
| JID-302 Smart Features | SSIS, Search-for-me, Lammah crawler, explainability, provider failures, entitlements; hide anything without real output | JID-201, JID-202 | P1 |
| JID-303 University Consent Journey | Verification/profile, declared graduate relationship, consented outcomes, institutional reports, export permissions | JID-103 | P1 |
| JID-304 Mentorship UI Regression | Complete UI journey against migrations 124–126 without reopening closed backend absent regression | JID-101 | P2 |

## Release and production bundles (later; founder approval required)

- RB-01 Non-production schema reconciliation and seed accounts: migrations, rollback, RLS matrix, test data.
- RB-02 Preview deployment and full AR/EN mobile journey verification.
- RB-03 Production release: exact commits/migrations/env changes, backup/PITR evidence, rollback plan, founder approval, smoke tests.

No package may claim completion without focused tests, type-check, diff check, lint/build as applicable, and the constitutional reporting fields.
