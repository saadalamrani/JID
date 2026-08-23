# JID Lammah — Dedup and Organization Mapping Report

Research run: `lammah-real-opportunities-2026-08-23`

This front does **not** create Directory companies, Owned Profiles, Verification requests, ownership, or membership.

## Deduplication

Merge signals: identical `source_stable_id`, identical normalized apply URL, identical normalized source URL. Similar title plus overlapping dates is a review signal only, not an automatic merge.

| Check | Result |
|---|---|
| Mergeable duplicates in this run | **0** |
| Aramco graduate tracks with similar titles | Kept separate (Job Req 1344 / 1408 / 1412 / 1358 / 16741 / 16740) |
| KAUST jobs | Separate requisition IDs |
| Elm jobs | Separate job codes 654012 and 679071 |
| KAUST VSRP vs KAUST jobs | Different type, host, and apply URL |
| Idempotent checksum | Same input → same `checksum_sha256` and `duplicate_key` |

Potential non-merge notes (do not collapse):

- Aramco University Internship 2026 is a closed **internship** program, distinct from the open graduate **job** tracks.
- PIF GDP is closed and excluded; it is not a duplicate of HRDF Tamheer.

## Organization mapping

Safe mapping is official-domain match against Directory seed anchors already in this repository. UUIDs are **not** attached here (`directory_company_id` remains null). Catalog owns UUID lock.

### mapped_pending_catalog_uuid

| Organization | Method | Publish-review items | Catalog dependency |
|---|---|---:|---|
| Saudi Aramco | official domain `aramco.com` / `careers.aramco.com` | 6 | yes |

Seed anchors also exist for SABIC, King Saud University, and King Abdulaziz University. They have no publish-review items in this inventory. SABIC was inspected only as a closed posting.

### ORG_MAPPING_REQUIRED

| Organization | Official host | Publish-review items | Why unresolved |
|---|---|---:|---|
| King Abdullah University of Science and Technology | `kaust.edu.sa` | 4 | Not in this front’s Directory domain anchors |
| Elm | `elm.sa` / `career.elm.sa` | 2 | Not in this front’s Directory domain anchors |
| ACWA Power | `acwapower.com` | 1 | Not in this front’s Directory domain anchors |
| Human Resources Development Fund | `hrdf.org.sa` | 1 | Not in this front’s Directory domain anchors |

All four remain reviewable. None were attached to an Owned Profile. None were invented as new `companies` rows.

### CATALOG_ORG_DEPENDENCY

Reported for every publish-review candidate. Founder/Catalog must attach Directory UUIDs before public cards can show a canonical Directory logo/name from `companies`, if that is desired. Publication can still store `company_name_raw` without creating a company.

## Native JID job precedence

No native JID job IDs were matched in this research run. Existing `lock_lammah_native_conflict` remains the publication-time authority. This front does not bypass it.
