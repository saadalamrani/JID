# Wave 5 — Frozen Employer Hiring Contract

**Authority date:** 2026-08-29 (Asia/Riyadh)  
**Base:** `integration/wave3-final-closure` at `c51d7d39688e74d62406aaf2ff5636c5ddd55128`  
**Status:** FROZEN; later changes must be additive or explicitly versioned.

## Canonical chain

`Opportunity -> Hiring Role -> Criteria -> Application -> Applicant -> Hiring Stage -> Evidence -> Outcome`

- **Opportunity** is the discoverable opening. A native opportunity is `jobs.id`, owned by an
  authorized `business_profiles.id`. A governed external Lammah item is discovery inventory,
  not an employer workspace.
- **Hiring Role** is the employer's governed selection configuration for one native opportunity.
- **Hiring Criteria** are role-relevant, bilingual definitions of what evidence is sought. They
  are not rankings and never create a universal candidate score.
- **Application** is one durable identity created by the Individual for one native opportunity.
  It references the applicant, opportunity, employer, disclosure authorization, and exactly one
  immutable application CV snapshot once submitted.
- **Applicant** is the Individual as seen through that application and authorized snapshot. It is
  not a copied profile and does not grant access to the private Career Record.
- **Hiring Stage** is employer workflow position. It is not an outcome.
- **Outcome** is an explicit terminal human decision/event: `HIRED`, `NOT_SELECTED`,
  `WITHDRAWN`, or `ROLE_CANCELLED`.
- **Audit Event** is append-only evidence of who performed a transition, when, and why.

The code-level enums and Wave 6 extension interface are frozen in
`src/types/contracts/hiring.ts`.

## Creation and references

The Individual creates a native Application. Employer users cannot fabricate an application
on an Individual's behalf. Submission references `jobs.id`, `business_profiles.id`, the
authenticated Individual, and `cv_projection_snapshots.id`. The existing
`create_application_cv_snapshot` transaction remains canonical: a non-null
`applications.cv_snapshot_id` is never overwritten.

External Lammah opportunities may be tracked by an Individual as `EXTERNAL_TRACKED`, but must
not create a row in the employer's applicant pipeline, imply employer participation, create
messages, or fabricate a candidate-visible employer status.

## Visibility boundary

Employer may see only application-scoped data: the submitted fields, immutable authorized CV
snapshot, candidate-visible status, criteria/evidence deliberately collected for this role,
and hiring history for its own opportunity. Employer-private notes, internal stage labels,
assignments, deliberation, and draft evidence stay employer-private.

Private Career Record facts, other applications, private profile fields, withdrawn disclosure
outside its applicable retention basis, and evidence unrelated to the role remain private.
RLS/server authorization must enforce this before data reaches a client.

Candidate-visible statuses are: `SUBMITTED`, `IN_REVIEW`, `ACTION_REQUIRED`, `INTERVIEW`,
`OFFER`, `NOT_SELECTED`, `HIRED`, and `WITHDRAWN`. Each stage declares its visible mapping.
Changing an internal stage does not automatically disclose its label or notes.

## Transitions and outcomes

Authorized Business owner/team members may perform only configured transitions for their own
opportunity. Each transition is atomic, append-only audited, and records actor, prior/new stage,
prior/new candidate-visible state, reason when required, and timestamp. Candidate withdrawal is
an Individual action; an employer cannot withdraw for them.

- Rejection means an accountable human explicitly records `NOT_SELECTED`; it is not merely a
  stage move.
- Withdrawal means the Individual ends their candidacy. It is not rejection.
- Silence, missing activity, a passed date, or employer inactivity means only "no recorded
  update". It must never be inferred as rejection, withdrawal, or outcome.
- `ROLE_CANCELLED` describes the opportunity, not a negative judgment about an applicant.
- `INTERVIEW`, `SCREENING`, `OFFER`, and `SHORTLIST` are workflow stages, not outcomes.

## Default governed stage graph

`APPLIED -> REVIEW -> SCREENING? -> INTERVIEW? -> OFFER? -> CLOSED`

Forward and backward non-terminal moves are allowed only when configured for the role. Closing
requires an explicit outcome. A closed application cannot transition except through a future,
explicit reopen operation that appends a new audit event. Bulk actions must apply the same
per-application authorization and transition validation as single actions.

## Team authority

Opportunity ownership stays anchored to the owned Business Profile. Team access is an explicit
membership with a bounded hiring role (`OWNER`, `HIRING_ADMIN`, `RECRUITER`, `INTERVIEWER`,
`VIEWER`) and active lifecycle. Directory records, verification, actor type, or another
organization's membership never grant hiring access. Staff access is separately privileged and
audited; University and Individual actors have no employer workspace authority.

## Wave 6 evidence extension

Wave 6 attaches purpose-bound evidence through `HiringEvidenceAttachmentRef`: application,
optional criterion, optional stage, evidence kind, evidence record id, recorder, and timestamp.
Supported extension kinds are screening response, work sample, structured interview observation,
rubric observation, scorecard, and assessment result. Evidence visibility is explicit per record.
No universal candidate score, culture-fit/personality ranking, autonomous rejection/hiring, or
automatic Career Record mutation is permitted.

## Audit contract

Audit events are immutable and tenant-scoped. Minimum event types: application submitted, stage
transitioned, candidate-visible status changed, outcome recorded, application withdrawn, note
added, and evidence attached. Corrections append; they do not rewrite history.
