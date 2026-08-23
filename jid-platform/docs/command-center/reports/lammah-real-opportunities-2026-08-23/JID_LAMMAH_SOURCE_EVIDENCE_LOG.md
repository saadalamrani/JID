# JID Lammah — Source Evidence Log

Research run: `lammah-real-opportunities-2026-08-23`  
`checked_at`: `2026-08-23T03:45:00+03:00` (`Asia/Riyadh`)

Rule used: discovery can be broad; publication evidence must be authoritative. An old social post or aggregator is not proof that an opportunity is currently open.

## Method

Official career/program pages were opened during this execution. Filled/closed banners override list pages. Missing optional facts stay absent. No salaries, applicant counts, match percentages, or rankings were recorded because the sources did not support them as JID claims.

A later WebFetch retry in the same calendar day timed out on some hosts. Inventory facts remain those captured in the live official-page review at `checked_at` above. Founder import should re-open URLs if more than 72 hours have passed.

## Tier A — used for publish-review candidates

| Host | Organization | Source type (research → registry) | What was verified |
|---|---|---|---|
| `careers.aramco.com` | Saudi Aramco | career_page → career_page | Six Saudi-applicant job details with Apply now and Job Offer Closing Date 31 December 2026. Location “within KSA, specified in offer” — Dhahran was not invented. Opening/posted date was not recorded because it was not evidenced. |
| `careers.kaust.edu.sa` | KAUST | career_page → career_page | Three job details with Apply now / full JD, no filled banner, no deadline. Posted dates 5, 12, and 17 August 2026 taken from the job pages. Location stated as Saudi Arabia. |
| `admissions.kaust.edu.sa` + `apply.kaust.edu.sa` | KAUST VSRP | official_university_program → official_program | Internships page states applications are year-round and points to the VSRP portal. One program-level internship only. |
| `career.elm.sa` | Elm | career_page → career_page | Two Riyadh jobs with Apply now, job codes 654012 and 679071, no filled banner, no deadline. |
| `careers.acwapower.com` | ACWA Power | career_page → career_page | Planning Engineer Rabigh full JD, no filled banner. Field Operator on the same portal showed filled and was excluded. |
| `hrdf.org.sa` | HRDF Tamheer | official_government_portal → official_program | Standing official program pages with current apply steps. Nafath login was not entered. |

## Tier A — verified closed / not live inventory

| Source | Evidence |
|---|---|
| `careers.stc.com.sa` Contract Management Expert | “Sorry, this position has been filled.” |
| `jobs.sabic.com` Sr. Engineer Maintenance Planning | Not available; Job Post End Date 13 May 2026 |
| `pif.gov.sa` Graduate Development Program | “The application is now closed.” FAQ wording was not treated as overriding the closed banner. Typed as `job` because the schema has no graduate-program enum. |
| `aramco.com` University Internship Program 2026 | Window 08:00 22 June 2026 to 15:00 29 June 2026; closed. |

## Tier B

None used as sole publication evidence in this run.

## Tier C — discovery only, rejected

| Lead | Action |
|---|---|
| Synthetic aggregator fixture `example-jobs-aggregator.test` | Excluded (`EXCLUDED_TIER_C_ONLY`). Not a live official source. Proves the publication gate. |
| Third-party aggregators / social reposts encountered while locating official pages | Used only to find official URLs. Never stored as publishable evidence. |

## Not verified / not used

- NEOM public listings: JS/reCAPTCHA prevented a specific public job from being verified without bypass. Not inventoried.
- stc TIP/COOP language that applicants are contacted when an upcoming batch starts: not currently open.
- Any source requiring login to private applicant areas.

## Provenance fields preserved per candidate

`source_url`, `apply_url`, `source_type`, `source_tier`, `checked_at`, `evidence_note`, `checksum_sha256`, `duplicate_key`, organization mapping status, and JID original short summaries in Arabic and English derived only from source facts.
