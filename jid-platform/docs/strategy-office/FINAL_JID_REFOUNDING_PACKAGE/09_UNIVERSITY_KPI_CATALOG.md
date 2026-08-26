# University KPI Catalog

## Use rule

This is a catalog of possible measures, not a dashboard specification and not a claim that JID currently has the required data. No KPI may render until its definition, eligible population, known numerator/denominator, source rights, coverage, refresh and disclosure controls pass review.

**Common notation:** `E` = eligible cohort; `K` = cohort members with known valid outcome for the measure; `N` = qualifying numerator. Percentages use `N/K` unless the definition explicitly uses `E`, and the UI must show both `K/E` coverage and the collection window.

| ID | KPI and exact definition/formula | Source / owner | Purpose and consent/legal gate | Minimum coverage gate | Frequency | Bias / representativeness warning | Identifiability | Phase |
|---|---|---|---|---|---|---|---|---|
| DQ-01 | Eligible cohort size `E`: graduates meeting documented program/award/period rules | university SIS / university | cohort contract and DPA | n/a; rule must validate | term/annual | exclusions and late awards | aggregate; source named | MVP |
| DQ-02 | Known-outcome coverage `K/E` for defined destination fields | survey + approved administrative/partner sources / joint | outcome collection purpose | show at every level; suppress comparisons below agreed gate | live + reporting cut | nonresponse can be systematic | aggregate | MVP |
| DQ-03 | Direct response rate: valid graduate survey responses / invited eligible graduates | survey / JID on behalf of university | clear notice and contact authority | disclose count; no hidden imputation | campaign | contactability and channel bias | aggregate | MVP |
| DQ-04 | Contactable cohort rate: graduates with a lawful working contact route / `E` | university / graduate | outreach purpose | no KPI use without source validity | campaign | contactability differs by segment | restricted aggregate | MVP |
| DQ-05 | Identity-link confidence distribution: confirmed, probable-review, unresolved / `E` | reconciliation service / joint | identity resolution purpose | 100% categorized | refresh | name/ID changes and duplicate risk | restricted | MVP |
| DQ-06 | Source mix: self-report, university, employer-confirmed, public/other among known outcomes | outcome ledger / joint | provenance transparency | all known outcomes sourced | live | source quality varies | aggregate | MVP |
| DQ-07 | Freshness: known outcomes updated within the defined reporting window / `K` | outcome ledger / JID | accurate reporting | disclose age bands | monthly/term | stale outcomes overstate current status | aggregate | MVP |
| DQ-08 | Item completeness: valid answers for each field / respondents eligible for that question | survey / JID | measurement quality | disclose per field | campaign | routing and sensitive-item nonresponse | aggregate | MVP |
| OUT-01 | Employment status rate: employed qualifying outcomes / `K` at a named follow-up point | graduate/administrative/employer / joint | outcomes reporting | coverage + minimum cell | 6/12/15 months as defined | respondents may differ from nonrespondents | aggregate | MVP |
| OUT-02 | Further-study rate: in formal further learning / `K` | graduate/institution / joint | outcomes reporting | coverage + minimum cell | follow-up | international/part-time records may be missing | aggregate | MVP |
| OUT-03 | Seeking-work rate: actively seeking / `K` | graduate survey / graduate | support and outcomes | coverage + minimum cell | follow-up | self-report/context sensitive | aggregate | MVP |
| OUT-04 | Multiple-activity distribution: employment/study/entrepreneurship/other combinations | graduate survey / graduate | richer destination truth | sufficient routed responses | follow-up | categories not mutually exclusive | aggregate | Later |
| OUT-05 | Time to first known employment: median days from award date to supported start date | graduate + employer/admin / joint | transition analysis | sufficient known exact dates | annual | recall/right censoring; not zero for unknown | aggregate | Later |
| OUT-06 | Employment retention at defined interval: still employed or moved positively / valid prior employed cohort | follow-up / joint | transition quality | linked follow-up threshold | annual | loss to follow-up | aggregate | Later |
| OUT-07 | Job-field alignment: rubric-classified aligned roles / known employed with valid occupation data | role title/occupation + reviewed mapping / joint | program alignment | high occupation coding + published rubric | annual | subjective mapping; interdisciplinary roles | aggregate | Pilot/Later |
| OUT-08 | Qualification-level alignment: roles requiring/utilizing comparable qualification / valid responses | graduate/employer + occupation evidence / joint | outcome quality | sufficient evidence | annual | requirement/use is difficult to infer | aggregate | Later |
| OUT-09 | Sector destination distribution: known employed by governed sector taxonomy / valid coded roles | organization/opportunity/outcome graph / JID | market alignment | coding/coverage disclosed | term/annual | taxonomy and unknown employers | aggregate | MVP |
| OUT-10 | Regional destination distribution: valid work region / known employed with location | graduate/employer / joint | regional planning | sufficient location coverage | annual | remote/hybrid and relocations | aggregate | MVP |
| OUT-11 | Contract/work arrangement distribution: full/part-time, permanent/fixed, self-employed, etc. | graduate/employer / joint | job-quality context | field coverage disclosed | annual | local definitions must be agreed | aggregate | Later |
| OUT-12 | Entrepreneurship outcome: active business/self-employment meeting defined evidence / `K` | graduate + registry/other evidence where lawful | broader outcomes | evidence class disclosed | annual | informal work undercount | aggregate | Later |
| OUT-13 | Compensation distribution: median and quartiles for valid comparable compensation | graduate/employer/authorized source | compensation insight | high coverage, currency/period normalization, strict suppression | annual | self-report, nonresponse, role/location mix | sensitive aggregate | Not MVP |
| EXP-01 | Internship participation: completed governed internship / eligible cohort | university/JID/employer | experiential learning | record coverage known | term | unrecorded external internships | aggregate | MVP if source exists |
| EXP-02 | Internship-to-offer conversion: participants receiving qualifying offer / participants with known employer outcome | employer/university / joint | program evaluation | outcome coverage and same cohort | term/annual | selection and employer mix | aggregate | Pilot |
| EXP-03 | Work-integrated learning completion: completed co-op/project/work sample / eligible defined participants | university/employer | program delivery | complete program roster | term | completion ≠ quality | aggregate | Later |
| CS-01 | Career-service reach: unique eligible graduates using a defined service / `E` | university career system / university | service evaluation | identity linkage/coverage | term | self-selection | aggregate | Pilot |
| CS-02 | Career-service repeat use: users with 2+ purposeful sessions / service users | career system / university | service design | valid event taxonomy | term | frequency is not outcome | aggregate | Later |
| CS-03 | Event-to-action: attendees completing defined next action within window / valid attendees | JID/university | service effectiveness | linked events/actions | event/term | attribution, external actions missing | aggregate | Later |
| CS-04 | Guidance closure: appointments with documented next step / completed appointments | university/JID | service quality | workflow completeness | monthly | documentation burden/quality | restricted aggregate | Pilot |
| EMP-01 | Unique verified employers engaging a cohort/program through qualifying action | JID/university | employer engagement | identity resolution and action definition | term | quantity ≠ quality | aggregate | MVP |
| EMP-02 | Employer response coverage: opportunities/applications receiving a status response / eligible interactions | JID native workflow | candidate experience | only native/observable denominator | monthly/term | external applications unobserved | aggregate | MVP |
| EMP-03 | Repeat employer participation: verified employers returning in later cycle / eligible prior employers | JID/university | relationship health | comparable cycles | annual | small numbers; employer restructuring | aggregate | Later |
| EMP-04 | Employer skill-demand distribution: governed skill requirements across fresh qualifying opportunities | Opportunity Graph / JID | program alignment | source/freshness/duplication coverage | monthly/term | postings ≠ hires; source mix bias | aggregate | Pilot |
| EMP-05 | Employer rubric gap themes: coded evidence gaps from structured feedback / valid feedback | employer / employer with agreement | curriculum/career action | minimum feedback and coding QA | term | participating-employer bias | aggregate | Pilot |
| PRG-01 | Program outcome distribution: OUT metrics by documented program cohort | outcome data / joint | program improvement | coverage + cell threshold per program | annual | small programs; mix differences | aggregate/suppressed | Pilot |
| PRG-02 | Program-to-sector transition mix | coded outcomes / joint | planning | program coverage and taxonomy quality | annual | sector desirability not implied | aggregate | Later |
| PRG-03 | Program skill-demand overlap: governed curriculum skill set intersecting fresh demand set, reported descriptively | curriculum + Opportunity Graph / joint | curriculum review | curriculum/demand version and coverage | term/annual | overlap is not quality or causal proof | aggregate | Later |
| PRG-04 | Credential utilization: graduates reporting/confirming use of named credential in outcome / valid holders | graduate/employer / joint | credential evaluation | sufficient holders/responses | annual | subjective use; selection | aggregate | Later |
| EQ-01 | Outcome gap by approved subgroup: difference/ratio in defined KPI with confidence/coverage | outcome + approved attributes / joint | equity review | high coverage, sufficient cells, legal/ethical review | annual | sensitive attributes, confounding, re-identification | restricted aggregate | Later |
| BENCH-01 | Peer benchmark: institution metric versus comparable, method-aligned group | multi-institution aggregate / JID | institutional context | comparable definitions, adequate institutions, contract | annual | ranking misuse and structural differences | aggregate | Not before scale |
| GOV-01 | Program transition outcome for a contracted public initiative | defined cohort/outcomes / joint | program evaluation | contract-specific methodology | per program | not nationally representative | aggregate | Partnership only |

## Recommended MVP set

The first university pilot should use only: `DQ-01` through `DQ-08`, `OUT-01` through `OUT-03`, `OUT-09`, `OUT-10`, `CS-01`, `EMP-01`, `EMP-02`, and `PRG-01` where coverage permits. All other measures require an explicit later gate.

## Rendering contract

Every KPI card/table/export must show:

- definition and reporting date;
- `N`, `K`, `E` as relevant;
- source mix and known-outcome coverage;
- period/follow-up point;
- suppression/rounding rule;
- last updated timestamp;
- representativeness warning;
- drill-down only to the privacy level authorized.
