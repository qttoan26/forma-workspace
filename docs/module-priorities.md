# Module implementation priorities

Preserve Forma Workspace's multi-department scope, the current Bitrix-inspired glass shell, native Apple typography, responsive phone navigation and the existing domain/persistence boundaries. Use gr8r-taskmanagement as a reference for interaction patterns and components, not a replacement design system or a source of fabricated business records.

This is the module rollout queue. It is separate from the original fixed 70-task frontend foundation backlog; module enhancements do not change that denominator or certify every module as complete.

| Priority | Module              | Deliverable and dependency                                                | Current scope                                                                                                                                                                                                       |
| -------- | ------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Work                | Daily task execution, personal task triage, project views, saved activity | Tasks/My Tasks filters, project progress/view links and current-project local activity are implemented; existing board/editor/checklist/files are reused. Project creation and multi-project discovery remain open. |
| P1       | Documents & Data    | Intake and searchable document references, then review/handoff            | Intake and searchable reference library share task/project Files, with editing, task reassignment and browser-local persistence. Binary upload/version services and OCR remain unconnected.                         |
| P1       | Production          | Intake → queue → processing → quality → delivery                          | Build after document/work references are stable; do not infer manufacturing-only semantics for the original BPO/OCR/operations platform.                                                                            |
| P2       | Admin               | Organization, team directory, membership and workspace settings           | Project members are already visible in Work. Organization teams and identity mapping belong here. Frontend controls must not imply server-enforced access.                                                          |
| P2       | Inbox               | Assignment/mention/update triage                                          | Requested browser-local Inbox is implemented using saved project activity/current assignments. Remote delivery still requires an authoritative event source and account-to-member mapping.                          |
| P3       | Automation          | Workflow builder → triggers → approval runs                               | Requires stable Work/Document/Production events; execution remains explicit until a runner exists.                                                                                                                  |
| P3       | Customers / Vendors | Requests, work assignment and delivery visibility                         | Depends on work packages and organization ownership.                                                                                                                                                                |
| P4       | Policy & Compliance | SOPs, policy review and traceability                                      | Depends on authoritative identity, permissions and shared audit events; local task activity is not a compliance audit log.                                                                                          |

## Work increment

- Tasks and My Tasks reuse the shared TanStack Table with sorting, pagination and internal scroll. Scope buttons show All/Open/Overdue/Completed counts for the relevant assignment scope; filters then combine text (ID/title/description/owner), status, priority, assignee and due date. My Tasks always enforces the current member independently of URL assignee values.
- TanStack Router validates and stores task filters in the URL. Defaults are omitted from generated URLs. Search retains spaces while typing. Clear filters restores the section URL. Task and New task links reuse the existing editor and persistence path.
- Due filters use the browser's local calendar day. Next 7 days includes today through six days later; overdue excludes completed tasks. No date is inferred for unscheduled work.
- Projects shows actual task completion and overdue counts plus Board/List/Table/Calendar/Timeline/Files links for the existing catalog entry. No dummy project creation action is added.
- Activity aggregates only saved records for known tasks in the current project from the existing IndexedDB store. It supports text/type filters, 50-row progressive display, error/retry and task deep links. It refreshes on focus and successful activity writes in this or another tab. Empty feeds are shown honestly; no historical events are invented for changes that were never recorded.
- Activity appends use one read/write transaction to preserve concurrent comments from multiple tabs. Records and entries are checked against project/task scope. Blocked storage produces an error, rather than an empty feed presented as success.

## Follow-up acceptance boundaries

Documents & Data intake/library now use the existing reference model; see [browser-local document scope](decisions/004-browser-local-document-intake.md). The next increment is Production intake/queue, referencing existing Work tasks and document references. Keep backend expansion separate until frontend foundation hardening is verified. Do not mark OCR, notifications, team administration, multi-project aggregation, binary file storage or compliance audit complete through placeholder UI.

## Requested Inbox increment

Inbox uses the Gr8r split list/conversation pattern within Forma’s current visual system. Category tabs, search, Unread, read toggles, Mark all, task deep links and inline replies are implemented. Read status is scoped to project/account on this browser; comments reuse the existing IndexedDB activity adapter. Assignment cards describe the current snapshot rather than claiming a historical assignment event. See [source and persistence boundaries](decisions/003-browser-local-inbox.md). Remote notifications and cross-device delivery remain open.
