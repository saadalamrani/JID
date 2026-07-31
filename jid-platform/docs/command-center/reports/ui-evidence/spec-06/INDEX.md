# Spec 06 — UI Evidence Index

**Run ID:** `jid06e-1785457887205`
**Capture method:** Playwright Chromium real browser against local Next (`localhost:3000`) + disposable Supabase (`jid-06e-disposable` / API 58621) matching tip `f6397f2`.
**Synthetic only:** all names/values include SYNTH / jid06e run id. No secrets/cookies committed.

| filename | route | locale | viewport | actor | fixture/run | state | expected | observed |
|---|---|---|---|---|---|---|---|---|
| 01-catalog-detail-ar.png | /catalog/synth-06e-jid06e-1785457887205 | ar | desktop | directory_owner | jid06e-1785457887205 | public_catalog_detail | Synthetic Directory detail visible | PASS — captured at http://localhost:3000/catalog/synth-06e-jid06e-1785457887205 |
| 02-correction-form-ar.png | /catalog/synth-06e-jid06e-1785457887205 | ar | desktop | directory_owner | jid06e-1785457887205 | correction_form_open | Correction form for allowed Directory field | PASS — captured at http://localhost:3000/catalog/synth-06e-jid06e-1785457887205 |
| 03-correction-submitted-ar.png | /catalog/synth-06e-jid06e-1785457887205 | ar | desktop | directory_owner | jid06e-1785457887205 | suggestion_submitted | Suggestion accepted for review | PASS — captured at http://localhost:3000/catalog/synth-06e-jid06e-1785457887205 |
| 04-staff-suggestions-queue-ar.png | /staff/directory/suggestions | ar | desktop | staff | jid06e-1785457887205 | pending_queue | Pending synthetic suggestions visible with current/proposed values | PASS — captured at http://localhost:3000/staff/directory/suggestions |
| 05-staff-after-approve-ar.png | /staff/directory/suggestions | ar | desktop | staff | jid06e-1785457887205 | after_approve | Approved suggestion leaves pending queue; toast success | PASS — captured at http://localhost:3000/staff/directory/suggestions |
| 06-staff-after-reject-ar.png | /staff/directory/suggestions | ar | desktop | staff | jid06e-1785457887205 | after_reject | Rejected suggestion leaves pending queue; no Directory field change | PASS — captured at http://localhost:3000/staff/directory/suggestions |
| 07-staff-missing-target-ar.png | /staff/directory/suggestions | ar | desktop | staff | jid06e-1785457887205 | directory_missing_error | Honest directory_missing failure; no fake success | PASS — captured at http://localhost:3000/staff/directory/suggestions |
| 08-staff-queue-state-ar.png | /staff/directory/suggestions | ar | desktop | staff | jid06e-1785457887205 | queue_post_decisions | Queue reflects remaining/empty synthetic state | PASS — captured at http://localhost:3000/staff/directory/suggestions |
| 09-nonstaff-staff-route-ar.png | /staff/directory/suggestions | ar | desktop | individual | jid06e-1785457887205 | staff_route_denied | Non-staff cannot use staff correction controls | PASS — captured at http://localhost:3000/staff/directory/suggestions |
| 10-catalog-after-approve-ar.png | /catalog/synth-06e-jid06e-1785457887205 | ar | desktop | anonymous | jid06e-1785457887205 | directory_city_updated | Exactly intended synthetic city field reflects approval when applied | PASS — captured at http://localhost:3000/catalog/synth-06e-jid06e-1785457887205 |
| 11-notif-approval-dropdown-ar.png | / | ar | desktop | verification_applicant | jid06e-1785457887205 | claim_approved_unread | Bell unread + localized approval title/body + create-profile continuation | PASS — captured at http://localhost:3000/ |
| 12-notif-approval-destination-ar.png | /company/create-profile | ar | desktop | verification_applicant | jid06e-1785457887205 | create_profile_continuation | Action navigates to approved/create-Profile surface; no automatic Profile claim | PASS — captured at http://localhost:3000/login?next=%2Fcompany%2Fcreate-profile |
| 13-notif-rejection-dropdown-ar.png | / | ar | desktop | verification_applicant | jid06e-1785457887205 | claim_rejected_with_reason | Rejection title/body includes SYNTH reason | PASS — captured at http://localhost:3000/ |
| 14-notif-rejection-destination-ar.png | /company/verification-rejected | ar | desktop | verification_applicant | jid06e-1785457887205 | rejected_outcome | Action navigates to real rejected outcome surface | PASS — captured at http://localhost:3000/login?next=%2Fcompany%2Fverification-rejected |
| 15-notif-fallback-blank-url-ar.png | / | ar | desktop | individual | jid06e-1785457887205 | empty_copy_and_blank_action_url | Unknown/empty copy fallback; blank action_url is not a dead link | PASS — captured at http://localhost:3000/ |
| 16-suggester-correction-notif-ar.png | / | ar | desktop | directory_owner | jid06e-1785457887205 | directory_correction_notification | Suggester notification when suggested_by identity supported; no dead link if action_url null | PASS — captured at http://localhost:3000/ |
| 01-catalog-detail-en.png | /catalog/synth-06e-jid06e-1785457887205 | en | desktop | directory_owner | jid06e-1785457887205 | public_catalog_detail | Synthetic Directory detail visible | PASS — captured at http://localhost:3000/en/catalog/synth-06e-jid06e-1785457887205 |
| 02-correction-form-en.png | /catalog/synth-06e-jid06e-1785457887205 | en | desktop | directory_owner | jid06e-1785457887205 | correction_form_open | Correction form for allowed Directory field | PASS — captured at http://localhost:3000/en/catalog/synth-06e-jid06e-1785457887205 |
| 04-staff-suggestions-queue-en.png | /staff/directory/suggestions | en | desktop | staff | jid06e-1785457887205 | pending_queue | Pending synthetic suggestions visible with current/proposed values | PASS — captured at http://localhost:3000/en/staff/directory/suggestions |
| 08-staff-queue-state-en.png | /staff/directory/suggestions | en | desktop | staff | jid06e-1785457887205 | queue_post_decisions | Queue reflects remaining/empty synthetic state | PASS — captured at http://localhost:3000/en/staff/directory/suggestions |
| 09-nonstaff-staff-route-en.png | /staff/directory/suggestions | en | desktop | individual | jid06e-1785457887205 | staff_route_denied | Non-staff cannot use staff correction controls | PASS — captured at http://localhost:3000/en/staff/directory/suggestions |
| 10-catalog-after-approve-en.png | /catalog/synth-06e-jid06e-1785457887205 | en | desktop | anonymous | jid06e-1785457887205 | directory_city_updated | Exactly intended synthetic city field reflects approval when applied | PASS — captured at http://localhost:3000/en/catalog/synth-06e-jid06e-1785457887205 |
| 11-notif-approval-dropdown-en.png | / | en | desktop | verification_applicant | jid06e-1785457887205 | claim_approved_unread | Bell unread + localized approval title/body + create-profile continuation | PASS — captured at http://localhost:3000/en |
| 12-notif-approval-destination-en.png | /company/create-profile | en | desktop | verification_applicant | jid06e-1785457887205 | create_profile_continuation | Action navigates to approved/create-Profile surface; no automatic Profile claim | PASS — captured at http://localhost:3000/en/login?next=%2Fen%2Fcompany%2Fcreate-profile |
| 13-notif-rejection-dropdown-en.png | / | en | desktop | verification_applicant | jid06e-1785457887205 | claim_rejected_with_reason | Rejection title/body includes SYNTH reason | PASS — captured at http://localhost:3000/en |
| 14-notif-rejection-destination-en.png | /company/verification-rejected | en | desktop | verification_applicant | jid06e-1785457887205 | rejected_outcome | Action navigates to real rejected outcome surface | PASS — captured at http://localhost:3000/en/login?next=%2Fen%2Fcompany%2Fverification-rejected |
| 15-notif-fallback-blank-url-en.png | / | en | desktop | individual | jid06e-1785457887205 | empty_copy_and_blank_action_url | Unknown/empty copy fallback; blank action_url is not a dead link | PASS — captured at http://localhost:3000/en |
| 16-suggester-correction-notif-en.png | / | en | desktop | directory_owner | jid06e-1785457887205 | directory_correction_notification | Suggester notification when suggested_by identity supported; no dead link if action_url null | PASS — captured at http://localhost:3000/en |
| 01-catalog-detail-ar-mobile-375.png | /catalog/synth-06e-jid06e-1785457887205 | ar | 375 | directory_owner | jid06e-1785457887205 | public_catalog_detail | Synthetic Directory detail visible | PASS — captured at http://localhost:3000/catalog/synth-06e-jid06e-1785457887205 |
| 02-correction-form-ar-mobile-375.png | /catalog/synth-06e-jid06e-1785457887205 | ar | 375 | directory_owner | jid06e-1785457887205 | correction_form_open | Correction form for allowed Directory field | PASS — captured at http://localhost:3000/catalog/synth-06e-jid06e-1785457887205 |
| 04-staff-suggestions-queue-ar-mobile-375.png | /staff/directory/suggestions | ar | 375 | staff | jid06e-1785457887205 | pending_queue | Pending synthetic suggestions visible with current/proposed values | PASS — captured at http://localhost:3000/staff/directory/suggestions |
| 08-staff-queue-state-ar-mobile-375.png | /staff/directory/suggestions | ar | 375 | staff | jid06e-1785457887205 | queue_post_decisions | Queue reflects remaining/empty synthetic state | PASS — captured at http://localhost:3000/staff/directory/suggestions |
| 09-nonstaff-staff-route-ar-mobile-375.png | /staff/directory/suggestions | ar | 375 | individual | jid06e-1785457887205 | staff_route_denied | Non-staff cannot use staff correction controls | PASS — captured at http://localhost:3000/staff/directory/suggestions |
| 10-catalog-after-approve-ar-mobile-375.png | /catalog/synth-06e-jid06e-1785457887205 | ar | 375 | anonymous | jid06e-1785457887205 | directory_city_updated | Exactly intended synthetic city field reflects approval when applied | PASS — captured at http://localhost:3000/catalog/synth-06e-jid06e-1785457887205 |
| 11-notif-approval-dropdown-ar-mobile-375.png | / | ar | 375 | verification_applicant | jid06e-1785457887205 | claim_approved_unread | Bell unread + localized approval title/body + create-profile continuation | PASS — captured at http://localhost:3000/ |
| 12-notif-approval-destination-ar-mobile-375.png | /company/create-profile | ar | 375 | verification_applicant | jid06e-1785457887205 | create_profile_continuation | Action navigates to approved/create-Profile surface; no automatic Profile claim | PASS — captured at http://localhost:3000/login?next=%2Fcompany%2Fcreate-profile |
| 13-notif-rejection-dropdown-ar-mobile-375.png | / | ar | 375 | verification_applicant | jid06e-1785457887205 | claim_rejected_with_reason | Rejection title/body includes SYNTH reason | PASS — captured at http://localhost:3000/ |
| 14-notif-rejection-destination-ar-mobile-375.png | /company/verification-rejected | ar | 375 | verification_applicant | jid06e-1785457887205 | rejected_outcome | Action navigates to real rejected outcome surface | PASS — captured at http://localhost:3000/login?next=%2Fcompany%2Fverification-rejected |
| 15-notif-fallback-blank-url-ar-mobile-375.png | / | ar | 375 | individual | jid06e-1785457887205 | empty_copy_and_blank_action_url | Unknown/empty copy fallback; blank action_url is not a dead link | PASS — captured at http://localhost:3000/ |
| 16-suggester-correction-notif-ar-mobile-375.png | / | ar | 375 | directory_owner | jid06e-1785457887205 | directory_correction_notification | Suggester notification when suggested_by identity supported; no dead link if action_url null | PASS — captured at http://localhost:3000/ |

## Browser coverage

- Correction primary: Arabic desktop, English desktop, Arabic mobile 375px
- Notification primary: Arabic desktop, English desktop, Arabic mobile 375px
- Honest states: missing-target (07), non-staff denied (09), unknown/empty + blank action_url (15), post-decision queue (08)

## Cleanup

See `cleanup-result.json`. Run-scoped companies/notifications/suggestions removed. Staff profile hard-delete blocked by immutable `audit_logs.actor_id` on disposable only; disposable destroyed with `supabase stop --no-backup`. `config.toml` restored to `jid-platform` / 54321.

## Contract proof

See `CONTRACT_PROOF.md` — all 11 Spec 06 external contracts UNCHANGED.
