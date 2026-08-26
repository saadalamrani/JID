# JID — Wave 1 Task Packet
## Shared Product Contracts + Design Foundations

**Prepared:** 2026-08-26 (Asia/Riyadh)
**Status:** Ready for founder-authorized execution after branch/SHA verification
**Source branch:** `strategy/jid-wave1-prep-2026-08-26`
**Wave 0 integration baseline:** `0e4b905e495667faf464351e28da0ab3e4d28fc9`

Wave 1 exists to prevent later JID capabilities from creating competing truth stores,
privacy models, actor semantics, market assumptions, or visual systems. It does **not**
build Wave 2+ products.

## Mandatory authority to read

1. `docs/JID_Agent_Operating_Constitution.md`
2. `docs/command-center/FOUNDER_DECISIONS_2026-08-26.md`
3. `docs/command-center/WAVE_OPERATING_MODEL.md`
4. `docs/command-center/MASTER_PLAN.md`
5. Wave 0 closeout report
6. current repository/runtime evidence for every touched contract

Agents must verify the current branch/SHA before any edit. Historical Strategy Office
material is evidence/recommendation, not authority over the adopted founder record.

---

# 1. Wave objective

Freeze the minimum shared contracts and product/design grammar required for coherent later
waves while preserving the Hybrid Rebuild strategy.

Wave 1 should answer:

- What is canonical truth versus a projection?
- How are actors, organization authority, and recipients represented?
- How do purpose, consent/authority, disclosure, retention, and audit travel with data?
- What minimum contracts can Career Record, Opportunity, Radar, Hiring, Social, University,
  Government, AI, and future GCC market adapters all rely on?
- How does University affiliation support `Declared -> Verified -> Needs Review` and cohort
  linkage without granting private-data access?
- How does the product remain Saudi-first without hard-coding the core so deeply that a
  future governed Market Adapter becomes impossible?
- What are the shared Arabic-first visual/state/accessibility rules later frontend waves
  must reuse?

---

# 2. Hard exclusions

Wave 1 must **not** implement:

- Career Record feature journeys or final CV builder;
- full Opportunity Graph/Lammah expansion;
- Radar or Abhathli features;
- Professional / Social feed/posts/comments/follows;
- Employer Hiring Workspace;
- screening/interview/assessment product workflows;
- University analytics/dashboards/KPIs;
- Government products;
- GCC country launch infrastructure;
- final pricing checkout/billing;
- production migrations, production data writes, or deployment.

Do not use Wave 1 as a pretext to refactor unrelated product code.

---

# 3. Required shared contracts

The final architecture packet must define the minimum versioned semantics for these
boundaries. Exact storage implementation is determined only after current-reality review.

## C1 — Actor and authority contract

Must distinguish:

- public actor type;
- authenticated account/user identity;
- organization reference identity;
- owned organization authority/profile representation;
- internal Staff/Super Admin roles;
- mentor as Individual capability, not actor;
- Government as institutional context, not public actor.

No contract may silently conflate Directory/reference identity with owned authority.

## C2 — Canonical Career Evidence contract

Minimum fields/semantics should support:

- stable fact/object identity;
- fact/evidence category;
- subject/owner;
- provenance/source class;
- verification/claim state;
- effective/observed timestamps;
- revision/correction/dispute/revocation;
- visibility/disclosure policy reference;
- evidence/artifact link where lawful;
- market/jurisdiction context only where needed.

CV/Profile/application/social expressions are projections/references, not second canonical
truth stores.

## C3 — Opportunity core contract

Minimum semantics:

- opportunity identity/type;
- source/provenance/authority;
- organization linkage;
- location/work-mode/jurisdiction context;
- freshness/expiry;
- application authority/destination;
- duplicate/supersession lineage;
- eligibility/requirements as source-linked claims;
- lifecycle/publication state.

`Opportunity` must not be structurally limited to `Job`.

## C4 — Journey / action / outcome event contract

Define versioned event semantics for user and employer transitions without building Radar or
Hiring Workspace yet. Preserve distinction between:

- user-declared action;
- system-observed action;
- employer-confirmed stage/outcome;
- external/third-party-sourced outcome;
- correction/reversal.

Missing state is never converted into rejection, success, unemployment, or any other
outcome.

## C5 — Purpose, disclosure, consent/authority, retention, audit contract

Define a reusable authorization envelope covering:

- subject;
- data category/object;
- recipient/audience;
- purpose;
- lawful/authorized basis reference;
- duration/expiry;
- withdrawal/revocation where applicable;
- retention policy reference;
- audit/access event.

Do not model all rights through one vague global consent toggle.

## C6 — University affiliation and cohort-linkage contract

Founder-approved relationship:

`Self-Declared Affiliation -> Institutional Verification -> Cohort Linkage`

Minimum semantics:

- University/institution reference;
- college/program/major/degree/graduation context as available;
- student/graduate status;
- optional institution/student identifier stored with appropriate privacy;
- declaration source/time;
- verification method/source/time;
- state: `Declared / Verified / Needs Review` or an equivalent documented enum;
- cohort-link record separate from full account visibility;
- correction/dispute/revocation/audit.

University email is optional and must never be mandatory.

## C7 — Assessment evidence contract

Define shared semantics only; do not build assessment products.

Minimum semantics:

- instrument/provider/version;
- construct/purpose;
- role/use context;
- attempt/result state;
- rubric/score meaning where applicable;
- accommodation/incident/appeal state;
- sharing/portability restrictions;
- retention;
- decision-use audit.

No universal JID Candidate/Employability/Culture Fit score.

## C8 — AI / automation authority envelope

Define a deterministic contract for:

- actor requesting action;
- approved purpose;
- input data classes;
- provider/model/version reference where material;
- permitted output/action class;
- external-action confirmation boundary;
- evidence/source links;
- human review state;
- fallback/kill state;
- audit event.

This contract must preserve Assistive + Explainable + Human-Authorized AI.

## C9 — Market/jurisdiction portability contract

Wave 1 must prevent needless Saudi lock-in without building foreign-market operations.

Define minimum representation for:

- country/jurisdiction;
- subdivision/region where relevant;
- locale/language;
- timezone/currency only where the domain needs them;
- organization/institution presence;
- source jurisdiction;
- policy/taxonomy version reference;
- future governed Market Adapter boundary.

Do not introduce multi-region infrastructure, foreign tax engines, foreign policy engines,
or speculative country tables without a current shared-contract need.

## C10 — Metric/event definition envelope

Define metadata required before a product metric can be trusted:

- metric/event ID and version;
- population/eligibility;
- numerator/denominator where applicable;
- period/window;
- source;
- missing/unknown state;
- coverage;
- privacy/suppression rule where applicable;
- owner and retirement/change history.

Do not invent KPI values.

---

# 4. Design foundations scope

Wave 1 may establish shared design foundations, not final feature screens.

Required outputs:

- approved JID semantic color/token inventory from governing brand/design evidence;
- Arabic/English typography contract and no-Arabic-letter-spacing enforcement;
- RTL/LTR layout primitives;
- spacing, radius, border, elevation, motion rules where evidence supports them;
- accessibility/focus/touch-target baseline;
- shared page/shell/header primitives only where current architecture supports reuse;
- standardized loading/empty/error/forbidden/offline/stale states;
- status/badge semantics tied to real domain states;
- form/dialog/filter/table/list patterns where cross-wave reuse is justified;
- anti-slop rules: no decorative KPI grids, fake charts, card soup, random pills,
  glassmorphism/glow, or unsupported visual metrics.

Cursor must not invent new backend semantics to make a component look complete.

---

# 5. Agent execution order

## Phase A — Claude Code: Research / Reuse / Architecture Gate

Claude Code is first.

### Claude tasks

1. Verify current branch/SHA and inspect only the files/tables/types/components needed to
   understand C1–C10 and design foundations.
2. Map current reality to each required contract: `KEEP / ADAPT / REPLACE / MISSING`.
3. Run focused OSS/standards research where a shared primitive could be reused or where an
   external standard materially reduces lock-in. Likely research areas include portable
   resume/evidence schema concepts, JobPosting/opportunity standards, observability/event
   standards, taxonomy references, form/schema tooling, and accessibility primitives.
4. Record license/source-rights/security/privacy/Arabic-Saudi fit and integration cost.
5. Produce one recommended contract architecture with alternatives/rejected options.
6. Identify every migration/data-risk implication but **do not execute migrations**.
7. Identify exact handoff interfaces for Codex and Cursor.

### Claude outputs

Create under `docs/command-center/wave-1/`:

- `WAVE_1_CURRENT_REALITY_MAP.md`
- `WAVE_1_ARCHITECTURE_AND_REUSE_PACKET.md`
- `WAVE_1_CONTRACT_SPEC.md`
- `WAVE_1_DESIGN_FOUNDATION_HANDOFF.md`
- `WAVE_1_RISK_AND_DECISION_LOG.md`

### Claude restrictions

- no product implementation;
- no production/database mutation;
- no broad full-repo archaeology after required evidence is found;
- no claiming standards are adopted merely because they are popular;
- no changing founder decisions.

End state:

`WAVE_1_CLAUDE_ARCHITECTURE_COMPLETE`

or

`BLOCKED_WITH_EXACT_CAUSE`

---

## Phase B — Codex: Canonical Contracts / Shared Engineering Foundations

Codex begins only after Claude's packet is reviewed and accepted for implementation.

### Codex tasks

- implement only approved shared contract types/schemas/adapters/guards/tests needed for
  Wave 1;
- preserve backward compatibility or use expand/contract techniques where required;
- add no product feature that belongs to Wave 2+;
- implement privacy/authorization/audit primitives only within approved contract scope;
- add focused tests proving contract invariants;
- update documentation with exact repository evidence.

Database changes, if any become genuinely necessary, require a separate explicit migration
sub-packet and remain non-production. Production is never authorized by this packet.

### Codex restrictions

- `DO NOT SPAWN SUBAGENTS` unless a later packet explicitly changes this line;
- no full-repo rescan after the Claude handoff identifies exact touchpoints;
- no broad refactor;
- no Wave 2 capability implementation;
- no new dependency without documented reuse decision/necessity;
- no production action.

End state:

`WAVE_1_CODEX_CONTRACTS_COMPLETE`

or

`BLOCKED_WITH_EXACT_CAUSE`

---

## Phase C — Cursor: Design Foundations / Frontend Shared Primitives

Cursor starts against frozen contracts only.

### Cursor tasks

- implement approved semantic tokens/foundations and shared primitives;
- preserve Arabic-first + English parity;
- ensure RTL/LTR, responsive, keyboard, focus, touch, contrast, and reduced-motion behavior;
- connect status/empty/loading/error/forbidden states only to real contract states;
- remove/replace conflicting shared design foundations only where the approved handoff
  explicitly scopes them;
- add component/accessibility tests where applicable.

### Cursor restrictions

- no invented metrics, states, data, or backend contract;
- no feature-screen redesign for Wave 2+;
- no decorative dashboard work;
- no production action;
- no subagents unless explicitly authorized.

End state:

`WAVE_1_CURSOR_FOUNDATIONS_COMPLETE`

or

`BLOCKED_WITH_EXACT_CAUSE`

---

# 6. Validation and closeout

Wave 1 cannot close until evidence confirms:

1. one canonical contract set exists for C1–C10;
2. no new parallel truth store was introduced;
3. University affiliation can represent declared/verified/review states without mandatory
   university email or automatic private-data access;
4. core contracts permit a future Market Adapter without premature GCC infrastructure;
5. assessment and AI authority contracts preserve adopted human-accountability rules;
6. data disclosures are purpose/audience scoped;
7. design foundations are Arabic-first, bilingual, accessible, responsive, and anti-slop;
8. focused tests pass;
9. `pnpm type-check`, `pnpm lint`, and build/tests required by changed application scope
   pass when application code is touched;
10. no production action occurred;
11. no Wave 2+ product capability was smuggled into the wave;
12. branch/SHA, changed files, tests, risks, deferred decisions, and Wave 2 entry point are
    recorded.

Final closeout artifact:

`docs/command-center/wave-1/WAVE_1_CLOSEOUT_REPORT.md`

Final terminal state:

`WAVE_1_COMPLETE`

Wave 2 starts only after strategic and technical closeout of Wave 1.
