# JID — Wave 1 / Front 2 Closeout

**Front:** Canonical Contracts / Shared Engineering Foundations
**Status:** CODE COMPLETE
**Starting branch:** `nebres/wave1-front2-codex-contracts`
**Starting SHA:** `49416e453d36467e354f90ff423a5ed6ac5280a5`
**Final branch:** `nebres/wave1-front2-codex-contracts`
**Final implementation SHA:** `095687cb5ee5f03832177f16ebfed738cde9aa65`

The closeout document is committed after the implementation commit. Its commit SHA is
reported in the final control-tower handoff because a commit cannot embed its own SHA.

## Changed files

- `src/lib/auth/rbac.ts`
- `src/types/contracts/actor-authority.ts`
- `src/types/contracts/assessment.ts`
- `src/types/contracts/automation.ts`
- `src/types/contracts/career-evidence.ts`
- `src/types/contracts/common.ts`
- `src/types/contracts/compatibility.ts`
- `src/types/contracts/disclosure.ts`
- `src/types/contracts/index.ts`
- `src/types/contracts/journey-event.ts`
- `src/types/contracts/market.ts`
- `src/types/contracts/metric.ts`
- `src/types/contracts/opportunity.ts`
- `src/types/contracts/university.ts`
- `tests/unit/contracts/shared-contracts.test.ts`
- `docs/command-center/wave-1/WAVE_1_FRONT_2_CLOSEOUT.md`

No dependency, migration, Edge Function, product route, product behavior, RLS policy, audit
implementation, pricing behavior, or deployment configuration changed.

## C1–C10 implementation

### C1 — Actor / Authority

- Frozen `PublicActorType` to exactly `INDIVIDUAL | BUSINESS | UNIVERSITY`.
- Separated `AccountIdentity`, `InternalRole`, `OrganizationReference`,
  `OrganizationAuthority`, `MentorCapability`, and `InstitutionalContext`.
- Added a compatibility-only legacy-role bridge. Business and University results explicitly
  require separate organization authority; generic `entity` and internal roles resolve to no
  public actor.
- Directory identity carries no ownership or write authority, and
  `companies.claimed_by` is not a target authority input.

### C2 — Canonical Career Evidence

- Added a versioned `CareerEvidence` contract with stable subject/object identity, typed
  category and provenance, declaration/verification states, effective/observed time, monotonic
  revision lineage, correction, dispute, revocation/expiry references, evidence linkage,
  disclosure authorization, and optional market context.
- Existing CV/Profile stores remain explicit legacy projection/reconciliation sources.

### C3 — Opportunity Core

- Added a neutral `Opportunity` contract with Job and eight non-job types.
- Preserved source/provenance, freshness/expiry, jurisdiction, organization/Profile linkage,
  apply authority/destination, lifecycle, requirements, and supersession.
- Added `OrganicOpportunityRelevance` with no paid tier, sponsorship, boost, or priority field.
- Existing `Job` and Lammah shapes remain explicitly wrapped compatibility sources.

### C4 — Journey / Action / Outcome Event

- Added append-only `JourneyEvent` semantics with the exact six required origin classes:
  `USER_DECLARED`, `SYSTEM_OBSERVED`, `EMPLOYER_CONFIRMED`,
  `INSTITUTION_CONFIRMED`, `THIRD_PARTY_SOURCED`, and `ADMIN_CORRECTION`.
- Action/stage events cannot carry outcomes; corrections link to the prior event.
- Missing, unknown, and absent data are not outcome values.

### C5 — Disclosure Authorization / Retention / Audit

- Added a purpose-bound `DisclosureAuthorization` requiring subject, object or data-category
  scope, recipient, purpose, reviewed basis/reference, lifecycle, retention policy, and creator.
- Basis types include but are not reduced to consent.
- Added an immutable-compatible `AccessAuditEvent` contract for material access decisions;
  existing RLS/read-path/audit enforcement remains unchanged.

### C6 — University Affiliation / Cohort Linkage

- Added `UniversityAffiliation` with exactly `DECLARED | VERIFIED | NEEDS_REVIEW`, optional
  private institutional identifier reference, optional verification methods including but not
  requiring email, correction/dispute/revocation reference, and audit reference.
- Added a separate `CohortLink`; it contains no disclosure authorization and grants no private
  Career Evidence access.

### C7 — Assessment Evidence / Decision Use

- Added versioned instrument, attempt, result-evidence, instrument-bound score, and
  human-attributable decision-use contracts.
- No JID Candidate, Employability, Culture Fit, or Potential score exists.
- No autonomous final hiring/rejection state exists. Legacy SSIS composite/recommendation
  semantics are compatibility-only and not exported as canonical authority.

### C8 — AI / Automation Authority

- Added `AutomationAuthority` with requesting actor, purpose, allowed input classes,
  provider/model version, output/action class, evidence references, review state, deterministic
  fallback, kill state, and audit reference.
- Consequential external actions are type-restricted to `human_review_state: APPROVED` and
  require an explicit `external_confirmation_ref`.

### C9 — Market / Jurisdiction Portability

- Added country-neutral `LocationContext`, `MarketContext`, and organization/institution
  `MarketPresence` contracts with country/subdivision, locale/language, timezone/currency when
  relevant, versioned policy/taxonomy references, and a future Market Adapter reference.
- Saudi Arabia is represented only as the operating default, not as universal schema truth.

### C10 — Metric Definition

- Added a versioned `MetricDefinition` separated from metric values.
- Every definition requires population, window, sources, missingness handling, coverage,
  privacy/disclosure semantics, owner, lifecycle, and change history.
- Ratio/rate/percentage definitions additionally require numerator and denominator.

## Compatibility adapters

- `actorCompatibilityFromLegacyRole` is the only RBAC adapter. It does not establish
  organization authority.
- `compatibility.ts` wraps current CV, Job, Application, Directory, Lammah, and SSIS records
  under explicit `Legacy*` names. It performs no conversion, write, or behavior change.
- Current CV/Profile remain migration sources/projections, current Jobs remain a Job subtype,
  paid visibility remains excluded from organic relevance, and SSIS recommendation fields
  remain excluded from canonical assessment decisions.

## Validation commands and exact results

1. `pnpm exec vitest run tests/unit/contracts/shared-contracts.test.ts --reporter=verbose`
   - Exit `0`.
   - `1` test file passed; `13` tests passed; `0` failed or skipped.
   - The 13 grouped tests cover all 17 required invariants.
   - Existing toolchain notice: Vite reported that native `resolve.tsconfigPaths` can replace
     the currently configured `vite-tsconfig-paths` plugin. No dependency/config change was
     made because it is unrelated to this front.
2. `pnpm type-check`
   - Exit `0`; no TypeScript errors.
3. `pnpm lint`
   - Exit `0`; `No ESLint warnings or errors`.
4. `pnpm exec prettier --check src/lib/auth/rbac.ts "src/types/contracts/*.ts" tests/unit/contracts/shared-contracts.test.ts`
   - Initial exit `1`: three changed files required formatting.
   - Ran scoped `pnpm exec prettier --write` on those three files.
   - Final exit `0`: all matched files use Prettier code style.
5. `pnpm build`
   - Exit `0`.
   - Next.js `14.2.15` compiled successfully, validated types, generated `304/304` static
     pages, finalized optimization, and collected build traces.
6. `git diff --check`
   - Exit `0`; no whitespace errors.
   - Git emitted Windows line-ending notices that LF working-tree content may be converted to
     CRLF when Git next touches the files; no content or validation failure resulted.

No broader unrelated test suite was run. No test was skipped within the focused contract
suite.

## Database-impact conclusion

Persistent storage is **not necessary for Wave 1 Front 2 closure**.

The delivered primitives are pure compile-time contracts, explicit compatibility wrappers,
and guards. They introduce no runtime write path and do not claim that the absent Career
Record, JourneyEvent, DisclosureAuthorization, UniversityAffiliation/CohortLink,
AutomationAuthority, or MetricDefinition registries already exist in storage. Adding tables
now would prematurely implement Wave 2+ persistence and reconciliation decisions.

- Migration subpacket created: **No**.
- Migration created or applied: **No**.
- DDL executed: **No**.
- Supabase schema modified: **No**.
- Production inspected or touched: **No**.

Future persistent implementation requires a separately authorized expand/contract migration
packet with current non-production schema evidence, PRE_COUNTS, RLS, audit, retention,
reconciliation, rollback, and tests.

## Risks and deferred work

- These TypeScript contracts do not themselves provide runtime validation, persistence, RLS,
  retention execution, or audit writes. Later authorized consumers must implement those
  controls without weakening existing enforcement.
- Legacy CV/Profile truth, Job/Lammah storage, mutable Application/Radar states, direct
  Profile university fields, paid-visibility residue, and SSIS composite/recommendation data
  remain present and unchanged.
- Career Record storage and zero-silent-loss CV/Profile reconciliation are deferred to Wave 2.
- Opportunity normalization/ranking, Journey projections, disclosure persistence,
  University identity bridging/cohorts, assessment products/vendors, AI product actions,
  market adapters, and metric registry values are deferred to their approved later waves.
- No unresolved blocker remains for this type-only front.

## Cursor Front 3 exact handoff

Cursor must:

1. start from the final head of `nebres/wave1-front2-codex-contracts`;
2. import frozen backend semantics only from `@/types/contracts` and not create competing
   actor, status, permission, metric, assessment, automation, or market enums;
3. treat `Legacy*` wrappers as compatibility sources only, never canonical UI/backend truth;
4. keep Directory identity, owned Profile authority, internal privilege, and public actor
   context visually and semantically separate;
5. render University affiliation only from `DECLARED | VERIFIED | NEEDS_REVIEW`, keep cohort
   linkage separate, and never infer named-person/private Career Record access;
6. never render missing Journey data as rejection, success, employment, unemployment, or
   another outcome;
7. expose no universal candidate/employability/culture-fit/potential score and no autonomous
   final hiring/rejection state;
8. represent consequential automation as explainable, human-reviewed, and explicitly
   confirmed before an external action;
9. use only real, definition-backed metrics and preserve coverage, missingness, population,
   window, source, and privacy/suppression meaning;
10. keep paid visibility out of organic opportunity relevance and preserve non-job
    Opportunity types;
11. implement only the approved Arabic-first, bilingual, RTL/LTR, accessible, responsive
    shared design foundations in `WAVE_1_DESIGN_FOUNDATION_HANDOFF.md`, without building a
    Wave 2+ feature screen or inventing backend data;
12. stop with an exact blocker if a needed enum, permission, metric, data state, or product
    decision is absent from the frozen contracts; and
13. run focused Front 3 tests plus repository-required type-check, lint, and build, recording
    warnings, skips, and unrelated failures exactly.

## Scope confirmations

- No Wave 2+ feature was implemented.
- No product behavior was modified.
- No production action occurred.
- No deployment occurred.
- No subagent was spawned.
- No new dependency was added.
- No historical migration or Edge Function was modified.

WAVE_1_CODEX_CONTRACTS_COMPLETE
