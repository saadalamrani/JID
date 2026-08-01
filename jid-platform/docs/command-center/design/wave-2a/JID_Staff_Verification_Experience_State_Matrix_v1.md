# JID — Staff Verification Experience
## Decision-State Matrix v1 (JID Design Wave 2A)

## 1. Verification request lifecycle (primary state machine)

| State | Meaning | Who can act | Actions available | Resulting state(s) | Audit event | UI screen |
|---|---|---|---|---|---|---|
| `pending` | Submitted, not yet opened by any Staff member | Any Staff (until first opened) | Open (auto-assigns opener) | `pending` (assigned) | none until opened | Screen 1, 2 |
| `pending` (assigned, not yet reviewed) | Opened once, sitting in an assigned Staff member's queue | Assigned Staff, Super Admin | Approve / Reject / Request more information | `approved` / `rejected` / `needs_more_info` | first-view/assign (already logged) | Screen 3, 6 |
| `under_review` | Same practical meaning as "pending, assigned" — shown when a request has been actively opened and is awaiting decision | Assigned Staff, Super Admin | Approve / Reject / Request more information | `approved` / `rejected` / `needs_more_info` | none extra | Screen 1, 2, 3 |
| `needs_more_info` | Staff asked the applicant for more; applicant has not yet responded | Assigned Staff, Super Admin (read-only until applicant responds); Applicant (outside this Staff surface) | none for Staff until applicant re-submits | `pending` (on re-submission, out of this spec's scope) | decision recorded when this state was entered | Screen 1, 2, 3, 7 |
| `approved` | Terminal, positive | none — read-only | view only | — (terminal) | decision recorded | Screen 3 (read-only), 9 |
| `rejected` | Terminal, negative, with a cooldown before reapplication | none — read-only | view only | — (terminal until `can_reapply_after`, then a **new** request may be submitted; this is a new row, not a state change on the old one) | decision recorded | Screen 3 (read-only), 8 |

**Note on `pending` vs `under_review`:** these two labels describe the same underlying database status family in the current implementation (an unassigned request and an assigned-but-undecided request). This design treats them as one lifecycle stage with two visible sub-labels ("Pending" before first view, "Under review" after) rather than inventing a distinct state machine step, since no new decision becomes possible between them — only assignment changes.

---

## 2. Actor × permitted action matrix

| Actor | View Queue/My Queue | Open a Workspace | View evidence | Approve | Reject | Request more info | View another Staff member's My Queue |
|---|---|---|---|---|---|---|---|
| Unauthenticated | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Individual / Business / University (non-staff) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Staff, request assigned to them, **not** the applicant | ✓ | ✓ | ✓ | ✓ (if checklist complete) | ✓ | ✓ | ✗ |
| Staff, request unassigned | ✓ | ✓ (auto-assigns on open) | ✓ | ✓ (after auto-assign + checklist) | ✓ | ✓ | ✗ |
| Staff, **is the applicant** on this request | ✓ (sees it in listings) | ✓ (view only) | partial — see note below | **✗ hard block** | **✗ hard block** | **✗ hard block** | ✗ |
| Staff, request assigned to a **different** Staff member | ✓ (sees it in the shared Queue) | ✓ (view only — decision panel shows "assigned to another reviewer", not the self-review notice) | ✓ | ✗ (not theirs to decide) | ✗ | ✗ | ✗ |
| Super Admin | ✓ | ✓ | ✓ | ✓ (subject to the same self-review + checklist rules) | ✓ | ✓ | ✓ (System-level oversight only, not a personal "My Queue" swap) |

**Note on Staff-as-applicant evidence view:** a Staff member who is also the applicant on a request can see that the request exists and its status (it's their own submission), but this design does not grant them the reviewer's evidence-inspection view of their *own* submission through the Staff surface — they see it the same way any applicant sees their own status, not through the EvidenceViewer's Staff-authorized document access. This prevents "self-review" from being trivially reframed as "self-view of my own evidence through the review tool."

---

## 3. Decision outcome matrix (Screen 6)

| Selected outcome | Reason required | Min length | Required-documents field | Checklist must be complete | Result |
|---|---|---|---|---|---|
| Approve | Yes | 10 characters | n/a | **Yes — hard requirement** | `approved`; Screen 9; applicant notified; no Profile created |
| Reject | Yes | 10 characters | Optional (Staff may specify what's missing/wrong) | No | `rejected`; Screen 8 (history); `can_reapply_after` computed; applicant notified |
| Request more information | Yes | 10 characters | Optional (same field, reused) | No | `needs_more_info`; Screen 7; applicant notified, no cooldown applied |

**Race conditions handled:**
- Two Staff members open the same unassigned request simultaneously → first successful auto-assign wins; the second Staff member's view refreshes to show it's now assigned to a colleague, decision panel becomes read-only for them.
- A request is decided by another Staff member between this Staff member loading the Workspace and submitting their own decision → submit fails with a specific "already reviewed by another team member" error (Screen 6 error state), not a silent overwrite.
- The self-review condition becomes true only after page load (edge case, e.g. an account merge) → re-validated server-side at submit time regardless of what rendered at page-load time.

---

## 4. Self-review block — decision table

| Condition checked | Value source | If true |
|---|---|---|
| `verification_requests.applicant_user_id === session.user.id` | Server-side, computed fresh on both Workspace load and Decision submit | DecisionPanel is fully replaced by SelfReviewNotice; no approve/reject/more-info controls are rendered, not merely disabled; submit endpoint independently rejects the action even if a client somehow POSTs one |

This is the only **hard, non-bypassable** block in the entire experience. Every other permission in this matrix is enforced but none carries the explicit "must render zero decision controls" requirement — the self-review rule does, per the product rule "Staff cannot review their own request."

---

## 5. Evidence viewer state matrix (Screen 4)

| Evidence item condition | Viewer state shown | Retry offered |
|---|---|---|
| Document attached, supported format, fetch succeeds | Populated preview | n/a |
| Document attached, supported format, fetch fails | Fetch-error | Yes |
| Document attached, unsupported format | Unsupported-format message + secure download offer | No (not applicable — offer download instead) |
| No document attached for this evidence item | Unavailable-document message | No (not an error — a valid, expected state) |
| Declared value (not a document — e.g., domain) | No viewer needed; shown inline as a DomainMatchFact | n/a |

---

## 6. Checklist completion matrix (Screen 5)

| Request type | Checklist items | Approve unlocked when |
|---|---|---|
| Business | Domain match · Applicant title reasonable · No duplicate active request · Organization exists in Directory | all 4 checked |
| University | Domain match · Applicant title reasonable · No duplicate active request · University exists in Directory | all 4 checked |
| Any future type not yet defined | Falls back to the same 4-item shape until a type-specific set is explicitly designed | all 4 checked |

Checklist state is a **workflow gate**, not a database-enforced constraint — it exists to make Staff consider each factor, not to encode business logic that must also live server-side beyond "was Approve legitimately reachable." The self-review block, by contrast, **is** a hard server-side constraint regardless of any client-side gate.

---

## 7. Cross-reference to forbidden states

No row in any table above may ever resolve to a UI state that:
- Uses the word "Claim"/"مطالبة" as a status, action, or section label.
- Implies Verification approval creates, activates, or publishes a Profile.
- Grants a decision control to the request's own applicant, under any role.
- Displays an invented metric (approval rate, average time-to-decision, etc.) not directly computed from real, currently-loaded rows.
- Links to `/sys/claims` or any other nonexistent route.
