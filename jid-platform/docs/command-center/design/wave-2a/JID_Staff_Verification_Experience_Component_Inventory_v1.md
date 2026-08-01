# JID — Staff Verification Experience
## Component Inventory v1 (JID Design Wave 2A)

Every component below is used by at least one screen in `JID_Staff_Verification_Experience_Design_Spec_v1.md` and implemented in `JID_Staff_Verification_Experience_Prototype_v1.html`. Brand tokens referenced by name are defined once in the Brand Tokens section at the end of this document.

---

### Layout & Shell

**AppShell**
Top-level frame: header bar + side navigation + main content region. Owns the language toggle and account switcher.
- States: default. Not screen-specific.
- Data: current locale (`ar`/`en`), current staff identity.
- Used on: every screen.
- Accessibility: `<header>`, `<nav>`, `<main>` landmarks; skip-to-content link as the first focusable element.
- RTL: entire shell mirrors via `dir` attribute on `<html>`; side nav moves from left (EN) to right (AR) as a structural flip, not a cosmetic `margin` hack.

**SideNav**
Primary navigation: Queue, My Queue, History, (System Dashboard as a separate demo entry point). Highlights current route.
- States: default, active-item.
- Data: nav item list (label, icon, route), current route.
- Used on: Screens 1, 2, 8; present in shell on all Staff screens.

**LanguageToggle**
Two-way switch between Arabic and English. Persists choice for the session (in-memory in the prototype; a real cookie/profile setting in production).
- States: `ar` active, `en` active.
- Used on: AppShell (global).
- Accessibility: implemented as two labeled buttons or a switch with `aria-pressed`, not an icon-only control.

**AccountSwitcher (prototype-only)**
Lets the reviewer of this prototype swap between "Layla Al-Fahad (Staff)" and "You, viewing VR-1004 (the request you submitted)" to demonstrate the self-review block. Explicitly labeled in the prototype UI as a demo control, not part of the real product.
- States: identity A, identity B.
- Used on: AppShell (global), directly affects Screen 6's rendering for VR-1004.

---

### Data Display

**VerificationCard**
Single request summary: organization name, TypeBadge, claimant name, StatusBadge, UrgencyIndicator. The atomic unit of every queue/list screen.
- States: default, focus, hover, self-review (visually flagged, e.g., a subtle "Submitted by your account" tag).
- Data: id, organization name (bilingual), type, claimant name, status, sla_due_at, assigned flag, self-review flag.
- Used on: Screens 1, 2, 8 (as VerificationCard variants), Screen 10 (a non-interactive reduced variant, VerificationPreviewRow).
- Accessibility: whole card is one focusable link; type/status conveyed by icon+text.

**TypeBadge**
Small label distinguishing Business from University. Text + icon, not color-only.
- States: `business`, `university`.
- Used on: VerificationCard, Workspace header, Checklist header.
- Brand: Business uses Primary Olive on Off-White; University uses Secondary Olive on Off-White — a deliberately restrained distinction (no third accent color introduced just for this).

**StatusBadge**
Text label for request status: Pending, Under review, Needs more information, Approved, Rejected.
- States: one per status value (5 total) — see State Matrix document for the full set and allowed transitions.
- Used on: VerificationCard, Workspace, History.
- Accessibility: text is the primary signal; a small icon reinforces it, color is a tertiary cue only.

**UrgencyIndicator**
SLA countdown/overdue marker (Normal / Warning / Critical / Overdue), derived from `sla_due_at`, never an invented score.
- States: normal, warning, critical, overdue.
- Used on: VerificationCard, Workspace header.
- Brand: overdue uses a small amount of a muted red (the one deliberate exception to the "no bright status colors" restraint, reserved only for genuinely overdue items); all other tiers stay within olive/gold/neutral tones.

**RelatedHistoryList**
List of other requests tied to the same applicant or same organization, each a compact link into that request's read-only Workspace.
- States: populated, empty ("No related requests found").
- Used on: Screen 3, Screen 8.

**AuditTrailList**
Chronological list of events for a request (submitted, first-viewed/assigned, evidence viewed, decision made), each with actor, timestamp, and event type — read-only.
- States: populated (a real request always has at least a "submitted" event, so this list is never genuinely empty for a real request).
- Used on: Screen 3.

**DirectoryReferenceCard**
Read-only presentation of the organization's Directory record (name, domains on file, entity state, existing verified links). Visually distinct from the applicant's *submitted* evidence, to reinforce Directory-vs-submission separation.
- States: found, not found (rare — organization record missing).
- Used on: Screen 3.

---

### Evidence & Checklist

**EvidenceList**
List of the request's submitted evidence items (declared domain, uploaded documents), each opening the EvidenceViewer.
- States: populated, no-evidence (shows the EvidenceViewer's "unavailable document" messaging inline as a placeholder row rather than requiring a click to discover there's nothing there).
- Used on: Screen 3.

**EvidenceViewer**
Modal/full-screen panel rendering one evidence item: document preview, metadata, privacy notice, and, when applicable, a secure download action.
- States: loading, populated (previewable), unavailable (nothing attached), unsupported-format (attached but can't preview), fetch-error.
- Used on: Screen 4, launched from Screen 3.
- Privacy: privacy notice is a required, non-dismissible-without-reading element of every populated/unsupported state.

**ChecklistPanel**
Type-aware list of ChecklistItem controls plus a completion summary used to gate Approve.
- States: incomplete (n of m checked), complete.
- Data: item definitions per request type (Business/University), current checked values.
- Used on: Screen 5, embedded in Screen 3's workspace rail.

**ChecklistItem**
Single checkbox + label + optional hint (e.g., compared domain values) + optional "view evidence" link.
- States: unchecked, checked, hint-loading, hint-error ("Couldn't verify — check manually").
- Used on: ChecklistPanel.
- Accessibility: real `<input type="checkbox">`, label and hint both associated via `for`/`aria-describedby`.

**DomainMatchFact**
Small, explicit two-column comparison ("Declared: acme.example" vs "On file: acme.example, acme-group.example") used inside the domain-match checklist item. Always shows both values — never a bare pass/fail icon with the underlying comparison hidden.
- States: match, mismatch, no-domains-on-file.
- Used on: ChecklistItem (domain-match), Workspace summary.

---

### Decision Flow

**DecisionPanel**
The Approve / Reject / Request-more-information control group, mandatory reason field, and submit action.
- States: default (reviewable), submitting, submit-error, self-review-blocked (entire form replaced by SelfReviewNotice), already-decided (entire form replaced by a read-only summary).
- Used on: Screen 6, embedded in Screen 3.

**DecisionOption**
One radio-style option within DecisionPanel (Approve/Reject/Request more information), each with its own icon and, for Reject, an expandable required-documents sub-selection.
- States: unselected, selected, disabled (Approve only, when checklist incomplete).
- Used on: DecisionPanel.

**ReasonField**
Mandatory multi-line text input with minimum-length validation and a visible note that the text may be shared with the applicant.
- States: empty, valid, invalid (too short), disabled (during submit).
- Used on: DecisionPanel.

**SelfReviewNotice**
Full-panel replacement shown instead of DecisionPanel when the signed-in Staff account is also the request's applicant. Explains why, offers no workaround.
- States: single state (always fully blocking — there is no "acknowledge and continue" variant).
- Used on: Screen 6 (for VR-1004 in the prototype).
- This component has no dismiss action by design.

**ConfirmationBanner**
Post-decision acknowledgment content used by Screens 7 and 9, differing only in body copy and whether a "no Profile created" statement is present (Screen 9 only).
- States: `more-information-sent`, `approved` (each with distinct copy, never shared/generic wording).
- Used on: Screens 7, 9.

---

### Filters & Search

**FilterBar**
Row of filter controls: type (All/Business/University), assignment (All/Assigned to me/Unassigned — Screen 1 only), urgency (All/Overdue/Critical/Normal), collapses to a drawer on mobile.
- States: default, mobile-collapsed (FilterDrawer).
- Used on: Screens 1, 2, 8.

**SearchInput**
Debounced free-text search by organization or claimant name.
- States: empty, typing, has-query.
- Used on: Screens 1, 2, 8.

**FilterDrawer**
Mobile-only bottom sheet housing the same controls as FilterBar.
- Used on: Screens 1, 2, 8 (mobile breakpoint only).

---

### Feedback & System States

**SkeletonRow / SkeletonBlock**
Structural loading placeholders matching the shape of the content they precede (list row, card section, evidence viewer frame).
- Used on: every screen with a data fetch (Screens 1–4, 8, 10).

**EmptyState**
Title + one-line subtitle, optional single secondary action (e.g., "Clear filters"). Two copy variants per screen: genuinely-empty vs. no-filter-matches.
- Used on: Screens 1, 2, 3 (related history), 4 (unavailable document), 8, 10.

**ErrorState**
Title + retry action (recoverable) or title + back-link (not-found/unauthorized, no retry offered).
- Used on: every screen with a data fetch.

**Toast/StatusAnnouncer**
Non-visual (or minimally visual) live-region announcer for state changes that need to reach assistive tech even without a full page navigation (decision submitted, checklist completion changed, first-view auto-assignment happened).
- Used on: Screens 3, 5, 6.

---

## Brand Tokens

| Token | Value | Primary use |
|---|---|---|
| `--jid-olive` (Primary Olive) | `#2F3A2E` | Primary text, primary buttons, active nav |
| `--jid-olive-secondary` (Secondary Olive) | `#414D40` | Secondary emphasis, University TypeBadge, section borders |
| `--jid-gold` (Accent Gold) | `#E6B43A` | Single-accent use only — focus rings, active-tab underline, the one "Confirm decision" primary action. Never used as a background fill for large areas. |
| `--jid-offwhite` (Off-White) | `#F7F5EF` | Page and card backgrounds |
| `--jid-overdue` (restrained red, not a brand-named token) | a single muted red, used only by UrgencyIndicator's overdue state | the one deliberate exception to the olive/gold/off-white palette |

**Explicitly excluded, per Brand rules:** no gradients anywhere (all fills are flat), no heavy drop shadows (borders and 1px hairlines are used for separation instead of shadow elevation), no additional accent colors beyond the single restrained red above, no decorative iconography that isn't functionally labeling a badge/state.
