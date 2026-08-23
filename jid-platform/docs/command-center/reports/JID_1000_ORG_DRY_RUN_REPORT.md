# JID 1,000-Organization Dry Run Report

**Generated:** 2026-08-23T02:27:42.688Z  
**Source:** `data/catalog/JID_Catalog_Import_Manifest_2026-08-05.csv` (1000 rows)  
**Mode:** DRY RUN — zero database writes

## Zero-write confirmation

| Boundary | Writes |
| --- | --- |
| companies / catalog pipeline | 0 |
| business_profiles | 0 |
| university_profiles | 0 |
| verification_requests | 0 |
| Ownership / claimed_by | 0 |

## Summary

| Metric | Count |
| --- | ---: |
| Total source rows | 1000 |
| Normalized | 1000 |
| Deterministic existing matches | 2 |
| Repeated-domain groups | 7 |
| Repeated-domain rows | 14 |
| High-confidence review candidates | 106 |
| Low-confidence / private-unverified candidates | 863 |
| Quarantined | 0 |
| Region mapping review required | 0 |
| Sector mapping review required | 15 |
| Duplicate risks (name+region) | 0 |
| Invalid domains | 0 |
| Invalid URLs | 0 |

## REALITY_DRIFT

- Low-confidence candidates: historical 878, this run 863 — 15 holding-company rows routed to sector review per FOUNDER_DECISION_TAX_003_RESOLVED (not counted as low-confidence).

## Repeated-domain groups (7)

- `alfanar.com`: row-116, row-257
- `neom.com`: row-136, row-733
- `atmc.com.sa`: row-276, row-439
- `alj.com`: row-338, row-466
- `aljomaih.com`: row-377, row-741
- `alessa.com.sa`: row-529, row-597
- `rawabi.com`: row-887, row-888

## Existing Directory reconciliations

- Saudi Aramco (`aramco.com`) → Saudi Aramco
- SABIC (`sabic.com`) → SABIC

## Unmapped source regions

_None._

## Unmapped source sectors

- المجموعات الاستثمارية والقابضة المتنوعة

## Canonical regions absent from source (2)

- **Hail** (`hail`) — حائل
- **Al Bahah** (`al-bahah`) — الباحة
