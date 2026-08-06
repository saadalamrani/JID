# JID Friends & Family — Release Handoff Package

Documentation-only operational handoff for the frozen nonproduction Friends & Family release candidate.

**Environment class:** nonproduction test only. Not production. Do not treat data or behavior as live market truth.

Related freeze record: [`JID_FRIENDS_FAMILY_RELEASE_CANDIDATE_FREEZE.md`](./JID_FRIENDS_FAMILY_RELEASE_CANDIDATE_FREEZE.md)  
Related defect ledger: [`JID_FRIENDS_FAMILY_RELEASE_DEFECT_LEDGER.md`](./JID_FRIENDS_FAMILY_RELEASE_DEFECT_LEDGER.md)

---

## A. Release manifest

| Field | Value |
| --- | --- |
| Release candidate SHA | `5d6c8e3baba1b37336f1d192ea30195f8d442953` |
| Public URL | https://jid-dev.vercel.app |
| Release freeze (Asia/Riyadh) | 2026-08-06 ≈ 04:15 AST |
| Canonical branch | `agent/nonprod-signup-fix` |
| Previous rollback SHA | `f59c441a45d48c4669bfc75f63ceeaa6c273e154` |
| CI status | SUCCESS — https://github.com/saadalamrani/JID/actions/runs/31061109053 |
| Deployment status | `jid-dev` READY; `jid-platform` READY; public alias serves the release candidate SHA |
| Database environment | Nonprod Supabase project `jid-nonprod` (ref `hmjuijmaefajdjrjdsxu`) |
| Production | **Unchanged** — no production deploy, no production tag, `main` untouched |

Promotion rules already applied for this candidate: pure fast-forward of canonical only; historical mirror `agent/nonprod-signup-form` unchanged at `b29846b644ab2d94ec1d88b3a0954f2f30276452`; `main` unchanged at `23997d53be91618fabb30f038753575a245dd305`.

---

## B. Tester guide

### What JID is

**جِد | JID is Saudi Arabia’s Career Infrastructure Platform.**

It connects exactly three public actors in one ecosystem:

1. **Individual** — “Who am I, and where am I going?”
2. **Business** (employer) — “Who are we, and why should graduates trust applying to us?”
3. **University** — “How are our graduates performing after graduation?”

**Mentor** is not a fourth public actor. Mentor is an **approved capability on an Individual** account after mentor approval.

### What JID is not

- Not a social network (no feed, likes, comments, or follower graph)
- Not a generic job board clone
- Not production / live customer data in this environment
- Not a place to upload real personal documents, national IDs, payroll, or confidential employer files for this test

### Architecture boundaries (must stay true while testing)

- **Directory ≠ Profile.** A Directory record is platform-owned reference data. An owned Profile is created only after verification and deliberate ownership. Testers must not expect “claim existing profile” flows — that product path does not exist.
- **Verification ≠ automatic Profile ownership.** Pending Business/University accounts stay in pending review until verified.
- **CV Builder** (where present) renders canonical profile data; it is not a parallel source of truth.

### Languages

- Arabic is first-class (RTL). English has full parity (LTR).
- Numbers should appear as **Latin digits** in both languages.
- Switch language with the AR / EN control in the header.

### How to log in

1. Open https://jid-dev.vercel.app
2. Go to **Login** (`/login` or `/en/login`)
3. Use a **shareable synthetic account** from section C (email identifier)
4. Use the **shared nonproduction credential provided separately by the founder** (never store sign-in secrets in this document or in screenshots of credentials)
5. Confirm you land on the expected portal for that account type (see matrix)

### How to log out

Use **Log out** / **تسجيل الخروج** from the signed-in account menu. After logout you should return to a public/auth surface and should not retain the previous role’s private portal.

### Public journeys to exercise

| Journey | Suggested path | Notes |
| --- | --- | --- |
| Arabic homepage | `/` | RTL, Arabic copy |
| English homepage | `/en` | LTR, English copy |
| Signup | `/signup` | Synthetic signup only; no real PII |
| Login | `/login` | Shareable accounts only |
| Opportunities (Jobs board) | `/opportunities` | Native opportunities list |
| Lammah | `/opportunities?tab=lammah` | Lammah tab on opportunities |
| Catalogue | `/catalog` | Directory catalogue surfaces |
| Mentors | `/mentors` | Public mentorship discovery |
| Plus | `/plus` | Plus / pricing surface (canonical path) |

Signed-in journeys: use the account matrix (section C) — complete Individual profile/CV paths, mentor hub, Business employer portal, University panel, and pending-verification states.

### What data must not be uploaded

Do **not** upload real national IDs, passports, commercial registrations for live companies, payroll, student grades tied to real people, or any production customer data. This environment is for synthetic Friends & Family testing only.

### How to report a problem

Use the feedback template in section E. Prefer: route + account type + language + device + expected vs actual + screenshot + severity + reproducibility. Send through the founder’s designated feedback channel.

### Environment statement

**This is a nonproduction test environment** (`jid-dev` / nonprod database). Behavior, content volume, and entitlements may differ from any future production release. Nothing here should be treated as a live hiring or university-operations system of record.

---

## C. Account-role matrix (shareable only)

Sign-in secrets, Staff access, Super Admin access, MFA enrollment material, and private tokens are **excluded** from this package. Credentials are distributed out-of-band by the founder.

| Identifier | Public actor | Intended journey |
| --- | --- | --- |
| `individual-complete@jidseed.test` | Individual | Completed profile paths: home/profile, opportunities, applications/CV surfaces as available |
| `individual-new@jidseed.test` | Individual | New / incomplete onboarding and early profile completion |
| `mentor-approved@jidseed.test` | Individual + approved Mentor capability | Mentor dashboard/hub (`/mentor/...`); not a separate public actor |
| `business-verified@jidseed.test` | Business | Verified employer portal: dashboard, business profile, opportunities/jobs posting surfaces |
| `business-pending@jidseed.test` | Business | Pending verification — limited pending surface; verified-only actions stay blocked |
| `university-verified@jidseed.test` | University | Verified university panel / catalogue-related owner surfaces |
| `university-pending@jidseed.test` | University | Pending review surface; verified dashboard authority stays blocked |

**Explicitly not shareable for Friends & Family:** Staff portal and Super Admin / platform-control accounts. Those remain founder/internal only and require MFA.

---

## D. Known limitations (verified Class C only)

Open Class A: **0**. Open Class B: **0**.

| ID | Limitation | Reality for testers |
| --- | --- | --- |
| FF-C01 | Some **internal** staff/sys date strings still use `toLocaleString('ar-SA')` without the Latin numbering system | Does not affect the shareable Friends & Family public/actor surfaces; deferred |
| FF-C02 | Direct public aliases `/pricing`, `/jobs`, and `/lammah` return 404 | Use canonical paths: `/plus`, `/opportunities`, and `/opportunities?tab=lammah`. Primary nav already points at canonical paths |

Do not describe unavailable university paid plans, social features, Claim Existing Profile, or production billing as active.

---

## E. Feedback template

Copy and fill:

```text
JID Friends & Family — feedback

Page or route:
Account type: (individual-complete | individual-new | mentor-approved | business-verified | business-pending | university-verified | university-pending | public/anonymous)
Device: (desktop | mobile) + browser
Language: (ar | en)
Expected behavior:
Actual behavior:
Screenshot: (attach; redact any credentials)
Severity: (blocker | major | minor | suggestion)
Reproducibility: (always | sometimes | once) + steps
```

---

## F. Founder release checklist

- [ ] Public URL opens: https://jid-dev.vercel.app
- [ ] Public alias SHA confirmed = `5d6c8e3baba1b37336f1d192ea30195f8d442953`
- [ ] Shareable accounts confirmed (section C only)
- [ ] Internal accounts excluded from the Friends & Family message
- [ ] Production unchanged (no prod deploy/tag; `main` untouched)
- [ ] Google Drive assets ready (guide + matrix + limitations + feedback template)
- [ ] Friends and Family message ready (nonprod disclaimer + what JID is / is not)
- [ ] Feedback channel ready
- [ ] Rollback SHA recorded: `f59c441a45d48c4669bfc75f63ceeaa6c273e154`

---

## Operator notes (documentation branch only)

- Handoff branch: `cursor/jid-friends-family-release-handoff`
- Do **not** promote this documentation commit to canonical as part of this task
- Do **not** deploy from this branch for the frozen candidate (candidate already served from canonical)
- Do **not** modify production, `main`, or historical mirror `agent/nonprod-signup-form`
