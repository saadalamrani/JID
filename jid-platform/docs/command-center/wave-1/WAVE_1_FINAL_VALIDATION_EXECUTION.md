# JID — Wave 1 Final Validation + Closeout Execution Packet

**Owner:** Codex (integration closeout)
**Branch:** `integration/wave1-final-validation-closeout`
**Base SHA:** `64c8945cdcce409d5d0092503de2a818c9073f0d`
**Scope:** validation and closeout only

## Operating rule

`DO NOT SPAWN SUBAGENTS.`

This is not a feature implementation task. Do not broaden scope, refactor product code, modify domain contracts, create migrations, touch Supabase, deploy Edge Functions, merge to `main`, or promote any Vercel deployment to production.

Git pushes may create Vercel PREVIEW deployments automatically. PREVIEW is not PRODUCTION. Record that distinction exactly.

## Read first

1. `docs/JID_Agent_Operating_Constitution.md`
2. `docs/command-center/FOUNDER_DECISIONS_2026-08-26.md`
3. `docs/command-center/WAVE_1_SHARED_PRODUCT_CONTRACTS_AND_DESIGN_FOUNDATIONS.md`
4. `docs/command-center/wave-1/WAVE_1_FRONT_1_CLOSEOUT.md`
5. `docs/command-center/wave-1/WAVE_1_FRONT_2_CLOSEOUT.md`
6. `docs/command-center/wave-1/WAVE_1_FRONT_3_CLOSEOUT.md`
7. `docs/command-center/wave-1/WAVE_1_CONTRACT_SPEC.md`
8. `docs/command-center/wave-1/WAVE_1_DESIGN_FOUNDATION_HANDOFF.md`

## Mission

Independently validate that Wave 1 is internally coherent and that Fronts 1–3 can be closed without smuggling Wave 2+ feature work or production changes.

## Gate A — Lineage and scope

Verify:

- Front 1 closeout is present and precedes Front 2.
- Front 2 final SHA is `8a3f6bca8a655be278b3a736d99cdf7cceb230b1`.
- Front 3 is based exactly on Front 2 final SHA.
- Current branch is based exactly on Front 3 final SHA `64c8945cdcce409d5d0092503de2a818c9073f0d`.
- Wave 1 changed scope is limited to governance/contracts/shared design foundations/tests/closeout evidence.
- No historical migration, Supabase schema, Edge Function, pricing behavior, opportunity ranking, production configuration, or Wave 2+ feature screen was intentionally changed by Wave 1.

If lineage materially differs, stop with `BLOCKED_WITH_EXACT_CAUSE`.

## Gate B — Contract integrity

Verify the frozen C1–C10 contract layer remains intact after Front 3.

At minimum confirm:

- public actors remain exactly `INDIVIDUAL | BUSINESS | UNIVERSITY`;
- Mentor and Government are not public actors;
- Directory identity and organization authority remain separate;
- Career Evidence preserves provenance/revision/dispute/revocation semantics;
- Opportunity supports non-job types and paid visibility is absent from organic relevance;
- missing Journey data is not an outcome;
- disclosure authorization remains purpose/recipient/object/basis/retention scoped;
- University affiliation states remain exactly `DECLARED | VERIFIED | NEEDS_REVIEW` and CohortLink is separate;
- assessment contracts expose no universal candidate/employability/culture-fit/potential score and no autonomous final hiring/rejection authority;
- consequential external automation requires human approval and explicit confirmation;
- market semantics remain Saudi-first but not Saudi-hardcoded as universal schema truth;
- metric definitions preserve source/population/window/coverage/missingness/privacy semantics.

Do not edit C1–C10 to make validation pass. A material contract defect is a blocker.

## Gate C — Design-foundation integrity

Verify Front 3 did not invent backend truth and that shared design foundations preserve:

- Arabic IBM Plex Sans Arabic;
- English Manrope;
- Arabic letter spacing = 0;
- approved JID semantic colors/tokens;
- contract-backed status presentation;
- RTL/LTR-safe shared overlays/primitives;
- accessible focus/keyboard/reduced-motion behavior where implemented;
- truthful loading/empty/error/forbidden/unavailable/stale states;
- no fake KPI/match/candidate-score semantics;
- no paid-organic relevance presentation;
- no Wave 2+ screen implementation.

Known deferred legacy UI debt must be recorded, not mass-fixed during closeout.

## Gate D — Validation commands

Run exactly, from `jid-platform`:

```bash
pnpm exec vitest run tests/unit/contracts/shared-contracts.test.ts --reporter=verbose
pnpm exec vitest run tests/unit/design-system --maxWorkers=3
pnpm type-check
pnpm lint
pnpm build
git diff --check
```

Run a scoped Prettier check on files touched by Fronts 2 and 3 if practical. Record exact commands/results, including warnings, skips, retries, worker limits, and pre-existing failures.

Do not hide failures.

## Gate E — Preview/runtime evidence

If Vercel access exists, verify the current Wave 1 branch/Front 3 preview only. Do not promote, alias, redeploy, or touch production.

At minimum distinguish:

- PREVIEW status;
- PRODUCTION status remains untouched.

Check representative Arabic and English preview routes if accessible:

- `/ar`
- `/en`

Confirm HTTP success and RTL/LTR direction markers. Do not claim pixel-perfect visual QA unless actual browser/viewport evidence exists.

If Vercel access is unavailable, state that explicitly and rely only on provided Control Tower evidence; do not invent a deployment result.

## Known deferred debt — do not reopen Wave 1 for these unless they break a gate

Examples include:

- legacy `FeatureUnavailable` glow/glass treatment;
- legacy `EmptyState` icon requirement;
- Dialog/Sheet default `closeLabel = "Close"` unless caller supplies i18n;
- raw legacy `jid-*` colors on older screens;
- legacy SSIS/composite/recommendation data and UI;
- legacy paid-visibility/boost residue outside the new organic-relevance contract;
- old product copy/screens not yet rebuilt;
- duplicate Vercel preview builds across `jid-dev` and `jid-platform` (P2 configuration debt).

These are deferred debt, not permission to widen this closeout.

## Required closeout artifact

Only after all gates pass, create:

`docs/command-center/wave-1/WAVE_1_CLOSEOUT_REPORT.md`

It must include:

- Wave 0 baseline and Wave 1 branch lineage;
- Front 1 / Front 2 / Front 3 acceptance and SHAs;
- exact changed-scope summary;
- C1–C10 integrity result;
- design-foundation integrity result;
- exact validation commands/results;
- Preview vs Production evidence;
- explicit statement that no production promotion/write was performed;
- database/migration status;
- known deferred debt;
- rollback posture;
- Wave 2 readiness statement;
- final terminal state.

Do not merge to `main`.
Do not deploy to production.
Do not start Wave 2 implementation from this task.

## Terminal state

End exactly with one of:

`WAVE_1_COMPLETE`

or

`BLOCKED_WITH_EXACT_CAUSE`
