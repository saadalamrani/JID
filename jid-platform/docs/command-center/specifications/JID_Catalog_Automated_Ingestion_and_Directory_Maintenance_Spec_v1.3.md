# JID Catalog — Automated Organization Discovery, Ingestion, and Directory Maintenance Specification

**Document ID:** JID_Catalog_Automated_Ingestion_and_Directory_Maintenance_Spec_v1.3.md
**Version:** 1.3 (supersedes v1.2 in full)
**Date:** 2026-07-28 (Asia/Riyadh)
**Status:** Specification only. Not an execution order. No code, migrations, branches, execution packs, or implementation sessions are authorized by this document. No implementation SHA is frozen here: Specification 04 is executing separately, and any later execution pack must resolve the then-current tip of `origin/agent/nonprod-signup-fix` only after Specification 04 is complete.
**Governing sources reconciled before writing:** JID_01 and the founder-verified live `jid-nonprod` schema (authoritative for current shipped architecture), JID_Agent_Operating_Constitution.md, JID Constitution Amendment Proposal v0.1, JID_Strategic_Summary_For_Claude_First.md.
**Authority note for current state:** where older Constitution/Amendment prose describes the *current* implementation differently from the later shipped schema, **JID_01 and the live repository/database win**. Constitutional *principles* (Directory ≠ Profile, privacy, data truth, terminology) remain fully binding; only outdated current-state descriptions are superseded.

**Statement labels used throughout:**

- **[CONFIRMED]** — confirmed current product rule (Constitution, Amendment, or founder brief)
- **[PROPOSED]** — proposed design in this specification
- **[VERIFY]** — assumption requiring repository/database verification by the later implementation executor
- **[OPEN]** — open decision requiring founder input
- **[DEFERRED]** — explicitly out of scope for this program

---

## Revision Log — v1.0 → v1.1

Founder-verified live `jid-nonprod` schema corrected a material current-state mismatch in v1.0. Corrections:

- **Header / §1:** current state corrected — production **already** structurally separates Directory (`companies`) from owned Profiles (`business_profiles`, `university_profiles`); `verification_requests` is the current verification table. Authority-of-current-state note added; no-SHA-freeze rule added.
- **§2 (rules 4, 13):** `claim_requests`/`review_claim()` references replaced with `verification_requests`; legacy internal object names containing `claim` are preserved as-is and never renamed in this program; new rule 13 added (shipped schema authoritative for current state).
- **§5:** removed the false "[DEFERRED] creating `business_profiles`/`university_profiles`" item (they exist); replaced with a preserve/never-write constraint.
- **§7:** invariants rewritten around the real schema — mandatory `directory_id UUID NOT NULL` + `UNIQUE(directory_id)` + FK → `companies(id)` `ON DELETE RESTRICT` on both Profile tables; removed the obsolete "production bridge" verification paragraph; nullable-future-link language removed.
- **§13:** a published Directory Record is a row in `companies`; adjacent fact/alias/identifier tables reference `companies(id)`.
- **§15:** publication defined as a controlled, audited write into `companies` through the single boundary only.
- **§19:** merge safety extended for Profile anchoring (`UNIQUE(directory_id)` + `ON DELETE RESTRICT` implications; Profile-anchored records must survive; two Profile-anchored records are never auto-merged).
- **§24:** representative edits target `business_profiles`/`university_profiles` explicitly.
- **§27:** `directory_records` removed as a duplicate publication table — `companies` remains the sole authoritative published Directory table; adjacent tables re-pointed to `companies(id)`; preserved-tables constraint added.
- **§32:** boundary-invariant tests updated to `verification_requests`, `business_profiles`, `university_profiles`.
- **§33:** Phase 1 updated to the resolved publication model.
- **§35:** OD-1 **resolved** (founder decision recorded); OD-4 **resolved** (thresholds calibrated from labeled Phase-1 data as governed configuration, never hardcoded in architecture); OD-2 remains open pending concrete source licensing.
- **§36:** deferred-scope list corrected to protect the four real tables instead of describing Profile tables as future work.
- **§37:** reconciliation checklist rewritten around `companies`, `business_profiles`, `university_profiles`, `verification_requests` (FKs, RLS, triggers, RPCs, read paths), legacy `claim`-named object preservation, and the no-SHA-freeze / post-Spec-04 branch-resolution rule.

---


## Revision Log — v1.1 → v1.2

A second live-schema review identified four execution-safety contradictions and resolved them before implementation:

- **Candidate intake and publication are now separate privileged boundaries.** `ingest_directory_candidate` never writes to `companies`; a distinct staff-authorized `publish_directory_candidate` performs the final audited write. This preserves separation of duties and prevents worker publication.
- **Published `companies` rows are not merged by this program.** The live schema has many operational foreign keys into `companies` (including jobs, applications, communications, subscriptions, Lammah, verification, and Profile anchoring). Phase 1–2 may deduplicate candidates and attach a candidate to an existing `companies` row, but company-to-company duplicate pairs are review-only. Any dependency-aware published-record consolidation requires a separate approved migration specification.
- **The protected-boundary claim is scoped correctly.** Current `companies` policies permit existing staff insert/update paths. This program guarantees that its workers, connectors, review queue, and automated jobs use the protected publication RPC; it does not claim to remove existing manual staff CRUD without a separately approved `companies` RLS hardening task.
- **Built-in Supabase `service_role` is not treated as least privilege.** Workers must use a dedicated restricted role/JWT or an RPC-only server mediator. If the current platform cannot provide that isolation safely, the implementation stops and reports the blocker.
- **Dangerous `companies` defaults are explicitly neutralized.** The live schema currently includes placeholder defaults such as `name='Stub Company'` and `domains='{stub.local}'`. Publication must supply validated explicit values, use an empty domain array when no validated domain exists, and reject any placeholder value. Neutral verification/ownership fields are pinned by the publication RPC and are never accepted from source payloads.
- **Lifecycle and duplicate state remain adjacent.** New catalog lifecycle, supersession, and review state is stored in adjacent ingestion tables; this program does not add lifecycle or merge columns to `companies`.

---

## Revision Log — v1.2 → v1.3

The founder delegated Phase-1 source selection. OD-2 is now resolved with two
complementary pilot sources:

1. **GLEIF Global LEI Index — Saudi legal-jurisdiction subset** for Business
   Directory candidates. Use Level-1 identity/reference data only in the pilot.
   The source record must capture the then-current GLEIF terms, CC0 licence,
   access method, schema version, and retrieval timestamp before the first run.
2. **Saudi Ministry of Education open-data dataset for the geographic
   distribution/listing of higher-education institutions** for University
   Directory candidates. Use the latest machine-readable official export
   available at execution time. Import university/institution-level identities
   only; colleges, institutes, and deanships are evidence for hierarchy and
   classification, not automatically separate Directory Records.

The Ministry's general portal pages may be used for human corroboration, but
the automated pilot must retrieve only from the approved open-data artifact
recorded in the source registry.

Both pilots remain fully human-reviewed. No official website crawling, broad
web discovery, commercial-registration provider, Wikidata enrichment, or
automatic publication is enabled in Phase 1.

---

## 1. Executive Summary

**[PROPOSED]** This specification defines how JID replaces its current manual, AI-list-driven Catalog population workflow with a governed pipeline that discovers, imports, normalizes, enriches, deduplicates, reviews, publishes, refreshes, and retires Directory Records from lawful, approved, traceable external sources.

The core shift is from *"AI writes a list of organizations and staff type it in"* to *"approved sources produce evidence; the system extracts facts with provenance; humans govern anything uncertain; nothing publishes without a real external source behind every field."*

The design is built on four non-negotiable pillars:

1. **Directory Record ≠ owned Profile.** Ingestion never creates, assigns, or implies ownership. **[CONFIRMED]** (Constitution Article 2 — now structurally expressed in the live schema: `companies` vs. `business_profiles`/`university_profiles`.)
2. **Evidence before facts.** Every published field traces to immutable raw evidence from an authorized source. AI output is never evidence for other AI output. **[CONFIRMED as principle via Data-Truth Doctrine, Article 4; PROPOSED as mechanism]**
3. **One ingestion boundary.** All connectors, imports, and staff submissions pass through a single authoritative server-side function; nothing writes directly to published tables. **[PROPOSED]**
4. **Conservative automation.** Automatic merge and automatic publication are earned per-source, reversible, audited, and gated behind explicit confidence dimensions — never a single opaque score. **[PROPOSED]**

**Current-state note [CONFIRMED — founder-verified live `jid-nonprod` schema]:** Production **already structurally expresses** the Directory ≠ Profile constitution: `companies` is the current Directory Record store; `business_profiles` and `university_profiles` exist as separate owned-Profile tables, each with `directory_id UUID NOT NULL`, `owner_user_id UUID NOT NULL`, a `UNIQUE` constraint on `directory_id`, and a foreign key from `directory_id` to `companies(id)` with `ON DELETE RESTRICT`; `verification_requests` is the current verification table (`directory_id` → `companies(id)`, `applicant_user_id`, `resulting_profile_id`, `resulting_profile_type`). Some legacy internal object names may still contain the word `claim`; this program never renames them, and all new design, code, documentation, and visible terminology use **Verification / التحقق** only. Accordingly, **OD-1 is resolved** (§35): `companies` remains the sole authoritative published Directory Record table; no second published organization table is created; ingestion publishes into `companies` exclusively through one protected, auditable, server-side boundary; and the implementation preserves — and never writes to — `business_profiles`, `university_profiles`, or `verification_requests`. Every schema element in §27 remains a proposal to be reconciled against the real repository and database before anything is created.

---

## 2. Confirmed Product Rules

All items in this section are **[CONFIRMED]** and are restated here as binding constraints on every later section:

1. JID has exactly three public actors: Individual, Business, University. Staff and Super Admin are internal roles. No new actor type may be introduced; unclassifiable entities are quarantined, not accommodated by architectural change.
2. A Directory Record is a platform-owned reference entry; an owned Profile is a self-authored identity created only after Verification and only by deliberate action of the verified representative. They are different products with different write authorities (Constitution Article 2).
3. Importing an organization never creates a Profile. Verification proves representation; it does not transfer ownership of a Directory Record. Approval and profile creation are two separate, sequential, intentional events.
4. Visible terminology is **Verification / التحقق**. The words **Claim / مطالبة / استلام** are banned from all *new* UI copy, code comments, function names, and documentation. The current verification table is **`verification_requests`** (`directory_id` → `companies(id)`, `applicant_user_id`, `resulting_profile_id`, `resulting_profile_type`). Legacy constraint or internal object names that still contain the word `claim` are preserved exactly as the repository contains them and are **never renamed by this catalog program**; renames, if ever wanted, are a separate production-safe task. No deletion or structural modification of `companies`, `business_profiles`, `university_profiles`, or `verification_requests` within this program.
5. Registry grammar for Directory surfaces; immersion grammar for Profile surfaces. Never blurred (Constitution Article 2).
6. Data-Truth Doctrine (Constitution Article 4): no fabricated numbers, no missing-data-as-zero, no unexplainable percentages, no invented trends. Every automated decision must carry a human-readable reason.
7. Privacy is enforced server-side and via RLS on the read path. Never fetch-and-hide. Defense in depth: route guards are convenience; RLS is the boundary; privileged writes go through `SECURITY DEFINER` functions with mandatory audit logging (Constitution Article 5).
8. Arabic-first, English localized (not translated). Latin digits everywhere. Zero letter-spacing on Arabic text. All strings through i18n.
9. No Commitment Score, no public trust score, no gold badges, no ranking, no social-feed mechanics, no vanity counters (Constitution Articles 3, 8).
10. University is a confirmed actor, but for the current MVP: staff-managed institutional partnership; **no standalone public University Directory product is built now** — `entity_type='university'` within the existing directory model suffices (Amendment §4). **[VERIFY]** that `companies.entity_type` (or equivalent) exists with a `'university'` value as the Amendment describes.
11. No new dependency without genuine, reported justification. Step 0 discovery is mandatory before any implementation. Conflicts are flagged, never silently resolved.
12. This catalog program is standalone; it must not renumber, reopen, or interfere with locked specifications JID_02–JID_09 or with the currently executing Specification 04. No implementation SHA is frozen in this specification; a later execution pack resolves the then-current tip of `origin/agent/nonprod-signup-fix` only after Specification 04 completes.
13. **JID_01 and the live repository/database state are authoritative for the current shipped architecture.** Older Constitution/Amendment statements describing the current implementation (e.g., "no technical Directory/Profile separation exists") are superseded by the later shipped schema and must not override it. Constitutional principles remain binding.

---

## 3. Problem Statement

**[CONFIRMED as founder-stated problem]** Today, Catalog growth depends on asking an AI model to produce lists of organizations, which staff then manually enter. This workflow is:

- **Slow** — human transcription bottleneck per record.
- **Unverifiable** — an AI-generated list carries no evidence trail; there is no way to prove an organization is real, correctly named, or correctly classified.
- **Inconsistent** — naming, Arabic/English parity, sector taxonomy, and completeness vary per session.
- **Duplicate-prone** — the same organization can enter under its Arabic name, English name, trade name, and legal name with no systematic resolution.
- **Vulnerable to fabrication** — LLMs invent plausible organizations, domains, and identifiers; today nothing structurally prevents a fabricated record from being published.
- **Unmaintainable** — records rot silently; there is no refresh, no change detection, no lifecycle.

**[PROPOSED]** The target system inverts the trust model: AI may only *extract and suggest* over lawfully retrieved source material; it may never *originate* a fact. Every published field is reproducible from stored evidence.

---

## 4. Scope

**[PROPOSED]** In scope for this specification:

- Source registry and source governance (approved / candidate / prohibited).
- Retrieval scheduling, bulk import, staff URL submission, CSV/spreadsheet import.
- Immutable raw-evidence capture and retention governance.
- Extraction, normalization, organization-type classification.
- Entity resolution, duplicate detection, conservative reversible merge.
- Field-level provenance and multi-dimensional confidence.
- Single authoritative ingestion boundary.
- Staff review workspace (design-level).
- Publication paths (auto-high-confidence, human review, reject/quarantine).
- Lifecycle states, change detection, corrections boundary.
- Security (RLS, service-role isolation, hostile-content handling).
- Phased rollout, testing matrix, success metrics.
- Repository-reconciliation checklist for the implementation executor.

---

## 5. Non-Goals

- **[DEFERRED]** Implementing Lammah (لمّاح) or ابحثلي. This spec designs shareable infrastructure boundaries only (§ "Shared Infrastructure Boundary", part of §16/§28 notes and dedicated section below).
- **[DEFERRED]** Any structural change to `companies`, `business_profiles`, `university_profiles`, or `verification_requests` (their columns, constraints, FKs, triggers, or RLS). This program adds *adjacent* ingestion infrastructure only.
- **[CONFIRMED constraint]** `business_profiles` and `university_profiles` **already exist** as separate owned-Profile tables. This program preserves them and **never writes to them** — reading their existence for merge-safety checks (§19) is the only permitted interaction.
- **[DEFERRED]** A standalone public University Directory product (Amendment §4).
- **[DEFERRED]** Self-serve university portal.
- **[CONFIRMED non-goal]** Any Commitment-Score-like public quality number for organizations derived from catalog data.
- **[CONFIRMED non-goal]** Individual-person ingestion. This pipeline handles organizations only; personal data encountered in sources is minimized/stripped (§12, §26).
- **[PROPOSED non-goal]** Real-time ingestion guarantees. The pipeline is batch/scheduled; freshness targets are defined in §34, not as real-time SLAs.
- **[PROPOSED non-goal]** Public API exposure of the ingestion system. Ingestion is internal-only in all phases of this spec.

---

## 6. Actors and Permissions

**[PROPOSED]** Roles in this system (all mapped to *existing* JID internal roles; no new public actor):

| Role | Capabilities in this system |
|---|---|
| **System / service-role workers** | Retrieval, extraction, normalization, candidate creation via ingestion boundary only. No publication authority in Phase 1–2. Never exposed to client. |
| **Staff (catalog reviewer)** | Review queue actions: approve, edit-and-approve, reject, quarantine, merge, link branch/parent, request re-fetch. Cannot manage sources or reverse merges. |
| **Staff (catalog admin / source steward)** | Everything above + source registry management (add candidate source, approve, suspend, set licence state), parser-version reprocessing, merge reversal, dead-letter handling. |
| **Super Admin** | Everything above + publication-policy changes (enabling auto-publication for a source), retention-policy changes, role grants. |
| **Public (all three actors)** | Read published Directory Records only, via existing catalog read paths. May submit a correction suggestion (existing staff-reviewed suggestion-queue pattern, Constitution Article 2). Zero write access to any ingestion table. |
| **Verified representative** | Same as public with respect to Directory data. Their Profile edits never write to Directory Records (§7, §24). |

**[VERIFY]** The exact existing staff-role/permission mechanism (roles table, permission checks, existing `SECURITY DEFINER` audit pattern) must be inventoried in Step 0 and reused — not re-invented (Constitution Article 7: search before building).

**[PROPOSED]** Two staff sub-roles (reviewer vs. admin/steward) are a *proposal*; if the current role system supports only one Staff granularity, Phase 1 may collapse them into one role with the split deferred, reported as a gap rather than hacked in.

---

## 7. Catalog versus Profile Boundary

**[CONFIRMED — Constitution Article 2, now structurally expressed in the live schema]** and restated as testable invariants for this system:

- **INV-1:** No code path in the ingestion system may INSERT, UPDATE, or DELETE rows in `business_profiles` or `university_profiles`, nor set any ownership or representative pointer anywhere. Reading Profile *existence* (whether a `companies` row is anchored by a Profile via `directory_id`) is permitted solely for merge-safety checks (§19).
- **INV-2:** No code path may INSERT, UPDATE, or DELETE rows in `verification_requests`, nor approve, advance, or simulate Verification. When a staff-approved candidate is first published as a new `companies` row, the publication boundary must explicitly pin the neutral initial values required by the current schema (`is_verified=false`, `claimed_by=NULL`, `entity_state='unclaimed'`) and must never accept those fields from retrieved source content. After creation, this program never changes those fields. Ingestion remains upstream of and orthogonal to Verification (التحقق).
- **INV-3:** No Resource, opportunity, subscription, or operational object may be attached to a record created or updated by ingestion. Operational objects anchor to owned Profiles only.
- **INV-4:** Ingestion output is publishable *reference data only*, written to `companies` through the boundary and rendered in registry grammar.
- **INV-5:** The existing mandatory relationship is preserved exactly: `business_profiles.directory_id` and `university_profiles.directory_id` are `UUID NOT NULL`, `UNIQUE`, and FK-bound to `companies(id)` with `ON DELETE RESTRICT`. Ingestion must never break, weaken, orphan, or duplicate this anchoring — concretely: never delete a `companies` row (lifecycle states, not deletion, §23); never retire, merge away, or re-identify a `companies` row that a Profile anchors (§19); never create a second `companies` row intended to represent an organization that already has a Profile-anchored row (duplicate resolution must attach, not fork). Profile creation itself remains exclusively the existing Verification-then-create flow, which records outcomes in `verification_requests` (`resulting_profile_id`, `resulting_profile_type`) — ingestion never participates in it.
- **INV-6:** Catalog read paths never join into or expose private Profile data, drafts, or operational data. `companies` remains reference data; `business_profiles`/`university_profiles` remain the organizations' own voice with their own read authorities.

---

## 8. User Journeys (public-facing)

**[PROPOSED]** Public-facing change is deliberately minimal:

1. **Discover:** An Individual searches the Catalog and finds a real organization imported from an authoritative source. The card shows registry-grammar reference data. A neutral, source-backed short description may appear (§25). Nothing implies the organization has joined JID.
2. **Distinguish states honestly:** A Directory Record that has a corresponding verified organization on JID may show the existing verified indication (whatever production already renders — **[VERIFY]**); an imported-only record shows none. No new badge, score, or tier is introduced. Missing fields simply do not render (Article 4) — never "N/A", never zero.
3. **Suggest a correction:** Any user may open "اقتراح تصحيح" on a Directory Record. The suggestion enters the staff-reviewed corrections queue (§24). It never edits the record directly. Copy uses natural Saudi Arabic; no "claim/مطالبة" vocabulary anywhere.
4. **Representative path (unchanged):** A person representing an imported organization follows the *existing* Verification journey (التحقق). Nothing in this pipeline shortcuts it. After approval they may intentionally create their Profile via the existing flow. The Catalog entry does not change ownership.

**[PROPOSED]** No public "request to add an organization" free-text form in Phase 1–2 (spam/abuse surface); staff-submitted sources cover this. **[OPEN]** whether a public suggestion-to-add path is wanted in Phase 3+ (§35 OD-7).

---

## 9. Staff Journeys

**[PROPOSED]**

1. **Register a source:** Source steward creates a source in `candidate` licence state with identity, jurisdiction, type, retrieval method, and claimed permitted use. Nothing is retrieved until the source is moved to `approved` with a recorded licence/robots decision (§10–11). Approval is audited.
2. **Run a sync:** Steward triggers (or scheduler runs) a sync for an approved source. A `sync_run` is created; retrieval workers capture raw evidence; extraction produces candidates; each candidate passes the ingestion boundary; the run report shows counts (retrieved, extracted, deduped, queued, quarantined, failed) — all real numbers from the run, no estimates.
3. **Review a candidate:** Reviewer opens the review workspace (§21), sees proposed record, evidence, provenance per field, duplicate explanations, confidence dimensions with reasons, and AI suggestions clearly marked as suggestions. Takes one audited action.
4. **Resolve duplicates:** Reviewer sees a side-by-side comparison with the matching evidence that triggered the pairing, and chooses merge / branch-link / parent-link / independent / quarantine.
5. **Handle drift:** Change-detection flags a published record whose source data changed (rename, closure, domain change). Reviewer confirms or rejects the change; history is preserved (§23).
6. **Suspend a failing or legally doubtful source:** Steward suspends; scheduled syncs stop; previously published records remain but their freshness state degrades honestly to `source stale` on schedule (§23).
7. **Reverse a bad merge:** Admin opens the merge event, sees the pre-merge snapshots, and reverses where safe (§19). Reversal is audited.
8. **CSV import:** Steward uploads an approved spreadsheet; the file itself becomes raw evidence; rows flow through the same boundary as any connector — with formula/CSV-injection sanitization (§26). Staff review required for every row in Phase 1.

---

## 10. Source Strategy

**[PROPOSED]** Sources are governed by a registry (§11) and classified into three legal-availability classes. **No source is presented below as confirmed-available; every entry that has not passed a documented licence/robots/terms review is a candidate, full stop.**

### 10.1 Class A — Usable once configured (structure/access already lawful by design, still requires per-source approval record)

**Phase-1 selected source A — GLEIF Global LEI Index (Business):**

- Program scope: Catalog / Business only.
- Retrieval scope: legal-jurisdiction country = Saudi Arabia.
- Pilot fields: LEI, official legal name, registered address, jurisdiction,
  entity status, registration/renewal/update timestamps, and source-record
  identity.
- Level-2 parent relationships are not enabled in the first ingestion run.
- GLEIF identity is authoritative only for entities represented in the LEI
  system; absence from GLEIF never means that a Saudi organization does not
  exist.
- The source steward must store the exact CC0/terms version and access method
  before activation.

**Phase-1 selected source B — Saudi Ministry of Education open data
(University):**

- Program scope: Catalog / University only.
- Use the latest approved machine-readable artifact covering the geographic
  distribution or official listing of higher-education institutions.
- Institution/university rows may become candidates.
- College, institute, branch, and deanship rows remain hierarchy evidence and
  do not automatically become public Directory Records.
- The exact downloadable artifact, update date, licence/terms, field schema,
  and checksum must be recorded before activation.
- If only a general webpage is available and no approved reusable
  machine-readable artifact can be confirmed, do not scrape it; block this
  connector and report the source gap.


- **Staff-submitted source URLs** — official organization websites nominated by staff, retrieved respecting robots policy and terms; used primarily for domain confirmation and contact/enrichment fields, not as sole existence evidence.
- **Approved CSV / spreadsheet imports** — files whose origin and usage rights are documented at upload time (e.g., a partner-provided list under written permission).
- **GLEIF (LEI) data** — published under an open licence intended for reuse; still requires a recorded approval entry confirming the licence version and field scope. **[VERIFY licence at implementation time — do not assume.]**
- **Wikidata** — open structured data; usable strictly as *secondary enrichment and cross-referencing*, never as the sole authoritative source for existence, identifiers, or official domains (community-editable → low authority tier).

### 10.2 Class B — Candidate sources requiring licence / legal / terms review before any retrieval

- Saudi government open-data portal datasets (licence terms per dataset must be recorded individually).
- Licensed Saudi commercial-registration data (Ministry of Commerce / Wathq or equivalent commercial provider) — access is credentialed and contractual; nothing here may be assumed available until an agreement exists.
- Official regulatory and licensing directories (sector regulators).
- Official university directories (Ministry of Education or equivalent listings).
- Approved structured APIs and commercial data providers.

### 10.3 Class C — Prohibited or unsupported

- Any source whose terms prohibit automated retrieval or reuse, until/unless a licence is obtained.
- Social networks and professional networks (terms-prohibited scraping; also identity-fabrication risk).
- AI-generated organization lists as a source. **[CONFIRMED — this is the workflow being retired; AI text is never evidence.]**
- Aggregator/SEO business directories of unverifiable provenance.
- Any source requiring circumvention of authentication, paywalls, rate limits, or robots policy.
- Sources materially containing personal data of individuals (this pipeline is organizations-only).

### 10.4 Authority tiers

**[PROPOSED]**

- **Tier 1 (authoritative):** government registries, regulators, GLEIF — authoritative for legal name, identifiers, legal status, jurisdiction.
- **Tier 2 (official self-published):** the organization's own official website — authoritative for official domain, public contact, self-described specialties (with Tier-1 corroboration of existence).
- **Tier 3 (secondary enrichment):** Wikidata and equivalent — corroboration, aliases, cross-links only; never sole evidence for any mandatory field.
- **Tier 4 (staff-attested):** CSV/staff submissions — authority equals the documented origin of the file/URL, recorded per import.

**[PROPOSED]** Field-level authority: each approved source declares which fields it is authoritative for (§11). A Tier-2 source can never overwrite a Tier-1 value for legal name; conflicts route to review (§20, §23).

---

## 11. Source Registry

**[PROPOSED]** Every source is a governed record with, at minimum:

- `source_key` (stable identity), display names (AR/EN), source owner (organization operating the source), jurisdiction.
- `source_type`: `government_registry | regulator | official_website | structured_api | commercial_provider | open_dataset | csv_import | staff_url`.
- Endpoint identity: URL / API base / feed / file-pattern.
- **Licence state:** `candidate | approved | suspended | prohibited`, with licence name/version, permitted-use notes, retention restrictions, and the reviewing person + date recorded. Retrieval is impossible (enforced in code and DB constraint) unless `approved`.
- Robots-policy result and date checked (for web sources).
- Approved retrieval method: `api | feed | fetch | file_upload` — crawling breadth is per-source-configured, defaulting to narrowest.
- Authentication requirements + credential reference (a secret *name* in the platform's secret manager — never a secret value in the database; **[CONFIRMED — never expose secrets]**).
- Authoritative-field list and supported organization classes (`business`, `university`, or both).
- Refresh cadence, rate limits (requests/min, concurrency, politeness delay), retention restrictions, evidence-expiry rules.
- Operational state: last successful sync, last failed sync, current health (`healthy | degraded | failing | suspended`), active parser version.
- Staff owner, and full approval/suspension history (append-only).

**[PROPOSED]** Adding a source and approving a source are two distinct audited actions by distinct capability checks where role granularity allows.

---

## 12. Raw Evidence Model

**[PROPOSED]** An append-only evidence layer that makes every extraction reproducible:

- Each retrieval produces one evidence object: source ID, sync-run ID, retrieval timestamp, request identity (URL/API call/file name), HTTP metadata where relevant, checksum (SHA-256) of the stored payload, storage pointer, size, content type, parser version present at capture.
- **Immutability:** evidence rows are never updated or deleted by workers; supersession happens by writing a new evidence object. Deletion happens only via retention policy (below), executed by an audited privileged job.
- **Storage:** payloads live in private storage (Supabase Storage private bucket **[VERIFY existing storage conventions]**); the database stores metadata + checksum + pointer. No public access path exists.
- **Sanitization at capture:** payloads are stored as retrieved (for reproducibility) but are *never rendered raw* to staff; the review UI renders a sanitized projection (scripts stripped, styles neutralized, images proxied-or-blocked, links defanged) (§26).
- **Personal-data minimization:** extraction targets organization fields only. If a payload substantially consists of personal data, the candidate is quarantined and the evidence flagged for early deletion review. Public officer/contact names present incidentally in registry payloads are retained only inside the raw payload (not extracted into Directory fields) unless the field is explicitly lawful and appropriate (e.g., a published general public email; personal emails of individuals are not extracted).
- **Retention:** per-source retention restriction from the registry; default proposal — evidence retained while any active fact depends on it, and reviewed for deletion when superseded + N days (**[OPEN]** default N; proposal: 180). Licence-mandated expiry always wins over the default.
- **Reprocessing:** parser upgrades re-run extraction over stored evidence (no re-fetch needed) and produce new candidate facts versioned by parser; original evidence untouched.

---

## 13. Directory Record Model

**[CONFIRMED]** A published Directory Record **is a row in `companies`**. There is no second published organization table.

**[PROPOSED — all field lists below are proposals; the executor must reconcile them against the real `companies` columns before creating anything. Where a listed field does not exist as a `companies` column, it is modeled in the adjacent tables of §27 (facts, aliases, identifiers) referencing `companies(id)` — never as an unapproved `companies` schema change.]**

Every **published** Directory Record must have (mandatory core):

- Stable internal Directory Record ID (`companies.id`).
- Organization type / directory classification: `business` or `university` (no third public class; unclassifiable → quarantine). Sub-classing (e.g., college/institute under university) is taxonomy, not a new actor.
- Canonical display name in at least one language (AR preferred; EN if AR genuinely unavailable from sources — never machine-fabricated AR).
- Country (default focus: SA; non-SA entities allowed only if a source policy explicitly includes them — **[OPEN]** OD-6).
- Lifecycle state + publication state (§23).
- At least one field-level provenance chain to approved-source evidence (§14).
- Last source-confirmation timestamp; confidence status (§20); append-only audit history.

Optional fields (render only when real — Article 4):

- Canonical Arabic name; canonical English name; original legal name; aliases; trade names.
- Sector; industry; specialties (all from the platform's existing taxonomy — **[VERIFY]** existing sector/industry taxonomy tables and reuse them; do not create a parallel taxonomy).
- Region; city; address.
- Official website; official domain (stored normalized, eTLD+1); official phone; public email (organizational addresses only, only where lawful and appropriate).
- Commercial-registration identifier; regulatory licence identifier; LEI or equivalent.
- Parent organization (Directory Record reference); branches (child references).
- Short neutral description (AR/EN), always marked as reviewed if AI-drafted (§25).

**[CONFIRMED]** Do not require fields authoritative sources do not reliably provide. Mandatory-field validation is per-source-class configured, not hardcoded maximalism.

**[CONFIRMED — live-schema safety]** The publication boundary must never rely on placeholder defaults in `companies`. It must provide an explicit validated name, explicitly set `domains` to validated domains or an empty array, reject `Stub Company`, `stub.local`, and equivalent placeholders, and explicitly pin neutral ownership/Verification values. Source payloads cannot supply `is_verified`, `claimed_by`, `entity_state`, subscription, or operational counter fields.

---

## 14. Field-Level Provenance

**[PROPOSED]** Every imported fact (candidate or published) retains:

- Source ID + source URL or source-record identity; retrieval timestamp; evidence object reference (checksum-linked).
- Original value (as extracted) and normalized value.
- Extraction method: `structured_api | parser | ai_extraction | staff_entry | csv_row`.
- Parser or AI model version; transformation history (ordered list of normalization steps applied).
- Authority level (from the source registry, per field).
- Per-fact confidence score **with a human-readable reason** (§20).
- Reviewer decision + reviewer edits (if any), reviewer identity, timestamp.
- Status: `active | superseded`, with supersession pointer.

**Rules:**

- One Directory Record may combine fields from different sources (e.g., legal name ← government registry; official domain ← organization website; sector ← reviewed AI suggestion). Each field carries its own chain.
- **AI-generated text must never become evidence for another AI-generated fact.** Concretely: `ai_extraction` and AI suggestions must cite an evidence object whose extraction method is *not* AI-authored content; the AI-drafted description (§25) is terminal output, never an input to classification, matching, or any other fact. Enforced by boundary validation + test (§32).
- A fact with no resolvable evidence chain cannot reach `active` on a published record. Staff manual entry is itself provenance (`staff_entry`, attributed and audited) but is flagged distinctly and cannot silently masquerade as source-derived.

---

## 15. Candidate-Ingestion and Publication Boundaries

**[PROPOSED]** The program uses two distinct privileged boundaries with separate callers and capabilities. They may be implemented as two `SECURITY DEFINER` RPCs or as one server service exposing two internally separated operations, but they must never collapse worker intake and staff publication into one caller capability.

### 15.1 Candidate intake — `ingest_directory_candidate`

Used by approved connectors, retrieval workers, CSV importers, staff URL submissions, backfills, and parser reprocessing.

It may write only to adjacent source/evidence/candidate/provenance/queue/audit tables. It **never writes to `companies`** and has no publication mode.

It enforces, in order:

1. approved source and permitted program scope;
2. valid sync run and caller identity;
3. schema and payload-size validation;
4. hostile-content sanitization;
5. organization classification;
6. deterministic normalization with transformation history;
7. identifier validation;
8. field-level provenance creation;
9. candidate-to-candidate and candidate-to-`companies` duplicate checks;
10. confidence dimensions and reasons;
11. routing to review, quarantine, or rejection;
12. idempotency on source ID + source-record identity + content checksum;
13. concurrency safety;
14. append-only audit and dead-letter behavior.

### 15.2 Staff publication — `publish_directory_candidate`

Used only after an authorized staff review decision. Workers and connectors cannot execute it.

It must:

- lock and re-read the candidate and its evidence at decision time;
- confirm the source is still approved;
- confirm no unresolved duplicate conflict exists;
- attach to an existing `companies` row when a deterministic identity match exists;
- otherwise create exactly one new `companies` row;
- never create or modify `business_profiles`, `university_profiles`, or `verification_requests`;
- explicitly provide validated `name`, `name_ar`, `domains`, and `entity_type`;
- use an empty domain array when no validated domain exists;
- reject `Stub Company`, `stub.local`, and any equivalent placeholder;
- explicitly pin `is_verified=false`, `claimed_by=NULL`, and `entity_state='unclaimed'` for a newly created row;
- never accept ownership, Verification, subscription, activity, response, ranking, or operational-counter fields from source content;
- write adjacent provenance/source links and one immutable audit event in the same transaction;
- be idempotent and race-safe under concurrent reviewer actions.

### 15.3 Scope of the protected-boundary guarantee

The live `companies` table currently has existing staff insert/update paths. This program guarantees that **all writes originating from catalog ingestion, connectors, automated jobs, and the new review queue** use the publication boundary. It does not silently remove or reinterpret pre-existing manual staff CRUD. Making the boundary globally exclusive for every staff edit would require a separately approved `companies` RLS/grant hardening task.

### 15.4 Worker identity

The built-in Supabase `service_role` must not be described as least privilege. Use a dedicated restricted database role/JWT, or an RPC-only server mediator whose database capability is limited to candidate intake. If the repository cannot provide this safely without broadening access, stop with a documented blocker rather than using a globally privileged service credential.

---

## 16. Job and Queue Architecture

**[PROPOSED]** Minimal, reusable, and reconciled with whatever job infrastructure already exists (**[VERIFY]** — if pg_cron / existing queue tables / Edge Function schedulers are present, reuse; add nothing new without justification, Article 1).

- **Job types:** `source_sync` (scheduled/incremental/backfill), `fetch` (one retrieval unit), `extract`, `resolve` (entity resolution pass), `refresh_record`, `reprocess_parser_version`, `duplicate_reevaluation`, `lifecycle_scan` (staleness/change detection), `retention_scan`.
- **Queue semantics:** at-least-once delivery + idempotent handlers (safe by §15.11); bounded retries with exponential backoff; poison messages → `directory_dead_letters` with payload reference, error class, attempt count.
- **Rate limiting:** per-source token bucket from registry limits; global politeness defaults; concurrency caps per source.
- **Observability:** every run writes a `directory_sync_runs` row with real counts; health rollups feed the source registry's health state. No synthetic metrics.
- **Isolation:** workers run under a least-privilege service role that can call the ingestion boundary and write evidence/queue tables — and nothing else (§29).

### Shared Infrastructure Boundary (Catalog / Lammah / ابحثلي)

**[PROPOSED]** The following layers are designed here as *reusable primitives*: source registry, retrieval workers, raw-evidence storage, provenance pattern, job/queue machinery, source-health monitoring, sanitization library, retry/dead-letter handling.

**[CONFIRMED constraint]** Catalog Directory Records, Lammah external opportunities, and ابحثلي search requests/results remain **separate domain models, separate ingestion boundaries, separate publication rules, and separate RLS policies**. No shared generic "ingested_things" table. Lammah/ابحثلي integration itself is **[DEFERRED]**; this spec only avoids foreclosing it (e.g., the source registry has a `program` scope column so a source approved for Catalog is not implicitly approved for Lammah).

---

## 17. Normalization

**[PROPOSED]**

- **Arabic names:** Unicode NFC; normalize presentation forms; strip tatweel; unify alef variants / ta marbuta / alef maqsura *for matching keys only* — the display name preserves the source's authentic orthography. Never letter-spacing anywhere. Latin digits in any generated display strings.
- **English names:** case-normalized matching keys; legal-suffix canonicalization (Co., Ltd, LLC, شركة, مؤسسة) into structured attributes for matching — display keeps the official form.
- **Domains:** lowercase, strip scheme/`www`, store eTLD+1 + full host; punycode-decoded display, punycode-aware matching (homograph defense, §26).
- **Phones:** E.164 where derivable; otherwise stored raw + flagged non-normalized (never guessed).
- **Identifiers:** format-validated per type (§15.6); whitespace/zero-width stripped.
- **Geography:** map to the platform's existing region/city reference data **[VERIFY existing tables]**; unmappable locations stay as raw strings + review flag — never force-mapped.
- **Every normalization step is recorded** in the fact's transformation history; normalization is deterministic and versioned so reprocessing is reproducible.

---

## 18. Entity Resolution

**[PROPOSED]** Layered matching, strongest evidence first:

**Deterministic keys (exact, validated):** commercial-registration number; regulatory identifier; LEI; official source-record ID; official domain (eTLD+1, with shared-hosting exclusion list).

**Probabilistic signals (scored, explainable):** normalized AR name similarity; normalized EN name similarity; alias/trade-name overlap; organization type agreement; city+country agreement; phone match; parent/branch structural hints from sources.

**Required distinctions (each with an explicit test case, §32):**

- Same organization under Arabic vs. English names → alias unification, one record.
- Trade name vs. legal name → same record, distinct name roles.
- Parent vs. branch → two records linked hierarchically, never merged.
- Separate legal entities with similar names → independent records (deterministic identifier disagreement always beats name similarity).
- University vs. its colleges/institutes → hierarchy within `university` classification, not merges and not a new actor.
- Renamed organization → same record, name history preserved (§23).
- Inactive organization vs. newly registered similarly-named entity → independent records; identifier discontinuity is decisive.
- Duplicate source records vs. independent corroborating evidence → corroboration strengthens confidence on one record; it never auto-creates a second.

---

## 19. Duplicate Resolution and Published-Record Safety

**[PROPOSED]** Duplicate resolution is split by lifecycle stage.

### 19.1 Candidate-to-candidate

Candidates with the same validated deterministic identifier or source identity may be consolidated before publication. Their evidence and facts remain versioned and reversible.

### 19.2 Candidate-to-existing `companies` row

A candidate that deterministically matches an existing Directory Record is attached to that `companies(id)` through adjacent source/fact/provenance rows. No second `companies` row is created.

Profile anchoring is checked read-only. If the matched company is anchored by a Business or University Profile, the existing company remains the canonical record and ingestion may enrich only Directory-owned reference fields through the staff publication decision; it never writes Profile data.

### 19.3 `companies`-to-`companies` duplicate pairs

This program detects and records probable duplicate pairs but does **not** physically or logically merge, re-key, retire, or repoint existing published `companies` rows in Phase 1 or Phase 2.

Reason: the live schema contains numerous operational foreign keys into `companies`, including jobs, applications, communication records, team invitations, subscriptions, Lammah records, verification requests, corrections, screenings, views, audit records, and both Profile tables. The program also forbids DML on several of those domains. A safe published-record merge therefore requires a separate dependency-aware migration and rollback specification.

For a company-to-company duplicate pair, the allowed outcomes here are:

- mark as probable duplicate in an adjacent review table;
- preserve both published rows unchanged;
- attach new evidence to neither row until staff resolves identity;
- quarantine future candidate publication against the pair;
- produce a recommendation for a future dedicated consolidation task.

No automatic or manual company-to-company merge is authorized by this specification.

### 19.4 Thresholds

- deterministic identity match: validated shared legal/regulatory identifier with no conflicting deterministic identifier;
- probable duplicate: governed configuration calibrated from labeled Phase-1 data;
- independent entity: below the review threshold with no deterministic overlap;
- quarantine: conflicting deterministic identifiers, impersonation suspicion, or unresolved identity contradiction.

AI may suggest duplicate candidates with reasons. AI never consolidates rows.

---

## 20. Confidence Dimensions

**[PROPOSED]** No single opaque score. Separate, individually stored and displayed dimensions, each with a machine value + human-readable reason string (AR/EN via i18n):

1. Source authority (from registry tier)
2. Organization authenticity (existence corroboration count/quality)
3. Identifier accuracy (validation results)
4. Name normalization (AR/EN parity, orthography certainty)
5. Organization-type classification (business vs. university certainty)
6. Domain ownership (official-site corroboration, homograph checks)
7. Location accuracy
8. Sector classification
9. Duplicate resolution (certainty that this is one distinct entity)
10. Branch/parent relationship certainty
11. Description quality (only if a description exists; reviewed state)
12. **Publication eligibility** — a derived gate computed from the above per publication policy, itself carrying the list of reasons it passed or failed.

**[CONFIRMED-aligned]** Every automated decision (route to review, quarantine, auto-attach, eligibility fail) must render its reasons to staff in plain language. A confidence value with no reason is a defect. None of these dimensions is ever shown publicly as a score, badge, or ranking.

---

## 21. Moderation and Review (Staff Review Workspace)

**[PROPOSED]** An internal staff surface (existing Staff portal patterns and sidebar preserved — Constitution Article 7; **[VERIFY]** existing Staff shell/components and reuse them) displaying per candidate:

- Proposed Directory Record (all fields, AR/EN, RTL/LTR correct).
- Raw source evidence — *sanitized projection only* (§12, §26) with a link to evidence metadata (checksum, retrieval time, source).
- Field-by-field provenance: source, original → normalized value, transformation history, authority, confidence + reason.
- Matching existing records with duplicate explanations (which signals fired, which conflicted).
- Identifier conflicts, aliases, source authority, all confidence dimensions.
- AI suggestions, visually and semantically labeled as suggestions ("اقتراح آلي — يتطلب مراجعة"), never pre-accepted.
- Recommended action + reasons; history of previous decisions on this candidate/record.

**Actions (each permission-checked and audited):** approve · edit-and-approve (edits become `staff_entry` provenance) · reject · quarantine · merge · link as branch · link as parent · preserve as independent · request re-fetch · disable source (steward/admin) · reverse a prior merge where safe (admin).

**Queue design:** prioritized honestly (age, source authority, publication-eligibility distance); no gamified counters or streaks; empty state renders as a genuine empty state, not decorative stats. Anti-slop review applies to this UI like any other before implementation (operating-mode G workflow), but UI implementation itself is a later, separately-approved step.

---

## 22. Publication Rules

**[PROPOSED]** Three paths:

### Path 1 — High-confidence automatic publication (Phase 3+ only, per-source policy)

All required simultaneously:

- Source is approved AND explicitly flagged `auto_publication_allowed` by Super Admin for this source (default false forever until flipped).
- Stable authoritative identifier present and validated.
- Valid `business`/`university` classification with high classification confidence.
- Zero unresolved duplicate conflict.
- All mandatory fields valid with clean provenance.
- Publication-eligibility gate passes with reasons recorded.
- Measured precision of this source's prior human-reviewed candidates meets the target in §34 before the flag may be enabled (evidence-based enablement, not optimism).

### Path 2 — Human review (default for everything in Phases 1–2)

Mandatory for: probable duplicates; missing authoritative identifier; conflicting names; unclear business/university classification; branch/parent ambiguity; conflicting location or status; medium confidence on any gate dimension; **first N candidates of any new source or new parser version** (proposal: N = all of Phase 1, then 100 per new source/pattern).

### Path 3 — Reject or quarantine

Mandatory for: prohibited/suspended source; fabricated or evidence-less organization; unsupported evidence; unresolved identity conflict; suspected impersonation (§26); malicious content; invalid/homograph domain; prohibited personal data; entity incompatible with the business/university model (quarantined for human decision, never auto-shoehorned — **[CONFIRMED]** no new actor type).

Quarantine preserves everything (evidence, facts, reasons) for later human resolution; reject is terminal but audited and evidence-retained per retention policy.

---

## 23. Lifecycle and Change Detection

**[PROPOSED]** Candidate states are stored in adjacent ingestion tables: `candidate → under_review → approved/published`, with holding states `quarantined` and `rejected`. Source freshness and change states such as `source_stale`, `source_conflict`, `renamed`, `inactive`, `closed`, and `superseded` are also stored in adjacent lifecycle/fact tables unless an existing `companies` field is explicitly reconciled and approved for reuse. This program adds no lifecycle or merge column to `companies`. Every transition is a `directory_lifecycle_events` row containing actor and reason.

**Change detection targets:** new registrations; name changes; identifier changes; licence changes; official-domain changes; address changes; sector changes; branch changes; closure/inactivity; disappearance from a source; conflict between previously agreeing trusted sources.

**Rules:**

- **[CONFIRMED-aligned]** Never delete a Directory Record because it disappeared from one source. Disappearance → `source_stale` on the affected facts; corroborated closure from an authoritative source → `inactive`/`closed` via review (auto only in Phase 3+ for Tier-1 sources with policy enabled).
- Historical names, superseded facts, provenance, and audit history are preserved permanently (subject only to licence-mandated evidence expiry, which expires *evidence payloads*, never the audit trail or fact history metadata).
- Detected changes on published records route through review by default; the public record continues showing the last-confirmed state until a decision (no flapping).
- `source_stale` is an internal freshness state; publicly it renders, at most, as an honest "آخر تأكيد من المصدر" timestamp if the founder approves showing it (**[OPEN]** OD-8) — never as a warning badge that shames the organization.

---

## 24. Corrections Boundary

**[PROPOSED]** Four correction channels, strictly separated:

1. **Automated source refresh** — new evidence supersedes old facts via the normal pipeline (review-gated per §23).
2. **Staff correction** — direct edit in the workspace; becomes `staff_entry` provenance; audited.
3. **Public correction submission** — suggestion queue only (Constitution Article 2's staff-reviewed suggestion pattern — **[VERIFY]** whether an equivalent queue already exists and reuse it). A public correction **never** directly overwrites Directory data, regardless of who submits it.
4. **Verified representative Profile edits** — edit their own `business_profiles` / `university_profiles` row, never the `companies` row it anchors. A Profile owner does not gain Directory write access or ownership; if their Profile data contradicts Directory data, that may generate a *suggested correction* into channel 3 for staff review (**[OPEN]** OD-9 whether to build this bridge in Phase 2 or defer).

All channels retain evidence/attribution, review state, and audit history.

---

## 25. AI Responsibilities and Restrictions

**[PROPOSED, with confirmed constraints marked]**

**AI may (always over approved-source evidence, always producing suggestions with per-field confidence + reasons):** extract structured fields; suggest AR/EN name normalization; classify sector/industry/specialties against the existing taxonomy; detect possible duplicates; suggest parent/branch relationships; draft a short neutral registry-grammar description (AR original, EN localized — never translated literally; no marketing language); summarize source conflicts for reviewers; prioritize the review queue; flag suspicious/malformed content.

**AI must never [CONFIRMED-aligned]:** invent organizations, legal identifiers, official domains, addresses, or contact information; mark anything verified; create or touch a Profile; publish unsupported facts; overwrite an authoritative value without a governed decision; merge records outside the approved confidence boundary; **follow instructions embedded inside retrieved source content** (§26); fill a missing field by guessing (missing stays missing — Article 4).

**Model governance:** model + prompt version recorded on every AI-derived fact (§14); extraction runs with structured-output constraints; AI receives sanitized, size-bounded content only; AI-drafted descriptions require staff review before first publication of the record and are marked reviewed; description text is terminal — excluded from matching, classification, and any downstream evidence chain.

---

## 26. Source-Content Security

**[PROPOSED]** All retrieved content is hostile data.

- **Prompt injection / hidden instructions:** retrieved content enters extraction as inert quoted data within a fixed instruction frame; system instructions never interpolate source text; extraction output is schema-validated — free-text fields that look like instructions ("ignore previous…", tool-call syntax) are flagged and quarantined. Hidden text (zero-width chars, off-screen HTML, white-on-white, HTML comments, alt/meta stuffing) is stripped/flagged during sanitization *before* AI sees content.
- **Malicious HTML / scripts:** server-side sanitize; staff UI renders sanitized projections only; CSP on the review surface; no inline script execution ever; images blocked or proxied.
- **Unsafe redirects / SSRF:** fetch workers use an allow-listed egress path; block redirects off the approved host set; block private/link-local IP ranges and cloud metadata endpoints; cap redirect depth.
- **Forged domains / impersonation:** punycode/homograph detection; newly-seen domain for a known organization → conflict, never silent overwrite; domain facts require corroboration rules per §10.4.
- **Malicious files:** type sniffing (not extension trust), size caps, archive-bomb protection, no execution of any fetched content, malware scan hook where infra provides one **[VERIFY]**.
- **CSV / spreadsheet injection:** cells beginning with `= + - @ \t \r` are defused on import *and* on any export; formulas never evaluated.
- **Oversized/malformed payloads:** hard size/time/depth caps at fetch and parse; failures → dead letters, never partial silent writes.
- **Data-exfiltration instructions in content:** workers have no outbound channels except approved fetch targets and the ingestion boundary; content can never cause a request to an attacker-chosen destination because destinations come only from the source registry.
- **Tracking content:** strip tracking params/pixels from stored projections; fetch with minimal, honest client identity per source policy.

---

## 27. Database Proposal

**[PROPOSED — names and shapes are proposals only. Do not assume equivalent tables do not already exist; the implementation executor must reconcile every item against the live repository and database (§37) before creating anything.]**

**[CONFIRMED constraints]** `companies` remains the sole authoritative published Directory Record table — no `directory_records` or any second published organization table is created. All published fact/provenance/alias/identifier tables below reference `companies(id)`. This program performs **zero DDL and zero DML** against `business_profiles`, `university_profiles`, and `verification_requests`, and never renames legacy internal objects whose names contain `claim`.

| Table | Purpose (minimum safe shape) |
|---|---|
| `directory_sources` | Source registry (§11): identity, type, licence state, tiers, cadence, limits, health, staff owner, `program` scope. |
| `directory_source_fields` | Per-source authoritative-field declarations + per-field authority. |
| `directory_sync_runs` | One row per run: source, type (scheduled/backfill/refresh), timestamps, real counts, outcome, error summary. |
| `directory_raw_evidence` | Append-only evidence metadata: source, run, request identity, checksum, storage pointer, content type, size, parser version at capture, retention marker. |
| `directory_import_candidates` | One candidate organization per (source-record, content version): state, classification, routing outcome, idempotency key. |
| `directory_candidate_facts` | Field-level extracted facts on candidates with full provenance (§14). |
| `directory_record_aliases` | Name roles for published records: legal, trade, AR, EN, historical, with provenance refs. FK → `companies(id)`. |
| `directory_record_identifiers` | Typed identifiers (CR, regulator, LEI, …), validation state, uniqueness constraints per type. FK → `companies(id)`. |
| `directory_record_facts` | Active + superseded field-level facts on published records with provenance. FK → `companies(id)`. |
| `directory_source_links` | `companies(id)` ↔ source-record bindings (supports multi-source corroboration + disappearance detection). |
| `directory_duplicate_candidates` | Pairwise duplicate propositions (candidate↔candidate, candidate↔`companies(id)`, or review-only `companies(id)`↔`companies(id)`): signals fired, governed threshold version, Profile anchoring, operational-reference warning, state, resolution. |
| `directory_candidate_merge_events` | Reversible pre-publication candidate consolidations only. This program creates no published-company merge event because company-to-company consolidation is deferred. |
| `directory_review_queue` | Review items: candidate/change/duplicate refs, priority inputs, assignment, decision, reasons. |
| `directory_lifecycle_events` | Append-only state transitions with actor + reason. |
| `directory_audit_events` | Append-only audit of every privileged/system action (or integrate with the platform's existing audit table — **[VERIFY]**, prefer reuse). |
| `directory_dead_letters` | Failed units: payload ref, error class, attempts, resolution state. |

Cross-cutting: FKs with `ON DELETE RESTRICT` (history is never cascaded away); `created_at/updated_at` in UTC stored, Asia/Riyadh rendered; partial unique indexes for idempotency keys; no column stores secret values (secret *names* only); every table gets RLS (§29); every DDL change is followed by a security-advisor check (**[CONFIRMED]** per this program's requirements).

---

## 28. APIs and Background Jobs

**[PROPOSED]**

- **Internal privileged surface only** (service role + staff sessions; no public API): `ingest_directory_candidate` (the boundary, §15); staff review RPCs (one per action in §21, each `SECURITY DEFINER` + permission check + audit per the platform's established pattern — **[VERIFY]** and reuse the pattern); source-registry management RPCs; merge/reverse-merge RPCs; re-fetch and reprocess triggers.
- **Background jobs** (§16): scheduled syncs per source cadence; lifecycle/staleness scan (daily proposal); duplicate re-evaluation on new evidence; retention scan; parser-version reprocessing; source-health rollup.
- **Public read paths:** the existing Catalog read routes continue to serve published records; this program adds no public write endpoint and no public ingestion visibility. Any public rendering change (e.g., last-confirmed timestamp) is a separate approved UI task.

---

## 29. RLS and Authorization

**[PROPOSED, applying the confirmed defense-in-depth doctrine]**

- **RLS enabled on every table in §27.** Default deny.
- **Public role:** SELECT only on published Directory Records/facts/aliases via the existing read model; zero visibility into sources, evidence, candidates, queues, dead letters, merge events, audit.
- **Staff roles:** all writes introduced by this program use permission-checked, audited `SECURITY DEFINER` RPCs. Existing manual staff CRUD on `companies` remains outside this specification and must not be misrepresented as removed. A future globally exclusive write boundary requires a separate RLS/grant hardening approval.
- **Worker identity:** use a dedicated restricted role/JWT or an RPC-only server mediator. The worker may execute candidate intake and write only the adjacent evidence/run/queue domain; it has no publication capability and no direct `companies` write.
- **Built-in service-role isolation:** the Supabase `service_role` credential remains server-side and is never exposed, but it is not considered a least-privilege worker identity. Do not use it directly for connector code unless the reconciliation proves an equivalent narrow mediation layer.
- **Never weaken existing RLS** on `companies` or any other table to make ingestion convenient (**[CONFIRMED]**). If an existing policy blocks a legitimate need, stop and report (Article 12), don't loosen.
- Immutable audit: audit/lifecycle/evidence tables have no UPDATE/DELETE grants for any non-superuser role; retention deletion runs as an audited privileged job.
- Rate limiting, idempotency, concurrency safety, retry boundaries, dead letters, rollback, reversible merges, data retention/minimization, and privacy review are specified in §12, §15, §16, §19, §31 and are treated as security requirements, not conveniences.

---

## 30. Audit and Observability

**[PROPOSED]**

- Every privileged action, routing decision, publication, merge, reversal, source approval/suspension, and retention deletion produces an append-only audit event with actor (human or job identity), timestamp, target, reason.
- Sync-run dashboards for staff show *real* counts only (retrieved/extracted/queued/published/failed) — no projections, no decorative charts, no trend lines without a genuine historical snapshot mechanism (Article 4).
- Source health derives from actual run outcomes; alerting thresholds (consecutive failures, error-rate) route to the staff owner.
- Every published field is drillable: staff can navigate value → fact → evidence → source in the workspace (Article 4's drillability, applied internally).

---

## 31. Failure and Retry Handling

**[PROPOSED]**

- Transient fetch/parse failures: bounded exponential-backoff retries within the run; exhaustion → dead letter with full context.
- Dead letters are first-class staff work items: inspect, re-drive after fix, or annotate-and-close; never silently purged.
- Partial-run failure never leaves half-written candidates: candidate + facts write transactionally through the boundary.
- Parser regressions: reprocessing runs against stored evidence in shadow mode first (results compared, not applied) before replacing active facts — a rollback-by-design posture.
- Source outage: health degrades; scheduled syncs pause after threshold; published records age into `source_stale` per policy rather than erroring publicly.
- Every destructive-looking operation (retention deletion, merge) has a defined reversal or preservation guarantee stated in this spec; anything without one is prohibited.

---

## 32. Testing Matrix

**[PROPOSED]** Minimum required coverage (each item = at least one automated test; security items also get adversarial fixtures):

**Governance/boundary:** source authorization enforced; licence-state enforcement (candidate/suspended/prohibited all rejected); disabled-source rejection mid-queue; ingestion-boundary enforcement (direct INSERT into published tables denied for worker + staff + anon roles); publication impossible from worker role in Phases 1–2.

**RLS/security:** RLS default-deny on every new table per role; service-role isolation; secret values never present in DB rows; prompt-injection fixtures (hidden text, instruction-bearing content) neutralized; malicious HTML sanitized; unsafe redirect + SSRF targets blocked; CSV/XLSX formula injection defused on import and export; oversized/malformed payloads dead-lettered.

**Pipeline correctness:** idempotent re-ingestion (same checksum → no-op); concurrent ingestion of the same source record (single candidate); authoritative-identifier candidate duplicate → deterministic consolidation; candidate-to-existing-company deterministic attach; AR/EN alias duplicate unified before publication; similar names + different identifiers stay independent; parent vs. branch linked not merged; business vs. university classification; unsupported organization type → quarantine; reversible candidate-merge round trip; AI-suggested duplicate cannot consolidate without review; company-to-company duplicate pair creates a review record and performs zero DML on either company or any referencing table.

**Lifecycle:** source conflict routing; source disappearance → stale (record not deleted); rename preserves history; closure handling; change detection on identifier/domain/address.

**Boundary invariants (INV-1…6, §7):** Profile non-creation and non-modification; no `verification_requests` writes; explicit neutral values on new `companies` rows; source payload cannot set Verification/ownership fields; placeholder defaults are rejected; mandatory Profile anchors remain unchanged; company-to-company duplicate detection performs zero merge/re-key DML; draft and private Profile data remain absent from Catalog reads.

**Operations:** staff permission matrix per action; audit immutability (UPDATE/DELETE denied); corrections review path (public suggestion cannot mutate records); retry and dead-letter behavior; rollback/shadow reprocessing; retention deletion audited.

**Localization:** Arabic and English display parity for record fields, reasons strings, and review UI; RTL/LTR; Latin digits; zero letter-spacing on Arabic (lint/visual gate).

---

## 33. Phased Rollout

**[PROPOSED]**

**Phase 1 — Foundations, human-gated (no automation trust):**
Reconcile current schema against this design (§37); publication per resolved
OD-1 — approved candidates publish into `companies` only through the protected
boundary, staff-approved, one by one; create source registry; add raw evidence,
provenance, candidate intake, staff publication boundary, review queue, dead
letters, and audit.

The only Phase-1 source programs are:

- **Business pilot:** GLEIF Global LEI Index, Saudi legal-jurisdiction subset,
  Level-1 reference data.
- **University pilot:** latest approved machine-readable Ministry of Education
  open-data artifact covering higher-education institutions.

Every candidate requires staff review. Duplicate handling is deterministic
only. There is zero automatic publication, no broad crawling, no official-site
enrichment, and no third source.

**Phase 2 — Assisted quality:**
Probabilistic entity resolution with labeled tuning data from Phase 1; AI-assisted extraction/normalization/classification as suggestions; reversible candidate-consolidation workflow; candidate-to-existing-company attachment; company-to-company duplicate pairs remain review-only; incremental sync; source-health monitoring; confidence-gated review prioritization. Still no auto-publication.

**Phase 3 — Earned automation:**
Additional approved connectors; high-confidence auto-publication for narrowly approved sources that met Phase-2 precision targets (§34), flag per source by Super Admin; change detection + lifecycle automation for Tier-1 corroborated events; record-refresh tooling; measured reduction of staff review load (measured, not assumed).

**Phase 4 — Breadth:**
Monitored sector/geographic discovery; broader lawful source coverage; advanced branch/parent resolution; hardening the shared retrieval infrastructure for *later, separately-specified* Lammah reuse (**[DEFERRED]** integration itself).

Each phase ends with: verification results, security-advisor check after any DDL, and a Handoff report; the next phase starts only on founder approval.

---

## 34. Success Metrics

**[PROPOSED targets — all measured from real system data; if the measurement mechanism doesn't exist yet, the metric is reported as "not yet measurable", never estimated (Article 4). Initial targets are starting points to be recalibrated after Phase 1 evidence.]**

| Metric | Phase-2 exit proposal | Phase-3 steady proposal |
|---|---|---|
| Valid Directory Records imported / week | ≥ 100 | ≥ 500 |
| % published records with ≥1 authoritative identifier | ≥ 80% | ≥ 90% |
| % published fields with field-level provenance | 100% (hard invariant) | 100% |
| Duplicate publication rate (dupes per 1,000 published) | ≤ 5 | ≤ 2 |
| False candidate-consolidation rate (per 1,000) | ≤ 2, all reversed | ≤ 1 |
| Median reviewer time per candidate | ≤ 3 min | ≤ 90 s |
| Auto-publication precision (sampled audit) | n/a | ≥ 99% |
| % published records `source_stale` | ≤ 20% | ≤ 10% |
| Source-sync success rate | ≥ 95% | ≥ 98% |
| Source failure recovery time (median) | ≤ 48 h | ≤ 24 h |
| Unsupported-fact rate on published records (sampled) | 0 (hard invariant) | 0 |
| AI suggestion acceptance rate (informational quality signal) | tracked, no target gaming | ≥ 70% before widening AI scope |
| Correction resolution time (median) | ≤ 7 days | ≤ 3 days |
| % records confirmed by >1 source | ≥ 30% | ≥ 60% |
| % records requiring manual rework post-publication | ≤ 10% | ≤ 5% |

---

## 35. Open Decisions

- **OD-1 [RESOLVED — founder decision, v1.1]:** `companies` remains the authoritative published Directory Record table. No second published organization table (no `directory_records`) is created. New catalog-ingestion infrastructure is limited to adjacent tables (sources, sync runs, raw evidence, import candidates, candidate facts, provenance, duplicate candidates, review queues, merge events, lifecycle events, audit events, dead letters). Approved candidates publish into `companies` only through one protected, auditable, server-side ingestion/publication boundary. The implementation preserves — and never writes to — `business_profiles`, `university_profiles`, or `verification_requests`.
- **OD-2 [RESOLVED — founder-delegated selection, v1.3]:** Phase 1 uses:
  1. GLEIF Global LEI Index, filtered to entities whose legal jurisdiction is
     Saudi Arabia, using Level-1 reference data for Business candidates.
  2. The latest machine-readable Saudi Ministry of Education open-data dataset
     covering the geographic distribution/listing of higher-education
     institutions, using institution-level rows for University candidates.

  Before retrieval, the reconciliation session must record the exact source
  URL/artifact, licence/terms version, schema or file version, permitted use,
  retention conditions, update cadence, and checksum strategy. If the Ministry
  artifact cannot be located in an approved machine-readable form or its reuse
  conditions cannot be recorded unambiguously, the University connector is
  blocked while the GLEIF pilot may proceed alone. Phase 1 enables no other
  source.
- **OD-3 [OPEN]:** Evidence retention default N days after supersession (proposal 180) and whether licence expiry auto-deletes or queues for steward confirmation.
- **OD-4 [RESOLVED — founder decision, v1.1]:** Duplicate thresholds are calibrated from labeled Phase-1 review data and stored as governed, audited configuration (per-source-adjustable, change-logged) — never permanently hardcoded in the architecture or in this document. The numeric values in §19 are illustrative starting points for calibration only.
- **OD-5 [OPEN]:** Staff role granularity (reviewer vs. steward/admin) vs. current role system capability.
- **OD-6 [OPEN]:** Non-SA organizations in scope at all, and if so under which source policies.
- **OD-7 [OPEN]:** Public "suggest an organization" path in Phase 3+.
- **OD-8 [OPEN]:** Whether to publicly render "آخر تأكيد من المصدر" freshness timestamps.
- **OD-9 [OPEN]:** Profile-vs-Directory contradiction bridge (auto-generated suggested corrections) in Phase 2 or deferred.
- **OD-10 [OPEN]:** Where descriptions are AI-drafted, whether EN localization requires a second human review or one bilingual review suffices.
- **OD-11 [RESOLVED — v1.2]:** candidate intake and staff publication are separate privileged operations; workers cannot publish.
- **OD-12 [RESOLVED — v1.2]:** existing published `companies` rows are not consolidated by this program. Company-to-company merge/re-key work requires a separate dependency-aware migration specification.
- **OD-13 [RESOLVED — v1.2]:** the program's protected-boundary guarantee applies to ingestion-originated writes. Existing manual staff CRUD is preserved until a separate `companies` RLS/grant hardening decision.
- **OD-14 [RESOLVED — v1.2]:** built-in `service_role` is not used as the least-privilege connector identity; a dedicated restricted role/JWT or RPC-only mediator is required.


---

## 36. Deferred Scope

**[DEFERRED]** Lammah ingestion/integration; ابحثلي integration; any structural change to `companies`; global removal of existing manual staff insert/update paths; dependency-aware consolidation/re-keying of existing published `companies` rows; any DDL/DML against `business_profiles`, `university_profiles`, or `verification_requests`; renaming legacy `claim`-named objects; self-serve university portal; standalone public University Directory product; public ingestion API; real-time ingestion; organization quality/engagement analytics; public freshness/quality badges beyond OD-8; enrichment beyond registry-grammar reference data.

---

## 37. Repository-Reconciliation Checklist (for the later implementation executor)

**[PROPOSED — mandatory Step 0 before any DDL, code, or Cursor pack. Produce a written reconciliation report; do not proceed on assumption.]**

1. Inventory the real `companies` schema: exact columns, constraints, indexes, triggers, RPCs, RLS policies, and public read paths. Confirm the exact business/university classification mechanism as shipped.
2. Inventory `business_profiles` and `university_profiles`: confirm `directory_id UUID NOT NULL`, `owner_user_id UUID NOT NULL`, `UNIQUE(directory_id)`, FK → `companies(id)` `ON DELETE RESTRICT`, plus their triggers, RPCs, RLS, and read paths. Confirm this program's per-role write denial to both tables.
3. Inventory `verification_requests`: confirm `directory_id` → `companies(id)`, `applicant_user_id`, `resulting_profile_id`, `resulting_profile_type`, its FKs, RLS, triggers, and the RPCs of the verification flow. Confirm this program's per-role write denial to it.
4. Inventory legacy internal object names containing `claim` (constraints, functions, indexes, policies); record them; confirm the plan renames none of them and introduces no new Claim terminology anywhere.
5. Search for any existing equivalents of every table in §27 (sources, evidence, audit, queues, dead letters, sync runs) — including generic platform audit tables and job infrastructure (pg_cron, Edge Function schedulers, queue tables). Reuse before creating; justify any new table against what exists.
6. Inventory the existing sector/industry/specialty taxonomy tables and the region/city reference data; confirm reuse (§13, §17).
7. Inventory the existing `SECURITY DEFINER` + audit-logging pattern for privileged writes and the existing staff permission mechanism; match them exactly (§28–29).
8. Inventory the existing Catalog read paths/routes/components that render organizations publicly; confirm the proposed publication model feeds them without breaking any route (Never-Break List).
9. Inventory the existing staff-reviewed public suggestion/corrections queue, if any (§24).
10. Confirm Supabase Storage conventions for private buckets and how existing features store non-public files (§12).
11. Confirm secret-management convention for connector credentials (names in DB, values in the platform's secret store only).
12. Confirm current feature-flag mechanism (`feature_flags` — noting the Amendment's production-priority clause about it) and whether ingestion surfaces should be flag-gated at launch. **[VERIFY the production `feature_flags` situation before scheduling any Phase-1 work; the Amendment makes production fixes the absolute first priority over this program.]**
13. Qualify the two selected Phase-1 sources:
    - GLEIF Global LEI Index: record the current terms/CC0 notice, access
      method, Level-1 schema version, Saudi filter semantics, delta/full-file
      options, and expected volume.
    - Saudi Ministry of Education: identify the exact latest machine-readable
      higher-education-institutions artifact, record its licence/reuse terms,
      update date, schema, stability, and whether institution-level rows can be
      separated safely from colleges/institutes/deanships.
    Do not write retrieval code in this session. If either source cannot be
    qualified, report the exact blocker; GLEIF and Ministry connectors are
    independently gateable.
14. Confirm pnpm scripts (`lint`, `type-check`, `test`, `build`) and CI expectations that any later implementation must pass.
15. After any eventual DDL: run the database security advisor and include results in the Handoff.
16. Confirm Specification 04's execution status; only after its completion, resolve the then-current tip of `origin/agent/nonprod-signup-fix` as the base for any execution pack. Never freeze a SHA inside a specification document.
17. Enumerate every current foreign key, trigger, RPC, route, background job, and policy that references `companies`. Treat the list as execution-time data; do not rely on the earlier snapshot.
18. Inspect current `companies` defaults and confirm the publication RPC never relies on placeholder values such as `Stub Company` or `stub.local`.
19. Inspect current `companies` RLS/grants. Record existing manual staff insert/update paths and prove the new ingestion workers cannot use them.
20. Prove the chosen worker credential is actually least privilege. The built-in Supabase `service_role` alone is not sufficient evidence.
21. Confirm lifecycle, freshness, duplicate, and supersession state is stored in adjacent tables and does not require new `companies` columns.
22. Deliver the reconciliation report to the founder; **stop and await approval** before creating anything.

---

**END OF SPECIFICATION — v1.3**