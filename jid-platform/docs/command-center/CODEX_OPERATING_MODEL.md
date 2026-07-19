# JID — Codex Operating Model

## Decision

Codex becomes the primary engineering executor for JID. Cursor is no longer the mandatory executor; it may remain installed as an editor or fallback. No project migration is required because the project already lives in Git and GitHub.

## Shared system

- ChatGPT / Nebras: command center, planning, product decisions, repository verification.
- Codex: implementation, tests, refactors, reviews, and pull requests.
- GitHub: single shared source of code and task evidence.
- Supabase: database and authentication environments.
- Vercel: preview and production deployments.
- Claude: optional independent reviewer for high-risk database/security changes only.

Claude is not directly merged into Codex as one agent. Both work against the same GitHub repository and task packets.

## Environment map

### Production
- Vercel project: `jid-platform`
- Branch: `main`
- Supabase project ref: `znfhladafpajyjwcfzvv`
- No write without explicit founder approval.

### Non-production
- Vercel project: `jid-dev`
- Working branch: `agent/nonprod-signup-fix`
- Supabase project ref: `hmjuijmaefajdjrjdsxu`

## Codex entry point

Codex must open the repository root, then treat `jid-platform/` as the application root.

Before each task it reads:

1. `/AGENTS.md`
2. `/jid-platform/docs/JID_Agent_Operating_Constitution.md`
3. `/jid-platform/docs/command-center/MASTER_PLAN.md`
4. The specific task packet.

## Connection model

### GitHub
Codex uses the existing `saadalamrani/JID` repository. Every task works on a dedicated branch or isolated worktree and returns a reviewable diff/PR.

### Supabase
Use one of:
- Supabase MCP configured inside Codex, or
- authenticated Supabase CLI in the local Codex environment.

Production and non-production credentials must remain separate. Service-role secrets must never be committed.

### Vercel
Use one of:
- Vercel MCP/skill if available, or
- authenticated Vercel CLI.

Preview deployment is allowed only against non-production configuration. Production deployment requires explicit founder approval.

### ChatGPT
Codex is part of the OpenAI/ChatGPT product family and uses the ChatGPT account. ChatGPT remains the command center and can inspect GitHub, Supabase, and Vercel through connected apps.

### Claude
No direct Codex-to-Claude control is assumed. Claude receives only exceptional review packets. GitHub is the shared evidence layer.

## Anti-loop workflow

`Task Packet → Codex implementation → GitHub commit/PR → ChatGPT verification → environment verification → CLOSED`

The founder only:
- starts a Codex task when a desktop interaction is required,
- approves production writes,
- resolves genuinely new product decisions.

No copying full reports between agents.

## First task

Run `JID-000` as a repository-wide audit only. It must not change application behavior or databases. Its output establishes the Feature Ledger and Task Board used for all later work.
