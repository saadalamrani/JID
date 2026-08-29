# Wave 5 — OSS / Existing-System Reuse Gate

**Decision date:** 2026-08-29. **Overall decision:** BUILD JID-specific contracts and RLS;
EXTRACT_PATTERN for generic workflow primitives. Do not adopt or fork an ATS.

| Candidate | License / maintenance / architecture | Decision | Reusable pattern and rejection reason |
| --- | --- | --- | --- |
| Existing JID | Native Next.js/Supabase; active; already integrated with Business Profiles, Career Record, CV snapshots, Arabic/English | ADOPT + ADAPT | Preserve identity, snapshots, opportunity ownership and UI shells. Replace coarse status mutation with governed stages/outcomes/audit. |
| OpenCATS | Mixed MPL 2.0 and legacy CATS Public License; maintained releases; older PHP/MySQL recruiting CRM | EXTRACT_PATTERN | Candidate/activity history and pipeline concepts are useful. Mixed licensing, architecture, localization/privacy fit, and integration cost reject code adoption. |
| ERPNext Recruitment | GPLv3; active Frappe/Python monolith with Job Applicant/Interview/Offer documents | EXTRACT_PATTERN | Separate applicant, interview, and offer records plus permissioned document workflow. Copyleft/monolith and broad ERP coupling reject integration. |
| Odoo Recruitment | Community core LGPLv3 with module/version licensing complexity; active Python/Postgres modular ERP | EXTRACT_PATTERN | Configurable job-specific stages, stage activities, chatter/audit. ERP coupling, edition boundaries, and non-JID identity/privacy model reject adoption. |
| Reqcore | AGPLv3 open-core; active modern Vue/Nuxt product; audit log is commercial-only | REJECT | Modern pipeline is relevant, but AGPL/open-core boundary, AI shortlist/scoring posture, and missing open audit primitive conflict with JID requirements. |

## Extracted patterns

- Store stage definitions separately from an application instance.
- Make transitions first-class append-only records, not silent status overwrites.
- Scope stages to a role/opportunity and team permissions to the tenant.
- Separate interview/evidence/offer records from the applicant identity.
- Keep human next actions and accountable actors visible in audit history.

## JID-specific build boundary

Career Record disclosure, immutable CV snapshot, candidate-visible truth, Business Profile RLS,
Opportunity Graph/Lammah boundary, evidence rights, Arabic-first UX, and Saudi product semantics
remain JID code. No external repository code or dependency is imported.

## Primary sources reviewed

- OpenCATS repository/documentation and license notice
- ERPNext repository and recruitment data model/documentation
- Odoo official Recruitment documentation and community source license
- Reqcore repository README and license/open-core boundary
