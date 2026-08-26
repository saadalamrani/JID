# JID — Wave 1 / Front 1 Closeout

**Front:** Current Reality + Contract Architecture  
**Execution owner for this run:** ChatGPT / Nebras (Control Tower fallback)  
**Branch:** `nebres/wave1-front1-contract-architecture`  
**Parent evidence commit:** `e20f70120ce588a1e7551385bf216d950a2f10a5`  
**Status:** CLOSED / READY FOR FRONT 2

## Closeout result

Front 1 is complete as architecture/research only.

The five required Wave 1 architecture outputs exist and are frozen for the next implementation front:

1. `WAVE_1_CURRENT_REALITY_MAP.md`
2. `WAVE_1_ARCHITECTURE_AND_REUSE_PACKET.md`
3. `WAVE_1_CONTRACT_SPEC.md`
4. `WAVE_1_DESIGN_FOUNDATION_HANDOFF.md`
5. `WAVE_1_RISK_AND_DECISION_LOG.md`

`WAVE_1_FRONT_1_NEBRAS_EXECUTION_NOTE.md` records the owner substitution used for this run and the corrected canonical C1–C10 numbering.

## Verified current-state findings handed forward

- the connected `jid-nonprod` project is active and was inspected read-only;
- relevant reviewed domain tables have RLS enabled;
- Directory / Verification / Owned Profile separation exists and is reusable;
- legacy claim-era authority residue still exists and must not become new target authority;
- Career Record canonical evidence is not yet implemented;
- native opportunities remain Job-centric while Lammah contains stronger provenance and multi-type foundations;
- no shared JourneyEvent, DisclosureAuthorization, AutomationAuthority, UniversityAffiliation/CohortLink, or MetricDefinition registry is currently implemented;
- legacy SSIS tables and recommendation semantics exist in non-production, but SSIS Edge Functions were not present in the connected non-production Edge Function inventory at review time;
- current non-production database runtime reports PostgreSQL 17.x;
- production parity remains intentionally unverified.

## Frozen architecture decisions

- Contract-first modular monolith on the existing Next.js + Supabase/PostgreSQL/RLS foundation.
- Exactly three public actors: Individual, Business, University.
- Career evidence becomes canonical; CV/Profile/application/social surfaces are projections or compatibility sources.
- Opportunity becomes a neutral core with Job as a subtype.
- Journey/outcome truth uses append-only event semantics.
- Cross-actor disclosure uses purpose/basis/recipient/object/time-scoped authorization while RLS remains enforcement.
- University affiliation follows `Declared -> Verified -> Needs Review`; cohort linkage is separate and grants no private Career Record access.
- Assessment evidence is purpose-bound; legacy generic AI composite/recommendation semantics are not target hiring authority.
- AI remains Assistive + Explainable + Human-Authorized through a shared authority envelope.
- Saudi remains the operating default while shared contracts avoid needless country lock-in.
- Metrics require explicit version/population/source/window/missingness/coverage/privacy semantics.
- Existing Arabic-first design foundations are adapted, not replaced wholesale.

## Front 2 entry gate

Front 2 may implement only the approved shared engineering primitives required by C1–C10. It must not implement Wave 2+ product journeys.

Before any schema change, Codex must re-verify the exact non-production schema and use expand/contract. Any DDL is a separate explicit non-production migration sub-packet. No production action is authorized.

## Terminal state

`WAVE_1_FRONT_1_ARCHITECTURE_COMPLETE`
