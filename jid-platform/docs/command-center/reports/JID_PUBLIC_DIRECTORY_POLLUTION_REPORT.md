# JID Public Directory Pollution Report

**Generated:** 2026-08-23 (Asia/Riyadh)  
**Scope:** Seed, test, pilot, and synthetic Directory markers in repository (not live DB scan)

**Rule applied:** Classify only — no automatic deletion.

---

## Classification legend

| Class | Meaning |
| --- | --- |
| `SEED_SYNTHETIC` | Generated dev seed (`jid-seed`, `f3000001-*`) |
| `TEST_FIXTURE` | Named test companies for journey/RLS tests |
| `JIDSEED_ACCOUNT` | `@jidseed.test` linked org fixtures |
| `STUB_PLATFORM` | Platform foundation stub |
| `PROTECTED_REFERENCE` | Real org names used as reference (not synthetic) |

---

## A. Platform stub

| Record | Domain | Class | Why | Referenced by tests | Profile/Verification | Treatment |
| --- | --- | --- | --- | --- | --- | --- |
| Stub Company | `stub.local` | `STUB_PLATFORM` | `012_platform_foundation.sql` default | Migration chain | Unknown | Keep out of public nonprod; never import |

---

## B. Entity signup protected reference orgs

| Name | Domains | Class | Why | Tests | Profile/VFY | Treatment |
| --- | --- | --- | --- | --- | --- | --- |
| Saudi Aramco | aramco.com, aramco.sa | `PROTECTED_REFERENCE` | Real org; founder 1k reconcile target | Signup/search | Possible | **Reconcile, never duplicate** |
| SABIC | sabic.com, sabic.sa | `PROTECTED_REFERENCE` | Real org; founder 1k reconcile target | Signup/search | Possible | **Reconcile, never duplicate** |
| King Saud University | ksu.edu.sa | `PROTECTED_REFERENCE` | Real university; **not in 1k source** | CV fixtures, signup | Possible | **Preserve — absence from source ≠ deletion** |
| King Abdulaziz University | kau.edu.sa | `PROTECTED_REFERENCE` | Real university; **not in 1k source** | Signup | Possible | **Preserve** |

---

## C. Profile journey fixtures (`seed.sql` — `d0000000-*`)

| ID | Name | Domain | Class | Why | Tests | Treatment |
| --- | --- | --- | --- | --- | --- | --- |
| `d0000000-…-001` | Unclaimed Startup Co | `unclaimed-test.jid.local` | `TEST_FIXTURE` | Public view CTA test | Company public view | Exclude from production Directory |
| `d0000000-…-002` | Approved Tech Corp | `approved-tech.jid.local` | `TEST_FIXTURE` | Claimed profile demo | Company dashboard | Exclude from production Directory |
| `d0000000-…-003` | Suspended Corp | `suspended-corp.jid.local` | `TEST_FIXTURE` | Suspended state | 404 behavior | Exclude from production Directory |

---

## D. Bulk synthetic seed (`seed/companies.sql`)

| Pattern | Count | Class | Why | Tests | Treatment |
| --- | ---: | --- | --- | --- | --- |
| `f3000001-*` IDs | 1050 | `SEED_SYNTHETIC` | `generate-companies-seed.ts` dev volume | Local catalog scale | **Never publish to nonprod/production Directory** |
| `*.jid-seed.local` domains | 1050 | `SEED_SYNTHETIC` | Explicit seed header | Catalog pagination dev | Filter from public queries in shared envs |

---

## E. Jidseed test accounts (`seed/local-test-accounts.sql`)

| Domain pattern | Class | Why | Treatment |
| --- | --- | --- | --- |
| `*.jidseed.test` | `JIDSEED_ACCOUNT` | Auth/verification journey matrix | Nonprod/local only |
| `seed-verified.jidseed.test` | `JIDSEED_ACCOUNT` | Business verification fixture | Nonprod/local only |
| `seed-uni.jidseed.test` | `JIDSEED_ACCOUNT` | University verification fixture | Nonprod/local only |

Linked `companies` rows created by local-test-accounts seed are **test org shells**, not founder catalog content.

---

## F. Catalog pilot / GLEIF candidates (historical nonprod)

2026-08-05 reconciliation reported 10 catalog pipeline candidates with 2 published, 6 needs review, etc. These are **governed pipeline rows**, not necessarily public pollution — classify per row at import review. Do not silently replace with founder 1k rows.

---

## G. Detection patterns for query filters

Recommended staff/public Directory filters for shared nonprod hygiene (implementation = separate UI/data front):

```
Domains:  *.jid-seed.local, *.jidseed.test, *-test.jid.local, stub.local
IDs:      f3000001-*, d0000000-* (fixtures)
Emails:   *@jidseed.test, *@test.jid.local (account layer)
```

---

## H. Summary

| Class | Approx count (repo) | Delete in this front? |
| --- | ---: | --- |
| SEED_SYNTHETIC | 1050 | **No** |
| TEST_FIXTURE | 3+ | **No** |
| JIDSEED_ACCOUNT | Multiple | **No** |
| STUB_PLATFORM | 1 | **No** |
| PROTECTED_REFERENCE | 4 | **No** |

**Destructive cleanup requires founder authorization and live DB evidence.**
