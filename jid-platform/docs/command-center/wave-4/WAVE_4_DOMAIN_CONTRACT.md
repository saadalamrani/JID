# WAVE 4 — FROZEN DOMAIN CONTRACT

**Freeze date:** 2026-08-29 (Asia/Riyadh)  
**Owner while open:** Cursor Wave 4 packet

This is the shared internal interface between Front A (Career Operations / Radar domain)
and Front B (Abhathli + Individual experience). Do not silently redefine Application.

## Distinctions (binding)

| Concept | Meaning |
| --- | --- |
| USER ACTION | Individual-initiated operational event (`actor_kind=user`) |
| EMPLOYER ACTION | Employer-initiated change, only when evidenced (`actor_kind=employer`) |
| SYSTEM EVENT | Platform event (`actor_kind=system`) |
| APPLICATION STATE | Frozen `applications.status` — Wave 5 shared |
| HIRING STAGE | Employer-side; Wave 4 must not invent a parallel truth |
| OUTCOME | User-recorded or evidenced terminal result on a Career Item |

## Career Item

User-private operational tracking of one opportunity.

- Identity: `career_items.id`
- Opportunity identity: Wave 3 `native:{job.id}` / `external:{lammah_opportunities.id}`
- Native applications may link `application_id`
- `GOVERNED_EXTERNAL` **must** keep `application_id` null
- Operational states: `considering | preparing | applied | interviewing | following_up | waiting | outcome`

## Radar presentation

Radar is the Career Operations surface, not only a Kanban of Saved/Applied/Interview/Offer/Rejected.

Required buckets:

- needs attention
- upcoming
- waiting
- changed
- next

Kanban of native applications may remain one presentation.

## Abhathli loop

`Find → Explain → Recommend → Prepare → User Approves → Apply / Redirect → Track`

- Search only the governed Opportunity Graph
- Explain from explicit criteria + Career Record evidence
- No match %
- No mass apply
- No consequential action without approval
- External redirect must not create an internal employer application
- Career Record is read-only unless a future user-approved inclusion flow is explicit

## Privacy

Notes, follow-ups, Abhathli reasoning, and private targets are owner-only.
Employer RLS must not gain these tables.
