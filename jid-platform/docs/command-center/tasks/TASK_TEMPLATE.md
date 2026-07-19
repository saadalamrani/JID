# JID-XXX — Task Title

## Objective

State one measurable outcome.

## Business reason

Explain the actor journey or risk this closes.

## Constitutional sources

- Name the governing articles in the [JID Agent Operating Constitution](../../JID_Agent_Operating_Constitution.md).
- Link relevant [Feature Ledger](../FEATURE_LEDGER.md) and [Task Board](../TASK_BOARD.md) entries.

## Prerequisites

- Required repository state, prior evidence, and tooling.

## Dependency gates

- List each prerequisite task and its required exact state.

## Scope

- List required behavior and deliverables.

## Out of scope

- List adjacent work that must not be performed.

## Environment

- Application root, branch/base, allowed runtime, and prohibited environments.

## Permissions

- Explicitly state allowed reads/writes and any separate approval requirement.

## Expected file domains

- List the narrow code, test, and report areas the executor may touch.

## Tests

- Focused behavior tests.
- `git diff --check`, type-check, lint, and build unless the packet explicitly narrows a documentation-only gate.

## Acceptance criteria

- Use observable pass/fail statements; no partial completion.

## Evidence

- Record files changed, reuse/new-code decisions, real data sources, gaps, command outputs, and architectural judgments required by Constitution Article 10.

## Stop conditions

- Stop for constitutional conflict, unmet dependency, missing authority, unsafe environment, scope expansion, or two failed repair attempts with the same root cause.

## Executor

Codex on the packet branch.

## Verifier

Name the independent command-center, security, or founder verifier.

## Final-state vocabulary

Return exactly one final line:

```text
CODE_COMPLETE
```

or

```text
BLOCKED_WITH_EXACT_CAUSE
```
