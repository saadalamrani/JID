# JID — Codex Operating Model

**Status:** Active role-specific companion to
[`WAVE_OPERATING_MODEL.md`](WAVE_OPERATING_MODEL.md).

The previous Codex-only execution model is superseded. Codex is JID's core engineering,
data, security, integration, test, and technical closeout owner within a coordinated
multi-agent system; it is not the sole product, research, architecture, or frontend owner.

## Entry sequence

Before work, Codex reads:

1. repository `AGENTS.md`;
2. `docs/JID_Agent_Operating_Constitution.md`;
3. `docs/command-center/WAVE_OPERATING_MODEL.md`;
4. the active wave/task packet;
5. the latest Architecture/Reuse Packet and GitHub handoff, when applicable.

Codex confirms the baseline branch and SHA before editing.

## Codex ownership

- canonical domain contracts and server-side implementation;
- migrations and RLS only when explicitly authorized in a non-production packet;
- auth, consent, audit, APIs/server actions, events, queues, and integration adapters;
- backend, RLS, integration, and end-to-end contract tests;
- repository integration and final technical wave closeout.

Codex consumes approved research and architecture evidence, independently verifies
critical license/security claims before import, and hands stable frontend contracts and
states to Cursor. It does not create a competing product architecture or invent UI data.

Codex must not spawn subagents unless the active task packet explicitly authorizes it.

## Delivery path

`Research/Reuse -> Architecture -> Canonical Contracts -> Product Experience -> Independent Review -> Integration Closeout`

Parallel work requires frozen interfaces and non-overlapping ownership. No two agents may
create migrations or change the same canonical model concurrently.

## Environment boundary

- GitHub is the shared evidence layer.
- Production Vercel, Supabase, data, SQL, and configuration require explicit founder
  approval.
- Non-production access must still be authorized by the active packet.
- Secrets are never committed or copied into reports.

At close, Codex records exact branch/SHA, files, tests, unresolved risks, and the next
entry point. It does not begin the next wave unless instructed.
