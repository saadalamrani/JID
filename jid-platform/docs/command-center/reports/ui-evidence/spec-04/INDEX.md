# Spec 04 UI evidence set

Real browser screenshots captured with Playwright Chromium against local disposable fixtures.
Password for seed accounts: local `JidSeed123!` only — never production.

| File | Locale | Viewport | Actor | State | Route | Step |
|---|---|---|---|---|---|---|
| `01-signup-business-ar-mobile-375.png` | ar | 375 | business | anonymous | `/signup/business` | 01-signup |
| `01-signup-business-ar.png` | ar | desktop | business | anonymous | `/signup/business` | 01-signup |
| `01-signup-business-en.png` | en | desktop | business | anonymous | `/signup/business` | 01-signup |
| `02-signup-company-wizard-ar-mobile-375.png` | ar | 375 | business | anonymous | `/signup/company` | 02-submit-verification-entry |
| `02-signup-company-wizard-ar.png` | ar | desktop | business | anonymous | `/signup/company` | 02-submit-verification-entry |
| `02-signup-company-wizard-en.png` | en | desktop | business | anonymous | `/signup/company` | 02-submit-verification-entry |
| `03-verification-pending-ar-mobile-375.png` | ar | 375 | business | pending_review | `/company/verification-pending` | 03-pending |
| `03-verification-pending-ar.png` | ar | desktop | business | pending_review | `/company/verification-pending` | 03-pending |
| `03-verification-pending-en.png` | en | desktop | business | pending_review | `/company/verification-pending` | 03-pending |
| `04-approved-create-profile-ar-mobile-375.png` | ar | 375 | business | approved_without_profile | `/company/create-profile` | 04-approved-create-profile |
| `04-approved-create-profile-ar.png` | ar | desktop | business | approved_without_profile | `/company/create-profile` | 04-approved-create-profile |
| `04-approved-create-profile-en.png` | en | desktop | business | approved_without_profile | `/company/create-profile` | 04-approved-create-profile |
| `05-draft-created-ar-mobile-375.png` | ar | 375 | business | draft_profile | `/company/profile` | 05-draft-created |
| `05-draft-created-ar.png` | ar | desktop | business | draft_profile | `/company/profile` | 05-draft-created |
| `05-draft-created-en.png` | en | desktop | business | draft_profile | `/company/profile` | 05-draft-created |
| `05b-profile-view-ar-mobile-375.png` | ar | 375 | business | published_profile | `/company/profile` | 05b-profile-view |
| `05b-profile-view-ar.png` | ar | desktop | business | published_profile | `/company/profile` | 05b-profile-view |
| `05b-profile-view-en.png` | en | desktop | business | published_profile | `/company/profile` | 05b-profile-view |
| `06-profile-edit-ar-mobile-375.png` | ar | 375 | business | published_profile | `/company/profile/edit` | 06-profile-edit |
| `06-profile-edit-ar.png` | ar | desktop | business | published_profile | `/company/profile/edit` | 06-profile-edit |
| `06-profile-edit-en.png` | en | desktop | business | published_profile | `/company/profile/edit` | 06-profile-edit |
| `07-profile-edit-after-save-ar-mobile-375.png` | ar | 375 | business | published_profile | `/company/profile/edit` | 07-edit-save |
| `07-profile-edit-after-save-ar.png` | ar | desktop | business | published_profile | `/company/profile/edit` | 07-edit-save |
| `07-profile-edit-after-save-en.png` | en | desktop | business | published_profile | `/company/profile/edit` | 07-edit-save |
| `08-profile-edit-reload-ar-mobile-375.png` | ar | 375 | business | published_profile | `/company/profile/edit` | 08-edit-reload |
| `08-profile-edit-reload-ar.png` | ar | desktop | business | published_profile | `/company/profile/edit` | 08-edit-reload |
| `08-profile-edit-reload-en.png` | en | desktop | business | published_profile | `/company/profile/edit` | 08-edit-reload |
| `09-visitor-preview-ar-mobile-375.png` | ar | 375 | business | published_profile | `/company/profile/preview` | 09-visitor-preview |
| `09-visitor-preview-ar.png` | ar | desktop | business | published_profile | `/company/profile/preview` | 09-visitor-preview |
| `09-visitor-preview-en.png` | en | desktop | business | published_profile | `/company/profile/preview` | 09-visitor-preview |
| `10-directory-catalog-ar-mobile-375.png` | ar | 375 | business | published_profile | `/catalog/seed-verified-business-co` | 10-directory-reference |
| `10-directory-catalog-ar.png` | ar | desktop | business | published_profile | `/catalog/seed-verified-business-co` | 10-directory-reference |
| `10-directory-catalog-en.png` | en | desktop | business | published_profile | `/catalog/seed-verified-business-co` | 10-directory-reference |
| `11-correction-entry-ar-mobile-375.png` | en | 375 | business | published_profile | `/company/profile/edit?section=correction` | 11-correction-entry |
| `11-correction-entry-ar.png` | en | desktop | business | published_profile | `/company/profile/edit?section=correction` | 11-correction-entry |
| `11-correction-entry-en.png` | en | desktop | business | published_profile | `/company/profile/edit?section=correction` | 11-correction-entry |
| `12-dashboard-ar-mobile-375.png` | ar | 375 | business | published_profile | `/company/dashboard` | 12-dashboard |
| `12-dashboard-ar.png` | ar | desktop | business | published_profile | `/company/dashboard` | 12-dashboard |
| `12-dashboard-en.png` | en | desktop | business | published_profile | `/company/dashboard` | 12-dashboard |
| `13-rejected-ar-mobile-375.png` | ar | 375 | business | rejected_eligible | `/company/verification-rejected` | 13-rejected |
| `13-rejected-ar.png` | ar | desktop | business | rejected_eligible | `/company/verification-rejected` | 13-rejected |
| `13-rejected-en-mobile-375.png` | en | 375 | business | rejected_eligible | `/company/verification-rejected` | 13-rejected |
| `13-rejected-en.png` | en | desktop | business | rejected_eligible | `/company/verification-rejected` | 13-rejected |
| `14-reapply-ar-mobile-375.png` | ar | 375 | business | rejected_eligible | `/company/verification/reapply` | 14-reapply |
| `14-reapply-ar.png` | ar | desktop | business | rejected_eligible | `/company/verification/reapply` | 14-reapply |
| `14-reapply-en-mobile-375.png` | en | 375 | business | rejected_eligible | `/company/verification/reapply` | 14-reapply |
| `14-reapply-en.png` | en | desktop | business | rejected_eligible | `/company/verification/reapply` | 14-reapply |
