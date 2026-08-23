# JID Nonprod Catalog Import Report

**Executed:** 2026-08-23T03:05:48.342Z
**Target:** `hmjuijmaefajdjrjdsxu`
**Source:** `founder.manifest-2026-08-05`
**Run:** `FOUNDER-IMPORT-2026-08-05-001`

## Import counters

| Metric | Count |
| --- | ---: |
| accepted | 1000 |
| replayed | 0 |
| rejected | 0 |

## Classification applied

- reconcile_existing: 2
- repeated_domain_manual_review: 14
- high_confidence_review_candidate: 106
- low_confidence_review_candidate: 863
- quarantined: 0
- region_mapping_review_required: 0
- sector_mapping_review_required: 15

## Reconciliations

| Organization | Company UUID | Domain | Action |
| --- | --- | --- | --- |
| Saudi Aramco | `73770146-f26c-41d1-aec6-d866bb81ae95` | aramco.com | reconcile_existing (candidate linked, not published) |
| SABIC | `2d0fad2f-4152-477c-beea-917af32808ea` | sabic.com | reconcile_existing (candidate linked, not published) |

## Side-effect assertions

| Boundary | Pre | Post | Delta |
| --- | ---: | ---: | ---: |
| business_profiles | 1 | 1 | 0 |
| university_profiles | 1 | 1 | 0 |
| verification_requests | 4 | 4 | 0 |
| companies_total | 10 | 10 | 0 |

## Taxonomy

- Regions after seed: 13
- Sectors after seed: 45

## Publication

No bulk publication performed. High-confidence candidates remain review-only.
