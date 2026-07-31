# Spec 07-E keyboard accessibility note

Run: `jid07e-1785524038244`
Actor: synthetic Business owner
Locale: `ar`
Viewport: desktop
Input: keyboard focus + Enter only for publication controls (login/navigation outside this walk)

## Publish flow — PASS

1. Owner Profile surface `/company/profile/edit` reached.
2. Tab to publish control.
3. Open confirmation dialog (Enter).
4. Focus observed inside dialog.
5. Cancel with keyboard; dialog closed and focus returned to trigger convention.
6. Reopen confirmation.
7. Confirm publication.
8. In-flight disabled state observed during request.
9. Accessible status announcement / published badge after server confirmation.
10. Public Profile link reachable after publish.

## Unpublish flow — PASS

11. Return to owner surface.
12. Unpublish confirmation by keyboard.
13. Confirm copy returns Profile to draft (not delete).
14. Public route becomes not-found after unpublish.

## Supporting checks — PASS

- Visible focus indicators on publish/unpublish controls and dialog actions.
- Status badges include text labels (not color-only).
- Directory / public Profile links use descriptive accessible names.
- Public pages expose a single clear `h1`.
- No keyboard trap in confirmation dialogs.
- Suspended owner surface communicates unavailability of publish/unpublish (controls absent on redirected suspended route).

Overall: **PASS**
