# JID Task Packets

Task packets are the executable contract between the command center, Codex, and the verifier. A packet narrows the master plan into one reviewable branch and must be read with the repository `AGENTS.md`, the Constitution, and the operating model.

## Source priority

1. Current repository architecture and data truth.
2. [JID Agent Operating Constitution](../../JID_Agent_Operating_Constitution.md).
3. [Codex Operating Model](../CODEX_OPERATING_MODEL.md) and [Master Plan](../MASTER_PLAN.md).
4. [Task Board](../TASK_BOARD.md), [Feature Ledger](../FEATURE_LEDGER.md), and the selected packet.

Conflicts stop execution; they are not silently resolved.

## Packet lifecycle

1. Select one packet whose dependency gates are green.
2. Confirm the named environment, branch, base commit, permissions, and clean scope.
3. Inventory existing implementation before editing.
4. Implement only the packet scope and add focused tests.
5. Run every required validation and record exact evidence.
6. Produce the constitutional report, commit, and push only to the authorized non-production branch.
7. Return exactly `CODE_COMPLETE` or `BLOCKED_WITH_EXACT_CAUSE`.

`CODE_COMPLETE` means every acceptance criterion and evidence gate passed. `BLOCKED_WITH_EXACT_CAUSE` names the precise unmet dependency, constitutional conflict, authorization gap, or repeatable failing gate. Intermediate labels such as done, mostly complete, or green enough are invalid.

## Index

- [Task template](TASK_TEMPLATE.md)
- [JID-102 — Constitutional Organization Lifecycle](JID-102.md)
- [JID-103 — Individual Privacy and Canonical Projection Audit](JID-103.md)
- [JID-107 — Suspended Profile Transition Boundary](JID-107.md)
- [JID-201 — Opportunity-to-Decision Journey](JID-201.md)
- [JID-202 — Honest Surface Closure](JID-202.md)
- [JID-203 — Staff Security and Financial Boundaries](JID-203.md)

JID-106 already identifies the RLS fixture/schema drift closure. No JID-106 packet is created here.
