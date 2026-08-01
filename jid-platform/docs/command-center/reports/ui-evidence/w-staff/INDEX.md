# Spec 08-C W-Staff evidence index

Synthetic Wave 2A Staff verification UI states (real component class contracts; no real PII).

| filename | route | actor | state | locale | direction | viewport | permission | actions | fixture | pass |
|---|---|---|---|---|---|---|---|---|---|---|
| 01-queue-ar-desktop.png | /staff/verification | staff | queue_mixed_urgency | ar | rtl | desktop | staff_queue | open request | synth-wave2a-queue | PASS |
| 02-queue-ar-375.png | /staff/verification | staff | queue_mobile_filters | ar | rtl | 375 | staff_queue | filter disclosure | synth-wave2a-queue | PASS |
| 03-queue-en-desktop.png | /staff/verification | staff | queue_mixed_urgency | en | ltr | desktop | staff_queue | open request | synth-wave2a-queue | PASS |
| 04-queue-en-375.png | /staff/verification | staff | queue_mixed_urgency | en | ltr | 375 | staff_queue | open request | synth-wave2a-queue | PASS |
| 05-workspace-self-review-ar-desktop.png | /staff/verification/[id] | staff_applicant | self_review_blocked | ar | rtl | desktop | view_only_self | none | synth-self-review | PASS |
| 06-workspace-other-reviewer-ar-desktop.png | /staff/verification/[id] | staff | assigned_to_other_view_only | ar | rtl | desktop | view_only | none | synth-other-reviewer | PASS |
| 07-workspace-sa-override-en-desktop.png | /staff/verification/[id] | super_admin | override_available | en | ltr | desktop | override_optional | approve/reject with checkbox | synth-sa-override | PASS |
| 08-terminal-approved-ar-desktop.png | /staff/verification/[id] | staff | approved_terminal | ar | rtl | desktop | read_only | none | synth-approved | PASS |
| 09-terminal-rejected-ar-desktop.png | /staff/verification/[id] | staff | rejected_terminal | ar | rtl | desktop | read_only | none | synth-rejected | PASS |
| 10-queue-loading-ar-desktop.png | /staff/verification | staff | loading | ar | rtl | desktop | staff_queue | none | synth-loading | PASS |
| 11-queue-empty-ar-desktop.png | /staff/verification | staff | empty | ar | rtl | desktop | staff_queue | clear filters | synth-empty | PASS |
| 12-queue-error-ar-desktop.png | /staff/verification | staff | query_error | ar | rtl | desktop | staff_queue | retry | synth-error | PASS |
| 13-workspace-assigned-ar-desktop.png | /staff/verification/[id] | assigned_staff | pending_assigned | ar | rtl | desktop | decide | approve/reject | synth-assigned | PASS |
