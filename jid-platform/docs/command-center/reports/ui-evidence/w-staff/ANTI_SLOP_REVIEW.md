# Spec 08-C Anti-Slop Review (W-Staff Wave 2A)

## Removed / avoided generic UI
- Removed multi-hue urgency rails (red/orange/amber/gray as decoration).
- Removed purple mentor type chip; avoided inventing additional accent colors.
- Removed heavy/rounded-full filter “pill SaaS” look in favor of restrained olive chips.
- No gradients, glow, or drop-shadow elevation on verification surfaces.
- No prototype AccountSwitcher or demo identity controls.

## Simplified
- Mobile filters collapse into a single `<details>` disclosure instead of a parallel filter tree.
- Status communicated primarily with text; color only reinforces overdue.

## Decorative content rejected
- Prototype confirmation marketing screens not shipped as new routes.
- Fake approval-rate / time-to-decision metrics not added.
- No decorative icon tiles or dashboard hero inside Staff workspace.

## Unsupported components omitted
- EvidenceViewer / EvidenceList as working controls.
- Request-more-information decision option.
- Persisted checklist store and evidence-view audit events.
- Honest deferred copy added on the review workspace instead.

## Prototype vs repository conflicts
| Prototype assumption | Repository reality | Resolution |
|---|---|---|
| University TypeBadge = secondary olive | Spec 02 test requires `bg-blue-100` | Keep Spec 02 class |
| Self-review replaces DecisionPanel entirely | Spec 02 requires disabled controls present | Keep disabled radios + banner |
| Request more information outcome | No staff RPC/option | Omit + deferred notice |
| Evidence viewer with files | No storage pipeline | Deferred notice |
| Persisted checklist | `useState` only | Deferred notice |
| AccountSwitcher | Demo-only | Not shipped |

## JID-specific decisions applied
- Brand olive / gold / beige tokens via existing `jid-*` Tailwind map.
- Gold reserved for focus rings and restrained emphasis.
- Overdue may use semantic destructive red only.
- Verification / تحقق terminology preserved; no Claim / مطالبة on touched screens.
- Locale-aware `arSA`/`enUS` and `ar-SA`/`en-US` with Latin digits in touched files.
