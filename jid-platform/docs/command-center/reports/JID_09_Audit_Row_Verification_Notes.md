# JID Spec 09 â€” Audit Row Verification Notes (Session 09-C)

**JID09_RUN_ID:** `jid09-20260801-7d956c`
**Project ref:** `hmjuijmaefajdjrjdsxu`
**Method:** bounded non-production seed DB reads only; no secrets, no raw private payloads committed.

## Journey 4 â€” Directory correction

| Check | Result |
|---|---|
| Pending suggestion `correction-pending` present | YES â€” status `pending`, field `city` |
| Directory target `dir-correction-target` present | YES â€” slug `jid09-dir-corr-jid09-20260801-7d956c` |
| Directory `city` before Staff apply | `null` (unchanged; no apply completed in UI) |
| Staff approve/apply via UI | NOT COMPLETED â€” Staff suggestions page failed to load (DEF-09B-002 / DEF-09C-002) |
| Success audit row for apply | NOT OBSERVED (0 matching audit rows in bounded query) |
| Rejection scenario audit | NOT EXECUTED (Staff review surface unavailable) |

**Conclusion:** Fixture continuity for correction is intact. End-to-end apply + audit proof could not be completed because the Staff correction-review surface is blocked by the `claim_requests` RLS environment defect. No fabricated success audit was recorded.

## Journey 5 â€” Notifications

| Check | Result |
|---|---|
| `notif-approved` row | present; recipient = `bizOwnerNoProfile`; category `claim.approved` (schema-bound string); action `/company/create-profile` |
| `notif-rejected` row | present; recipient = `uniOwnerNoProfile`; category `claim.rejected`; action `/university/rejected` |
| Forbidden destinations (`/settings`, `/sys/claims`) | absent on both fixture rows |
| UI inbox (approval) | PASS â€” Arabic copy states deliberate Profile creation; no auto-Profile implication |
| Live Staff decision â†’ new notification | NOT COMPLETED â€” Staff verification workspace blocked by DEF-09B-002 |

**Conclusion:** Seeded notification contracts match Spec 03 destinations. Live decision fan-out could not be re-proven in UI during 09-C.

## Journey 6 â€” Publication audits

| Check | Result |
|---|---|
| Owner publish/unpublish UI | NOT OPERABLE â€” owners redirected to `/signup/entity-type` under DEF-09B-002 |
| Publish success audit | NOT OBSERVED in this session |
| Unpublish success audit | NOT OBSERVED in this session |
| Public published Business Profile | PASS (anonymous) |
| Public published University Profile | FAIL 404 (DEF-09B-004 / DEF-09C-003) |
| Draft/suspended public denial | PASS for walked Business/University public cells |

**Conclusion:** Publication RPC audit proof requires operable owner surfaces; deferred as blocked by DEF-09B-002, not fabricated.
