# JID Catalog — Final Shipping Specification v1.0
## Staff Review Workspace + GLEIF Automation + Non-Production Pilot + Phase-1 Closeout

**Document ID:** JID_Catalog_Final_Shipping_Specification_v1.0.md
**Date:** 2026-08-01 (Asia/Riyadh)
**Status:** Final Catalog Phase-1 specification. Implementation-ready for one bounded Codex shipping wave. No further Catalog Phase-1 specification, discovery report, audit task, readiness assessment, or closeout session exists after this document.

**Authoritative baseline (founder-verified):**

- Repository: `saadalamrani/JID`
- Canonical branch: `agent/nonprod-signup-fix`
- Current canonical SHA / Completed Catalog Foundations commit: `6c48ffc3501e1a4c3420dc6c69122a19d7af5855`
- Approved non-production Supabase: `jid-nonprod` (`hmjuijmaefajdjrjdsxu`)
- Approved non-production application: `https://jid-dev.vercel.app`
- Frozen production candidate (unrelated to Catalog, untouched): `39fc3066e94a81ee22eb79ddff7a62d6521d1290`
- Historical mirror (never modify): `agent/nonprod-signup-form` @ `b29846b644ab2d94ec1d88b3a0954f2f30276452`

**Inspection provenance (honesty note):** this specification was authored from the founder-verified baseline above, the completed-Foundations inventory, JID_01, Catalog Spec v1.1, and the approved Phase-1 decisions — not from a fresh file-level repository read. Therefore the Codex wave **begins** by reading the mandatory source files (Constitution, `JID_CATALOG_FINAL_BASELINE_AND_PHASE1_DECISION.md`, `JID_CATALOG_PHASE1_FOUNDATIONS_REPORT.md`, `JID_CATALOG_PHASE1_FOUNDATIONS_DISPOSABLE_DB_TRANSCRIPT.md`, `JID_MASTER_EXECUTION_LEDGER.md`, current Catalog migrations + generated types, Staff auth/MFA, Staff routes/navigation, `companies` schema/queries, Profile/Verification schemas and RPCs, feature-flag system, audit infrastructure, cron/worker/Edge Function/Vault/server-runtime patterns) **inside the same wave** as bounded verification of the file map (§17) and runtime selection inputs (§3). This is verification against a written spec, not re-architecture, not a separate discovery task. Where the repository contradicts a mechanical detail here, the repository wins and the deviation is recorded in the implementation report. Where it contradicts a binding product rule here, Codex stops with `ONE_EXACT_BLOCKER`.

**Completed Foundations — preserved exactly, never redesigned:** `directory_sources`, `directory_sync_runs`, `directory_raw_evidence`, `directory_import_candidates`, `directory_candidate_facts`, `directory_review_queue`, `directory_dead_letters`; worker candidate-intake RPC; authenticated Staff/Super Admin publication RPC `public.publish_directory_candidate(uuid)`; forced RLS; `catalog_worker` capability role; dedicated NOLOGIN/NOBYPASSRLS function owner; fixed function search paths; immutable audit integration; idempotency and concurrency protection; default-off `catalog.phase1_ingestion`; no Profile writes; no Verification writes; no Directory ownership assignment; no automatic publication. The Advisor warning `authenticated_security_definer_function_executable` on `public.publish_directory_candidate(uuid)` is a founder-accepted decision and is **not reopened**.

**Binding architecture (restated, enforced throughout):** `companies` is the only published Directory store; Directory is not owned and is not a Profile; Verification is separate; Catalog cannot create/approve Verification, cannot create/publish Business or University Profiles, cannot assign ownership, cannot write `claimed_by`; no `directory_records` table; no automatic Directory publication; no fourth public actor; worker identities are internal technical identities only; public Catalog shows only approved Directory records and already-supported published Profile projections; no fabricated metrics, confidence percentages, descriptions, Arabic names, domains, sectors, or URLs.

**Phase-1 source scope:** GLEIF only (`QUALIFIED_WITH_LIMITATIONS`). Ministry of Education is `BLOCKED_SOURCE_QUALIFICATION` — no Ministry connector, no Ministry fixtures, no second external source, no speculative Saudi government integration, no Lammah, no منتج_مؤجل.

---

## 1. Executive Product Definition

**What the automated Catalog does (Phase 1):** on a schedule, it retrieves Saudi-jurisdiction legal-entity records from GLEIF's public LEI API; captures immutable raw evidence; normalizes source-supported facts with field-level provenance; creates import candidates through the existing worker intake boundary; deterministically screens them against existing `companies` rows and other candidates; queues every candidate for mandatory human review in a new Staff Review Workspace inside the existing Staff shell; supports staff validation of official domains from real evidence; and, on explicit staff approval, publishes through the existing `publish_directory_candidate(uuid)` RPC into `companies` — writing only the approved field set (§10). It monitors its own runs, retries bounded failures, dead-letters the rest, and can be suspended or killed instantly.

**What it does not do:** it does not publish anything automatically; does not invent any fact (no fabricated Arabic names, domains, sectors, descriptions, URLs, or metrics); does not create, own, verify, or modify Profiles; does not touch Verification; does not assign ownership or write `claimed_by`; does not import non-Saudi scope, Ministry data, universities-by-source, Lammah, or منتج_مؤجل; does not represent GLEIF as a complete census of Saudi organizations; does not expose evidence or pipeline internals to anyone but authorized Staff.

**Who benefits:** Individuals get a larger, real, provenance-backed Directory to discover; future Business representatives find their organization already referenced (Verification remains their separate journey); Staff stop hand-typing AI-generated lists; the founder gets a Catalog that grows on a schedule with zero fabrication risk and a full audit trail.

**What becomes automatic:** retrieval, evidence capture, normalization, provenance, candidate creation, deterministic duplicate screening, queueing, run accounting, failure handling, retention eligibility marking.

**What remains human:** every publication decision; official-domain confirmation; Arabic-name review; ambiguous-match resolution; dead-letter disposition; source suspension judgment.

**How it reduces cost and pressure:** one scheduled connector on existing infrastructure (no new paid service); staff time shifts from data entry (~minutes/record) to review (~seconds-to-a-minute/record) with evidence pre-assembled; failures self-contain in dead letters instead of corrupting data; the kill switch and flag mean zero standing operational obligation when paused.

**Phase-1 success means:** the §19 closeout proof exists — a completed non-production pilot in which real GLEIF records flowed end-to-end, every published record was human-approved, every published fact has provenance, all §15 tests pass, all four validation gates pass, and zero forbidden side effects occurred.

---

## 2. End-to-End Operational Journey

Each step: **actor → input → action → output → DB state → audit → failure state → retry → human condition.**

**Step 0 — Source configuration (one-time).**
Staff (Super Admin) → GLEIF source parameters → activates the GLEIF row in `directory_sources` (approved state, cadence, rate limits, parser version) via existing staff-permitted update path or seed migration → configured source → `directory_sources` updated → audit event `source_configured` → misconfiguration fails validation → n/a → human is the actor.

**Step 1 — Scheduled trigger.**
Scheduler (§3) → cron schedule + `catalog.phase1_ingestion` flag + source enabled + kill switch clear → invokes connector → run started → `directory_sync_runs` row (`running`, run identifier, checkpoint empty) → `sync_run_started` → flag/kill/disabled → skip silently with `sync_run_skipped` audit (no retry — next schedule) → human only to re-enable.

**Step 2 — Retrieval.**
Connector (LOGIN member of `catalog_worker`) → checkpoint + GLEIF page cursor → HTTPS GET to GLEIF LEI API with Saudi filter (§5), politeness delay, timeout → JSON pages → no table writes yet → per-page `page_retrieved` counter on the run row → HTTP error/timeout → bounded retry (§11); exhaustion → run `failed_partial` with checkpoint preserved → human on repeated source failure (§11 suspension threshold).

**Step 3 — Raw evidence capture.**
Connector → page payload → compute SHA-256, store payload (append-only evidence storage per Foundations pattern), record metadata → evidence row → `directory_raw_evidence` insert → `evidence_captured` → storage failure → retry once; else dead-letter the page → none.

**Step 4 — Extraction + normalization + provenance.**
Connector → evidence payload → parse per data contract (§4), normalize (Unicode NFC, whitespace, country/region/city mapping, name keys), build fact set with per-fact provenance (source, evidence checksum, JSON pointer, original→normalized, parser version, authority) → candidate fact set in memory → no writes yet → n/a → malformed record → that record → dead letter with reason; page continues → none.

**Step 5 — Candidate intake (boundary).**
Connector → fact set + idempotency key (source id + LEI + content checksum) → calls the existing **worker candidate-intake RPC** (preserved contract) → candidate row + facts, or idempotent no-op, or rejection → `directory_import_candidates` + `directory_candidate_facts` insert; state `pending_review` (or `quarantined` per §5 rules) → `candidate_created` / `candidate_replayed` / `candidate_quarantined` → constraint/validation rejection → dead letter with payload reference → none.

**Step 6 — Deterministic dedup + conflict handling.**
Intake boundary (same transaction or immediate follow-up job) → candidate identifiers → match against `companies` and open candidates per §7 hierarchy → match outcome recorded on candidate (`new | update_existing | ambiguous | duplicate_candidate`) → candidate columns + `directory_review_queue` entry with outcome and reasons → `candidate_matched` → matching error → dead letter → ambiguous outcomes are, by definition, routed to human review (all outcomes are — this step only annotates).

**Step 7 — Staff review.**
Staff reviewer → review queue → §8 workspace: inspect evidence, provenance, comparison, domain validation; accept/reject facts; enter reviewed `name_ar` (evidence-backed only); record notes → decision `approve | reject | return_for_correction` → queue + candidate state transition (§9) → `review_decided` with reviewer id and reasons → n/a → n/a → this step **is** the mandatory human gate.

**Step 8 — Publication.**
Staff (authenticated, MFA-satisfied per existing shell) → approved candidate → Staff UI invokes `public.publish_directory_candidate(uuid)` (existing RPC, unchanged) → new/updated `companies` row per §10 contract → `companies` insert/update; candidate `published`; queue closed → RPC's existing immutable audit + `candidate_published` → RPC failure → error surfaced to reviewer; candidate stays `approved`; retry is manual re-invoke (idempotent, §10) → human initiates; concurrency per §9.

**Step 9 — Run completion + monitoring.**
Connector → end of pages or budget reached → finalize run: real row-based counters (retrieved, evidence, candidates created/replayed/quarantined, dead letters), checkpoint saved → run `succeeded | succeeded_partial | failed` → `directory_sync_runs` final update; source health + `last_successful_sync` updated → `sync_run_completed` → finalize failure → run marked `failed`, alert → human per alert policy (§11).

**Step 10 — Dead-letter disposition.**
Staff → dead-letter queue (§8) → inspect payload/reason → re-drive after fix, or annotate-and-close → resolution recorded → `directory_dead_letters` state → `dead_letter_resolved` → re-drive fails again → returns to dead letter with attempt count → human always.

**Step 11 — Retention.**
Retention job (§11) → eligibility rules → mark/delete per policy (never audit rows; legal hold respected) → retention actions → evidence rows per policy → `retention_executed` → job failure → next scheduled attempt → legal-hold decisions are human.

---

## 3. GLEIF Connector Architecture

**Runtime selection (smallest correct, from current JID reality):** the selected runtime is a **Supabase Edge Function** (`catalog-gleif-sync`) scheduled by **pg_cron** in `jid-nonprod` invoking it through `pg_net` with a shared invocation secret — **provided** the wave-start read of current cron/worker/Edge Function/Vault patterns confirms these primitives are present as expected. Selection logic Codex applies at wave start (bounded, in-wave):

1. If the repository already has an established scheduled-worker pattern (Edge Function + pg_cron/pg_net, or native scheduled functions), **reuse that exact pattern**.
2. Else if pg_cron + pg_net are available: Edge Function + pg_cron + shared-secret invocation (this document's default).
3. Else (only if neither exists): a Vercel **server** cron route with the same internals and server-only secrets.
No browser automation in any option. This is a mechanical selection among current supported options, not a founder decision.

**Authentication & connection model:** the connector authenticates to Postgres as a dedicated **LOGIN role** (name pattern `catalog_worker_gleif`, confirmed against repo naming at wave start) granted membership in the existing `catalog_worker` capability role — created by migration with `NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS LOGIN`, password provisioned out-of-band (§18). Connection via the Supabase connection pooler (transaction mode) using a DSN stored as an Edge Function secret / Vault entry. **Never `service_role`. Never anon/authenticated keys. Never any `NEXT_PUBLIC_*` or client-exposed variable.** The GLEIF API itself is public HTTPS and requires no credentials; the invocation secret (pg_net → function) is a random 256-bit value in Vault + function secret, compared constant-time, rotated with the same procedure as the DSN.

**Credential rotation:** DSN password and invocation secret rotate by: create new secret → update function secrets → verify one manual run → revoke old. Documented in the runbook section of the implementation report; revocation path doubles as the §18 emergency procedure.

**Scheduling:** default cadence weekly (GLEIF golden copy updates daily, but Phase-1 review capacity, not source freshness, is the binding constraint); expressed as an implementation constant `CATALOG_GLEIF_CRON` requiring bounded calibration during the pilot — not an invented permanent metric. Pilot runs are manually triggered (§14).

**Rate limiting / politeness:** GLEIF public API budget respected with a fixed inter-page delay and single-flight execution (no concurrent pages in Phase 1); constants `CATALOG_GLEIF_PAGE_DELAY_MS`, `CATALOG_GLEIF_PAGE_SIZE` (≤ the API's documented max, confirmed at wave start against the live contract), `CATALOG_GLEIF_MAX_PAGES_PER_RUN` (run budget). One run at a time enforced by an advisory lock keyed on the source id — a second trigger exits with `sync_run_skipped(reason=already_running)`.

**Pagination & checkpoints:** cursor/page checkpoint persisted on the run row after each successfully ingested page; a new run resumes from the last completed checkpoint of the most recent non-failed run when in incremental mode, or starts clean in replay mode (§11).

**Retries/timeouts:** per-request timeout constant; HTTP 429/5xx → exponential backoff, max 3 attempts per page; 4xx (non-429) → page dead-lettered, run continues; function wall-clock guard ends the run gracefully at budget with checkpoint saved (`succeeded_partial`).

**Partial-run recovery:** `succeeded_partial`/`failed_partial` runs leave a valid checkpoint; the next scheduled or manual run resumes; no page is double-ingested (evidence checksum + candidate idempotency make replays no-ops).

**Idempotency:** page level — evidence rows keyed by checksum; record level — intake RPC idempotency key (source, LEI, content checksum). Replays produce `candidate_replayed` audit events and zero duplicate rows.

**Cost controls / execution limits:** single-flight, page/run budgets, weekly cadence, no new paid infrastructure, evidence payloads stored compressed; all limits are named implementation constants surfaced in one config module for calibration.

---

## 4. GLEIF Data Contract

Accepted source fields (GLEIF LEI-Records API v1, JSON:API shape). **Codex confirms each pointer against the live GLEIF contract at wave start; any drift → adjust pointer mechanically and record it; a missing/renamed field that breaks the contract semantics → `ONE_EXACT_BLOCKER`.** No field outside this table is extracted in Phase 1.

| # | GLEIF source location (JSON pointer within `data[i]`) | JID normalized fact key | Type | Validation | Transformation | Authority | Publishable | Staff-editable | Optional | Rejection condition |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/attributes/lei` | `identifier.lei` | string(20) | ISO 17442 format + check digits | uppercase, trim | authoritative | yes (as identifier fact; not a §10 `companies` column) | no | no | invalid LEI → record dead-lettered |
| 2 | `/attributes/entity/legalName/name` | `name.legal` | string | non-empty ≤ 500 | NFC, trim, collapse whitespace | authoritative | yes → `companies.name` (EN/Latin) or `name_ar` when Arabic-script (see #3 note) | review-gated | no | empty → dead letter |
| 3 | `/attributes/entity/legalName/language` | `name.legal.lang` | string | BCP-47-ish tag | lowercase | authoritative | supports routing of #2 into `name` vs `name_ar` | no | yes | — |
| 4 | `/attributes/entity/otherNames[*]` (`name`,`type`,`language`) | `name.other[]` | array | each non-empty | NFC, trim | authoritative | review-gated: an Arabic-script other-name may become the **evidence** for reviewed `name_ar` | yes (select/edit at review) | yes | — |
| 5 | `/attributes/entity/transliteratedOtherNames[*]` | `name.transliterated[]` | array | non-empty | NFC, trim | authoritative | no (review context only) | no | yes | — |
| 6 | `/attributes/entity/legalAddress/country` | `address.country` | string(2) | must equal `SA` for Phase-1 intake (§5) | uppercase | authoritative | scope filter only | no | no | ≠ SA → not ingested |
| 7 | `/attributes/entity/legalAddress/region` | `address.region` | string | ISO 3166-2 `SA-xx` when present | map to platform region reference where a mapping exists; else keep raw + flag | authoritative | review context; publishable only via approved city (§10) | yes | yes | — |
| 8 | `/attributes/entity/legalAddress/city` | `address.city` | string | non-empty when present | NFC, trim; map to platform city reference; unmappable → raw + review flag | authoritative | yes → `companies.city` after staff approval | yes | yes | — |
| 9 | `/attributes/entity/legalAddress/addressLines`, `postalCode` | `address.raw` | string | ≤ 1000 | join, NFC | authoritative | no (evidence/review context) | no | yes | — |
| 10 | `/attributes/entity/status` | `entity.status` | enum | `ACTIVE`/`INACTIVE` | uppercase | authoritative | gates publication (§5) | no | no | missing → dead letter |
| 11 | `/attributes/registration/status` | `registration.status` | enum | GLEIF set (`ISSUED`,`LAPSED`,`RETIRED`,`MERGED`,`ANNULLED`,`DUPLICATE`,…) | uppercase | authoritative | gates intake/publication (§5) | no | no | `ANNULLED`/`DUPLICATE` → not ingested |
| 12 | `/attributes/entity/registeredAs` | `identifier.local_registration` | string | non-empty when present; format not assumed | trim | authoritative | yes (identifier fact) | no | yes | — |
| 13 | `/attributes/entity/registeredAt/id` | `identifier.registration_authority` | string | RA code format | trim | authoritative | review context | no | yes | — |
| 14 | `/attributes/entity/legalForm/id` | `entity.legal_form` | string | ELF code | trim | authoritative | review context only (no sector inference) | no | yes | — |
| 15 | `/attributes/entity/creationDate` | `entity.creation_date` | date | ISO date, not future, ≥ 1800 | extract year | authoritative | yes → provenance-derived `companies.founded_year` | review-gated | yes | invalid → fact rejected (record continues) |
| 16 | `/attributes/entity/jurisdiction` | `entity.jurisdiction` | string | expected `SA` | uppercase | authoritative | scope support (§5) | no | yes | — |
| 17 | `/relationships` parent links (direct/ultimate), when present in the record payload | `relationship.parent_lei` | string(20) | LEI format | uppercase | authoritative | no (recorded as fact for future phases; no hierarchy writes in Phase 1) | no | yes | — |

Explicitly **not provided by GLEIF and never inferred from it:** official website domain, sector, Saudi region beyond the address fields above, Profile ownership, Verification, marketing description, social URLs, logo, employee count, subscription, JID endorsement. Every accepted fact retains full provenance (§2 Step 4).

---

## 5. Saudi Phase-1 Scope

**Jurisdiction filter (intake):** GLEIF query filtered to legal-address country `SA` (`filter[entity.legalAddress.country]=SA`, exact parameter syntax confirmed at wave start). A record is ingested only if `address.country == SA`. `entity.jurisdiction` is recorded; a mismatch (legal address SA, jurisdiction ≠ SA) does not block intake but adds a review flag `jurisdiction_mismatch`.

**Entity/registration status handling:**

| Condition | Handling |
|---|---|
| `entity.status=ACTIVE` + `registration.status=ISSUED` | Normal candidate; publishable after review. |
| `registration.status=LAPSED` (entity ACTIVE) | Candidate with `lapsed_registration` review flag; publishable only if the reviewer explicitly accepts the flag (LEI renewal lapse ≠ company closure — the flag text explains this). |
| `entity.status=INACTIVE`, or `registration.status ∈ {RETIRED, MERGED}` | Ingested as **quarantined** candidate (evidence preserved, review-only, not publishable in Phase 1). |
| `registration.status ∈ {ANNULLED, DUPLICATE}` | Not ingested; counted in run stats; no candidate. |

**Duplicates:** per §7; duplicate GLEIF records for one LEI are impossible by key; duplicate legal entities across LEIs route through matching.

**No official domain:** candidate proceeds through review normally but is **review-only and not publishable** until ≥ 1 validated domain exists (§6). It remains `approved_pending_domain` (§9) rather than blocking queue throughput.

**Outside Saudi Arabia:** not ingested (filter); if a page anomaly delivers one, intake rejects it (`address.country` validation) → dead letter with reason `out_of_scope`.

**Branch vs. parent:** GLEIF Phase-1 records are legal entities; parent LEI relationships are stored as facts only. No branch/parent hierarchy is written to `companies` in Phase 1; two related legal entities publish as independent Directory records; `relationship.parent_lei` facts wait for a future phase.

**Dissolved/lapsed:** covered by the status table above; no candidate is deleted for status reasons — quarantine preserves evidence.

**Honesty rule:** nothing in UI, reports, or copy claims GLEIF represents every Saudi organization; the source description in the workspace states its coverage limitation explicitly (AR/EN).

---

## 6. Official Domain Validation

GLEIF establishes no domains. Phase-1 domain facts are **staff-confirmed from real evidence**; automation only assists.

**Acceptable evidence (any one, recorded as the domain fact's provenance):** the organization's own website whose content identifies the same legal entity (legal name and/or local registration identifier match); an official government or regulator listing that states the domain; official registry documents naming the domain. The evidence reference (URL + retrieval date + reviewer attestation) is stored with the fact.

**Prohibited evidence:** AI inference or "likely domain" guesses; search-engine ranking alone; social-media profiles; third-party aggregator listings; parked/for-sale pages; any AI-generated text.

**Normalization:** lowercase; strip scheme, `www.`, path, query; store registrable domain (eTLD+1) plus the full host when materially different; punycode stored decoded for display, encoded for comparison.

**Automated assist checks (advisory, run server-side on reviewer request; results displayed, never auto-approving):** DNS resolution succeeds; HTTPS reachable (following ≤ 3 redirects, final host recorded; cross-registrable-domain redirects flagged); homograph/punycode screen; legal-name vs. site-title/metadata comparison rendered side-by-side for the reviewer (no similarity percentage shown — the comparison text itself is shown).

**Manual confirmation:** a domain fact becomes `validated` only by explicit reviewer action citing acceptable evidence. **Placeholder rejection:** empty, `example.*`, `localhost`, IP literals, and any `*.local` are rejected by validation — the system **never generates `stub.local`** or any synthetic domain.

**Conflict handling:** candidate domain conflicting with a domain already on a different `companies` row → `domain_conflict` review flag; publication blocked until the reviewer resolves (choose correct owner, or mark ambiguous → candidate stays unpublishable). No silent overwrite of an existing validated domain by a lower-authority claim (§7).

**Multi-domain:** multiple validated domains allowed (each with its own evidence); reviewer marks one primary for display where the `companies` contract supports it (confirmed at wave start).

**Stale domains:** a previously validated domain failing the assist checks at a later review renders a `domain_stale` flag on the candidate/queue item; staff decide (revalidate with fresh evidence or remove before publication). No automated unpublishing in Phase 1.

**Rule:** no validated domain → candidate is review-only and **not publishable** (state `approved_pending_domain` at most).

---

## 7. Matching and Deduplication

Deterministic only in Phase 1. **Exact-match hierarchy** against `companies` and open candidates, evaluated in order; first decisive tier wins:

1. **LEI match:** an existing `companies` row (or its identifier facts from prior Catalog publication) carries the same LEI → outcome `update_existing` targeting that row.
2. **Local registration identifier match:** same `identifier.local_registration` (exact, trimmed) recorded against an existing row → `update_existing`; if the same identifier appears with a *different* LEI on another live candidate/row → `ambiguous` (identifier conflict).
3. **Validated-domain match:** candidate's staff-validated domain equals an existing row's validated domain (registrable-domain comparison) → `update_existing` unless legal names are decisively different → `ambiguous`.
4. **Normalized legal-name match:** exact match on normalized name keys (AR-normalized and/or Latin-normalized per §3 Catalog-Foundations normalization) **plus** supporting locality evidence (same city where both sides have one, or same jurisdiction when city absent) → `probable_update` routed as `ambiguous` for human confirmation (name+locality alone never auto-targets an update).
5. Otherwise → `new`.

**Conflicting sources / authority protection:** GLEIF facts never silently overwrite a higher-authority or staff-entered value on an existing row. `update_existing` publication (§10) may only fill empty allowed fields or update fields whose current value's provenance is the same source (GLEIF) at lower recency; any other collision surfaces as a fact-level conflict in review, resolved explicitly by the reviewer.

**Update vs. new decision:** carried on the candidate (`match_outcome`, `match_target_company_id`, `match_reasons[]` — human-readable). Reviewer sees the §8 comparison view and may override outcome `new ⇄ update_existing` with a recorded reason; overrides to `update_existing` require the reviewer to pick the target from matched rows only (no free-text target).

**Ambiguity state:** `ambiguous` candidates cannot be approved until a reviewer resolves the conflict explicitly (choose target / declare independent / quarantine). **Manual merge of two existing `companies` rows is prohibited in Phase 1** — no merge UI, no merge RPC; discovered existing-row duplicates are recorded as review notes for a future phase.

**Concurrency:** matching runs inside the intake transaction (or an immediately-following single job) with a deterministic lock order (LEI, then identifier) so two concurrent candidates for the same entity serialize; the second becomes `duplicate_candidate` → auto-closed with audit, pointing at the first.

**No public match percentage; no similarity scores anywhere in UI** — reasons are textual and factual.

---

## 8. Staff Review Workspace

Lives entirely inside the **existing Staff shell** (existing guard chain: `middleware.ts` → `(staff)/layout.tsx` → `requireStaffShellAccess()` — session, staff/super_admin role, MFA aal2, 8-hour session age — plus per-query re-guards; exact reuse, zero new auth machinery). Not a generic SaaS dashboard: no decorative charts, no fake counters, no gradient stat cards; every count renders from a real row count; empty states are honest.

**Routes (pattern; confirmed against current Staff routing at wave start):**

- `/staff/catalog` — operations overview: source health, last successful sync, recent runs (real counters), dead-letter count, flag/kill state. Links only; no vanity visuals.
- `/staff/catalog/review` — review queue (default landing).
- `/staff/catalog/review/[candidateId]` — candidate detail.
- `/staff/catalog/dead-letters` — dead-letter queue + detail.
- `/staff/catalog/runs` — run history + run detail (counters, checkpoint, errors).

**Navigation placement:** one "الكتالوج" group in the existing staff sidebar containing المراجعة / الرسائل المتعثرة / التشغيل — inserted per the existing navigation config pattern; nothing else in the shell moves.

**Access roles:** `staff` and `super_admin` full review capability; publication invokes the existing RPC (already `authenticated`-executable by accepted decision — the UI still renders publish actions only for staff/super_admin, and the RPC's own internal role check remains the boundary). Source configuration, kill switch, flag toggles, retention actions: `super_admin` only. `admin` (where such a role exists in the current system): denied from all Catalog surfaces — same 404 behavior the shell already uses for non-staff.

**Queue screen:** columns — organization name (AR-first display, EN fallback), match outcome badge (new / update / ambiguous / quarantined — text badges, semantic tokens), flags (lapsed_registration, domain_conflict, jurisdiction_mismatch, no_domain), source, candidate age, assignee. Filters: state, match outcome, flags, run. Search: name (normalized, AR/EN) and LEI/registration identifier (exact). Sort: oldest first (default), newest. **Assignment:** race-safe claim-on-open using the same `.is('assigned_staff_id', null)` auto-assign pattern already shipped for verification review; assigned items are view-only to other ordinary staff; super_admin may reassign explicitly (mirror of the locked Spec-02 authorization decision).

**Candidate detail — panels:**

1. **Proposed record** — normalized facts, each with accept/reject toggle and staff-edit affordance where §4 allows; edited values are recorded as staff-entered provenance.
2. **Evidence panel** — sanitized projection of the exact GLEIF payload slice (JSON, pretty, read-only) + checksum + retrieval time; raw evidence is never rendered as HTML.
3. **Provenance panel** — per fact: source pointer, original → normalized, parser version, transformation notes.
4. **Existing-Directory comparison** — when `update_existing`/`ambiguous`: side-by-side current `companies` values vs. candidate values, collisions highlighted, each collision requiring an explicit keep/replace choice (replace allowed only within the §10 field contract).
5. **Conflict view** — match reasons, identifier conflicts, `domain_conflict` details.
6. **Domain validation view** — evidence entry (URL + attestation), assist-check trigger + results (DNS/HTTPS/redirect/homograph/name-comparison), validate/reject per domain (§6).
7. **Arabic-name review** — GLEIF Arabic-script names (legal/other) offered as selectable evidence for `name_ar`; reviewer confirms or enters `name_ar` **only** with cited evidence; a visible rule states: no transliteration inventions, no machine translation. If no Arabic evidence exists, `name_ar` stays empty — the record publishes with the Latin legal name only.
8. **Review notes** — free text, stored on the queue item, audit-logged.

**Actions:** approve (→ `approved` or `approved_pending_domain`), reject (reason mandatory), return for correction (reason mandatory; candidate → `pending_review` with note), publish (visible on `approved` only; invokes the RPC; result — success with link to the public record, or the exact error), quarantine/unquarantine (super_admin), dead-letter re-drive/close (with reason). Every action = one audited transition (§9).

**Audit history panel:** the full event trail for the candidate (system + human) rendered chronologically from the immutable audit rows.

**Arabic-first copy for critical states/actions (keys in both `messages/ar.json` + `messages/en.json`, parity-checked):** examples — approve: «اعتماد», reject: «رفض», return: «إعادة للتصحيح», publish: «نشر في الدليل», pending domain: «بانتظار تحقق النطاق», ambiguous: «تطابق غير محسوم», quarantined: «محجوز للمراجعة», dead letter: «رسالة متعثرة», empty queue: «لا توجد سجلات بانتظار المراجعة». Latin digits; no letter-spacing on Arabic; logical CSS properties; usable at 375px; honest loading/empty/error states.

---

## 9. Review State Machine

Allowed transitions (initiator → guard → audit event → reversible/terminal → concurrency). Anything not listed is forbidden and untestable transitions are constraint-blocked. **No automatic transition to `approved` or `published` exists anywhere.**

**Source (`directory_sources` operational state):** `enabled → suspended` (super_admin, or system at failure threshold §11; audit `source_suspended`; reversible) · `suspended → enabled` (super_admin; `source_resumed`; reversible). Concurrency: row lock; last audited action wins.

**Sync run:** `created → running` (scheduler/manual; flag+kill+enabled guard; `sync_run_started`) · `running → succeeded | succeeded_partial | failed` (system; `sync_run_completed`; terminal per run) · `created → skipped` (system; guard failed; `sync_run_skipped`; terminal). Single-flight advisory lock guarantees ≤ 1 `running` per source.

**Raw evidence:** insert-only (`evidence_captured`); no updates; deletion only by retention job under §11 policy (`retention_executed`; terminal). Tamper resistance: no UPDATE grant to any role.

**Candidate:** `pending_review ⇄ (assignment)` (claim/release per §8; `candidate_assigned`/`candidate_released`; reversible) · `pending_review → quarantined` (system per §5, or super_admin; `candidate_quarantined`; reversible by super_admin `candidate_unquarantined`) · `pending_review → approved` (assigned reviewer; guards: not ambiguous-unresolved, all mandatory facts accepted, ≥1 validated domain; `review_decided(approve)`; reversible only via `return_for_correction` before publication) · `pending_review → approved_pending_domain` (assigned reviewer; same guards minus domain; `review_decided(approve_pending_domain)`; reversible) · `approved_pending_domain → approved` (reviewer after §6 validation; `domain_validated`; reversible) · `pending_review → rejected` (assigned reviewer; reason required; `review_decided(reject)`; terminal for the candidate — a future re-ingestion creates a new candidate version) · `approved | approved_pending_domain → pending_review` (reviewer/super_admin; `returned_for_correction`; reversible) · `approved → published` (staff via RPC only; RPC internal guards + §10 contract; RPC audit + `candidate_published`; terminal) · any non-terminal → `superseded_by_replay` (system, when a newer content version of the same source record arrives; `candidate_replaced`; terminal, evidence preserved).

**Candidate fact:** `proposed → accepted | rejected | edited` (assigned reviewer; `fact_reviewed`; reversible until candidate approval) · frozen at candidate approval.

**Review queue item:** mirrors candidate decisions; `open → closed(decision)` (terminal per item; `queue_item_closed`).

**Dead letter:** `open → redriven` (staff; `dead_letter_redriven`; if re-drive fails → new open entry, attempt count +1) · `open → closed` (staff, reason; `dead_letter_resolved`; terminal).

**Publication:** executed solely inside `publish_directory_candidate(uuid)`; idempotent (second invocation on a `published` candidate is a no-op returning the existing result; guard inside the RPC confirmed at wave start — if absent, the UI-side guard + candidate-state check provides it and the report records the gap). Concurrency: two staff publishing the same candidate serialize on the candidate row; second sees `already published`. Two staff publishing *different* candidates matched to the same target row serialize on the target `companies` row; the second re-checks collisions and fails safe to review if the first changed the relevant fields.

---

## 10. Publication Contract

The existing `public.publish_directory_candidate(uuid)` RPC is preserved exactly (signature, ownership, fixed search path, audit). The Staff UI invokes it via a thin server action that: (1) re-verifies staff shell access, (2) passes the candidate id, (3) surfaces the RPC result verbatim, (4) writes no table itself.

**Exact allowed `companies` writes (whitelist — the only fields publication may set):**

- `id` (new rows: server-generated)
- `name` (reviewed legal name)
- `name_ar` (reviewed, evidence-backed only; may be null)
- validated domains (per the current `companies` domain representation, confirmed at wave start)
- `entity_type` pinned to `business` (GLEIF Phase 1 imports businesses only; a GLEIF record that is evidently a university → quarantine, not publication)
- `city` (approved)
- `founded_year` (provenance-derived from `entity.creation_date` only)
- server-generated `slug`
- `is_active = true`
- `link_status = 'pending'`
- server-set `updated_at`

**Prohibited writes (asserted by tests §15):** `claimed_by` and any ownership/representative column; any Verification table; `business_profiles` / `university_profiles`; moderation fields; commercial/subscription fields; social fields; metrics; descriptions; sectors; logos; any column not whitelisted above. **No side effects:** no Profile, Verification, ownership, moderation, commercial, social, metric, notification, or unsupported-content writes of any kind, in the RPC path or the server action.

`update_existing` publications write only: empty allowed fields, or allowed fields whose current provenance is GLEIF with older recency, or fields the reviewer explicitly chose "replace" on in the collision view — always within the whitelist.

---

## 11. Automation and Operational Controls

All numeric values below are **implementation constants requiring bounded calibration during the pilot** (named, centralized, change-logged) — not invented permanent metrics. Proposed starting values in parentheses.

- Schedule cadence `CATALOG_GLEIF_CRON` (weekly; pilot: manual only) · max batch `CATALOG_GLEIF_MAX_PAGES_PER_RUN` (pilot: 2 pages) · page size (API max, confirmed) · concurrency (1; single-flight lock) · run wall-clock budget (function limit − safety margin) · retry limit (3/page) · dead-letter alert threshold (>10 open) · consecutive-failure suspension threshold (3 failed runs → system `source_suspended` + alert).
- **Connector kill switch:** dedicated flag/config `catalog.gleif_connector_enabled` (default off) checked at run start — distinct from the ingestion flag so staff can halt retrieval while review continues.
- **Ingestion feature flag:** existing default-off `catalog.phase1_ingestion` gates the entire pipeline (connector + intake). The existing public `catalog` flag is **not repurposed** and not touched.
- **Manual rerun:** super_admin action creating a manual run (incremental from checkpoint). **Historical replay:** super_admin action with explicit `replay` mode (clean cursor); idempotency renders replays safe.
- **Source health:** derived only from real run outcomes; `last_successful_sync` shown from the run table; counters are `count(*)` queries, never cached approximations.
- **Operational alerts:** run failure, suspension trigger, dead-letter threshold — delivered through the existing notification/audit convention read at wave start (no new alerting dependency; minimum viable = surfaced prominently on `/staff/catalog` with honest timestamps).
- **Retention eligibility:** evidence superseded by newer checksum for the same source record AND older than `CATALOG_EVIDENCE_RETENTION_DAYS` (180) → eligible. **Deletion job:** scheduled, deletes eligible evidence payloads only (metadata + checksum + audit remain), audited per batch. **Legal hold:** boolean on evidence/candidate settable by super_admin; held rows are never retention-deleted. **Personal-data quarantine:** if extraction detects personal-data patterns beyond organizational scope in a payload (person-identifying fields outside registry officer context), the record is quarantined, flagged `personal_data_review`, excluded from any publication path, and eligible for early deletion on super_admin confirmation.

---

## 12. Privacy and Security

- **Worker privileges:** `catalog_worker_gleif` LOGIN role: member of `catalog_worker` only; can execute the intake RPC and write evidence/run tables per existing Foundations grants; zero grants on `companies`, Profiles, Verification, and all non-Catalog tables; NOBYPASSRLS.
- **Function ownership:** all new functions owned by the existing dedicated NOLOGIN/NOBYPASSRLS function owner with fixed `search_path`, matching Foundations exactly.
- **Staff permissions:** review/queue/dead-letter actions require staff or super_admin through the existing shell + per-action RPC checks; **Super Admin-only:** source config, kill switch, flags, retention, legal hold, quarantine release, replay. **Admin denial:** any distinct `admin` role receives no Catalog grant and hits the shell's existing 404 path (consistent with the locked no-override decision pattern).
- **RLS:** forced RLS stays on all Catalog tables; public/anon/authenticated: zero visibility of sources, runs, evidence, candidates, facts, queues, dead letters; staff read policies scoped to review needs; no policy on any existing table is weakened.
- **Raw evidence confidentiality:** private storage; staff-only sanitized projections; never exposed to public or ordinary authenticated users; no public URL can address evidence.
- **Secrets:** DSN + invocation secret in Supabase secrets/Vault per current repo pattern; nothing in client bundles, nothing in `NEXT_PUBLIC_*`, nothing committed.
- **Audit:** every §9 transition emits into the existing immutable audit integration; no UPDATE/DELETE grants on audit rows; tamper resistance inherited from Foundations.
- **Personal-data exclusion:** §4 extracts organizational fields only; §11 quarantine handles residuals.
- **API exposure:** no new public API routes; connector is invoked by scheduler only (shared-secret verified, constant-time compare, replay-protected by run single-flight + timestamped nonce); staff actions are server actions/RPCs behind the shell (SSR/server authorization re-checked per action, mirroring existing per-query re-guards).
- **Rate limiting:** outbound (GLEIF politeness) per §3; inbound irrelevant (no public endpoint); staff actions inherit platform session controls.

---

## 13. Feature Flags and Rollout

- `catalog.phase1_ingestion` (exists, default off): master gate for connector + intake. Off ⇒ scheduler skips (`sync_run_skipped`), intake RPC rejects new candidates (existing behavior preserved).
- `catalog.gleif_connector_enabled` (new, default off): retrieval-only gate under the master flag.
- Review-workspace enablement: the workspace routes are staff-only and harmless when idle; they ship enabled within the staff shell (no separate public flag needed; if the current flag system trivially supports staff-surface flags, gate as `catalog.review_workspace` default on for staff — wave-start choice, recorded).
- **Pilot mode:** both flags on **only** in `jid-nonprod`; production untouched (§18: no production deployment at all).
- **Rollback behavior:** disabling `catalog.phase1_ingestion` stops new ingestion immediately; running run finishes its current page and finalizes; pending review records remain reviewable and publishable (review/publication are human paths, not ingestion) — unless the founder later chooses to freeze publication too, which is a one-line staff-UI guard on the same flag: Phase-1 behavior = review continues.
- **Effect on existing public Catalog:** none while nothing is published; published records appear through the existing approved public Catalog read paths exactly like manually created Directory records. The existing public `catalog` flag is not repurposed, not read, not written by this work.

---

## 14. Non-Production Pilot

One bounded pilot on `jid-nonprod` (`hmjuijmaefajdjrjdsxu`) via `https://jid-dev.vercel.app`.

- **Scope:** GLEIF Saudi filter, manual runs only, `CATALOG_GLEIF_MAX_PAGES_PER_RUN=2`, **maximum 100 candidate records total**; run identifiers `PILOT-GLEIF-001`, `-002` as needed.
- **No real personal data:** organizational registry data only (GLEIF is public legal-entity data); any `personal_data_review` quarantine during the pilot → excluded + recorded.
- **Source snapshot:** every pilot page's raw evidence retained for the full pilot; checksums listed in the closeout evidence.
- **Review requirement:** **every** pilot candidate manually reviewed by Staff test actors; target ≥ 25 approved; ≥ 5 rejected/returned exercising those paths; ≥ 3 `update_existing`/`ambiguous` resolutions if matches occur naturally (if none occur, one synthetic pre-seeded `companies` fixture with a known LEI provides the match case — fixture labeled and removed at cleanup).
- **Domain evidence requirement:** every published pilot record has ≥ 1 staff-validated domain with recorded evidence; at least 3 records deliberately left `approved_pending_domain` to prove the block.
- **Staff test actors:** existing non-production staff + super_admin test accounts (no new production-like accounts; credentials per existing non-prod conventions).
- **Publication:** ≤ 25 records published into non-prod `companies`, each human-approved; verify public Catalog rendering (AR/EN, RTL/LTR, mobile 375px).
- **Expected evidence (collected during the wave):** run rows with real counters; evidence checksums; candidate/fact/provenance samples; review + publication audit trails; RLS denial proofs; side-effect zero-proofs (§15 queries); screenshots of queue, detail, domain validation, published public record (desktop + mobile, AR + EN).
- **Cleanup ownership:** the same Codex wave. **Retained:** audit rows, run history, evidence within retention, published records marked as pilot in the ledger. **Removed:** synthetic fixtures, test-only artifacts, any quarantined personal-data payloads. Cleanup verified by listed queries in the report.
- **Success conditions:** all §16 criteria pass. **Stop conditions:** any forbidden side effect detected; any RLS leak; GLEIF contract drift breaking §4 semantics; > 20% of pilot candidates dead-lettered for one systematic cause → stop, fix within the bounded mechanical-repair pass, or exit `ONE_EXACT_BLOCKER`.

---

## 15. Testing Matrix

Implementation-ready tests (unit/integration in vitest per platform stack; DB-boundary tests in the disposable Supabase environment per JID_01 §5; each line ≥ 1 test):

**Connector/auth:** connector authenticates as `catalog_worker_gleif` (not service_role — asserted); wrong DSN credentials → clean failure, no partial writes; invocation without/with-wrong shared secret → rejected; source disabled → skip; `catalog.phase1_ingestion` off → skip + intake rejection; kill switch off → retrieval halted, review still works.
**Retrieval:** pagination across ≥ 3 fixture pages with checkpoint resume; 429 → backoff retry; timeout → retry then partial finalize; 4xx page → dead letter, run continues; partial failure resumes without duplication; replay mode idempotent (zero new rows, `candidate_replayed` events); checksum mismatch between fetch and store → page dead-lettered.
**Dedup/matching:** duplicate source record (same LEI, same checksum) → no-op; same LEI new checksum → candidate version supersedes; LEI match → `update_existing`; registration-identifier match; conflicting identifier/LEI pair → `ambiguous`; domain match; name+locality → `ambiguous` (never auto-update); duplicate Directory record fixture → correct target; concurrent same-entity candidates serialize (one `duplicate_candidate`).
**Domain:** missing domain → publish blocked (`approved_pending_domain`); invalid/placeholder (`stub.local`, IP, `example.com`) → rejected; homograph fixture flagged; stale-domain flag on failing recheck; `domain_conflict` blocks until resolved.
**Fields/data:** unsupported field in payload → ignored + logged, never stored as fact; invalid LEI check digit → dead letter; invalid `creationDate` → fact rejected, record proceeds; Arabic-script legal name routes to `name_ar` evidence; no machine-generated `name_ar` possible (no code path exists — asserted by absence + UI test); personal-data pattern → quarantine + exclusion.
**Authorization:** staff can review; assigned-reviewer view-only enforcement for others; super_admin reassign; `admin` role denied (404); external/authenticated non-staff actor denied on every route and RPC; anon denied; RLS: public/authenticated SELECT on all seven Foundations tables + new tables returns zero rows.
**Review/publication:** concurrent review claims race-safely; concurrent publication of same candidate → second no-op; concurrent publication into same target row → second fails safe; idempotent publication; publication writes exactly the §10 whitelist (column-diff assertion); prohibited-column write attempts fail; audit rows immutable (UPDATE/DELETE denied).
**Side effects (zero-proofs):** after full pilot flow — `verification_requests` unchanged; `business_profiles`/`university_profiles` unchanged; `claimed_by` unchanged on every touched row; no notification/commercial/social/moderation writes from any Catalog path.
**Operations:** retention job deletes only eligible, non-held evidence payloads (metadata/audit survive); legal hold blocks deletion; dead-letter re-drive success + repeated-failure accounting; suspension after N failures + resume; pilot cleanup queries return clean.
**UI:** AR/EN parity for every new key (parity check); RTL/LTR rendering; desktop + 375px mobile for queue and detail; keyboard navigation + labeled controls + focus states on all actions (accessibility baseline); honest empty/loading/error states render.

---

## 16. Acceptance Criteria

Binary, Codex-provable:

1. `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build` all exit 0 at the promoted SHA.
2. Every §15 line has ≥ 1 passing automated test, or a DB-transcript proof from the disposable environment, referenced in the report.
3. Disposable-environment transcript exists showing: migrations apply cleanly; positive AND negative authorization tests pass; environment destroyed; cleanup verified.
4. `supabase` security advisor run after DDL; output attached; zero new unaccepted warnings (the one pre-accepted warning may persist unchanged).
5. Grep-proof: no `service_role` usage in connector code; no new `NEXT_PUBLIC_` secret; no `stub.local` string anywhere; no new Claim/مطالبة terminology in added code/copy (legacy names untouched).
6. Pilot executed on `jid-nonprod`: ≥ 1 completed run row with real counters; ≥ 25 human-approved candidates; ≥ 1 and ≤ 25 published `companies` rows each with full provenance chains and ≥ 1 validated domain with recorded evidence; ≥ 3 records blocked at `approved_pending_domain`; zero automatic publications (audit trail shows a human `review_decided(approve)` + human RPC invocation before every publication).
7. Zero-side-effect queries (§15) return unchanged counts for Verification/Profile/ownership surfaces, attached to the report.
8. Every new i18n key exists in both `messages/ar.json` and `messages/en.json`; parity check passes.
9. Screenshots attached: queue, candidate detail, domain validation, published public record — AR + EN, desktop + 375px.
10. `JID_MASTER_EXECUTION_LEDGER.md` updated within the wave's commits; implementation report exists; promotion to `agent/nonprod-signup-fix` was clean fast-forward with green CI; non-prod Vercel checks green; production and historical mirror untouched (ref-log proof).

No subjective wording is part of acceptance.

---

## 17. Implementation File Map

Likely locations, stated as **patterns to confirm at wave start against the real tree** (paths already known from prior verified work are marked ✓; nothing here authorizes inventing a path — if a pattern's real location differs, use the real one and record it):

- **Migrations:** `supabase/migrations/1xx_catalog_gleif_connector_role.sql`, `1xx_catalog_review_states.sql`, `1xx_catalog_operational_flags.sql` (numbering follows the current sequence observed at wave start; Foundations migrations untouched).
- **Connector:** `supabase/functions/catalog-gleif-sync/index.ts` (+ shared config module for §11 constants) — or the repo's established worker location if different.
- **Server modules:** `jid-platform/src/lib/catalog/` — normalization, matching, domain-check assist, publication server action.
- **Staff routes:** `jid-platform/src/app/(staff)/staff/catalog/{page,review/page,review/[candidateId]/page,dead-letters/page,runs/page}.tsx` following the existing `(staff)` conventions ✓ (shell/guards reused).
- **Server actions/queries:** `src/lib/staff/catalog-review-queries.ts`, `catalog-review-actions.ts` mirroring `claims-queue.ts` / `verification-review-queries.ts` patterns ✓.
- **Messages:** `messages/ar.json`, `messages/en.json` ✓.
- **Feature flags:** the existing flag system's registry location (read at wave start) + the two Catalog flags.
- **Tests:** `tests/catalog/…` per the existing vitest layout (`tests/setup.ts` mocks ✓).
- **Reports:** `jid-platform/docs/command-center/reports/` ✓ — implementation report + pilot evidence + this ledger update.

---

## 18. Deployment and Rollback

1. **Disposable Supabase validation first** (JID_01 §5): unique ports/name → apply all new migrations → synthetic fixtures → positive + negative authorization tests → §15 DB-boundary proofs → destroy → verify cleanup. Security-sensitive changes do not promote if this cannot run.
2. **Non-production migration application:** apply to `jid-nonprod` only, in order, after disposable validation; security advisor after DDL.
3. **Worker secret provisioning:** create `catalog_worker_gleif` LOGIN; set DSN + invocation secret in Supabase function secrets/Vault; verify one authenticated no-op connection; document rotation steps in the report.
4. **Flag activation:** `catalog.phase1_ingestion` on, then `catalog.gleif_connector_enabled` on — non-prod only.
5. **Pilot start:** manual run `PILOT-GLEIF-001`. **Pilot stop:** flags off (connector first); running page completes; state preserved.
6. **Rollback:** flags off ⇒ ingestion fully stopped with zero data loss; if schema rollback is required, each new migration has a written down-path or a documented forward-fix rationale in the report; published pilot rows are removable by listed audited statements if the founder orders it (default: retained as real non-prod data).
7. **Credential revocation:** drop/disable `catalog_worker_gleif` login + rotate invocation secret — the emergency kill independent of flags.
8. **Failed-run recovery:** §2 Step 9 / §3 checkpoints; dead letters per §8.
9. **No production deployment. No `main`. No historical mirror. The frozen production candidate SHA is untouched.**

---

## 19. Phase-1 Closeout

`JID_CATALOG_PHASE1_SHIPPED` is declared **inside the same wave** when and only when all §16 criteria hold, evidenced by one implementation report (in `docs/command-center/reports/`) containing: promoted SHA; validation-gate outputs; disposable-DB transcript; advisor output; test summary mapped to §15; pilot run identifiers + counters; publication list with provenance samples; zero-side-effect query outputs; screenshots; cleanup verification; ledger entry reference; deviations register (mechanical repo-reality adjustments with reasons). The same Codex task performs implementation, testing, non-production deployment, pilot, evidence, and closeout. **No separate QA, audit, or closeout session exists afterward.**

---

## 20. Codex Execution Contract

- **One execution wave.** Wave-start mandatory reading of the §"Inspection provenance" file list is bounded verification inside this wave — it is not a separate discovery task and produces no separate report (findings go in the deviations register).
- **No separate discovery task. No separate audit task. No separate closeout task.**
- **One bounded mechanical repair pass** (per JID_01 self-repair: max 2 automatic attempts per proven root cause; then stop).
- **Never touch:** production, `main`, the historical mirror `agent/nonprod-signup-form`, the frozen production candidate.
- **Never include:** Ministry connector/fixtures, any second external source, Lammah, منتج_مؤجل.
- **Never allow:** automatic publication; Profile writes; Verification writes; ownership/`claimed_by` mutation; `service_role` connector identity; client-exposed secrets; fabricated facts of any kind; new Claim terminology; weakening of any existing RLS, guard, or CI gate.
- **Always:** four validation gates; disposable-DB validation for security-sensitive changes; clean fast-forward promotion to `agent/nonprod-signup-fix` only after green CI; ledger update within the wave; the §19 report.
- **Allowed final outcomes (exactly one):**
  - `JID_CATALOG_PHASE1_SHIPPED <promoted SHA>`
  - `ONE_EXACT_BLOCKER — <one exact blocker>`
  - `ONE_FOUNDER_DECISION — <one exact decision>` (only for a true product/privacy/legal/commercial decision underivable from the Constitution, existing architecture, or approved Catalog decisions; maximum one; mechanical details get the safest bounded choice instead).

---

JID_CATALOG_FINAL_SHIPPING_SPEC_READY
