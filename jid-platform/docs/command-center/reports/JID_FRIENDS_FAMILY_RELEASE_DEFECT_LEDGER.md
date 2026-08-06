# Friends & Family Release Hardening — Defect Ledger

Canonical base: `f59c441a45d48c4669bfc75f63ceeaa6c273e154`  
Branch: `cursor/jid-friends-family-release-hardening`  
Nonprod: `hmjuijmaefajdjrjdsxu` / `https://jid-dev.vercel.app`

| ID | Route | Account | Severity | Reproduction | Root cause | Fix | Verification | Status |
|---|---|---|---|---|---|---|---|---|
| FF-A01 | `/login` | all | A | Pre-hydration submit put `email`/`password` in query string | Native form default method GET before React handlers attach | `method="post"` on credential forms + login URL scrubber | Unit source scan; manual probe | CLOSED |
| FF-B01 | `/jobs` | business-verified | B | Dashboard Opportunities/Applicants CTAs → 404 | No company jobs list page under `(company)/jobs` | Added owner jobs list page, guard, nav link, i18n | Unit test + type-check; route renders with auth | CLOSED |
| FF-B02 | `/opportunities`, `/mentors` | public | B | Arabic/EN boards showed Indic digits (`٠`) | `toLocaleString('ar-SA')` without `numberingSystem: latn` | Switched to `formatNumber` (Latin digits) | Unit assertion + source scan | CLOSED |
| FF-B03 | `/en/opportunities` | public | B | EN locale still showed hardcoded Arabic hero | Hardcoded AR copy in `job-board-hero` / results bar | next-intl `opportunities.board` keys | Source + i18n keys present | CLOSED |
| FF-B04 | `/university/profile` | university-verified | B | Owner profile URL 404 | Only `/university/profile/edit` existed | Index redirect to edit | File present; redirect | CLOSED |
| FF-B05 | `/mentor/requests` etc. | mentor-approved | B | Direct mentor subpaths 404 | Hub tabs are in-dashboard only | Alias redirects + `?tab=` deep-link | Redirect pages + hub reads searchParams | CLOSED |
| FF-B06 | logout | mentor-approved | B | Mentor mode cookie survived logout | `signOut` did not clear `jid_active_mode` | `clearProfileModeCookie()` on logout | Unit source assertion | CLOSED |
| FF-C01 | staff/sys date strings | staff/admin | C | Some internal `toLocaleString('ar-SA')` date renders | Legacy date formatting | Documented; not critical F&F share surface | Deferred | OPEN (C) |
| FF-C02 | `/pricing` `/jobs` `/lammah` public aliases | public | C | Direct URLs 404 | Canonical paths are `/plus`, `/opportunities` (+tab) | Not linked from primary nav; documented | Deferred | OPEN (C) |

All Class A: none found.  
All Class B entries above: CLOSED.
