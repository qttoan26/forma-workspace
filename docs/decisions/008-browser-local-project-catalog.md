# ADR-008: Browser-local project creation and discovery

- Status: Accepted
- Date: 2026-11-08

## Scope

Work → Projects lists the existing sample project and projects explicitly created
by the signed-in account on this browser. Name, key and description are searchable
through URL-backed search. Each project exposes Board, List, Table, Calendar,
Timeline and Files and a task summary from the existing task repository. Home
links to saved projects and the complete catalog. A new project starts with an
empty task list and no assigned members; the sample team is not copied.

Project metadata lives in a dedicated IndexedDB catalog, scoped by deployment
base path, workspace and authenticated account. A unique index on scope and
normalized project key prevents duplicate creation across tabs. The sample key
is reserved. Creation resolves only after the transaction commits; failures keep
the form values available for retry. An unreadable catalog is reported as a
failure and disables creation, without replacing or deleting stored records.
The sample remains available while custom discovery is unavailable.

## Navigation and data ownership

Project routes resolve saved metadata for the current account before loading
tasks. Unknown projects and projects absent from that account's local catalog
use the existing not-found route. Work, Documents and Production selection uses
`?project=…`; the default sample omits that parameter. Sidebar, mobile navigation,
navigation search and module stage links preserve selection,
and switching projects clears task filters and selected task state. The project
picker on a project page preserves its view while dropping task-specific search.

Task IDs use the project's key. Task persistence, comments, references, sync and
recovery retain their existing adapters and project IDs. Catalog updates refresh
other tabs through BroadcastChannel and on focus. Task summaries subscribe to
their own project's updates. No global aggregate or historical event is inferred.

This is browser persistence, not server-enforced project membership or sharing.
Catalog metadata is not synchronized to the API or another device. When a task
API is configured, task writes still use its existing owner-scoped authorization.
Documents and Production resolve the selected project with the current account
before exposing their forms or saved records. Both provide the shared project
picker, including recovery after an unavailable project. Changing project or
account unmounts editors and drafts; no sample-source fallback is used for a
missing custom project. Production re-resolves Work tasks and document references
with the same account and project before saving or queueing. Files within each
project uses that project's reference scope. Authoritative project/membership APIs
remain a separate increment.

## Validation

Browser coverage exercises creation and task reload, every project view, deep
links, Work selection, URL search, account separation, concurrent duplicate
keys, cross-tab discovery, save failure/retry, unreadable catalog preservation,
keyboard dismissal and phone layout. Cross-module regression coverage checks
project-preserving navigation, reference/task/package scope, reloads, source
removal in another tab, project switching and inaccessible custom-project links.
Component coverage also verifies fresh source validation before queueing and
editor disposal when the authenticated account changes.
