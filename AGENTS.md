# JID — Repository Operating Instructions

These instructions govern every agent working in this repository.

## Read before acting

1. `jid-platform/docs/JID_Agent_Operating_Constitution.md`
2. `jid-platform/docs/command-center/WAVE_OPERATING_MODEL.md`
3. The active wave/task packet and latest GitHub handoff

The dated Wave Operating Model controls product and delivery decisions that conflict with
older product-specific Constitution or command-center language. Trust, privacy, security,
truth, user rights, and production safeguards remain binding. Record genuine conflicts;
do not silently resolve them.

## Repository and runtime

- App root: `jid-platform/`
- Next.js 14.2 App Router; strict TypeScript; never introduce `any`
- `pnpm` only
- Supabase with RLS as the security boundary
- Arabic-first through `next-intl`, with complete English parity
- Timezone `Asia/Riyadh`; Latin digits in both languages

## Active delivery model

- ChatGPT / Nebras: strategy, orchestration, synthesis, verification.
- Claude Code: research, OSS intelligence, architecture, algorithms, methodology.
- Codex: backend, contracts, data/RLS, APIs, workflows, integration, tests, closeout.
- Cursor: UI/UX, frontend, Arabic-first responsive and accessible experience.
- GitHub: shared source of truth.

No agent owns JID independently. Codex must not spawn subagents unless the active task
packet explicitly authorizes it.

## Non-negotiable boundaries

- Exactly three public actors: Individual, Business / Employer, University.
- Mentor is an Individual capability; Government is a partner/customer/authority context.
- Directory records are not owned Profiles.
- Never restore Claim Existing Profile or Commitment Score.
- Professional/social posts, comments, follows, reactions, articles, and a relevant feed
  are permitted under the Wave Operating Model; never optimize them for vanity,
  addiction, fake achievement, or pay-to-win organic visibility.
- Do not fetch private data to the client and hide it there.
- No metric, percentage, badge, outcome, or claim without a traceable real source.
- Career Record is canonical; CV and other expressions do not become parallel truth.
- AI remains assistive, explainable, and human-authorized.
- Every substantial subsystem must pass the OSS / Existing-System Reuse Gate before a
  greenfield build decision.

## Execution contract

1. Inspect the current baseline before editing.
2. Stay inside the active packet and wave.
3. Reuse existing components and utilities before creating new ones.
4. Add or update tests for changed behavior.
5. Run the packet's required checks and report command evidence honestly.
6. Use a dedicated non-production branch/worktree and GitHub handoff.
7. Never execute production SQL, production deployment, or production writes without
   explicit founder approval.
8. End in the exact terminal state required by the active packet.

Default application checks are `pnpm type-check`, `pnpm lint`, and `pnpm build`, plus
focused tests. Documentation-only packets may require narrower checks when explicitly
stated.
