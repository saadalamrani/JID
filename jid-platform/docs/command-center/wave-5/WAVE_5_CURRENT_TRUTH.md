# Wave 5 — Current Truth

**Verified:** 2026-08-29 on canonical base `c51d7d3`.

| Area | Classification | Verified truth |
| --- | --- | --- |
| Owned Business profiles | PRESERVE | `business_profiles.owner_user_id` is the operational ownership anchor. |
| Directory companies | PRESERVE | Display/reference identity only; `claimed_by` remains a transitional legacy path. |
| Native opportunities | ADAPT | `jobs.business_profile_id` ownership and publication rules are valid; role/criteria/lifecycle need a governed layer. |
| Applications | ADAPT | One `applications.id` and applicant ownership exist; status currently conflates workflow and outcome. |
| Application CV snapshot | PRESERVE | Atomic immutable snapshot creation and pointer are already implemented. |
| Employer applicant triage | REPLACE | Useful UI/query shell exists, but coarse status mutation and profile joins are ATS-like and over-broad. |
| Candidate Radar | ADAPT | Candidate-owned tracking exists; visible employer state must come from explicit events only. |
| Team permissions | BUILD | No durable per-Business hiring membership/role model exists. |
| Employer notes/audit | BUILD | No tenant-scoped hiring notes or transition ledger exists. |
| Screening/SSIS | DEFER | Wave 6 evidence extension only; do not deepen legacy scoring here. |
| Lammah external applications | PRESERVE boundary | External discovery/tracking never creates an employer workspace application. |
| Legacy `claimed_by` RLS | REMOVE-LATER | Transitional only; never use for new Profile-anchored rows. |
| Synthetic metrics/boost UI | REMOVE-LATER | Applicant counts may be factual; fake performance/conversion and paid visibility are outside contract. |

## Security gaps to close in implementation

- Add explicit organization hiring membership and bounded roles.
- Enforce stage transitions in the database, not only TypeScript/UI.
- Separate candidate-visible state, private stage, and terminal outcome.
- Replace mutable status-only history with an append-only audit/event ledger.
- Scope employer reads to submitted application data and immutable authorized snapshots.
- Add cross-organization, actor, anonymous, and withdrawal negative tests.
