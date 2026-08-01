# Spec 08-B W-Dashboards evidence index

| JID08B_RUN_ID | jid08b-1785541618847 |

| filename | route | locale | viewport | actor | state | query source | expected | observed | pass |
|---|---|---|---|---|---|---|---|---|---|
| 01-business-ar-desktop-zero.png | /company/dashboard | ar | desktop | business_owner | legitimate_zero | countOwnerJobsPosted + countOwnerApplicationsReceived | metrics show 0 | 0 | PASS |
| 02-business-en-desktop-zero.png | /en/company/dashboard | en | desktop | business_owner | legitimate_zero | owner-scoped counts | EN dashboard with 0 | captured | PASS |
| 03-business-ar-375-zero.png | /company/dashboard | ar | 375 | business_owner | legitimate_zero | owner-scoped counts | stacks at 375px | captured | PASS |
| 04-business-ar-desktop-populated.png | /company/dashboard | ar | desktop | business_owner | populated | owner-scoped counts | jobs>=1 apps>=1 | 1 | PASS |
| 05-business-en-desktop-populated.png | /en/company/dashboard | en | desktop | business_owner | populated | owner-scoped counts | EN populated | captured | PASS |
| 06-business-ar-375-populated.png | /company/dashboard | ar | 375 | business_owner | populated | owner-scoped counts | 375 populated | captured | PASS |
| 07-university-ar-desktop-absent.png | /university/dashboard | ar | desktop | university_owner | snapshot_absent | university_dashboard_view (empty) | EmptyUniversityState | empty | PASS |
| 08-university-en-desktop-absent.png | /en/university/dashboard | en | desktop | university_owner | snapshot_absent | university_dashboard_view (empty) | empty EN | captured | PASS |
| 09-university-ar-375-absent.png | /university/dashboard | ar | 375 | university_owner | snapshot_absent | university_dashboard_view (empty) | empty 375 | captured | PASS |
| 10-university-ar-desktop-present-zero.png | /university/dashboard | ar | desktop | university_owner | snapshot_present_zero | university_dashboard_view (mocked synthetic row) | KPIs with 0 + export | snapshot | PASS |
| 11-university-en-desktop-present.png | /en/university/dashboard | en | desktop | university_owner | snapshot_present | university_dashboard_view (mocked) | EN snapshot | captured | PASS |
| 12-university-ar-375-present.png | /university/dashboard | ar | 375 | university_owner | snapshot_present | university_dashboard_view (mocked) | 375 snapshot | captured | PASS |
| 13-university-ar-desktop-error.png | /university/dashboard | ar | desktop | university_owner | query_error | university_dashboard_view (forced 500) | error state | error | PASS |
