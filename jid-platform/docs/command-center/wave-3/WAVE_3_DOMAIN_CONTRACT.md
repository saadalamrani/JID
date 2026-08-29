# WAVE 3 — FROZEN DOMAIN CONTRACT

**Authority:** Wave 3 Master Execution Command + C3 Opportunity Core  
**Freeze date:** 2026-08-29 (Asia/Riyadh)  
**Shared interface owner while open:** Front A until `WAVE_3_FRONT_A_COMPLETE`

This is the minimum canonical interface between Front A (core) and Front B (discovery UI).
Do not invent a future-proof mega-abstraction.

---

## 1. What is a JID Opportunity?

A discoverable career opening with typed family, provenance, lifecycle/freshness,
organization identity when known, and an apply authority/destination.

Job is one family. Opportunity is the conceptual master object for discovery.

## 2. Families currently supported

Canonical discovery enum (uppercase, C3-aligned):

`JOB | INTERNSHIP | COOP | GRADUATE_PROGRAM | FELLOWSHIP | SCHOLARSHIP`

| Family | Native today | External (Lammah) today |
| --- | --- | --- |
| JOB | yes (all `jobs` rows) | yes (`job`) |
| INTERNSHIP | no native type column — do not invent | yes |
| COOP | no | yes (`co_op`) |
| GRADUATE_PROGRAM | no | not in Lammah enum — omit |
| FELLOWSHIP | no | yes |
| SCHOLARSHIP | no | yes |

Unsupported families are not shown as labels.

## 3–4. Native vs external

| Class | Meaning |
| --- | --- |
| `JID_NATIVE` | Created/published through authorized owned organization workflow inside JID (`jobs`) |
| `GOVERNED_EXTERNAL` | Discovered/maintained by JID from an approved Lammah source |

Never imply a Lammah row was posted by the organization on JID, that JID owns the posting,
that JID submitted an application, or that employer messaging applies.

## 5. Canonical identity

| Origin | Identity |
| --- | --- |
| Native | `native:{job.id}` |
| External | `external:{lammah_opportunities.id}` |

Multiple observations of the same underlying opening must not create duplicate *active*
public inventory when deterministic dedup/native precedence applies. Provenance is retained
(`superseded` / match events), not hard-deleted.

## 6. Source provenance

Required on every discovery item:

- `source_class`: `JID_NATIVE` | `GOVERNED_EXTERNAL`
- `source_ref`: native org/profile anchor or `lammah_sources.id`
- `source_record_ref`: native job id or `external_ref_hash` / source record key
- External only: `source_name`, `source_approval_state` when loaded

## 7–8. Lifecycle + freshness

| Origin | Public-active rule |
| --- | --- |
| Native | `jobs.status = published` AND `application_deadline >= now` |
| External | `status = active` AND (`expires_at` null OR `expires_at > now`) AND `last_confirmed_at` within freshness window (14 days) |

Historical Lammah statuses preserved: `active | hidden | superseded | expired`.

Do not fabricate “still open / closing soon / recently posted” without evidence fields.

## 9–10. Discoverable vs unavailable

**Discoverable:** passes public-active rule; external also requires server-side `lammah_feed` entitlement before rows cross the network.

**Unavailable / excluded:** draft/closed native; hidden/expired/superseded/stale external; unentitled Lammah (empty entitled=false payload, no teaser inventory counts from protected rows).

## 11. Organization identity

- Native: Directory/`companies` via job.company_id + owned `business_profile_id`
- External: preserve `company_name_raw`; `company_id` only when mapped; unresolved allowed
- Never create Directory/Profile/Verification from Lammah alone

## 12. Native precedence

1. Matching native published job → do not expose active Lammah duplicate  
2. Native publish after Lammah → supersede external (`supersede_lammah_on_native_post`)  
3. Preserve provenance; no physical delete for precedence  
4. Native unpublish must not reactivate stale external  
5. AI similarity alone never suppresses  
6. Enforced in DB; discovery read model trusts status=`active` filter

## 13. What the Individual can do

- Discover native opportunities (core)  
- Discover Lammah when entitled  
- Open apply destination (native apply flow or external redirect)  
- Save/report external without employer-communication side effects  

## 14. What must NOT happen for external

- Internal `applications` / snapshots / communication_* / outreach  
- Profile ownership mutation  
- Abhathli / match % / personalized ranking  

## 15. Missing fields

Omit cleanly. Never coerce to `0`. Optional: location, deadline, organization mapping, description.

## 16. Stable read contract for Front B

Type: `OpportunityDiscoveryItem` in `src/lib/opportunity/discovery-types.ts`

```ts
{
  opportunity_id: string           // native:uuid | external:uuid
  opportunity_family: OpportunityDiscoveryFamily
  source_class: 'JID_NATIVE' | 'GOVERNED_EXTERNAL'
  source_ref: string
  source_record_ref: string
  source_name?: string
  source_approval_state?: 'approved' | 'candidate' | 'prohibited' | string
  organization_ref_id?: string
  organization_name?: string
  organization_logo_url?: string
  title: { ar?: string; en?: string }
  excerpt?: string
  location?: { country?: string; region?: string; city?: string; is_remote?: boolean }
  published_at?: string
  last_confirmed_at?: string
  expires_at?: string
  apply_authority: 'JID_NATIVE' | 'OFFICIAL_EXTERNAL' | 'REDIRECT_ONLY' | 'UNAVAILABLE'
  apply_url?: string
  source_url?: string              // may equal apply_url when not separately stored
  lifecycle_state: 'PUBLISHED' | 'ACTIVE_EXTERNAL' | 'CLOSED' | 'EXPIRED' | 'SUPERSEDED' | 'HIDDEN'
}
```

Server loaders:

- `listNativeDiscoveryOpportunities(filters)` — no entitlement gate  
- `listExternalDiscoveryOpportunities()` — entitlement fail-closed before query  
- `listOpportunityDiscovery(filters)` — merged view with deterministic sort (freshness/deadline, stable id tie-break); never boost/match %

### Source rights (Front A)

`lammah_sources.approval_state`:

- `approved` — may automate within contract  
- `candidate` — no automated publication  
- `prohibited` (or unsupported) — blocked  

### Reuse gate (embedded)

External reference `MadsLorentzen/ai-job-search`: **EXTRACT_PATTERN** only  
(adapters, normalize, dedup, provenance, freshness). Do not import product model.  
Abhathli = Wave 4.

---

## FRONT_A_OWNERSHIP

- `src/lib/opportunity/**`
- `docs/command-center/wave-3/**` (core/contract)
- Opportunity unit tests under `tests/unit/opportunity/**`
- Additive migrations only if required for graph invariants
- Lammah server read adapters consumed by graph (`src/lib/lammah/server.ts` — A may extend export shapes carefully)

## FRONT_B_OWNERSHIP

- `src/app/[locale]/(public)/opportunities/**`
- `messages` `opportunities.*` copy
- Frontend/component tests for discovery UI

## SHARED_INTERFACES

- `OpportunityDiscoveryItem` + discovery loaders above  
- Only one Front edits a shared file at a time; B starts from A `FINAL_SHA`
