# Data, Trust and Privacy Architecture

## Architecture principle

Every fact, inference, disclosure and decision must have an owner, purpose, source, time, policy and audit path. Trust is not a badge; it is an inspectable chain.

## Domain records

1. **Identity:** account, actor, organization representation and internal roles.
2. **Career Evidence:** canonical facts, credentials, projects, artifacts and provenance.
3. **Organization Registry:** platform-curated Directory identity and authored Profiles as separate domains.
4. **Opportunity Graph:** native/external opportunity identity, source, freshness, mappings and duplicates.
5. **Journey:** saves, applications/declarations, stages, communications and outcomes.
6. **Assessment:** instrument/version, purpose, rubric, attempt, accommodation, result and decision use.
7. **Institutional Outcomes:** cohort, collection, source, coverage, aggregate and suppression.
8. **Knowledge/Interaction:** authored objects, context, moderation and policy state.
9. **Governance:** consent grants, retention, legal basis/purpose, vendor/model use and audit.

## Fact classes

- `SELF_DECLARED`
- `ISSUER_VERIFIED`
- `ORGANIZATION_CONFIRMED`
- `SYSTEM_OBSERVED`
- `THIRD_PARTY_SOURCED`
- `DERIVED_EXPLAINABLE`
- `DISPUTED`
- `REVOKED_OR_EXPIRED`

The class and source must travel with the fact. A recipient projection cannot silently upgrade it.

## Consent and purpose

Use grants scoped by subject, data category, recipient/audience, purpose, duration and revocation state. Separate:

- public profile publication;
- employer discovery;
- a specific application;
- mentor/service interaction;
- university outcome collection/identifiable access;
- aggregate research/analytics;
- AI processing and any external provider.

Consent is not the only possible lawful basis, and the correct basis requires qualified legal review, but product design must never rely on one vague all-purpose toggle.

## Read paths

Each audience receives a server-computed projection. RLS is the data boundary; server authorization, purpose checks and output schemas provide defense in depth. The owner view is never fetched to another client and hidden.

## Provenance contract

For every sourced or derived item:

- source ID/type and locator where allowed;
- observed/issued/effective dates;
- parser/manual/verification method and version;
- transformation/mapping;
- confidence category, never misleading public precision;
- supersession/dispute status;
- retention/license restrictions;
- responsible owner.

## AI governance

Maintain an AI use-case register with purpose, user, input classes, provider/model/version, output, decision impact, evaluation, error/harm, fairness, human review, retention, cross-border transfer, fallback and kill switch.

High-impact employment uses require:

- validated objective and dataset rights;
- offline evaluation and field monitoring;
- subgroup/error analysis where lawful and statistically sufficient;
- explainability meaningful to candidate/recruiter;
- human authority and appeal;
- model/prompt/version trace;
- no sensitive-attribute proxy use without justified review;
- pause conditions.

Generative output is assistance, not verified truth. External job descriptions and documents are untrusted content.

## University aggregation

- explicit eligible cohort and known-outcome coverage;
- minimum-cell suppression determined with privacy/statistical review;
- rounding and export controls;
- no small-slice differencing attacks;
- no named graduate access by default;
- methodology and caveat on every output;
- separate institution-private and public aggregate rules.

## Retention

Create category-specific schedules rather than “keep forever”: account/record, application, assessment media, messages, raw source evidence, audit, university outcomes and model logs each need purpose, minimum period, deletion/hold and downstream propagation. Raw video/audio and third-party source payloads should be minimized and short-lived unless evidence/legal obligations require otherwise.

## Security

- least privilege and tenant isolation;
- MFA and session controls for privileged roles;
- `SECURITY DEFINER` hardening and immutable privileged audit;
- service identities scoped per connector/workflow;
- secrets only in approved server stores;
- upload scanning/sandboxing;
- prompt-injection/data-exfiltration tests;
- dependency/SBOM and vendor security review;
- incident response and user notification process;
- backup/restore/rollback evidence before production change.

## Rights and transparency

Provide accessible notices, data/access/export/correction/deletion routes, consent history, AI involvement explanation, assessment appeal and organization/contact channels. The product should show what is verified, declared, sourced, derived, stale or disputed.

## Governance gates

No capability launches without:

- data flow and purpose map;
- owner/controller/processor/recipient roles;
- RLS/authorization tests;
- retention/deletion path;
- audit and incident owner;
- source/license/vendor review;
- user comprehension and accessibility;
- legal/GRC sign-off proportional to risk;
- metrics and kill conditions.
