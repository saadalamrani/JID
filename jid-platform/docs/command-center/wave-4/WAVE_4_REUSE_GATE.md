# WAVE 4 — OSS / EXISTING-SYSTEM REUSE GATE

**Question:** Career Operations tracker + controlled career-search copilot (Radar + ابحث لي).  
**Date:** 2026-08-29 (Asia/Riyadh)

Mandatory references were inspected independently of Wave 3's Lammah reuse gate.

## Internal first

| Asset | Decision |
| --- | --- |
| Wave 3 Opportunity Graph + Lammah | **INTEGRATE** — Abhathli searches this inventory only |
| Native `applications` + snapshot + applicant transitions | **INTEGRATE** — do not rebuild; Wave 5 shared |
| Existing Radar Kanban | **EXTRACT_PATTERN / ADAPT** — keep as one view |
| Removed search_mandates / scored Abhathli (20260805) | **REJECT** restore — scored matcher and match % |
| Notifications / mentorship meetings | **INTEGRATE** existing; do not add urgency spam |
| Gmail | **DEFER** — no current capability |

## External candidates

### 1. MadsLorentzen/ai-job-search — MANDATORY

| Criterion | Assessment |
| --- | --- |
| License | MIT (per repo LICENSE / prior JID OSINT) |
| Maturity | Active personal workflow; Claude Code skill pack |
| Maintenance | Active 2026; not a multi-tenant SaaS foundation |
| Architecture fit | Local-first `/setup /scrape /rank /apply /interview /outcome` |
| Privacy | Local files; not JID RLS/multi-actor |
| Security | Explicitly treats agent instructions as **not a sandbox** beside untrusted postings |
| Integration cost | High if forked wholesale |

**Reuse:** workflow separation; source-adapter thinking already in Lammah; drafter/reviewer (prepare then human review); untrusted posting handling; outcome feedback as user-declared; no auto-send.

**Must not inherit:** 0–100 fit scores; scrape/auth-wall bypass; local profile files as SaaS truth; mass automation.

**Decision:** **EXTRACT_PATTERN**

### 2. Gsync/jobsync

| Criterion | Assessment |
| --- | --- |
| License | Inspected as OSS self-host tracker (README: open source; not adopted as dependency) |
| Maturity | Next.js self-host tracker with tasks, AI resume review, MCP add-with-approval |
| Architecture fit | Single-user self-host; SQLite/Prisma; job-match **scoring** |
| Privacy | Self-host pattern is useful; JID is hosted multi-actor |
| Security | MCP write-with-approval is the useful pattern |

**Reuse:** application tracker + tasks/actions; approval-before-write; private notes/tasks as owner data.

**Must not inherit:** numeric job matching scores; dashboard vanity analytics; resume as second canonical truth.

**Decision:** **EXTRACT_PATTERN** — **REJECT** fake/numeric match scoring.

### 3. DaKheera47/job-ops

| Criterion | Assessment |
| --- | --- |
| License | **AGPL-3.0 + Commons Clause** (no Sell, including hosted services) |
| Maturity | Graphical self-host pipeline; multi-board scrape; Gmail outcome inbox |
| Privacy / security | Broad scraping; Gmail inbox access; 0–100 fit score |

**Decision:** **REJECT** for code reuse (copyleft + Commons Clause + scrape/score model). **EXTRACT_PATTERN** only conceptually: search → prepare → track, no auto-apply.

### 4. santifer/career-ops

| Criterion | Assessment |
| --- | --- |
| License | MIT |
| Maturity | Very active CLI-agent job-search command center |
| Architecture fit | Local markdown/CLI; 1.0–5.0 rubric scores; not a hosted marketplace |
| Privacy | Local-first, no telemetry — pattern only |

**Reuse:** human-in-the-loop apply; journey stages; fact-gated drafting.

**Must not inherit:** global fit scores; portal scanning as JID inventory; CV rewrite as Career Record mutation.

**Decision:** **EXTRACT_PATTERN**

## Other serious alternatives (brief)

| Candidate | Decision | Why |
| --- | --- | --- |
| AIHawk / mass auto-apply agents | **REJECT** | Auto-apply, stealth, JID red line |
| JobSpy / generic scrapers | **REJECT** for Wave 4 inventory | Source rights; Lammah already governs |
| OpenCATS / Frappe HRMS / Horilla | **REJECT** | Wrong identity/hiring plane |
| JSON Resume / Reactive Resume | **EXTRACT_PATTERN** already done in Wave 2 | CV is projection, not truth |

## What JID implemented from reuse

- Find / explain / prepare / human-approve / track loop
- Untrusted posting sanitization
- Owner-private operations data with RLS
- Evidence-linked insights with source population, missingness, and time window
- External opportunities tracked privately, never as internal employer applications

## What JID must not inherit

- Match % or 0–100 fit scores
- Mass auto-apply
- Silent Career Record writes
- Gmail/inbox scraping in this Wave
- AGPL/Commons Clause code
