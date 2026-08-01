# JID — Staff Verification Experience
## Design Specification v1 (JID Design Wave 2A)

**Scope:** the internal Staff surface for reviewing organizational Verification requests (Business and University). Public-facing submission (`EntitySignupWizard`, `ClaimSubmissionForm`) and the System (`/sys`) administration surfaces are out of scope except where explicitly named (Screen 10).

**Terminology lock, applies to every screen in this document:**
"Verification" / "التحقق" is the only term used for the request, the process, and the review action. "Claim" / "مطالبة" does not appear anywhere in visible UI, in this document's own screen copy, or in the prototype. Where the underlying data model still uses "claim"-shaped names internally (out of this design task's scope to change), the UI-facing label is always "Verification."

**Constitutional anchors this spec enforces on every screen:**
Directory records are reference records only — nothing here lets Staff or an applicant treat a Directory row as something owned. Verification proves organizational representation; it does not create a Profile — Screen 9 states this explicitly rather than leaving it implied. Staff can never review a request where they are also the applicant — Screen 6 makes this a hard block, not a warning. No screen invents a metric, percentage, or count that isn't a direct reflection of real visible rows. No screen exposes uploaded evidence outside an authenticated, authorized Staff session. No decision is ever auto-made from a domain match alone — domain match is always presented as one signal among several, decided by a person.

**Placeholder data used throughout this spec and the prototype** (fictional, chosen to be unambiguously not real organizations):

| ID | Organization (EN) | Organization (AR) | Type | Status | Notes |
|---|---|---|---|---|---|
| VR-1001 | Al Rawabi Logistics | شركة الروابي للخدمات اللوجستية | Business | Under review, assigned to current staff | Near SLA (critical), full evidence, one prior rejected request on file |
| VR-1002 | Al-Noor National University | جامعة النور الوطنية | University | Pending, unassigned | Normal urgency, full evidence |
| VR-1003 | Sahel Retail Group | مجموعة ساحل للتجزئة | Business | Needs more information | Staff already requested a clearer authorization letter |
| VR-1004 | Prime Analytics | برايم للتحليلات | Business | Pending, assigned to current staff | **Self-review blocked** — applicant is the signed-in staff account |
| VR-1005 | Eastern Coast University | جامعة الساحل الشرقي | University | Approved | Used for Screen 9 |
| VR-1006 | Bright Path Consulting | المسار المشرق للاستشارات | Business | Rejected | Reapply cooldown active, used for Screen 8 |
| VR-1007 | Amber Field Trading | حقل العنبر للتجارة | Business | Pending, unassigned, overdue | No evidence uploaded — used for Screen 4's unavailable-document state |
| VR-1008 | Al-Noor National University | جامعة النور الوطنية | University | Under review | One evidence file in an unsupported format — used for Screen 4 |

Signed-in demo Staff account: **"Layla Al-Fahad" / "ليلى الفهد"** (role: Staff, non-super-admin). A second demo identity, **"You (as applicant on VR-1004)"**, is selectable in the prototype's account switcher solely to demonstrate the self-review block — this is a prototype-only affordance, not a real feature.

---

## Screen 1 — Verification Queue

**Purpose:** the primary Staff landing surface for working the Verification backlog — see everything pending across the team, distinguish Business from University at a glance, and pull the next item to review.

**Permitted role:** Staff, Super Admin. Not reachable by Individual, Business, University, or unauthenticated sessions.

**Required data:** for each request — id, organization name (bilingual), type (business/university), status, submitted_at, assigned_staff (nullable), sla_due_at. No applicant PII beyond the claimant's display name is shown at list level; business email and documents are workspace-only (see Privacy boundary).

**Privacy boundary:** the queue shows the minimum needed to triage — organization name, claimant name, status, urgency. Business email, phone, uploaded documents, and full applicant profile are not rendered at list level; they load only inside the Verification Workspace (Screen 3), which is a server-authorized fetch per request, not a client-side reveal of already-fetched data.

**Arabic copy:**
- Title: "طلبات التحقق"
- Subtitle: "راجع طلبات تحقق الشركات والجامعات"
- Column/section labels: "الكل" · "غير مُسندة" · "مُسندة لي" · "النوع" · "الحالة" · "المهلة"
- Type badges: "شركة" (Business) · "جامعة" (University)
- Empty: "لا توجد طلبات مطابقة"

**English copy:**
- Title: "Verification Requests"
- Subtitle: "Review Business and University verification requests"
- Column/section labels: "All" · "Unassigned" · "Assigned to me" · "Type" · "Status" · "SLA"
- Type badges: "Business" · "University"
- Empty: "No matching requests"

**Primary action:** open a request → Verification Workspace (Screen 3).
**Secondary actions:** filter by type (Business / University / All), filter by urgency (Overdue / Critical / Normal / All), filter by assignment (Assigned to me / Unassigned / All), free-text search by organization or claimant name, jump to My Queue (Screen 2) or History (Screen 8).

**Loading state:** skeleton rows (organization-name-width bar + status-pill-width bar) in place of real rows, count matches the last known page size or a fixed placeholder count — never a spinner alone with no structure, so the layout doesn't jump on load.

**Empty state:** centered message + subtitle only ("No matching requests" / "Try a different filter"), no illustration implying activity that isn't there, no invented "0 requests today, up 12% ​" style copy.

**Error state:** inline banner above the list — "Couldn't load verification requests. Try again." / "تعذّر تحميل طلبات التحقق. حاول مرة أخرى." — with a retry action. The rest of the shell (filters, nav) stays interactive; a full-page error is never used for a list-fetch failure.

**Validation:** none (read-only screen); filter/search inputs have no server round-trip validation, only client-side debounce on the search field.

**Accessibility:** list is a semantic list (`<ul>`/table with proper headers), each row is a single keyboard-focusable link (not a div with a click handler only), status and type communicated by icon + text, never by color alone, focus ring visible in both LTR and RTL, filter controls are real `<button>`/`<select>` elements with visible labels (not icon-only).

**Mobile behavior:** filters collapse into a single "Filters" sheet/drawer triggered by one button; each row stacks organization name above claimant name above status/urgency, full row remains one tap target.

**Audit consequence:** none — viewing the queue is not itself a logged decision event, though the underlying read is authorized and rate-limited server-side like any Staff query.

**Next transition:** selecting a row → Screen 3 (Verification Workspace) for that request.

**Forbidden wording:** "Claim," "claim queue," "claimed," any invented aggregate ("94% approval rate," "average review time: 2.3h") not derived from the rows actually shown.

**Implementation acceptance criteria:**
- [ ] No request row, filter, or copy string contains the word "Claim"/"مطالبة" in any language.
- [ ] Business and University rows are visually distinguishable without relying on color alone (icon or text badge).
- [ ] No count, percentage, or chart appears anywhere on this screen that isn't a direct tally of the rows currently loaded.
- [ ] List reachable and fully operable via keyboard alone.
- [ ] Verified in both `dir="rtl"` (Arabic) and `dir="ltr"` (English) layouts.

---

## Screen 2 — My Review Queue

**Purpose:** narrow the backlog to exactly what this Staff member is personally responsible for, so nothing assigned to them goes stale unnoticed.

**Permitted role:** Staff, Super Admin (viewing only their own assignments — this is not a way to see another staff member's personal queue).

**Required data:** same shape as Screen 1, pre-filtered server-side to `assigned_staff_id = current_user`.

**Privacy boundary:** identical to Screen 1 — no additional exposure, and critically, no way to pivot this screen to view a colleague's assigned queue instead of your own.

**Arabic copy:**
- Title: "قائمتي للمراجعة"
- Subtitle: "الطلبات المُسندة إليك"
- Empty: "لا توجد طلبات مُسندة إليك حالياً"

**English copy:**
- Title: "My Review Queue"
- Subtitle: "Requests assigned to you"
- Empty: "You have no requests assigned right now"

**Primary action:** open a request → Verification Workspace.
**Secondary actions:** same filter/search set as Screen 1, minus the "Assigned to me / Unassigned" toggle (redundant here); a link back to the full Queue.

**Loading state:** same skeleton pattern as Screen 1.

**Empty state:** this is the state most likely to occur legitimately and often (a Staff member with a clean queue) — copy is neutral and positive-toned, not apologetic, and does not suggest something is broken: "You have no requests assigned right now" / "لا توجد طلبات مُسندة إليك حالياً," with a secondary link to the full Queue to pick up unassigned work.

**Error state:** identical pattern to Screen 1.

**Validation:** none (read-only).

**Accessibility:** identical pattern to Screen 1.

**Mobile behavior:** identical pattern to Screen 1.

**Audit consequence:** none.

**Next transition:** selecting a row → Verification Workspace.

**Forbidden wording:** "My claims," "my claim queue."

**Implementation acceptance criteria:**
- [ ] Query is server-scoped to the authenticated user's `assigned_staff_id`; no client-side "assigned to me" filter over a full unscoped dataset.
- [ ] Empty state copy reads as normal, not as an error.
- [ ] No "Claim" wording anywhere.

---

## Screen 3 — Verification Request Workspace

**Purpose:** the single screen where a Staff member gathers everything needed to decide — who is applying, what organization they claim to represent, what evidence they submitted, how it relates to past requests — and reaches a decision.

**Permitted role:** Staff, Super Admin. A Staff member who is also the request's applicant may open this screen to see status, but the Decision Panel (Screen 6) is blocked for them — see Screen 6.

**Required data:** applicant identity (name, verified-contact indicators — not raw phone/email unless within the Business Email evidence field itself), organization Directory reference record (name, domains on file, entity state, existing verification/linkedin/website links), the request's own submitted evidence (business email, claimant title, uploaded documents, declared domain), domain-match signal (computed, evidence-only), related history (other requests by the same applicant or against the same organization), and the audit trail for this request.

**Privacy boundary:** this is the one screen authorized to show applicant contact detail and uploaded documents — and only to assigned/eligible Staff, never to the applicant's own non-staff view, never to another organization, never in a public or System-level surface. Opening this screen for an unassigned request auto-assigns it to the opening Staff member (first-view assignment), which is itself a privacy-relevant event and is logged.

**Arabic copy:**
- Back link: "العودة إلى قائمة الطلبات"
- Section titles: "بيانات الطلب" · "مقدّم الطلب" · "الجهة (سجل الدليل)" · "الأدلة المرفقة" · "طلبات ذات صلة"
- Status line: "الحالة: {status} · قُدّم {relativeTime}"
- Already-decided banner: "تم اتخاذ قرار بشأن هذا الطلب مسبقاً"

**English copy:**
- Back link: "Back to queue"
- Section titles: "Request details" · "Applicant" · "Organization (Directory reference)" · "Submitted evidence" · "Related requests"
- Status line: "Status: {status} · submitted {relativeTime}"
- Already-decided banner: "This request has already been reviewed"

**Primary action:** if pending/needs-more-info and reviewable: reach a decision via the Decision Panel (Screen 6). If already decided: read-only review, no action.
**Secondary actions:** open Evidence Viewer (Screen 4) per document, open Review Checklist (Screen 5), view full Related History (Screen 8-adjacent), navigate back to queue.

**Loading state:** the workspace loads in sections — header/applicant/organization skeleton first (fastest query), evidence and related-history sections show their own independent skeletons rather than blocking the whole page on the slowest query.

**Empty state:** not applicable to the workspace shell itself, but two of its sections have their own: no uploaded evidence (see Screen 4's "unavailable document" state) and no related history ("No related requests found" / "لا توجد طلبات ذات صلة").

**Error state:** if the request can't be found (bad id, deleted, or not authorized): a dedicated not-found message with a link back to the queue, not a blank page. If the workspace loads but a sub-section (e.g., related history) fails independently: that section shows its own inline retry, the rest of the workspace remains usable.

**Validation:** none at the workspace-shell level (validation lives in the Decision Panel, Screen 6).

**Accessibility:** section headings are real headings (`<h2>`/`<h3>`) forming a correct outline for screen-reader navigation; the applicant/organization data is presented as definition lists (`<dl>`) with paired labels, not bare visual columns; the "already decided" banner is announced (`role="status"`).

**Mobile behavior:** the two-column desktop layout (main content + sticky checklist/actions rail) becomes a single column; the checklist and decision panel move below the evidence section rather than floating, and a persistent "Review" button anchors to the bottom of the viewport so the decision action is always reachable without scrolling back up.

**Audit consequence:** opening an unassigned request logs a first-view/auto-assign event. No other passive viewing is logged beyond standard access logging.

**Next transition:** submitting a decision in the Decision Panel → either Screen 9 (Approved confirmation), Screen 7 (More-information acknowledgment), or back to the queue with the item now marked Rejected (detail visible via Screen 8-style history).

**Forbidden wording:** "Claim," "claimant" as a section title (claimant is fine as a data field label referring to the person's declared title, but "Claim" itself never appears), "the company you're claiming."

**Implementation acceptance criteria:**
- [ ] Business email, uploaded documents, and full applicant contact detail are never present in the initial page payload for the Queue or My Queue screens — only fetched when the Workspace for that specific, authorized request is opened.
- [ ] First-view auto-assignment is a real server-side event with an audit log entry, not a UI-only label change.
- [ ] Domain-match signal is displayed as a labeled fact ("Domain matches organization record: yes/no"), never as a pass/fail gate that hides or disables the decision panel.
- [ ] Screen renders correctly for both Business and University request types, with type-appropriate evidence fields (see Screen 5).

---

## Screen 4 — Evidence Viewer

**Purpose:** let Staff inspect a specific piece of submitted evidence (a document or declared value) closely enough to judge it, without ever exposing it outside an authorized session.

**Permitted role:** Staff, Super Admin, only from within a Verification Workspace they're authorized to view.

**Required data:** the evidence item's type (document / declared value), file metadata (name, format, upload time) for documents, and the document content itself via a short-lived authorized fetch — never a permanent public URL.

**Privacy boundary:** every document view is a fresh, authorized, short-lived fetch; the viewer never caches a shareable link, never renders in a plain `<img>`/`<iframe>` pointed at a public bucket path, and the viewer explicitly warns Staff before any export/download action that the file contains third-party personal or business information and must not be shared outside the review.

**Arabic copy:**
- Title: "عرض الدليل"
- Privacy notice: "يحتوي هذا الملف على معلومات خاصة بمقدّم الطلب. لا تتم مشاركته خارج نطاق المراجعة."
- Unavailable: "لم يتم إرفاق هذا الدليل"
- Unsupported format: "تعذّر عرض هذا الملف داخل النظام. النوع غير مدعوم للمعاينة."

**English copy:**
- Title: "Evidence viewer"
- Privacy notice: "This file contains information about the applicant. Do not share it outside this review."
- Unavailable: "No document was attached for this evidence item"
- Unsupported format: "This file type can't be previewed in the system."

**Primary action:** close viewer / return to Workspace. **Secondary actions:** where the format supports it, zoom; where unsupported, a clearly labeled secure download is offered instead of a broken inline preview — download itself re-shows the privacy notice as a confirm step.

**Loading state:** a bounded skeleton matching the expected document aspect ratio, with a text status ("Loading document…" / "جارٍ تحميل المستند…") — not an indefinite spinner with no bound.

**Empty state:** the "unavailable document" state above — a plain, neutral message, not an error styling, since a missing optional document is an expected, valid state, not a failure.

**Error state:** distinct from "unavailable" — a genuine fetch failure ("Couldn't load this document. Try again." / "تعذّر تحميل المستند. حاول مرة أخرى.") with retry, used only when a document exists but couldn't be retrieved.

**Validation:** none (viewer is read-only).

**Accessibility:** the privacy notice is announced before content, not visually present only; keyboard-operable close and zoom controls; alt text on any rendered image describing it as "submitted verification document," never auto-describing document contents (no OCR-derived alt text that could leak content into assistive-tech logs beyond what's necessary).

**Mobile behavior:** viewer opens full-screen rather than as a small modal, to keep documents legible; privacy notice stays pinned at the top rather than scrolling away.

**Audit consequence:** every evidence view is logged (who, which document, when); every download/export attempt is logged separately and more prominently, since it's the higher-risk action.

**Next transition:** close → back to Workspace, checklist item for this evidence can now be marked reviewed.

**Forbidden wording:** none specific, but no copy in this viewer may restate or summarize the document's private contents as UI chrome (e.g., a filename should not encode a national ID number).

**Implementation acceptance criteria:**
- [ ] Document URLs are never guessable/persistent — each view issues a fresh authorized request.
- [ ] Unavailable vs. unsupported-format vs. fetch-error are three visually and textually distinct states, never collapsed into one generic "error."
- [ ] Every view and every download is captured in the audit trail with distinct event types.
- [ ] Privacy notice is present on every document type without exception.

---

## Screen 5 — Review Checklist

**Purpose:** give Staff a consistent, type-aware structure for judging a request, so decisions rest on the same considered factors every time rather than an unstructured read-through.

**Permitted role:** Staff, Super Admin, within an authorized Workspace, only interactive while the request is still reviewable (see Screen 6).

**Required data:** checklist item definitions (varies by Business vs. University vs. any other request type the platform supports), current checked state per item, and the specific evidence values needed to render each item's hint (declared domain vs. organization's domains on file, claimant title, related-history duplicate signal).

**Privacy boundary:** the checklist itself contains no new private data beyond what's already loaded into the authorized Workspace; it is a lens on that data, not a new source of it.

**Arabic copy (Business):**
- "تطابق النطاق مع سجل الجهة" (hint: shows the compared domains)
- "منصب مقدّم الطلب معقول" (hint: shows the declared title)
- "لا تكرار لطلبات نشطة على نفس الجهة"
- "الجهة موجودة في الدليل"

**English copy (Business):**
- "Domain matches organization record" (hint shows compared domains)
- "Applicant's stated title is reasonable" (hint shows declared title)
- "No duplicate active request for this organization"
- "Organization exists in the Directory"

**University variant** swaps "Organization exists in the Directory" for "University is listed in the Directory" and keeps the same domain/title/duplicate items — Business and University share the same underlying checklist shape, differing only in label, exactly matching how the actual system distinguishes the two types.

**Primary action:** toggle a checklist item. **Secondary action:** view the evidence behind a hint (opens Evidence Viewer where applicable, e.g., a linked document).

**Loading state:** items render with their labels immediately (static, known ahead of data) while hint values ("comparing domains…") resolve independently.

**Empty state:** not applicable — a checklist always has a fixed item set for its request type.

**Error state:** if a hint's underlying value fails to load (e.g., related-history duplicate check), that single item shows "Couldn't verify — check manually" rather than blocking the whole checklist.

**Validation:** the Decision Panel's Approve action is disabled until every checklist item is checked — this is a soft workflow gate, not a database constraint, and Staff can still see why it's disabled (a plain list of unchecked items).

**Accessibility:** each item is a real checkbox with a programmatically associated label and hint (`aria-describedby`), not a styled div; checklist completion state is announced when it changes.

**Mobile behavior:** checklist collapses into the same single column as the rest of the workspace on small screens; items remain full-width tap targets.

**Audit consequence:** the checklist's checked state at time of decision is stored with the decision record (what was actually verified), not just the final approve/reject outcome.

**Next transition:** completing the checklist enables the Decision Panel's Approve path; the checklist does not itself navigate anywhere.

**Forbidden wording:** "Claim checklist," "claim evidence."

**Implementation acceptance criteria:**
- [ ] Checklist item set is derived from request type (Business/University/other), not hardcoded to one shape.
- [ ] Domain-match hint always shows both sides of the comparison (declared vs. on-file), never just a pass/fail icon with no evidence shown.
- [ ] Approve is genuinely disabled (not just visually dimmed but still clickable) until all items are checked.
- [ ] Checklist state is persisted with the decision, retrievable later via audit trail.

---

## Screen 6 — Decision Panel

**Purpose:** the point of accountability — Staff commits to Approve, Reject, or Request More Information, with a reason that becomes part of the permanent record.

**Permitted role:** Staff, Super Admin — and explicitly **not** the applicant themselves, even if they hold a Staff role. This is the one screen in the whole experience with a hard, non-bypassable block.

**Required data:** the three decision options, a mandatory reason field, Reject-specific required-document selection, and — critically — a server-verified comparison of `applicant_user_id` against the current session's user id, computed before rendering, not inferred from anything the client already has cached.

**Privacy boundary:** the reason field is stored as part of the audit-visible decision record (visible to Staff/Super Admin reviewing history, and, in appropriately summarized form, to the applicant as their rejection/more-info reason) — Staff should write it knowing it may be read by the applicant, and the UI says so.

**Arabic copy:**
- Title: "القرار"
- Options: "قبول" · "رفض" · "طلب مزيد من المعلومات"
- Reason label: "سبب القرار (سيُشارك مع مقدّم الطلب عند الرفض أو طلب المعلومات)"
- Reason placeholder: "اكتب سبباً واضحاً ومحدداً"
- Submit: "تأكيد القرار"
- Self-review blocked: "لا يمكنك مراجعة طلب تحقق مقدَّم من حسابك الخاص. سيقوم عضو آخر من الفريق بمراجعته."

**English copy:**
- Title: "Decision"
- Options: "Approve" · "Reject" · "Request more information"
- Reason label: "Reason (shared with the applicant on reject or request-more-information)"
- Reason placeholder: "Write a clear, specific reason"
- Submit: "Confirm decision"
- Self-review blocked: "You can't review a verification request submitted by your own account. Another team member will review it."

**Primary action:** Confirm decision (submits the selected outcome + reason). **Secondary action:** cancel/change selection before confirming.

**Loading state:** submit button shows a bounded "Submitting…" state and is disabled for the duration — no double-submit possible.

**Empty state:** not applicable.

**Error state:** if submission fails server-side (including a race where the request was decided by someone else a second earlier, or a race where self-review is discovered only at submit time), a specific inline error is shown ("This request was just reviewed by another team member." / "تمت مراجعة هذا الطلب للتو من قِبل عضو آخر بالفريق.") and the panel reloads the request's current state rather than letting Staff resubmit blindly.

**Validation:** reason is required and must meet a minimum length (matches the platform's existing 10-character minimum); Reject requires at least a plain-language reason even if required-documents is empty; Approve requires the Screen 5 checklist fully checked; the self-review block is validated server-side regardless of what the client renders, so a manipulated client request is rejected the same way.

**Accessibility:** the three decision options are a real radio group with visible focus and labels; the mandatory-reason error is associated with the field via `aria-describedby` and announced on failed submit attempt; the self-review-blocked state replaces the entire panel with an explanatory message and removes the (now meaningless) form controls from the tab order rather than leaving disabled-but-focusable controls.

**Mobile behavior:** panel is full-width, reason field expands to a comfortable multi-line height, submit button is the persistent bottom-anchored action described in Screen 3.

**Audit consequence:** this is the highest-consequence screen in the experience — every submitted decision writes a permanent audit record (who, what decision, what reason, checklist snapshot, timestamp) and triggers the applicant notification.

**Next transition:** Approve → Screen 9. Reject → request marked Rejected, visible via Screen 8 history. Request more information → Screen 7.

**Forbidden wording:** "Approve this claim," "reject this claim," any phrasing implying the decision affects Directory ownership rather than a Verification record.

**Implementation acceptance criteria:**
- [ ] Self-review is blocked by a server-side check comparing authenticated user id to the request's `applicant_user_id`, re-verified at submit time, not only at page-render time.
- [ ] A blocked self-review state removes the decision form entirely rather than disabling it in place.
- [ ] Reason is mandatory for all three outcomes and enforces the existing minimum-length rule.
- [ ] Approve is unreachable unless the Screen 5 checklist is fully checked.
- [ ] Every confirmed decision is atomically recorded with its checklist snapshot in the audit trail.
- [ ] No UI copy anywhere in this panel implies approval creates or activates a Profile.

---

## Screen 7 — More-Information State

**Purpose:** the acknowledgment shown to Staff immediately after choosing "Request more information," confirming what happens next and that the ball is now in the applicant's court.

**Permitted role:** Staff, Super Admin (post-decision, same session that just submitted).

**Required data:** the reason just submitted, the request's new status, and — if defined — the next reapply/response expectation shown to the applicant.

**Privacy boundary:** none beyond what's already visible in the Workspace; this is a confirmation of an action just taken, not a new data surface.

**Arabic copy:**
- Title: "تم إرسال طلب المعلومات الإضافية"
- Body: "تم إشعار مقدّم الطلب بالسبب التالي، وستظهر الحالة كـ «بانتظار معلومات إضافية» حتى يقوم بالرد."
- Action: "العودة إلى قائمة الطلبات"

**English copy:**
- Title: "Request for more information sent"
- Body: "The applicant has been notified with the reason below, and the status will show as 'Needs more information' until they respond."
- Action: "Back to queue"

**Primary action:** return to queue. **Secondary action:** stay and review another related request from the same applicant, if one exists.

**Loading state:** not applicable — this screen renders from the decision just made, no new fetch required.

**Empty state:** not applicable.

**Error state:** not applicable (errors are caught before this screen is reached, in Screen 6).

**Validation:** not applicable.

**Accessibility:** confirmation is announced via `role="status"` on arrival for screen-reader users who may have submitted and immediately navigated.

**Mobile behavior:** identical single-column presentation, primary action remains the anchored bottom button pattern.

**Audit consequence:** already recorded at submission (Screen 6); this screen reflects, not creates, that record.

**Next transition:** back to Screen 1 (Queue) or Screen 2 (My Queue), or directly into another Workspace.

**Forbidden wording:** none specific beyond the standing "Claim" ban.

**Implementation acceptance criteria:**
- [ ] Status shown matches the actual persisted status ("needs_more_info"), not a locally-optimistic guess that could drift from server truth.
- [ ] No copy suggests a deadline or SLA promise that isn't actually configured in the system.

---

## Screen 8 — Rejected Request History

**Purpose:** let Staff see a rejected request's full record — why it was rejected, by whom, and when it becomes eligible for reapplication — both from within a single request's Workspace and as a filtered History list.

**Permitted role:** Staff, Super Admin.

**Required data:** rejection reason, reviewing staff member, decision timestamp, `can_reapply_after` date, and — if a reapplication has since occurred — a link to the newer request (related history, not a silent overwrite).

**Privacy boundary:** same as the Workspace — rejection reason may reference private submitted evidence, so this view is Staff-only, never rendered on any public or applicant-facing page in raw form (the applicant sees their own reason via their own notification/status view, out of this spec's scope).

**Arabic copy:**
- Title: "الطلبات المرفوضة"
- Field labels: "سبب الرفض" · "روجع بواسطة" · "تاريخ القرار" · "يمكن إعادة التقديم بعد"
- Reapply-eligible-now note: "يمكن لمقدّم الطلب إعادة التقديم الآن"
- Reapply-not-yet note: "لا يمكن إعادة التقديم قبل {date}"

**English copy:**
- Title: "Rejected requests"
- Field labels: "Rejection reason" · "Reviewed by" · "Decision date" · "Can reapply after"
- Reapply-eligible-now note: "The applicant can reapply now"
- Reapply-not-yet note: "Cannot reapply before {date}"

**Primary action:** open the full Workspace (read-only, decision already made) for deeper context. **Secondary action:** filter the rejected list by organization type or date range.

**Loading state:** same skeleton-row pattern as Screen 1.

**Empty state:** "No rejected requests" / "لا توجد طلبات مرفوضة" — genuinely neutral, since an empty rejected list is a good outcome, not a gap to apologize for.

**Error state:** same pattern as Screen 1.

**Validation:** not applicable (read-only).

**Accessibility:** same list patterns as Screen 1; the reapply-eligibility note uses text, not color alone, to distinguish "eligible now" from "not yet."

**Mobile behavior:** same stacking pattern as Screen 1.

**Audit consequence:** none beyond standard read access (viewing history is not itself a new decision).

**Next transition:** into a specific rejected request's read-only Workspace.

**Forbidden wording:** "Rejected claims," "denied claim."

**Implementation acceptance criteria:**
- [ ] Reapply eligibility is computed from the actual `can_reapply_after` timestamp, not hardcoded.
- [ ] A newer reapplication, if one exists, is surfaced as a link rather than silently hidden.
- [ ] No aggregate "rejection rate" statistic appears anywhere on this screen.

---

## Screen 9 — Approved Request Confirmation

**Purpose:** confirm the approval was recorded, and — this is the screen this whole design exists partly to get right — state unambiguously that approval alone did not create a Profile, so no Staff member walks away assuming the organization now has an active presence on the platform.

**Permitted role:** Staff, Super Admin.

**Required data:** the approved request's id/organization, decision timestamp, reviewing staff member, and the explicit no-profile-created statement.

**Privacy boundary:** none beyond the Workspace it's shown from.

**Arabic copy:**
- Title: "تم قبول طلب التحقق"
- Body (mandatory, exact meaning must be preserved in any translation): "تم تسجيل هذا القرار. لم يتم إنشاء أي ملف تعريف (Profile) تلقائياً — يجب على الممثل المُتحقق منه تسجيل الدخول وإنشاء ملفه التعريفي بنفسه."
- Action: "العودة إلى قائمة الطلبات"

**English copy:**
- Title: "Verification approved"
- Body (exact meaning must be preserved): "This decision has been recorded. No Profile was created automatically — the verified representative must sign in and create their Profile themselves."
- Action: "Back to queue"

**Primary action:** return to queue. **Secondary action:** none — this is intentionally a single, unambiguous exit, not a screen with competing calls to action.

**Loading state:** not applicable — renders from the decision just confirmed.

**Empty state:** not applicable.

**Error state:** not applicable (this screen is only reached after a successful submission).

**Validation:** not applicable.

**Accessibility:** the no-profile-created statement is the first thing announced on this screen (`role="status"`, focus moved to it on arrival), since it's the single most important fact here, not a footnote.

**Mobile behavior:** identical single-column layout.

**Audit consequence:** already recorded at the Screen 6 submission; this screen is a reflection of that record and does not itself write anything new.

**Next transition:** back to Screen 1 or Screen 2.

**Forbidden wording:** anything implying automatic Profile creation, e.g. "The organization is now live on JID," "Their profile has been activated."

**Implementation acceptance criteria:**
- [ ] The no-automatic-Profile statement is present, unambiguous, and cannot be dismissed/hidden without being read (not buried below the fold, not a tooltip).
- [ ] No language anywhere on this screen implies the organization now has a live public presence.
- [ ] Statement text matches, word for word in meaning, between the Arabic and English versions.

---

## Screen 10 — System Dashboard Verification Preview

**Purpose:** give a Super Admin a lightweight, honest glance at the pending Verification backlog from the System dashboard, without duplicating the full Staff queue experience or linking anywhere broken.

**Permitted role:** Super Admin only (System surface).

**Required data:** the same top-N pending preview shape already used in production — id, organization name, claimant name, status, sla_due_at — nothing additional invented for this design.

**Privacy boundary:** identical constraints to Screen 1 — preview rows never include business email, documents, or full applicant profile.

**Arabic copy:**
- Title: "طلبات التحقق المعلّقة"
- Subtitle: "أحدث ٥ طلبات تحقق حسب موعد المعالجة"
- Empty: "لا توجد طلبات معلّقة"

**English copy:**
- Title: "Pending verifications"
- Subtitle: "Top 5 by earliest SLA"
- Empty: "No pending requests"

**Primary action:** none — this is intentionally a read-only preview widget, not a navigation entry point, since this design explicitly does not add a link to `/sys/claims` or invent a new System-level verification queue page.
**Secondary action:** none.

**Loading state:** same skeleton-row pattern as Screen 1, sized to 5 rows.

**Empty state:** "No pending requests" / "لا توجد طلبات معلّقة" — plain, no celebratory styling implying an achievement, just a fact.

**Error state:** inline retry within the widget card, the rest of the System dashboard remains usable.

**Validation:** not applicable.

**Accessibility:** widget is a labeled region (`aria-label="Pending verifications"`), rows are non-interactive text (since there is no click-through in this design), so no interactive element implies a broken destination.

**Mobile behavior:** widget stacks full-width like the rest of the System dashboard grid.

**Audit consequence:** none.

**Next transition:** none by design. If a future task adds System-level drill-through, it must land on a real route — this spec deliberately does not invent one now.

**Forbidden wording:** "Claims queue," and no link text of any kind pointing at `/sys/claims`.

**Implementation acceptance criteria:**
- [ ] Widget contains zero interactive elements that navigate anywhere (no dead links).
- [ ] Row count is never inflated or padded — exactly reflects real pending items, capped at 5.
- [ ] No percentage, trend arrow, or comparison-to-last-period statistic is added — only the plain top-5 list already specified.

---

## Screen 11 — Empty, Loading, Error, and Unavailable States (cross-screen reference)

**Purpose:** a single consolidated reference so every screen in this spec uses the same visual and copy pattern for these four states, rather than each screen inventing its own.

**Permitted role:** n/a (applies across all screens above).

**Required data:** n/a.

**Privacy boundary:** an error state must never leak technical detail that could reveal private data (no raw error messages containing another user's id, email, or document path) — errors shown to Staff are always a translated, generic message plus a correlation id Staff can quote to engineering if needed.

**Arabic copy (shared primitives):**
- Loading: "جارٍ التحميل…"
- Generic error: "حدث خطأ غير متوقع. حاول مرة أخرى." + retry button "إعادة المحاولة"
- Generic empty: title + one-line subtitle only, no illustration required

**English copy (shared primitives):**
- Loading: "Loading…"
- Generic error: "Something went wrong. Try again." + retry button "Try again"
- Generic empty: title + one-line subtitle only

**Primary action:** retry (error state only). **Secondary action:** n/a.

**Loading state:** IS this reference's subject — skeletons preferred over spinners wherever the eventual content has a predictable shape (lists, cards); a bare spinner is acceptable only for a single, small, unpredictable-shape element (e.g., a button's own submitting state).

**Empty state:** IS this reference's subject — always distinguishes "genuinely nothing here" (neutral tone) from "your filters matched nothing" (offers a clear-filters action) — these are not the same message.

**Error state:** IS this reference's subject — always distinguishes "couldn't load" (retry) from "not found / not authorized" (no retry, only a way back) — these are not the same message either.

**Validation:** n/a.

**Accessibility:** loading, empty, and error states are all announced to assistive tech (`aria-live="polite"` for loading/empty transitions, `role="alert"` for errors) since none of them are purely visual cues.

**Mobile behavior:** all three states remain full-width, centered, and legible at narrow widths; retry buttons remain full-width tap targets on mobile.

**Audit consequence:** repeated error states on the same screen/session may be worth surfacing to engineering monitoring, but that's an operational concern outside this design's scope, not a UI requirement.

**Next transition:** n/a (these are terminal-per-attempt states, not navigation).

**Forbidden wording:** raw stack traces, raw database error text, or any error copy that names a specific other user, organization, or document.

**Implementation acceptance criteria:**
- [ ] Every screen in this spec that fetches data implements all three of loading/empty/error using these shared primitives, not a bespoke pattern per screen.
- [ ] No error message displayed to Staff ever contains unredacted backend error text.
- [ ] "No results for these filters" and "genuinely empty" are copy-distinct everywhere they occur.
