# WAVE 8 — TALENT SOURCING CONTRACT

**Status:** FROZEN (interface)  
**Authority date:** 2026-08-30 (Asia/Riyadh)  
**Base:** `WAVE_6_COMPLETE` `b7f6eae7ac14a1b26d0ea6d17f45cab0c6c5af13`  
**Additive to:** Wave 5 hiring contract, Wave 6 evidence contract.

## Reuse gate

| Surface | Decision |
| --- | --- |
| Wave 5 hiring roles / criteria / workspace authority | REUSE |
| Wave 6 evidence comparison + `assertNoAggregate` | REUSE |
| `profiles.visibility` + `show_profile_to_companies` (default private/false) | ADAPT — now the explicit Professional Discovery opt-in |
| Professional Discovery fail-closed profile SELECT | REUSE fail-closed table SELECT; ADAPT discovery to RPC-only |
| Career Operations notes / Abhathli | DEFER — never exposed |
| Social follows / feed / likes | DEFER — Wave 9 |
| Match % / paid ranking | DEFER — forbidden |

## States

`NOT_DISCOVERABLE` · `DISCOVERABLE` · `INVITED` · `INTERESTED` · `DECLINED` · `WITHDRAWN`

Discoverable never implies seeking work, open contact, JID endorsement, high match, or eligibility.  
Invitation never inserts `applications`.

## Authorization

Verified Business: `companies.entity_state = approved` AND `is_verified` AND hiring workspace access.  
Search/compare: workspace read. Invite/withdraw: workspace write.  
Individual: owner of discoverability flags; respond to own invitations.  
University / anon / other Business: denied.

## Evidence

Only published profile fields and `profile_skills`. Missing evidence is neutral.  
Comparison is criterion × person. No total, rank, or match percentage.

## Intelligence

Operational counts only, each with source, population, 30-day Asia/Riyadh window, coverage, and missingness.
