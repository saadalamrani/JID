# JID — Wave 2 Career Record Migration Subpacket

**Front:** Wave 2 / Front 2A — Canonical Career Record + CV Projection Core

**Status:** READY FOR EXPLICIT NON-PRODUCTION MIGRATION AUTHORIZATION

**Prepared from:** `e60c2bbc8787d3b0ffaaf75f89c4c5d703a16c8c`

**Branch:** `codex/wave2-career-record-core`

**Production exclusion:** This packet is a design and execution contract. It creates no
migration, executes no DDL, changes no Supabase schema, and writes no data.

## 1. Gate decision

Canonical Career Record persistence requires a database change.

The current database has normalized legacy CV tables but no storage capable of enforcing
the frozen C2 semantics for stable evidence identity, immutable revision lineage,
provenance, declared versus verified state, dispute/correction/revocation/expiry,
per-evidence disclosure-policy handling, purpose-bound disclosure authorization, or lawful
artifact linkage. It also has no relation that makes a CV select and order canonical
evidence, and no purpose-bound application/CV snapshot store.

Application-only implementation would either keep CV facts canonical, discard lineage, or
simulate authorization in memory. All three outcomes violate the Wave 1 contract. The
required path is an expand/contract migration followed by bounded application cutover.

### 1.1 C2/C5 conflict proof and controlling interpretation

Wave 1 C2 requires `disclosure_policy_ref` on every `CareerEvidenceObject` and defines it as
visibility/disclosure handling. C5 separately defines `DisclosureAuthorization` with an
exact scope, recipient, purpose, reviewed basis, lifecycle and retention reference. The
pre-correction TypeScript contract omitted the required policy and instead required
`disclosure_authorization_ref` on every evidence object. The first version of this packet
propagated that drift as a non-null authorization FK on every revision.

Those meanings are not interchangeable. Private owner evidence needs an explicit governing
policy but has not crossed a recipient/use boundary and therefore must not manufacture a C5
authorization. The controlling model is:

- **Disclosure policy:** required on every canonical evidence root; private-by-default
  handling, independent of any recipient grant.
- **Disclosure authorization:** optional on the evidence object in private owner context,
  but mandatory and exact when an operation discloses evidence to public, Business,
  University or another recipient for a stated purpose.

## 2. Current-reality reconciliation

### 2.1 Current storage and ownership

| Area                          | Current truth                                                                                                                                            | Classification     | Treatment                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `cvs`                         | Owner FK is `user_id -> profiles.id`; header, contact, summary, template, technical skills and languages are stored on the CV row.                       | ADAPT              | Retain as the projection header during compatibility. Stop treating `technical_skills` and `languages` as long-term fact stores. |
| `cv_education`                | Mutable education facts owned indirectly through `cv_id`.                                                                                                | COMPATIBILITY-ONLY | Backfill declared Career Evidence and projection selections; preserve rows unchanged.                                            |
| `cv_experience`               | Mutable experience facts and bullets owned indirectly through `cv_id`.                                                                                   | COMPATIBILITY-ONLY | Backfill declared Career Evidence and projection selections; preserve rows unchanged.                                            |
| `cv_skills`                   | Mutable skill/proficiency facts owned indirectly through `cv_id`.                                                                                        | COMPATIBILITY-ONLY | Backfill declared Career Evidence and projection selections; preserve rows unchanged.                                            |
| `cv_additional`               | Mutable certification, language, project, award, leadership, volunteer, publication and other facts.                                                     | COMPATIBILITY-ONLY | Map deterministically by category; preserve every row and unrecognized value.                                                    |
| `cv_generations`              | Export/refinement audit-like rows with input/output snapshots.                                                                                           | KEEP               | Preserve as historical compatibility evidence; new durable snapshots use the proposed immutable snapshot table.                  |
| `profiles` career fields      | `headline`, `about_me`, university/college/major/graduation/student status, target fields, links and location overlap presentation or education context. | ADAPT              | Keep identity/preferences/presentation on Profile; only governed career facts become declared evidence.                          |
| `profile_skills` + `skills`   | Profile-level skill relation overlaps `cv_skills` and `cvs.technical_skills`.                                                                            | COMPATIBILITY-ONLY | Backfill with exact normalized dedupe and source links.                                                                          |
| `applications.resume_url`     | A pointer, not a frozen Career Record/CV payload.                                                                                                        | ADAPT              | Keep pointer; add an immutable purpose-bound projection snapshot reference in a later contract stage.                            |
| Career Evidence TypeScript    | Frozen semantic contract only; no persistence.                                                                                                           | KEEP               | Physical schema adapts to it without aliasing legacy CV types.                                                                   |
| Career Record persistence     | Absent.                                                                                                                                                  | MISSING            | Add canonical root/revision, provenance, disclosure and artifact storage.                                                        |
| CV projection selection/order | Absent; order lives on mutable legacy fact rows.                                                                                                         | MISSING            | Add section/item projection tables.                                                                                              |
| CV/application snapshots      | Export payload exists only in `cv_generations`; application snapshot absent.                                                                             | MISSING            | Add immutable purpose-bound snapshots.                                                                                           |

### 2.2 Current service and route behavior

- The builder is `/[locale]/profile/cv`; first visit creates a primary `cvs` row and may
  copy Profile and catalog values into `cvs` and `cv_education`.
- `GET /api/me/cv?cvId=...` returns a full CV after session and owner checks.
- `PATCH /api/me/cv/[id]` directly mutates CV header fields.
- Education, experience and additional routes directly create, update and delete legacy
  fact rows; reorder routes update `sort_order` on those fact rows.
- `PATCH /api/me/cv/[id]/skills` directly updates JSON skill/language facts on `cvs`.
- Client state correctly keeps only UI state in Zustand; server data uses TanStack Query.
- Preview and PDF rendering are reusable presentation infrastructure. PDF generation is
  client-side; the export route writes the current payload to `cv_generations`.
- There is no direct CV share route or share token. The Individual public Profile is the
  current disclosure surface.
- Profile projection reads the primary/latest CV and exposes education, experience,
  skills, certifications and projects after server-side Profile audience checks. It can
  use an admin client after those checks. CV `status = published` is not the disclosure
  gate, and item-level disclosure does not exist.

### 2.3 Current RLS and tests

- `cvs` owner policies allow owner CRUD; privileged staff also have broad access.
- Child CV tables authorize through the parent CV owner and also allow privileged staff.
- No anonymous/public policy exists on CV base tables. Public Profile composition is a
  server projection rather than a direct CV table read.
- Existing contract tests prove only that `CvRecord` is not `CareerEvidence` and that the
  C2 type contains required semantic fields.
- Existing RLS coverage inserts CVs only as input to University aggregate tests. It does
  not prove CV/Career Record cross-user isolation, lineage, disclosure, or projection
  invariants.

### 2.4 Migration history in scope

- `026_badges_system.sql` created the original `cvs` stub.
- `068_cv_database.sql` expanded `cvs`, created normalized child/generation tables and RLS.
- `069_cv_header_professional_links.sql` added professional/contact links.
- `070_cv_education_extended.sql` added institution location, honors and coursework.
- `071_cv_experience_extended.sql` added company city/country.
- `072_cv_skills_languages.sql` added JSON skill/language arrays and `leadership`.
- Later privacy migrations make Individual Profile reads fail closed, but they do not add
  CV item-level disclosure or Career Record persistence.

No already-applied migration may be edited.

## 3. Focused reuse decision

**Decision: BUILD on existing PostgreSQL/Supabase architecture, EXTRACT PATTERN from the
repository's immutable audit log and security-definer authorization functions, and KEEP the
existing CV renderer/builder during compatibility.**

No external resume service, ORM, graph database, event bus, workflow engine, validation
framework or AI dependency is justified. PostgreSQL relational constraints, RLS, existing
Supabase clients, existing Zod validation and `audit_logs` are sufficient. The legacy CV
tables are valuable compatibility inputs but cannot enforce the canonical boundary.

## 4. Target physical model

The physical model separates stable evidence identity from immutable revisions. API
adapters continue to expose the frozen `CareerEvidence` semantic shape; physical helper
IDs do not weaken that contract.

### 4.1 Enumerations and checks

Create these PostgreSQL enums with values exactly matching the frozen contracts:

- `career_evidence_category_enum`: `EDUCATION`, `EXPERIENCE`, `SKILL`, `PROJECT`,
  `CREDENTIAL`, `AWARD`, `LANGUAGE`, `VOLUNTEERING`, `PUBLICATION`, `OTHER`.
- `career_evidence_source_class_enum`: `SELF_DECLARED`, `ISSUER_VERIFIED`,
  `ORGANIZATION_CONFIRMED`, `SYSTEM_OBSERVED`, `THIRD_PARTY_SOURCED`,
  `DERIVED_EXPLAINABLE`.
- `career_evidence_state_enum`: `DECLARED`, `VERIFIED`, `CONFIRMED`, `SOURCED`, `DERIVED`,
  `DISPUTED`, `CORRECTED`, `REVOKED`, `EXPIRED`.
- `career_evidence_lifecycle_enum`: `ACTIVE`, `DISPUTED`, `REVOKED`, `EXPIRED`.
- `career_reconciliation_state_enum`: `LINKED`, `DEDUPLICATED`,
  `CONFLICT_NEEDS_REVIEW`, `INVALID_PRESERVED`, `DEFERRED`.
- `disclosure_recipient_type_enum`: `PUBLIC`, `BUSINESS`, `UNIVERSITY`, `MENTOR`, `VENDOR`,
  `SYSTEM`, `OTHER_APPROVED`.
- `authorization_basis_type_enum`: `CONSENT`, `CONTRACT`, `LEGAL_OBLIGATION`,
  `LEGITIMATE_AUTHORITY`, `PUBLIC_TASK`, `OTHER_REVIEWED`.
- `disclosure_authorization_state_enum`: `ACTIVE`, `REVOKED`, `EXPIRED`, `SUPERSEDED`.
- `cv_snapshot_purpose_enum`: `EXPORT`, `APPLICATION`, `PUBLIC_SHARE`, `PROFILE_PREVIEW`,
  `RECIPIENT_DISCLOSURE`.

Reference JSON columns use a common check: value is null or a JSON object containing a
non-blank string `id`; optional `version` must be a string. Fact and presentation payloads
must be JSON objects. Timestamps are `timestamptz`. All revision numbers and sort orders are
non-negative/positive as stated below.

### 4.2 `career_evidence_disclosure_policies`

Immutable C2 policy records. They govern default visibility but do not authorize a
recipient or purpose.

| Column                 | Type / constraint                                                        |
| ---------------------- | ------------------------------------------------------------------------ |
| `id`                   | `uuid` PK, default `gen_random_uuid()`                                   |
| `subject_id`           | `uuid NOT NULL` FK `profiles(id) ON DELETE RESTRICT`                     |
| `contract_version`     | `text NOT NULL DEFAULT '1.0' CHECK (contract_version = '1.0')`           |
| `default_visibility`   | `text NOT NULL DEFAULT 'PRIVATE' CHECK (default_visibility = 'PRIVATE')` |
| `supersedes_policy_id` | nullable self-FK `ON DELETE RESTRICT`                                    |
| `created_by`           | `uuid NOT NULL` FK `profiles(id) ON DELETE RESTRICT`                     |
| `created_at`           | `timestamptz NOT NULL DEFAULT now()`                                     |

Unique `supersedes_policy_id` where non-null prevents branching. Rows are immutable. A
future policy change appends a new policy row and atomically advances the evidence root's
reference through an audited owner operation. `PRIVATE` is the only Wave 2 default; adding
another default requires a later governed contract/schema decision. Public or recipient
disclosure is never inferred from this policy and still requires C5 authorization.
The domain adapter maps `id` plus `contract_version` to C2 `disclosure_policy_ref`.

### 4.3 `career_evidence`

Stable root identity for one subject-owned career fact lineage.

| Column                 | Type / constraint                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `id`                   | `uuid` PK, default `gen_random_uuid()`                                             |
| `subject_id`           | `uuid NOT NULL` FK `profiles(id) ON DELETE RESTRICT`                               |
| `category`             | `career_evidence_category_enum NOT NULL`                                           |
| `disclosure_policy_id` | `uuid NOT NULL` FK `career_evidence_disclosure_policies(id) ON DELETE RESTRICT`    |
| `current_revision_id`  | nullable `uuid`; deferred FK to `career_evidence_revisions(id) ON DELETE RESTRICT` |
| `lifecycle_state`      | `career_evidence_lifecycle_enum NOT NULL DEFAULT 'ACTIVE'`                         |
| `archived_at`          | nullable `timestamptz`; owner presentation/archive state only                      |
| `archived_by`          | nullable `uuid` FK `profiles(id) ON DELETE SET NULL`                               |
| `created_at`           | `timestamptz NOT NULL DEFAULT now()`                                               |
| `updated_at`           | `timestamptz NOT NULL DEFAULT now()`                                               |

Constraints/indexes:

- unique `(id, subject_id)` for composite child ownership FKs;
- the referenced disclosure policy must have the same `subject_id`; enforce through the
  write functions and a deferred constraint trigger;
- index `(subject_id, category, lifecycle_state, updated_at DESC)`;
- index `(subject_id, archived_at)` where `archived_at IS NULL`;
- `current_revision_id`, when present, must reference a revision with the same
  `evidence_id` and `subject_id`; enforce through the write functions and a deferred
  constraint trigger.

### 4.4 `career_evidence_revisions`

Immutable fact/provenance revisions.

| Column                     | Type / constraint                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `id`                       | `uuid` PK, default `gen_random_uuid()`                                             |
| `evidence_id`              | `uuid NOT NULL`                                                                    |
| `subject_id`               | `uuid NOT NULL`                                                                    |
| `revision_no`              | `integer NOT NULL CHECK (revision_no >= 1)`                                        |
| `contract_version`         | `text NOT NULL DEFAULT '1.0' CHECK (contract_version = '1.0')`                     |
| `fact_payload`             | `jsonb NOT NULL`, JSON object                                                      |
| `source_class`             | `career_evidence_source_class_enum NOT NULL`                                       |
| `source_ref`               | nullable checked reference JSON                                                    |
| `verification_state`       | `career_evidence_state_enum NOT NULL`                                              |
| `effective_from`           | nullable `timestamptz`                                                             |
| `effective_to`             | nullable `timestamptz`                                                             |
| `observed_at`              | nullable `timestamptz`                                                             |
| `supersedes_revision_id`   | nullable self-FK `ON DELETE RESTRICT`                                              |
| `dispute_ref`              | nullable checked reference JSON                                                    |
| `revocation_or_expiry_ref` | nullable checked reference JSON                                                    |
| `primary_artifact_id`      | nullable `uuid`; deferred FK to `career_evidence_artifacts(id) ON DELETE RESTRICT` |
| `market_context_ref`       | nullable checked reference JSON                                                    |
| `created_by`               | `uuid NOT NULL` FK `profiles(id) ON DELETE RESTRICT`                               |
| `created_at`               | `timestamptz NOT NULL DEFAULT now()`                                               |

Constraints/indexes:

- composite FK `(evidence_id, subject_id) -> career_evidence(id, subject_id) ON DELETE RESTRICT`;
- unique `(evidence_id, revision_no)`;
- unique `supersedes_revision_id` where non-null, preventing revision branches;
- `effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from`;
- revision 1 has no predecessor; revision N must supersede revision N-1 of the same root;
- `VERIFIED` requires `source_class = 'ISSUER_VERIFIED'` and non-null `source_ref`;
- `CONFIRMED` requires `source_class = 'ORGANIZATION_CONFIRMED'` and non-null `source_ref`;
- `DERIVED` requires `source_class = 'DERIVED_EXPLAINABLE'` and non-null `source_ref`;
- `SOURCED` requires `source_class = 'THIRD_PARTY_SOURCED'` and non-null `source_ref`;
- legacy backfill always uses `SELF_DECLARED` + `DECLARED`;
- `DISPUTED` requires `dispute_ref`; `REVOKED`/`EXPIRED` require
  `revocation_or_expiry_ref`;
- indexes `(subject_id, created_at DESC)`, `(evidence_id, revision_no DESC)`, and GIN on
  `fact_payload` only if an authorized query plan proves it is required. Do not add the GIN
  index speculatively.

The immutable-row trigger rejects direct `UPDATE` and `DELETE`. Corrections and lifecycle
changes append a new revision and atomically advance `career_evidence.current_revision_id`.
The prior revision remains unchanged; the API derives `CORRECTED` history from the
successor relationship rather than rewriting the old fact.

### 4.5 `career_evidence_artifacts`

Private evidence/proof metadata; no public URLs.

| Column                 | Type / constraint                                                     |
| ---------------------- | --------------------------------------------------------------------- |
| `id`                   | `uuid` PK, default `gen_random_uuid()`                                |
| `subject_id`           | `uuid NOT NULL` FK `profiles(id) ON DELETE RESTRICT`                  |
| `evidence_id`          | `uuid NOT NULL` FK `career_evidence(id) ON DELETE RESTRICT`           |
| `revision_id`          | `uuid NOT NULL` FK `career_evidence_revisions(id) ON DELETE RESTRICT` |
| `bucket_id`            | `text NOT NULL CHECK (bucket_id = 'career-evidence')`                 |
| `object_path`          | `text NOT NULL`                                                       |
| `media_type`           | `text NOT NULL`                                                       |
| `byte_size`            | `bigint NOT NULL CHECK (byte_size > 0)`                               |
| `sha256`               | `text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$')`                     |
| `retention_policy_ref` | checked reference JSON `NOT NULL`                                     |
| `uploaded_by`          | `uuid NOT NULL` FK `profiles(id) ON DELETE RESTRICT`                  |
| `created_at`           | `timestamptz NOT NULL DEFAULT now()`                                  |
| `revoked_at`           | nullable `timestamptz`                                                |
| `deleted_at`           | nullable `timestamptz`; logical deletion/retention state only         |

Constraints/indexes: unique `(bucket_id, object_path)`, index `(subject_id, evidence_id)`,
and a constraint trigger proving artifact subject/root/revision ownership matches. Create a
private `career-evidence` Storage bucket only in disposable/non-production authorization.
Object paths are `{subject_id}/{evidence_id}/{artifact_id}/{sanitized_filename}`. Access is
through short-lived signed URLs after server authorization; never `getPublicUrl`. Owner
access relies on ownership plus the evidence policy and needs no fabricated recipient
authorization. Any non-owner artifact access requires an active C5 authorization matching
the exact subject, evidence/artifact object, recipient and purpose.

### 4.6 `disclosure_authorizations`

Purpose-bound C5 authorization records. This table does not declare a legal conclusion; it
records a reviewed basis reference supplied by the responsible policy owner.

| Column                        | Type / constraint                                               |
| ----------------------------- | --------------------------------------------------------------- |
| `id`                          | `uuid` PK, default `gen_random_uuid()`                          |
| `contract_version`            | `text NOT NULL DEFAULT '1.0' CHECK (contract_version = '1.0')`  |
| `subject_id`                  | `uuid NOT NULL` FK `profiles(id) ON DELETE RESTRICT`            |
| `object_ref`                  | nullable checked reference JSON                                 |
| `data_category`               | nullable non-blank text                                         |
| `recipient_type`              | `disclosure_recipient_type_enum NOT NULL`                       |
| `recipient_ref`               | nullable checked reference JSON                                 |
| `purpose_code`                | non-blank `text NOT NULL`                                       |
| `basis_type`                  | `authorization_basis_type_enum NOT NULL`                        |
| `basis_ref`                   | checked reference JSON `NOT NULL`                               |
| `state`                       | `disclosure_authorization_state_enum NOT NULL DEFAULT 'ACTIVE'` |
| `effective_at`                | `timestamptz NOT NULL`                                          |
| `expires_at`                  | nullable `timestamptz`                                          |
| `revoked_at`                  | nullable `timestamptz`                                          |
| `retention_policy_ref`        | checked reference JSON `NOT NULL`                               |
| `created_by`                  | `uuid NOT NULL` FK `profiles(id) ON DELETE RESTRICT`            |
| `supersedes_authorization_id` | nullable self-FK `ON DELETE RESTRICT`                           |
| `created_at`                  | `timestamptz NOT NULL DEFAULT now()`                            |

Checks/indexes:

- exactly one of `object_ref` or `data_category` is present;
- non-public recipient classes that represent a specific recipient require
  `recipient_ref`;
- `expires_at >= effective_at`; `REVOKED` requires `revoked_at`;
- partial index for active authorization lookup by subject/purpose/recipient;
- unique `supersedes_authorization_id` where non-null.

No authorization is synthesized from mere university, employer, mentor or government
status. A new CV projection and newly created evidence are private by default. Existing
Profile visibility remains a compatibility gate until a user-visible disclosure conversion
flow is authorized; the backfill does not manufacture C5 legal/basis records.

Private owner evidence references `career_evidence_disclosure_policies`, not this table.
When an actual disclosure is requested, the service must find or create an exact C5 record
using real reviewed basis and retention references; if those references or recipient/purpose
authority are absent, the disclosure fails closed. The API exposes that record as
`disclosure_authorization_ref` only in the authorized disclosure context.

### 4.7 `career_evidence_legacy_sources`

Append-only reconciliation ledger ensuring every legacy source is preserved and traceable.

| Column                    | Type / constraint                                                     |
| ------------------------- | --------------------------------------------------------------------- |
| `id`                      | `uuid` PK, default `gen_random_uuid()`                                |
| `subject_id`              | `uuid NOT NULL` FK `profiles(id) ON DELETE RESTRICT`                  |
| `source_table`            | `text NOT NULL` checked to the allowed legacy source list             |
| `source_locator`          | `text NOT NULL`; row ID or deterministic array/field locator          |
| `source_cv_id`            | nullable `uuid` FK `cvs(id) ON DELETE RESTRICT`                       |
| `evidence_id`             | nullable `uuid` FK `career_evidence(id) ON DELETE RESTRICT`           |
| `revision_id`             | nullable `uuid` FK `career_evidence_revisions(id) ON DELETE RESTRICT` |
| `source_snapshot`         | `jsonb NOT NULL`                                                      |
| `source_sha256`           | `text NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$')`              |
| `normalized_identity_key` | nullable `text`                                                       |
| `reconciliation_state`    | `career_reconciliation_state_enum NOT NULL`                           |
| `precedence_rank`         | `smallint NOT NULL CHECK (precedence_rank BETWEEN 1 AND 99)`          |
| `conflict_group_id`       | nullable `uuid`                                                       |
| `migration_batch_id`      | `uuid NOT NULL`                                                       |
| `notes`                   | nullable `text`                                                       |
| `created_at`              | `timestamptz NOT NULL DEFAULT now()`                                  |

Unique `(source_table, source_locator)`. Allowed sources are `cv_education`,
`cv_experience`, `cv_skills`, `cv_additional`, `cvs.technical_skills`, `cvs.languages`,
`profiles.education`, `profiles.presentation`, and `profile_skills`. Rows in presentation
sources may be `DEFERRED` with no evidence link; their snapshot still proves preservation.

### 4.8 `cv_projection_sections`

Presentation-only section state attached to the retained `cvs` row.

| Column                  | Type / constraint                                                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                    | `uuid` PK, default `gen_random_uuid()`                                                                                                                                                   |
| `cv_id`                 | `uuid NOT NULL` FK `cvs(id) ON DELETE CASCADE`                                                                                                                                           |
| `section_key`           | non-blank `text NOT NULL` checked to `HEADER`, `SUMMARY`, `EXPERIENCE`, `EDUCATION`, `SKILLS`, `CREDENTIALS`, `PROJECTS`, `AWARDS`, `LANGUAGES`, `VOLUNTEERING`, `PUBLICATIONS`, `OTHER` |
| `heading_override`      | nullable `text`                                                                                                                                                                          |
| `sort_order`            | `integer NOT NULL CHECK (sort_order >= 0)`                                                                                                                                               |
| `is_visible`            | `boolean NOT NULL DEFAULT true`                                                                                                                                                          |
| `presentation_settings` | `jsonb NOT NULL DEFAULT '{}'`, JSON object                                                                                                                                               |
| `created_at`            | `timestamptz NOT NULL DEFAULT now()`                                                                                                                                                     |
| `updated_at`            | `timestamptz NOT NULL DEFAULT now()`                                                                                                                                                     |

Unique `(cv_id, section_key)` and deferrable unique `(cv_id, sort_order)`.

### 4.9 `cv_projection_items`

Selection and ordering of canonical evidence. It contains no independent fact payload.

| Column                 | Type / constraint                                                 |
| ---------------------- | ----------------------------------------------------------------- |
| `id`                   | `uuid` PK, default `gen_random_uuid()`                            |
| `cv_id`                | `uuid NOT NULL` FK `cvs(id) ON DELETE CASCADE`                    |
| `section_id`           | `uuid NOT NULL` FK `cv_projection_sections(id) ON DELETE CASCADE` |
| `evidence_id`          | `uuid NOT NULL` FK `career_evidence(id) ON DELETE RESTRICT`       |
| `sort_order`           | `integer NOT NULL CHECK (sort_order >= 0)`                        |
| `is_selected`          | `boolean NOT NULL DEFAULT true`                                   |
| `presentation_payload` | `jsonb NOT NULL DEFAULT '{}'`, JSON object                        |
| `created_at`           | `timestamptz NOT NULL DEFAULT now()`                              |
| `updated_at`           | `timestamptz NOT NULL DEFAULT now()`                              |

Unique `(cv_id, evidence_id)` and deferrable unique `(section_id, sort_order)`. A constraint
trigger/RPC proves the CV owner equals the evidence subject and the section belongs to the
same CV.

`presentation_payload` is whitelisted to `display_title`, `summary`, `selected_bullets`,
`section_label`, `locale_variant`, and `notes`. It must reject canonical fact keys including
institution/company identity, degree, job title, dates, credential issuer, skill identity,
proficiency and verification state. Changing formatting, selection or order never writes a
Career Evidence revision. Editing any fact calls the explicit revise operation.

### 4.10 `cv_projection_snapshots`

Immutable historical expression for export, application, explicit share or Profile preview.

| Column                        | Type / constraint                                                     |
| ----------------------------- | --------------------------------------------------------------------- |
| `id`                          | `uuid` PK, default `gen_random_uuid()`                                |
| `cv_id`                       | `uuid NOT NULL` FK `cvs(id) ON DELETE RESTRICT`                       |
| `subject_id`                  | `uuid NOT NULL` FK `profiles(id) ON DELETE RESTRICT`                  |
| `purpose`                     | `cv_snapshot_purpose_enum NOT NULL`                                   |
| `application_id`              | nullable `uuid` FK `applications(id) ON DELETE RESTRICT`              |
| `disclosure_authorization_id` | nullable `uuid` FK `disclosure_authorizations(id) ON DELETE RESTRICT` |
| `projection_version`          | `integer NOT NULL CHECK (projection_version >= 1)`                    |
| `locale`                      | `text NOT NULL CHECK (locale IN ('ar', 'en'))`                        |
| `template_key`                | non-blank `text NOT NULL`                                             |
| `snapshot_payload`            | `jsonb NOT NULL`, JSON object                                         |
| `evidence_revision_manifest`  | `jsonb NOT NULL`, JSON array of evidence/revision IDs                 |
| `content_sha256`              | `text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$')`             |
| `retention_policy_ref`        | checked reference JSON `NOT NULL`                                     |
| `created_by`                  | `uuid NOT NULL` FK `profiles(id) ON DELETE RESTRICT`                  |
| `created_at`                  | `timestamptz NOT NULL DEFAULT now()`                                  |
| `expires_at`                  | nullable `timestamptz`                                                |
| `revoked_at`                  | nullable `timestamptz`                                                |

Checks/indexes:

- `APPLICATION` requires `application_id` and a disclosure authorization valid for the
  exact Business recipient and application purpose;
- `PUBLIC_SHARE` requires an active public disclosure authorization;
- `RECIPIENT_DISCLOSURE` requires an active authorization for the exact recipient and
  purpose; University affiliation or employer role is never sufficient;
- `EXPORT` and `PROFILE_PREVIEW` are owner-only and require
  `disclosure_authorization_id IS NULL`; they do not cross a recipient boundary;
- non-`APPLICATION` purposes prohibit unrelated `application_id`;
- unique `(cv_id, purpose, content_sha256, created_at)` is not required; repeated exports
  remain separately attributable;
- indexes `(subject_id, created_at DESC)`, `(application_id)` where non-null, and
  `(disclosure_authorization_id)` where non-null;
- immutable-row trigger rejects update/delete.

`cv_generations` remains untouched. Existing export snapshots may be linked later through
the reconciliation ledger; they are not rewritten or deleted.

### 4.11 Application compatibility

During EXPAND, add nullable `applications.cv_snapshot_id uuid` referencing
`cv_projection_snapshots(id) ON DELETE RESTRICT`, plus a partial index where the value is
non-null. Do not populate it by guessing from `resume_url`. Existing applications with only
`resume_url` remain valid compatibility rows and are flagged `DEFERRED` for snapshot
reconciliation. New applications created after cutover must create the snapshot atomically
before submission.

## 5. Required functions and triggers

Only the following database functions/triggers are justified:

1. `create_career_evidence(...)`: authenticated subject only; inserts root + revision 1 as
   `DECLARED` for user-authored facts plus an immutable private-by-default disclosure policy;
   it does not create a disclosure authorization. An authorized issuer/organization path
   may supply the stronger evidence state; writes `audit_logs`.
2. `revise_career_evidence(p_evidence_id, p_expected_revision_no, ...)`: owner-only,
   optimistic concurrency, row lock, append revision N+1, predecessor N, atomic current
   pointer update, immutable audit event. It never carries `VERIFIED` forward unless the
   correcting source is independently authorized to establish it; user correction defaults
   to `SELF_DECLARED`/`DECLARED`.
3. `set_career_evidence_lifecycle(...)`: owner dispute/archive or authorized
   issuer/administrator revocation/expiry path; requires reason/reference as appropriate,
   appends a revision and audits. Staff role alone is insufficient.
4. `set_cv_projection_items(p_cv_id, p_section_key, p_ordered_evidence_ids)`: owner-only,
   validates subject ownership and active evidence, then atomically selects/reorders without
   changing facts.
5. `create_cv_projection_snapshot(...)`: validates owner, evidence/revision manifest,
   purpose and conditional disclosure authorization. Owner-only `EXPORT`/`PROFILE_PREVIEW`
   prohibit a fabricated authorization. `APPLICATION`, `PUBLIC_SHARE` and
   `RECIPIENT_DISCLOSURE` require an exact active C5 authorization; inserts one immutable
   snapshot and audits material disclosures.
6. Immutable triggers for `career_evidence_revisions` and `cv_projection_snapshots`.
7. Immutable trigger for `career_evidence_disclosure_policies`; a policy change appends a
   new row and atomically advances the evidence root.
8. Deferred integrity triggers for policy/root subject equality, current revision, artifact
   ownership and projection owner/subject equality where ordinary FKs cannot express the
   cross-table invariant.
9. Reuse `public._write_audit_log`; do not create a competing audit store.

All security-definer functions set a fixed `search_path`, revoke execute from `PUBLIC` and
`anon`, grant only the minimum authenticated/service roles, check `auth.uid()` inside the
function, and never accept caller-supplied subject/actor IDs without equality checks.

### 5.1 Audit requirements

Reuse immutable `audit_logs` with these namespaced actions:

- `career_evidence.created`, `career_evidence.revised`,
  `career_evidence.lifecycle_changed`, `career_evidence.artifact_attached`;
- `cv_projection.presentation_changed`, `cv_projection.selection_changed`,
  `cv_projection.snapshot_created`;
- `career_evidence.disclosure_allowed` and `career_evidence.disclosure_denied` for material
  recipient reads.

Audit metadata for material reads/disclosures contains actor/recipient reference, subject
ID, object/snapshot reference, purpose code, authorization/basis reference, `ALLOWED` or
`DENIED`, request correlation context and occurred time. Fact payloads and artifact contents
are not copied into audit metadata; record IDs, hashes and bounded old/new lifecycle fields
are sufficient. RLS-denied attempts that never reach a function are recorded by the server
authorization boundary when a material disclosure was attempted.

## 6. RLS and authorization matrix

| Object                          | Owner                                       | Other Individual | Employer                                               | University                                        | Anonymous                                            | Staff                                                 |
| ------------------------------- | ------------------------------------------- | ---------------- | ------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| Evidence disclosure policies    | SELECT own; changes through audited RPC     | none             | evaluated server-side only                             | evaluated server-side only                        | none                                                 | audited policy/support path only                      |
| Career Evidence roots/revisions | SELECT own; mutations through RPC           | none             | exact active purpose/recipient authorization only      | exact active purpose/recipient authorization only | exact active public authorization only               | none by role; audited purpose-bound service path only |
| Evidence artifacts              | metadata/signed access to own               | none             | only exact active disclosure                           | only exact active disclosure                      | none                                                 | audited purpose-bound service path only               |
| Legacy source ledger            | SELECT own; no direct mutation              | none             | none                                                   | none                                              | none                                                 | migration service/audited support only                |
| CV projection sections/items    | CRUD own                                    | none             | none by role                                           | none                                              | none                                                 | audited support only                                  |
| CV snapshots                    | SELECT own; create via RPC                  | none             | exact application/share authorization only             | exact authorization only                          | public-share endpoint only with active authorization | audited support only                                  |
| Disclosure authorizations       | owner can read/manage permitted user grants | none             | recipient sees only grant metadata required for access | same                                              | public endpoint evaluates, never lists               | audited policy/support path only                      |

RLS is enabled and forced on every new table. No base-table `anon` grant is allowed. Public
or recipient projection endpoints return only selected snapshot/projection fields after
server authorization; they never fetch the subject's full Career Record and hide fields in
the client.

The legacy broad staff CV policies remain during EXPAND to avoid an unreviewed destructive
contract change. CONTRACT must replace them with audited purpose-bound access after the new
service path is verified.

Storage RLS permits object insert/select/delete only when the first path segment equals
`auth.uid()` and a matching owner metadata row exists. Recipient downloads require a
server-created short-lived signed URL after exact active C5 authorization; recipient clients
receive no bucket listing permission. Owner access to own private artifact does not create
an authorization row.

## 7. Deterministic legacy mapping

### 7.1 Fact category mapping

| Legacy source                                      | Canonical category    | Notes                                                                                    |
| -------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `cv_education`                                     | `EDUCATION`           | Preserve all nullable values; do not invent degree/date/GPA.                             |
| `cv_experience`                                    | `EXPERIENCE`          | Bullets remain declared content; no employer confirmation is inferred.                   |
| `cv_skills`                                        | `SKILL`               | One evidence root per normalized skill identity.                                         |
| `cvs.technical_skills[*]`                          | `SKILL`               | Deterministic locator includes array ordinal; exact normalized duplicates link together. |
| `cvs.languages[*]`                                 | `LANGUAGE`            | Preserve name and proficiency exactly; invalid JSON is `INVALID_PRESERVED`.              |
| `cv_additional.certification`                      | `CREDENTIAL`          | `issuer` remains declared issuer text, not verification.                                 |
| `cv_additional.award`                              | `AWARD`               | Self-declared.                                                                           |
| `cv_additional.project`                            | `PROJECT`             | Self-declared; URL is a claimed project link, not proof.                                 |
| `cv_additional.volunteer`                          | `VOLUNTEERING`        | Self-declared.                                                                           |
| `cv_additional.publication`                        | `PUBLICATION`         | Self-declared; URL is not independently verified.                                        |
| `cv_additional.language`                           | `LANGUAGE`            | Exact-match dedupe with `cvs.languages`; conflicts remain separate.                      |
| `cv_additional.leadership`                         | `OTHER`               | Fact payload subtype is `LEADERSHIP`; do not coerce to employment.                       |
| `cv_additional.other`                              | `OTHER`               | Preserve original category and payload.                                                  |
| `profile_skills`                                   | `SKILL`               | Exact normalized match may dedupe; verification metadata is not inferred.                |
| Profile university/college/major/graduation fields | `EDUCATION` candidate | Only non-empty source-backed values; conflict with CV education requires review.         |

`cvs.full_name`, email, phone, city/country, professional links, title, summary, template and
locale remain projection/identity/presentation fields. `profiles.headline`, `about_me`,
target preferences and links remain Profile/presentation/preferences. They are snapshotted
in the ledger but are not converted into career facts.

### 7.2 Precedence and conflict rules

1. An existing user-reviewed canonical revision wins over every legacy source. The baseline
   has none, but reruns must be idempotent.
2. Exact normalized identity plus exact canonical payload hash within the same subject and
   category deduplicates to one declared evidence root with multiple legacy source links.
3. A legacy CV child/array fact has precedence rank 20; Profile career fields and
   `profile_skills` have rank 30. Rank controls transitional display only. It never deletes,
   rewrites, verifies or silently merges the lower-ranked source.
4. Same normalized identity with a different payload creates separate declared roots linked
   by one `conflict_group_id` and state `CONFLICT_NEEDS_REVIEW`. Neither becomes verified.
5. Multiple CVs remain distinct projections selecting shared roots. Sort order belongs to
   each projection item, not to the canonical fact.
6. Empty values create no fabricated fact. The source row/snapshot is still counted for
   zero-loss reconciliation.
7. Malformed or unmappable values are preserved verbatim as `INVALID_PRESERVED`; they do not
   become invented normalized values.
8. A user resolves conflicts only through an explicit keep/separate/correct action. A
   correction appends lineage; it never overwrites a legacy row during EXPAND.

### 7.3 Projection backfill

- Create sections for every existing CV using deterministic default order.
- Create a projection item for every linked legacy fact belonging to that CV.
- Preserve each legacy row's current `sort_order` in the item.
- Header/summary/template/contact values remain on `cvs` during compatibility.
- A new CV created after EXPAND is private, selects no evidence unless the user chooses or
  explicitly accepts an autofill proposal, and does not copy Profile facts silently.
- Every backfilled evidence root receives an immutable private-by-default disclosure policy
  and does not create a disclosure authorization.
- Existing Profile audience behavior remains on the compatibility read path without being
  broadened. No new public authorization is backfilled from `cvs.status`, `is_primary`,
  university affiliation, employer role or Profile discoverability alone.
- Canonical Career Evidence must not enter a non-owner Profile projection until an exact
  active C5 authorization exists. Owner-only Profile preview remains private and needs no
  fabricated authorization. The legacy compatibility projection is not treated as
  canonical authorization and must be retired at CONTRACT.

## 8. Expand/contract execution stages

### Stage 0 — authorization and disposable baseline

- Obtain explicit non-production migration authorization.
- Create one new forward-only migration; do not edit 026/068–072.
- Capture PRE_COUNTS and checksums in a disposable local Supabase database.
- Confirm real reviewed basis and retention references before enabling any non-owner
  disclosure flow; they are not needed to store private owner evidence.

### Stage 1 — EXPAND

- Create in dependency order: enums, Career Evidence disclosure policies,
  `disclosure_authorizations`, Career Evidence roots, revisions/artifacts/ledger, CV
  projection sections/items/snapshots, the nullable application snapshot FK, deferred
  circular FKs, indexes, functions, triggers and RLS.
- Create the private Storage bucket/policies only if artifact upload is included in the
  authorized non-production run.
- Make no destructive change to legacy tables or policies.
- Regenerate `src/lib/supabase/types.ts` from the disposable database.

### Stage 2 — deterministic backfill

- Insert private declared roots/revisions, one private-by-default disclosure policy per
  evidence root, and the legacy ledger in bounded, idempotent subject batches.
- Create projection sections/items for existing CVs.
- Do not create public/verified facts or any disclosure authorization during backfill.
- Record migration batch ID, hashes, conflicts and invalid preserved rows.

### Stage 3 — application dual-read / guarded dual-write

- New Career Record services write only through canonical RPCs.
- CV reads prefer canonical projection and fall back to legacy rows only when the ledger is
  incomplete.
- Existing legacy fact-edit endpoints are adapted: fact edits invoke create/revise Career
  Evidence and update projection selection. Direct legacy writes remain compatibility
  mirrors only while parity is monitored.
- Presentation edits write only `cvs`, sections/items and presentation payloads.
- Profile projection consumes explicit canonical selections while retaining its existing
  audience gate; non-owner canonical evidence additionally requires exact active C5
  authorization.

### Stage 4 — parity and snapshot cutover

- Require zero unmatched sources, zero unauthorized reads, hash parity for unchanged CV
  previews, and explicit conflict handling.
- New application submission creates `cv_projection_snapshots` atomically and writes
  `applications.cv_snapshot_id`; existing `resume_url` records remain preserved.
- Export writes the immutable snapshot and may continue the `cv_generations` log during
  compatibility.

### Stage 5 — CONTRACT (separate authorization)

- Disable direct factual writes to `cv_education`, `cv_experience`, `cv_skills`,
  `cv_additional`, `cvs.technical_skills` and `cvs.languages`.
- Replace broad staff CV access with audited purpose-bound service access.
- Retain legacy tables read-only for at least one full release/rollback window and until
  DATA_LOSS=0 and snapshot parity are re-proven.
- Dropping columns/tables is a separate destructive migration requiring explicit founder
  approval; it is not part of this subpacket.

## 9. PRE_COUNTS queries

Run read-only before migration and store results with the migration evidence:

```sql
SELECT 'cvs' AS source, count(*)::bigint AS rows FROM public.cvs
UNION ALL SELECT 'cv_education', count(*) FROM public.cv_education
UNION ALL SELECT 'cv_experience', count(*) FROM public.cv_experience
UNION ALL SELECT 'cv_skills', count(*) FROM public.cv_skills
UNION ALL SELECT 'cv_additional', count(*) FROM public.cv_additional
UNION ALL SELECT 'cv_generations', count(*) FROM public.cv_generations
UNION ALL SELECT 'cvs.presentation', count(*) FROM public.cvs
UNION ALL SELECT 'cvs.technical_skills.items', count(*)
  FROM public.cvs c CROSS JOIN LATERAL jsonb_array_elements(c.technical_skills) v
UNION ALL SELECT 'cvs.languages.items', count(*)
  FROM public.cvs c CROSS JOIN LATERAL jsonb_array_elements(c.languages) v
UNION ALL SELECT 'profile_skills', count(*) FROM public.profile_skills
UNION ALL SELECT 'profiles.education', count(*) FROM public.profiles p
  WHERE p.university_id IS NOT NULL OR p.college_id IS NOT NULL
     OR p.major_id IS NOT NULL OR p.graduation_year IS NOT NULL
UNION ALL SELECT 'profiles.presentation', count(*) FROM public.profiles;
```

```sql
SELECT user_id, count(*) AS cv_count,
       count(*) FILTER (WHERE is_primary) AS primary_count
FROM public.cvs
GROUP BY user_id
ORDER BY user_id;
```

```sql
SELECT c.user_id,
       count(DISTINCT c.id) AS cvs,
       count(DISTINCT e.id) AS education,
       count(DISTINCT x.id) AS experience,
       count(DISTINCT s.id) AS skills,
       count(DISTINCT a.id) AS additional
FROM public.cvs c
LEFT JOIN public.cv_education e ON e.cv_id = c.id
LEFT JOIN public.cv_experience x ON x.cv_id = c.id
LEFT JOIN public.cv_skills s ON s.cv_id = c.id
LEFT JOIN public.cv_additional a ON a.cv_id = c.id
GROUP BY c.user_id
ORDER BY c.user_id;
```

Capture deterministic table checksums for all six legacy CV tables:

```sql
SELECT 'cvs' AS source, count(*) AS rows,
       encode(digest(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY t.id::text), ''), 'sha256'), 'hex') AS checksum
FROM public.cvs t
UNION ALL
SELECT 'cv_education', count(*),
       encode(digest(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY t.id::text), ''), 'sha256'), 'hex')
FROM public.cv_education t
UNION ALL
SELECT 'cv_experience', count(*),
       encode(digest(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY t.id::text), ''), 'sha256'), 'hex')
FROM public.cv_experience t
UNION ALL
SELECT 'cv_skills', count(*),
       encode(digest(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY t.id::text), ''), 'sha256'), 'hex')
FROM public.cv_skills t
UNION ALL
SELECT 'cv_additional', count(*),
       encode(digest(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY t.id::text), ''), 'sha256'), 'hex')
FROM public.cv_additional t
UNION ALL
SELECT 'cv_generations', count(*),
       encode(digest(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY t.id::text), ''), 'sha256'), 'hex')
FROM public.cv_generations t;
```

Store only the counts/checksums in non-production migration evidence, not the underlying
personal payloads.

## 10. POST_COUNTS and reconciliation queries

```sql
SELECT 'career_evidence' AS target, count(*)::bigint AS rows FROM public.career_evidence
UNION ALL SELECT 'career_evidence_disclosure_policies', count(*) FROM public.career_evidence_disclosure_policies
UNION ALL SELECT 'career_evidence_revisions', count(*) FROM public.career_evidence_revisions
UNION ALL SELECT 'career_evidence_legacy_sources', count(*) FROM public.career_evidence_legacy_sources
UNION ALL SELECT 'cv_projection_sections', count(*) FROM public.cv_projection_sections
UNION ALL SELECT 'cv_projection_items', count(*) FROM public.cv_projection_items
UNION ALL SELECT 'cv_projection_snapshots', count(*) FROM public.cv_projection_snapshots
UNION ALL SELECT 'disclosure_authorizations', count(*) FROM public.disclosure_authorizations;
```

Every row-based source must have exactly one ledger entry:

```sql
SELECT 'cv_education' AS source, count(*) AS unmatched
FROM public.cv_education s
WHERE NOT EXISTS (
  SELECT 1 FROM public.career_evidence_legacy_sources l
  WHERE l.source_table = 'cv_education' AND l.source_locator = s.id::text
)
UNION ALL
SELECT 'cv_experience', count(*) FROM public.cv_experience s
WHERE NOT EXISTS (
  SELECT 1 FROM public.career_evidence_legacy_sources l
  WHERE l.source_table = 'cv_experience' AND l.source_locator = s.id::text
)
UNION ALL
SELECT 'cv_skills', count(*) FROM public.cv_skills s
WHERE NOT EXISTS (
  SELECT 1 FROM public.career_evidence_legacy_sources l
  WHERE l.source_table = 'cv_skills' AND l.source_locator = s.id::text
)
UNION ALL
SELECT 'cv_additional', count(*) FROM public.cv_additional s
WHERE NOT EXISTS (
  SELECT 1 FROM public.career_evidence_legacy_sources l
  WHERE l.source_table = 'cv_additional' AND l.source_locator = s.id::text
);
```

Array locators are `cvs:{cv_id}:technical_skills:{ordinality}` and
`cvs:{cv_id}:languages:{ordinality}` using `WITH ORDINALITY`. Unmatched must be zero:

```sql
WITH array_sources AS (
  SELECT 'cvs.technical_skills'::text AS source_table,
         format('cvs:%s:technical_skills:%s', c.id, item.ordinality) AS source_locator
  FROM public.cvs c
  CROSS JOIN LATERAL jsonb_array_elements(c.technical_skills)
    WITH ORDINALITY AS item(value, ordinality)
  UNION ALL
  SELECT 'cvs.languages',
         format('cvs:%s:languages:%s', c.id, item.ordinality)
  FROM public.cvs c
  CROSS JOIN LATERAL jsonb_array_elements(c.languages)
    WITH ORDINALITY AS item(value, ordinality)
)
SELECT a.source_table, count(*) AS unmatched
FROM array_sources a
LEFT JOIN public.career_evidence_legacy_sources l
  ON l.source_table = a.source_table
 AND l.source_locator = a.source_locator
WHERE l.id IS NULL
GROUP BY a.source_table
ORDER BY a.source_table;
```

```sql
SELECT reconciliation_state, count(*)
FROM public.career_evidence_legacy_sources
GROUP BY reconciliation_state
ORDER BY reconciliation_state;
```

```sql
SELECT e.id
FROM public.career_evidence e
LEFT JOIN public.career_evidence_disclosure_policies p
  ON p.id = e.disclosure_policy_id
WHERE p.id IS NULL
   OR p.subject_id <> e.subject_id
   OR p.default_visibility <> 'PRIVATE';
```

The immediate post-backfill result below must be zero. Backfill creates policy handling, not
a recipient authorization:

```sql
SELECT count(*) AS fabricated_backfill_authorizations
FROM public.disclosure_authorizations;
```

```sql
SELECT r.evidence_id
FROM public.career_evidence_revisions r
GROUP BY r.evidence_id
HAVING min(r.revision_no) <> 1
   OR max(r.revision_no) <> count(*)
   OR count(*) FILTER (WHERE r.supersedes_revision_id IS NULL) <> 1;
```

```sql
SELECT p.id
FROM public.cv_projection_items p
JOIN public.cvs c ON c.id = p.cv_id
JOIN public.career_evidence e ON e.id = p.evidence_id
WHERE c.user_id <> e.subject_id;
```

```sql
SELECT r.id
FROM public.career_evidence_revisions r
WHERE (r.verification_state = 'VERIFIED'
       AND (r.source_class <> 'ISSUER_VERIFIED' OR r.source_ref IS NULL))
   OR (r.verification_state = 'CONFIRMED'
       AND (r.source_class <> 'ORGANIZATION_CONFIRMED' OR r.source_ref IS NULL));
```

```sql
SELECT s.id
FROM public.cv_projection_snapshots s
WHERE (s.purpose IN ('APPLICATION', 'PUBLIC_SHARE', 'RECIPIENT_DISCLOSURE')
       AND s.disclosure_authorization_id IS NULL)
   OR (s.purpose IN ('EXPORT', 'PROFILE_PREVIEW')
       AND s.disclosure_authorization_id IS NOT NULL);
```

Re-run all PRE_COUNTS and legacy checksums after backfill. Counts and checksums for existing
tables must be identical.

## 11. DATA_LOSS=0 acceptance rule

`DATA_LOSS=0` only when all conditions are true:

1. Every pre-existing legacy CV row and every JSON array element has exactly one ledger
   source locator.
2. Every source is either linked/deduplicated to evidence or explicitly
   `CONFLICT_NEEDS_REVIEW`, `INVALID_PRESERVED`, or `DEFERRED` with its full source snapshot
   and hash.
3. Legacy row counts and checksums are unchanged.
4. `cv_generations`, application `resume_url` values and all existing CV/Profile rows are
   unchanged.
5. Every existing CV has deterministic sections/items for all linkable facts, with the same
   selection and order as the legacy rendered document.
6. No backfilled revision is `VERIFIED`, `CONFIRMED`, `SOURCED` or `DERIVED` unless an
   independently valid source and authority record existed before the migration. The
   baseline legacy CV/Profile backfill is entirely `SELF_DECLARED`/`DECLARED`.
7. Every evidence root has an explicit same-subject private-by-default disclosure policy;
   backfill creates zero disclosure authorizations.
8. All conflict, invalid and deferred counts are reported; none is hidden as success.
9. Cross-owner, unauthorized recipient and anonymous base-table reads return zero rows.

Any failure means `DATA_LOSS` is not zero and blocks contract/cutover.

## 12. Required disposable/non-production tests

### Database/RLS

- User A can create/read/revise/archive own evidence; User B cannot select or mutate it.
- Private Career Evidence exists with a required disclosure policy and no disclosure
  authorization row.
- Employer, University, Mentor and anonymous roles receive no Career Record access merely
  because of role, affiliation, discoverability or Profile visibility.
- Direct update/delete of revisions and snapshots fails.
- Correction creates revision N+1, preserves N, links predecessor and advances the current
  pointer atomically; stale expected revision fails.
- A declared revision cannot become verified through the owner correction function.
- Revoked/expired evidence is excluded from new projection selection and public reads but
  remains in owner history and existing immutable snapshots.
- Artifact metadata and Storage objects cannot cross subject boundaries; public URLs are
  impossible.
- Projection item insert fails when CV owner and evidence subject differ.
- Projection reorder changes only projection rows; evidence root/revision checksums remain
  identical.
- A new CV/projection is private and creates no disclosure authorization.
- Owner-only export/Profile preview snapshots reject a fabricated authorization.
- Public sharing requires an exact active public authorization.
- Application/Business disclosure requires the exact Business recipient and purpose.
- University disclosure requires the exact University recipient and purpose; affiliation
  alone remains insufficient.
- Every recipient-bound snapshot rejects missing, mismatched, revoked, expired or superseded
  authorization.
- Backfill rerun is idempotent and creates no duplicate roots, revisions, ledger rows or
  projection items.

### Application/domain

- Legacy `CvRecord` remains a compatibility wrapper and is never re-exported/aliased as
  `CareerEvidence`.
- Fact editing from the CV calls create/revise Career Record; formatting, template,
  headings, selection and order do not.
- Missing nullable legacy fields remain missing/null and do not become fabricated strings,
  dates, scores or claims.
- Exact duplicate mapping is deterministic; conflicts create review groups without silent
  precedence mutation.
- Preview resolves current evidence revisions and presentation payloads; snapshot preserves
  the exact revision manifest used at creation.
- Current Profile audience behavior is not expanded during compatibility.
- Optional authorization on private `CareerEvidence` never weakens the mandatory
  authorization check at an actual disclosure boundary.
- Legacy backfill creates a private policy, remains `SELF_DECLARED`/`DECLARED`, and does not
  fabricate authorization or verification.

Required validation after authorized implementation:

- focused Career Record/CV unit and integration tests;
- disposable RLS suite and storage authorization tests;
- `pnpm type-check`;
- `pnpm lint`;
- `pnpm build`;
- scoped Prettier on changed files;
- `git diff --check`.

## 13. Rollback and recovery

EXPAND rollback is recoverable because legacy tables remain authoritative compatibility
inputs and are not modified:

1. Disable new canonical writes with an application feature flag/kill switch.
2. Return reads to legacy CV/Profile paths.
3. Preserve new canonical tables and audit logs for investigation; do not delete evidence
   during incident response.
4. If a disposable environment must be reset, destroy and recreate only that explicitly
   named disposable database.
5. Correct a bad backfill with a new forward migration/batch. Never edit an applied
   migration or mutate immutable revision/snapshot history.
6. Contract rollback re-enables guarded legacy writes only while compatibility tables still
   exist. No drop is authorized in this packet.

Production execution, production SQL, production data writes, deployment, destructive
contract/drop, and main-branch merge are explicitly excluded.

## 14. Frozen post-migration service boundary

After an authorized migration and application implementation, Cursor may rely on these
domain operations; route names may follow repository conventions, but semantics are frozen:

- `listCareerEvidence()` — owner-scoped current facts plus explicit lifecycle/provenance.
- `getCareerEvidence(evidenceId)` — owner-scoped current revision and history.
- `createDeclaredCareerEvidence(input)` — creates only declared self-authored evidence.
- `getCareerEvidenceDisclosurePolicy(evidenceId)` — returns the required current
  private-by-default policy; it is not a recipient authorization.
- `updateCareerEvidenceDisclosurePolicy(evidenceId, expectedPolicyId, input)` — appends an
  audited policy revision; Wave 2 supports only private-by-default handling.
- `reviseCareerEvidence(evidenceId, expectedRevision, input)` — explicit correction with
  lineage; no silent verification carry-forward.
- `setCareerEvidenceLifecycle(evidenceId, action, reasonRef)` — archive/dispute/revoke/expire
  only where authority permits.
- `getCvProjection(cvId)` — presentation state plus selected canonical evidence.
- `updateCvPresentation(cvId, patch)` — title, summary, template, language, section order and
  allowed presentation fields only.
- `setCvEvidenceSelection(cvId, sectionKey, orderedEvidenceIds)` — select/unselect/reorder;
  does not mutate evidence.
- `previewCvProjection(cvId)` — current projection, missing values preserved as missing.
- `authorizeCareerEvidenceDisclosure(input)` — creates C5 authorization only from real
  subject/object scope, recipient, purpose, reviewed basis, lifecycle and retention input;
  it never runs during evidence creation/backfill.
- `resolveAuthorizedCareerEvidenceDisclosure(input)` — returns evidence only when policy,
  exact active authorization and recipient/purpose all permit the disclosure; otherwise
  fails closed and audits the result.
- `createCvSnapshot(cvId, purpose, authorizationRef?)` — immutable purpose-bound snapshot;
  authorization is prohibited for owner-only export/preview and mandatory for application,
  public-share and recipient-disclosure purposes.

No frontend may write the proposed base tables directly or treat legacy CV/Profile records
as canonical evidence. Public/Profile reads remain server-authorized and field-minimized.

### 14.1 Remaining legal/policy dependency

No recipient, legal basis, consent, retention reference or recipient authority is needed or
created merely to store private owner Career Evidence. Before enabling any actual public,
Business, University, Mentor, vendor or other recipient disclosure, the responsible owner
must provide real reviewed basis and retention references for that exact purpose and
recipient. Their values are intentionally not named in this packet. Absence blocks only the
disclosure operation; it does not block non-production authorization of the corrected schema
or private Career Record persistence.

## 15. No-touch confirmation and terminal state

- No Wave 3 Opportunity Graph, Lammah, Radar, Abhathli, Social, Employer Hiring Workspace,
  assessment, University analytics, Government, GCC operations, pricing or billing work is
  included.
- C1–C10 meanings and the three-actor model are unchanged.
- No score, percentage, badge, verification or public state is invented.
- No migration SQL has been created or applied.
- No production system or data has been touched.

**Terminal state:** `READY_FOR_NONPROD_MIGRATION_AUTHORIZATION`
