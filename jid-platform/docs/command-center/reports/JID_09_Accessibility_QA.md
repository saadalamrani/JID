# JID Spec 09 â€” Accessibility QA (Session 09-C)

**JID09_RUN_ID:** `jid09-20260801-7d956c`
**Deployment:** `https://jid-dev.vercel.app`

## Keyboard-only Staff decision walk

| Step | Result |
|---|---|
| Sign in + MFA as Staff A | PASS |
| Open `/staff/verification` | FAIL â€” page-load error boundary (DEF-09B-002) |
| Queue navigation / open request / decide / reason / confirm | NOT REACHABLE |
| Visible focus / no trap | NOT PROVEN on decision controls |
| Evidence | `ui-evidence/final-qa/captures/J3-a11y-keyboard__ar__desktop__staff-queue.png` |
| Defect | DEF-09C-014 |

## Spot checks performed

| Surface | Locale | Result |
|---|---|---|
| Notification inbox filters + mark-all + row action | ar/en | PASS â€” text labels present; unread not color-only (dot + badge + copy) |
| Notification action â€œØ¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ù„Ùâ€ | ar | PASS â€” named link; destination create-profile |
| Entity-type signup cards | ar | FAIL â€” visible Ù…Ø·Ø§Ù„Ø¨Ø© (DEF-09B-001) |
| Catalog correction entry | ar | FAIL â€” catalog load error (DEF-09C-001) |
| Staff correction suggestions | ar/en/375 | FAIL â€” Staff shell error (DEF-09C-002) |
| Business publish/unpublish controls | ar | FAIL â€” owner redirect to entity-type (DEF-09B-002) |
| University publish/unpublish controls | ar | FAIL â€” owner redirect to entity-type (DEF-09B-002) |
| Public Business Profile | ar/en | PASS â€” heading present; Latin digits in RUN_ID; no Arabic tracking observed on captured text |
| Locale switcher | ar/en | PASS on walked public/notification pages |

## RTL / Latin digits / tracking

- Arabic pages walked remain RTL.
- Latin digits present in RUN_ID strings on public Business Profile and notifications.
- No `letter-spacing`/`tracking` visual regression noted on captured Arabic notification/public surfaces.

## Outcome

Accessibility verification is **PARTIAL FAIL**: notification surfaces are usable; the mandated full Staff keyboard decision walk and owner publish control spot checks are blocked by DEF-09B-002 and related page-load failures. Failures are recorded as defects, not fixed in 09-C.
