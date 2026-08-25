# Abhathli / ابحث لي Strategy

## Product definition

Abhathli is the Individual's **active, consent-controlled opportunity search copilot**. It uses the Career Record, explicit goals and the governed Opportunity Graph to monitor, explain, prepare and track.

It is not another opportunity feed, a scraping brand, a fake match scorer or a mass-application bot.

## Relationship to Lammah and Radar

```text
Approved sources → ingestion/provenance → Lammah opportunity intelligence
                                               │
Career Record + preferences ───────────────────┤
                                               ▼
                                            Abhathli
                                               │
                         explain / alert / prepare / ask user
                                               │
                                               ▼
                                             Radar
```

Lammah is reusable market inventory. Abhathli is personal orchestration. Radar is the private action/outcome record. They share infrastructure but are not one feature.

## User contract

The user defines:

- target occupations/sectors;
- locations/work modes;
- opportunity types;
- eligibility and schedule constraints;
- notification cadence;
- which Career Record facts may be used;
- allowed external processing;
- whether a draft may be generated.

The system explains:

- source and last verified time;
- why the opportunity met explicit criteria;
- strengths supported by record facts;
- gaps or unknowns;
- application route and deadline;
- what data/tool was used.

## No-match-score rule

Do not show `87% fit`. Use evidence categories:

- Meets stated requirement — linked fact.
- Possible/transferable evidence — explain reasoning.
- Missing or unknown — no inference.
- Constraint conflict — location, deadline, eligibility or schedule.
- User review required — ambiguity.

Any later ranking model requires offline evaluation, field validation, explanation, fairness review and clear uncertainty.

## Source policy

Rank access methods:

1. partner API/feed;
2. documented public API/open dataset;
3. authorized structured feed;
4. public indexing where terms and robots permit;
5. low-volume browser retrieval after legal/operational review;
6. prohibited/blocked source — do not access.

Every adapter requires owner, terms/robots review, license/reuse record, rate limit, freshness rule, failure mode, deletion rule and kill switch.

## External reference decision

`MadsLorentzen/ai-job-search` is a useful implementation reference for portal adapters, drafter/reviewer flow, local privacy, outcome tracking and explicit security caveats. Its 2026 security policy acknowledges that agent instructions are not a sandbox when untrusted job content is processed alongside personal data. JID should borrow patterns only after file-level license/dependency/security review; it should not import the framework wholesale into a hosted multi-user product.

## Security architecture

- external postings are untrusted data, never instructions;
- fetchers cannot access Career Record data;
- personal search/ranking runs use minimized projections;
- no arbitrary URL/tool execution from posting content;
- sanitize and validate apply URLs;
- isolate ingestion, reasoning and user-action tools;
- record model/tool/version and input-purpose metadata;
- require user review before any external communication;
- support provider failure and deletion;
- evaluate prompt injection, data exfiltration and source poisoning.

## MVP

1. user creates one search mandate;
2. Abhathli searches only already-governed Lammah/native inventory;
3. returns a finite list with reasons/gaps/constraints;
4. user saves/dismisses/asks for changes;
5. optional truthful CV tailoring draft;
6. user chooses application action;
7. Radar tracks declared status;
8. outcome improves preferences only with consent.

No autonomous submission, email sending, account creation or login to third-party sites in MVP.

## Monetization hypothesis

Free: one mandate, manual refresh and core alerts.
JID Plus: multiple mandates, recurring monitoring, faster alerts, bounded tailored drafts, preparation workflows and history.

Do not degrade free opportunity access or sell higher candidate visibility.

## Success measures

- valid/fresh results per mandate;
- duplicate and expired-result rate;
- user-reported reason accuracy;
- save/action rate after user review;
- correction/hallucination rate;
- source/ToS incidents;
- notification fatigue/disable rate;
- application outcome coverage where user chooses to report;
- inference fairness across Arabic/English titles and segments.
