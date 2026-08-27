# JID — Wave Delivery Master Plan

**Authority date:** 2026-08-27
**Active doctrine:** [`WAVE_OPERATING_MODEL.md`](WAVE_OPERATING_MODEL.md)
**Constitution:** [`../JID_Agent_Operating_Constitution.md`](../JID_Agent_Operating_Constitution.md)

The previous fixed-phase/90-day plan is superseded. This sequence is dependency- and
evidence-ordered, not calendar-bound.

## Delivery rule — Adaptive Closure Model

A Wave is a milestone/capability boundary, not a fixed sequence of agents.

Each Wave starts by verifying current repository/runtime truth, defining a binary Wave
outcome, identifying frozen dependencies/interfaces, and assigning the minimum **Front
Budget** required to close it safely.

The governing execution chain is:

`Current Truth -> Direct Decision -> Largest Safe Coherent Scope -> Execute -> Self-Repair -> Risk-Appropriate Validation -> Evidence -> Close`

### Front Budget

- **1 Front — default:** one owner can safely close the coherent workstream.
- **2 Fronts — when justified:** a real independent boundary exists, commonly backend/data
  versus product experience, with frozen interfaces and non-overlapping ownership.
- **3 Fronts — exceptional:** a distinct research/architecture/methodology problem, core
  implementation problem, and substantial product-experience problem all genuinely exist.
- **More than 3 — not allowed by default:** requires a documented reason showing material
  risk, collision, or slower delivery if the work is compressed further.

No more than **3 Fronts may be open across JID at the same time**. Normal operation is 1–2.
Do not open a new Front merely because an agent is available.

A Front is an independent **closure unit**, not a mandatory phase. Research, architecture,
implementation, validation, and closeout should be combined when one owner can perform them
safely.

### Closure Packet rule

Each Front receives one autonomous **Closure Packet** designed to close its assigned scope.
It should be large in responsibility but small and focused in context.

Where safe, the same packet performs:

`reconcile -> focused reuse/research -> implement -> self-repair -> test -> runtime validate where relevant -> evidence -> close`

Do not create audit-only prompts when reconciliation, implementation, validation, and
closeout can safely happen together. Do not split ten tightly coupled tasks into ten sessions
when one bounded closure unit can verify them coherently.

Every packet must include the applicable parts of:

- TITLE
- ROLE
- PROJECT / REPOSITORY
- VERIFIED CURRENT BASE
- MISSION
- CURRENT TRUTH
- SCOPE TO CLOSE
- DEPENDENCIES / FROZEN INTERFACES
- DO NOT TOUCH
- IMPLEMENTATION REQUIREMENTS
- EDGE CASES
- SECURITY / PRIVACY
- DATA / MIGRATIONS
- UX / RESPONSIVE / ACCESSIBILITY
- LOCALIZATION
- TESTS
- LINT / TYPECHECK / BUILD where applicable
- RUNTIME / BROWSER / DATABASE SMOKE where applicable
- EVIDENCE
- GIT RULES
- ROLLBACK / RECOVERY
- STOP CONDITIONS
- BINARY DEFINITION OF DONE
- FINAL COMPLETION TOKEN

The final evidence must state the base SHA/state, final SHA/state, changed areas, exact test
pass/fail/skip results, build/runtime status where relevant, blockers, exact remaining work,
and confirmation that forbidden areas were untouched.

### Validation and review

Validation is risk-appropriate rather than ritualized:

- backend/contracts use focused unit/integration, type-check, authorization/API/runtime
  validation as applicable;
- frontend/product work uses focused tests, type-check/lint/build as applicable, browser
  smoke, Arabic/English, RTL/LTR, responsive and accessibility checks;
- database/migration work uses disposable/non-production forward validation, RLS,
  reconciliation evidence, and rollback/recovery checks;
- docs-only work does not run browser/build gates without a concrete reason.

Independent review is used **once** for material high-risk changes involving security,
privacy, authorization/RLS, database schema or destructive migrations, destructive
operations, or consequential hiring/assessment AI.

The high-risk pattern is:

`Implement -> Self-Validate -> One Independent Review -> Fix Proven P0/P1 -> Final Verification -> Close`

Do not create `audit -> fix -> audit -> fix` loops. P0/P1 may reopen the active scope. P2/P3
are backlog by default and do not reopen a closed Front.

### Closeout

Closeout is an outcome, not a mandatory standalone session.

- One-Front Wave: close inside the same Closure Packet when safe.
- Multi-Front Wave: the final integration-capable Front should normally reconcile, validate,
  produce evidence, and close the Wave.
- Separate closeout Front: only for non-trivial multi-branch reconciliation, high-risk
  integration requiring independent evidence, or material evidence conflict.

Preferred terminal states are binary:

`IMPLEMENTED / VERIFIED / INTEGRATED / READY_FOR_PROMOTION / WAVE_X_COMPLETE`

or

`BLOCKED_WITH_EXACT_CAUSE`

## Wave sequence

| Wave | Scope |
|---|---|
| 0 | Governance reconciliation + canonical integration baseline — **CLOSED** |
| 1 | Shared Product Contracts + Design Foundations, including minimum GCC portability and University affiliation/cohort-linkage contracts |
| 2 | Career Record + world-class CV/projection system |
| 3 | Opportunity Graph + Lammah source/provenance layer |
| 4 | Radar + Abhathli controlled career-search copilot |
| 5 | Employer Foundation + Hiring Workspace + first economic closure loop |
| 6 | Hiring Evidence: structured screening, work samples, structured interviews, anchored scorecards |
| 7 | Assessment orchestration + recorded-interview workflow; specialist instruments/provider gates |
| 8 | Talent sourcing + candidate evidence comparison + hiring intelligence |
| 9 | Professional / Social Layer at governed scale |
| 10 | University data contract + affiliation verification + cohorts + graduate outcomes core |
| 11 | University employability intelligence + program/employer alignment + career-readiness operations |
| 12 | University reporting, accreditation support, exports, and defensible benchmarking |
| 13 | Integration platform: ATS/API/webhooks/connectors/market adapters where evidence requires |
| 14 | Commercial packaging + operational hardening + scale-readiness |

### Sequencing notes

- The Professional / Social Layer remains founder-approved; only its **large-scale build**
  is sequenced after the first employer economic loop because JID is operating under a
  capital-light model.
- University **affiliation and cohort-linkage contracts** enter Wave 1 because they affect
  identity, consent, distribution, and future data integrity. University analytics and
  reporting remain later waves.
- GCC readiness in Wave 1 means portable contracts and clean market boundaries, not
  premature multi-country infrastructure or country launches.
- Exact pricing is not a Wave 1 blocker. Pricing architecture is adopted; price points are
  evidence-gated.
- The Wave sequence is unchanged by the Adaptive Closure Model. What changes is the number
  and routing of Fronts inside each Wave.

## Wave entry economics

A wave should not advance because the prior one produced many files, prompts, commits, or
agent sessions. Entry should be justified by one or more of:

- user-value evidence;
- payer/revenue evidence;
- necessary shared dependency;
- risk reduction or legal/security requirement;
- material operating-cost reduction;
- defensibility/network compounding.

Do not use feature count, account count, partner logos, AI output volume, prompt count, or
number of open branches as progress proxies.

The primary delivery progress measure is **closed coherent scope** and reduction of open
Fronts.

## Conditional agent routing

The Control Tower routes work according to the Wave's actual problem. No agent is a mandatory
stage.

1. **ChatGPT / Nebras** verifies current truth, freezes founder decisions and scope, sets the
   Front Budget, identifies frozen interfaces, routes only necessary agents, and verifies
   strategic closure.
2. **Claude Code** is used when deep research, OSS/reuse intelligence, architecture,
   algorithms/methodology, unfamiliar integration, assessment/data science, or difficult
   reconciliation is genuinely needed before or alongside implementation.
3. **Codex** is used for canonical backend/data/security engineering, APIs, database/RLS,
   integrations, workflows, focused tests, repository integration, and technical closure.
4. **Cursor** is used for product UI/UX, frontend implementation, Arabic-first
   responsive/accessibility execution, browser validation, and visual-system rollout.
5. **GitHub** is the shared source of truth and evidence handoff.

A Wave does **not** automatically run:

`Claude -> Codex -> Cursor -> Review -> Codex Closeout`

Examples of valid routing:

- one coherent backend/domain Wave -> **Codex only**;
- one coherent frontend Wave with frozen backend -> **Cursor only**;
- backend/data + independent product experience -> **Codex + Cursor**;
- complex algorithm/methodology + implementation + substantial UX -> **Claude + Codex + Cursor**;
- dedicated independent reviewer -> only when the high-risk one-review rule applies.

Research/reuse assessment should be embedded in the implementing Closure Packet when the
question is bounded. Open a dedicated research Front only when implementation would be unsafe
without an independent architecture/methodology decision.

Parallel work is allowed only with frozen interfaces and non-overlapping file/domain
ownership. Do not allow two agents to mutate the same active area concurrently. No default
Codex subagents.

## Permanent controls

- Hybrid Rebuild: preserve trustworthy foundations; replace unsupported or fragmented
  product structure.
- Mandatory OSS / existing-system reuse decision before substantial greenfield systems; it
  may be embedded in the active Closure Packet when safely bounded.
- No production write/deploy without explicit release-specific founder approval.
- No fabricated metrics, AI claims, institutional outcomes, verification, or compliance.
- AI remains assistive, explainable, and human-authorized.
- Privacy/security are enforced on the read/action path, not in presentation only.
- JID Trust & Rights Constitution is adopted and binding.
- Wave 1's historical execution remains valid; the Adaptive Closure Model applies to Wave 2
  onward and does not reopen Wave 0 or Wave 1.
