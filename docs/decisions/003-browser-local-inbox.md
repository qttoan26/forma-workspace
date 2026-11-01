# Browser-local Inbox

The requested Gr8r Inbox interaction pattern is implemented inside Forma's existing glass shell: category tabs, unread triage, independent list/conversation scrolling, task metadata, task deep links and inline replies. The page uses existing typography, tokens, line icons and mobile navigation. At widths up to 900px the list and detail replace one another with a Back control; this avoids a second modal over the existing shell.

## Sources and identity

Inbox reads the current project repository and the existing IndexedDB activity store. Comments become comment items, complete `@Full Name` or `@[member-id]` matches become mentions for a known current member, and saved task detail events become updates. It does not invent events for unrecorded changes. Current, incomplete tasks assigned to the known member become assignment items, labeled **Current assignment**, without an invented assignment timestamp or actor. Unlinked accounts still see project activity, but have no personal assignment or mention classification. This is presentation filtering, not a security boundary.

Read status uses one localStorage key per project, account and item, so a concurrent change to another item cannot overwrite it. Counts derive from those actual items. Opening an item marks it read; Unread filtering does not close an already-open conversation. Mark all applies across all loaded categories, independent of the current search. Storage events update other tabs; committed activity notifications and focus reload saved activity. Failed reads/writes are visible and retryable.

## Replies and limits

Replies append validated comments through the same atomic IndexedDB adapter as task comments. They remain plain text, carry the known author ID when available and refresh the conversation after a successful save. The composer blocks repeated submissions while saving, retains failed drafts and keeps separate drafts while switching tasks in the open Inbox. Leaving the Inbox or reloading clears those in-memory drafts. Own newly saved replies are marked read. Lists progressively reveal 50 items and conversations reveal 30 comments at a time.

Browser-local activity and current assignment snapshots are not a remote notification service. There is no server fan-out, push delivery, multi-project aggregation or cross-device read synchronization. Shared notifications still require an authoritative event source and account-to-member mapping. This increment does not change the fixed 70-task frontend foundation completion count.
