# JID — Codex Operating Instructions

These instructions govern every Codex task in this repository.

## Mandatory sources of truth

Before planning, editing, reviewing, or running commands, read and obey:

1. `jid-platform/docs/JID_Agent_Operating_Constitution.md`
2. `jid-platform/docs/command-center/CODEX_OPERATING_MODEL.md`
3. The current task packet under `jid-platform/docs/command-center/tasks/`

If a task conflicts with the constitution, stop and report the conflict. The constitution wins.

## Repository and runtime

- App root: `jid-platform/`
- Framework: Next.js 14.2 App Router
- Language: strict TypeScript; do not introduce `any`
- Package manager: `pnpm` only
- Database: Supabase with RLS as the security boundary
- Arabic-first using `next-intl`; preserve full English parity
- Timezone: `Asia/Riyadh`
- Numbers: Latin digits in both languages

## Non-negotiable architecture

- Exactly three external actors: Individual, Business, University.
- Directory records are not owned profiles.
- Never restore Claim Existing Profile or commitment scoring.
- No social feed, likes, comments, follower graph, or fabricated engagement metrics.
- Do not fetch private data to the client and hide it there.
- No metric, percentage, badge, or claim without a traceable real data source.
- CV Builder renders canonical profile data; it is not a parallel source of truth.

## Task execution contract

1. Inspect before editing.
2. Stay inside the task packet scope.
3. Reuse existing components and utilities before creating new ones.
4. Add or update tests for changed behavior.
5. Run the required checks from the task packet.
6. Commit and push only to the designated non-production branch.
7. Never execute production SQL or deploy to production without explicit founder approval.
8. End with exactly one state:
   - `CODE_COMPLETE`
   - `BLOCKED_WITH_EXACT_CAUSE`

## Default checks

Run from `jid-platform/` unless the task packet says otherwise:

```bash
pnpm type-check
pnpm lint
pnpm build
```

Also run focused tests for the changed domain. Do not claim PASS without command evidence.

## Change discipline

- Do not modify `main` directly.
- Do not touch production data or secrets.
- Do not add dependencies without a documented necessity.
- Do not reopen closed work without direct regression evidence.
- After two failed repair attempts, stop and create a root-cause blocker rather than looping.
