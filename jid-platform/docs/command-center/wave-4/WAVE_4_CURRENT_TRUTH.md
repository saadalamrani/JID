# WAVE 4 — CURRENT TRUTH

**Timezone:** Asia/Riyadh  
**Generated:** 2026-08-29  
**Work branch:** `cursor/wave4-career-operations-abhathli`  
**BASE_SHA:** `c51d7d39688e74d62406aaf2ff5636c5ddd55128` (`integration/wave3-final-closure`)  
**Wave 3 implementation evidence:** `774032845b19919cf76c2710ca7f667742664937`

## Front budget

**2 FRONTS, one owner (Cursor), serial inside this packet**

| Front | Scope | Frozen interface |
| --- | --- | --- |
| A | Career Operations core / Radar domain | `CareerItem`, attention buckets, event actor kinds, application bridge |
| B | Abhathli + Individual experience | Find → Explain → Recommend → Prepare → Approve → Apply/Redirect → Track |

Shared internal interfaces were frozen in `WAVE_4_DOMAIN_CONTRACT.md` before UI wiring.

## Existing capability classification

| Surface | Class | Notes |
| --- | --- | --- |
| Opportunity Graph discovery contract | PRESERVE | Wave 3 `OpportunityDiscoveryItem` + loaders |
| Lammah governed inventory | PRESERVE | Entitlement, provenance, native precedence |
| Native `applications` + statuses | PRESERVE | Shared with Wave 5; no status added/removed |
| Application CV snapshot | PRESERVE | Immutable / purpose-bound |
| Applicant Radar Kanban + drag rules | ADAPT | Kept as native-application presentation, not the product |
| `JobSaveButton` → `applications.status=saved` | PRESERVE | Pre-existing employer-visible saved row |
| `lammah_radar_items` | ADAPT | Too thin; Wave 4 uses `career_items` |
| `radar_items` (generic scheduled cards) | DEFER | Mentorship meetings still loaded separately |
| Mentorship meetings on Radar | PRESERVE | |
| Notifications infrastructure | PRESERVE | No manipulative urgency notifications added |
| Gmail sync | DEFER | No current Gmail capability in repo |
| User tasks/reminders | BUILD | `career_item_actions` (did not exist) |
| Abhathli / search_mandates (removed 20260805) | REPLACE | New controlled copilot; do not restore scored matcher |
| Fake match % | REMOVE-LATER / absent | Must not return |
| Career Record | PRESERVE | Read-only for intelligence; no silent writes |
| CV projection | PRESERVE | User-controlled; drafts are review-only |
| i18n AR/EN + RTL/LTR | ADAPT | New `radar.operations` + `abhathli` copy |
| RLS model | ADAPT | New owner-only tables; applications RLS unchanged |
| Generated Supabase types | DEFER | New tables consumed via untyped client until `gen-types` after nonprod apply |

## Proposed Wave 5 contract change (NOT implemented)

Wave 4 does **not** independently redefine `Application`.

Recorded proposal only:

> Employer applicant lists should exclude Individual-private considering state (`saved` / `draft`) unless the user has submitted a native JID application. Wave 4 instead stores considering/notes/follow-ups on `career_items`, which employers cannot read.

No Application column, status, or snapshot semantics were changed in this Wave.

## Non-production / production

| Key | Value |
| --- | --- |
| NONPROD_REF | `hmjuijmaefajdjrjdsxu` |
| PRODUCTION_REF | `znfhladafpajyjwcfzvv` |
| PRODUCTION_TOUCHED | `NO` |
