# JID Lammah — Nonprod Import Manifest

Research run: `lammah-real-opportunities-2026-08-23`  
**`remote_write`: false**  
This file describes what **would** be imported after Founder review. It is not an authorization to import.

Do not apply this to production (`znfhladafpajyjwcfzvv`).  
Do not apply this to nonprod (`hmjuijmaefajdjrjdsxu`) from this command.

Machine-readable ingest records: `JID_REAL_OPPORTUNITIES_CURRENT_INVENTORY.json` → `ingest_records`.

## Zero writes performed

| Surface | Writes |
|---|---:|
| Remote nonprod import | 0 |
| `companies` created | 0 |
| `business_profiles` | 0 |
| `university_profiles` | 0 |
| `verification_requests` | 0 |
| Ownership / membership | 0 |
| Abhathli | 0 |
| Professional Discovery | 0 |
| Auto-publication | 0 |

## Preconditions (separate Founder authorization)

1. Stay off `main`. Stay on `cursor/jid-lammah-real-opportunities-v1`.
2. Apply forward-only migration `jid-platform/supabase/migrations/20260823120000_lammah_source_host_allowlist.sql` to **nonprod only** after review. It is not applied in this run.
3. Keep `lammah.phase1_ingestion` / connector flags under existing super-admin controls. Do not enable global auto-publish.
4. Re-open each official URL if `checked_at` is older than 72 hours.
5. Catalog UUID attachment may happen later; it is not required to register sources as `candidate`.

## Intended actions (all `remote_write: false`)

20 dry-run actions: 6 `register_source_candidate` + 14 `ingest_review_candidate`.

### A. Register source candidates

Do **not** set `approval_state='approved'`.  
Do **not** set `auto_publication_enabled=true`.  
Do **not** set `robots_ok=true` until robots/terms are qualified.  
Do **not** attach `company_id`.

| source_key | name | base_url | registry source_type | allowed_source_hosts | allowed_apply_hosts | supported types |
|---|---|---|---|---|---|---|
| `careers_aramco_com` | Saudi Aramco | https://careers.aramco.com | career_page | aramco.com, careers.aramco.com | aramco.com, careers.aramco.com | job |
| `careers_kaust_edu_sa` | King Abdullah University of Science and Technology | https://careers.kaust.edu.sa | career_page | kaust.edu.sa, careers.kaust.edu.sa | kaust.edu.sa, careers.kaust.edu.sa | job |
| `admissions_kaust_edu_sa` | King Abdullah University of Science and Technology | https://admissions.kaust.edu.sa | official_program | kaust.edu.sa, admissions.kaust.edu.sa, apply.kaust.edu.sa | same | internship |
| `career_elm_sa` | Elm | https://career.elm.sa | career_page | elm.sa, career.elm.sa | elm.sa, career.elm.sa | job |
| `careers_acwapower_com` | ACWA Power | https://careers.acwapower.com | career_page | acwapower.com, careers.acwapower.com | acwapower.com, careers.acwapower.com | job |
| `hrdf_org_sa` | Human Resources Development Fund | https://hrdf.org.sa | official_program | hrdf.org.sa, www.hrdf.org.sa | hrdf.org.sa, www.hrdf.org.sa | internship |

Research-only labels `official_university_program` and `official_government_portal` map to registry `official_program` because that is the current check constraint. Schema wins.

`eu_careers_cast` is unchanged.

### B. Ingest 14 review candidates

Intended state: `pending_review` (never auto-published).  
Closed-shape JSON only. `content_type`: `application/json` (allowed by `lammah_raw_evidence`).  
`payload_body` is a sanitized evidence projection, not a copyrighted full HTML dump.

Worker ingest via `lammah_begin_source_run` is **blocked** until each source is qualified (`approved` + `robots_ok`). After qualification, ingest must use `ingest_lammah_candidate` with the JSON in the inventory file. Identical checksum replays; it must not create a second public row.

Publish-review keys:

1. `aramco-engineering-graduates-1344`
2. `aramco-computing-it-graduates-1408`
3. `aramco-other-graduates-1412`
4. `aramco-business-graduates-1358`
5. `aramco-experienced-it-16741`
6. `aramco-experienced-engineer-16740`
7. `kaust-integration-architect-developer-expert-1423404933`
8. `kaust-research-user-computing-lead-1425615433`
9. `kaust-senior-financial-analyst-treasury-1426843033`
10. `kaust-vsrp-internship-program`
11. `elm-associate-principal-ai-platform-654012`
12. `elm-consultant-portfolio-integrations-679071`
13. `acwa-planning-engineer-rabigh-857297623`
14. `hrdf-tamheer-graduate-development`

### C. Explicitly do not import

Closed stc / SABIC / PIF / Aramco UIP records.  
Synthetic Tier C aggregator.  
Any invented employer, deadline, salary, applicant count, match %, or ranking.

### D. After ingest (still not this command)

Staff review on `/staff/lammah/review`.  
Org mapping queue for `ORG_MAPPING_REQUIRED`.  
Manual `publish_lammah_candidate` only.  
Public semantics remain: فرصة خارجية / رابط التقديم الرسمي / التقديم لدى الجهة.

## Idempotency

Re-running the same `source_record_id` + `checksum_sha256` must return replay, not a second `lammah_opportunities` row. Covered by existing ingest replay behavior and unit checksum tests.
