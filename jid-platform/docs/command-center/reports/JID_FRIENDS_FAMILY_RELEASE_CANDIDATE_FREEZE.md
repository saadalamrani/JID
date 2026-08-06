# Friends & Family Release Candidate — Freeze Record

Do not make additional product changes on this candidate without a new task.

Handoff package: [`JID_FRIENDS_FAMILY_RELEASE_HANDOFF.md`](./JID_FRIENDS_FAMILY_RELEASE_HANDOFF.md)

## Identifiers

| Field | Value |
| --- | --- |
| RELEASE_CANDIDATE_SHA | `5d6c8e3baba1b37336f1d192ea30195f8d442953` |
| Previous canonical (rollback) | `f59c441a45d48c4669bfc75f63ceeaa6c273e154` |
| Implementation branch | `cursor/jid-friends-family-release-hardening` @ same SHA |
| Canonical branch | `agent/nonprod-signup-fix` @ same SHA |
| Historical mirror | `agent/nonprod-signup-form` @ `b29846b644ab2d94ec1d88b3a0954f2f30276452` |
| Main | `23997d53be91618fabb30f038753575a245dd305` (unchanged) |
| Production | unchanged; no production deploy or tag |
| Public URL | https://jid-dev.vercel.app |

## Evidence

| Gate | Result |
| --- | --- |
| Open Class A | 0 |
| Open Class B | 0 |
| CI | success — https://github.com/saadalamrani/JID/actions/runs/31061109053 |
| jid-dev | READY @ FINAL_SHA / `agent/nonprod-signup-fix` (`dpl_HLx1DRLFqiNHSFmpiXqB2zNa1Hi8`) |
| jid-platform | READY @ FINAL_SHA / `agent/nonprod-signup-fix` (`dpl_CRThHsRFhhTG8Rr2XNK3VsXVcYLQ`) |
| Public alias | jid-dev.vercel.app → FINAL_SHA |

## Account matrix tested

Shareable: individual-complete, individual-new, mentor-approved, business-verified, business-pending, university-verified, university-pending — PASS.

Internal (founder-only; not for Friends & Family sharing): staff MFA required; super_admin MFA required; no bypass — PASS.

Playwright role matrix on alias: 9/9 passed (`role_exit=0`).

## Known Class C

- FF-C01: some internal staff/sys date strings still use `toLocaleString('ar-SA')`
- FF-C02: public aliases `/pricing`, `/jobs`, `/lammah` 404; canonical paths are `/plus` and `/opportunities` (+tab)

## Notes

- Preceding hardening commit `914dbb1` failed Quality Gate on ledger trailing whitespace; freeze SHA includes whitespace-only repair `5d6c8e3` with identical product code.
- No production tag created or moved.
- No sign-in secrets, MFA enrollment material, or private tokens are recorded in this file.
