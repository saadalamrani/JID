# Spec 08-C â€” Wave 2A completed component mapping

Canonical tip at Session start: `e8e1aed5af5084aa2c0a5c50fde946251e871a67`
Design pack: `docs/command-center/design/wave-2a/`

| Design component | Real repository component | Exact path | Action | Data source | Auth boundary | Protecting tests | Prototype vs reality | Final action |
|---|---|---|---|---|---|---|---|---|
| AppShell / SideNav / LanguageToggle | Existing staff shell | `(staff)/layout` + shared nav | reused | session locale / role | staff gate | Spec 02 suites | Prototype AccountSwitcher omitted | No product account switcher |
| VerificationCard | `VerificationCard` | `staff/verification/_components/verification-card.tsx` | restyled | `StaffClaimsQueueItem` + SLA | staff queue RLS | `verification-decision-ui.test.tsx` | University badge remains Spec 02 `bg-blue-100` (not secondary olive) | Locale-aware dates; olive/gold urgency rails; mentor olive badge |
| TypeBadge | inline on card | same | restyled-in-place | `queueType` | â€” | decision-ui | Design wanted secondary olive for University; Spec 02 locks blue | Keep Spec 02 distinction |
| StatusBadge | status text on card/workspace | card + workspace | restyled | request `status` | â€” | decision / assignment | Text primary, not color-only | Kept |
| UrgencyIndicator | SLA text + border rail | card + `verification-urgency.ts` | restyled | `sla_due_at` | â€” | decision-ui | Multi-hue rails replaced; overdue = destructive only | Applied |
| VerificationKanban | `VerificationKanban` | `verification-kanban.tsx` | restyled | partitioned queue items | staff | structural | No radar fork | Beige header chrome |
| FilterBar / SearchInput / FilterDrawer | `VerificationFilters` | `verification-filters.tsx` | restructured (mobile `<details>`) | URL searchParams | â€” | filters used by list | No separate search input beyond URL filters already present | Mobile disclosure; olive active chips |
| ChecklistPanel / ChecklistItem | `ChecklistPanel` | `(staff)/_components/checklist-panel.tsx` | restyled | client `useState` | disabled when view-only/self | structural / decision | Persisted checklist absent | Visual only; deferred notice |
| DomainMatchFact | checklist domain hint | workspace checklist items | reused | directory domains | â€” | â€” | Shown as hint text | Unchanged behavior |
| DecisionPanel / DecisionOption / ReasonField | `VerificationDecisionForm` | `verification-decision-form.tsx` | restyled | approve/reject only | assignment + self-review | decision-ui / action / assignment | Prototype â€œrequest more infoâ€ option **omitted** (no backend) | Olive submit; gold focus |
| SelfReviewNotice | self-review banner + disabled controls | decision form | reused | `isSelfReview` | hard deny server+UI | decision-ui / action | Prototype replaces form entirely; product disables controls (Spec 02) | Preserve Spec 02 disabled pattern |
| RelatedHistoryList | `RelatedHistoryPanel` | `related-history-panel.tsx` | restyled | related query | staff | structural | â€” | Locale-aware `ar-SA`/`en-US` + Latin digits |
| DirectoryReferenceCard | directory section | `verification-review-workspace.tsx` | restyled | directory row | staff | â€” | â€” | Flat card |
| EvidenceList / EvidenceViewer | â€” | â€” | **honest unavailable** | none | â€” | â€” | No storage/viewer | Deferred copy in workspace |
| Request-more-information | â€” | â€” | **omitted control** | status may already be `needs_more_info` | â€” | â€” | No staff decision option/RPC | Deferred copy |
| AuditTrailList | â€” | â€” | omitted | limited decision notes only | â€” | â€” | No evidence-view audit | Not invented |
| ConfirmationBanner Screens 7/9 | `alreadyReviewed` + `approvedNoProfileNotice` | workspace | reused | status + notes | â€” | â€” | â€” | Preserved |
| Skeleton / Empty / Error | existing list empty/loading patterns | list/kanban pages | reused | react-query / page | â€” | â€” | â€” | Unchanged contracts |
| Toast/StatusAnnouncer | sonner toasts | workspace mutation | reused | â€” | â€” | â€” | â€” | Unchanged |
| Sys VerificationPreviewRow | `VerificationQueueWidget` | `sys/dashboard/_components/verification-queue-widget.tsx` | restyled | pending preview | sys role | 102D1 cleanup | No `/sys/claims` link | Flat olive title |

## Unsupported capabilities (honest)

- Evidence viewer / download â€” deferred notice only
- Request-more-information Staff decision â€” omitted
- Persisted checklist / checklist audit snapshot â€” deferred notice; client gate only

## Spec 02 contracts preserved

Assigned-reviewer, Super Admin override checkbox, self-review denial, approve/reject-only decisions, terminal read-only, auto-assign on open â€” **unchanged**.
