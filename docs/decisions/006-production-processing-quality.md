# ADR-006: Manual Production processing and quality review

- Status: Accepted
- Date: 2026-11-02

Extend ADR-005's browser-local package collection without changing its storage key. Existing Draft/Queued packages remain readable. Optional workflow history stores explicit transitions, timestamps, notes and selected reviewer IDs. This is local operational history, not authenticated audit evidence.

Allowed transitions: Draft → Queued; Queued → Draft or Processing; Processing → Queued or Quality review; Quality review → Processing (rework) or QC approved; QC approved → Processing (reopen). Processing requires an assigned owner. Quality handoffs require a note; quality decisions require both a note and an existing project member selected as reviewer. Reopening approval requires a reason and removes approved status. Reviewer selection does not verify identity or enforce separation of duties.

Only Draft/Queued plans may be edited. Return active work to the queue to repair or change its plan. Every transition except returning to Draft revalidates current sources, and every mutation checks the latest revision inside the existing lock. QC approval means a manual local review was recorded; it does not deliver output or execute processing. A missing source blocks forward transitions. Active/reviewed packages may return to Queued to repair sources; returning from Quality review requires reviewer/notes, and returning from QC approved requires a reason. Approval is cleared by returning to Queued. All source tasks and document references remain unchanged.

Processing shows Queued/Processing packages. Quality control shows Quality review/QC approved packages. Queue shows all stages with combined filters and the existing TanStack Table. History appears in the internally scrolling editor, with text rendered as text. Failed transitions keep note/reviewer inputs for retry. Existing read/write failure handling, cross-tab refresh and concurrency limits remain unchanged.

No runner, OCR, output upload, shared approvals, delivery service, backend or dependency additions are included. Delivery remains a separate increment.
