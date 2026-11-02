# ADR-004: Browser-local document reference intake and library

- Status: Accepted
- Date: 2026-11-02

## Context

Documents & Data is the next module in the priority queue. Work already links document references on tasks and shows project Files. The platform still has no binary storage, version, OCR, review or handoff service. A second reference catalog would fragment those existing links.

## Decision

Document intake and library share the existing `DocumentReference` schema and project-scoped localStorage key with task Files and project Files. They register metadata and source locations, link/reassign tasks, search by document/location/task, filter link scope/source type, and edit/remove references. TanStack Table owns sorting and pagination; the body scrolls inside a bounded region. Root Documents opens the reference workspace; the sidebar retains explicit implementation notices for OCR, review and handoff.

Interactive writers use one entity mutation entry point. It re-reads the saved collection immediately before applying a single-reference mutation, compares the expected reference before edits/removals, and commits before reporting success. Browser Web Locks serialize cooperating writers across same-origin tabs. Without Web Locks the synchronous read/modify/write fallback prevents stale panel snapshots from replacing the collection, but does not guarantee atomic cross-tab writes; this remains a browser-local convenience, not shared authoritative storage. Older open app bundles must be refreshed to use the new writer.

Unreadable, duplicate-ID or incorrectly scoped stored data blocks editing rather than being replaced as an empty catalog. A cached validated snapshot supports React's external-store subscription. Same-tab events, cross-tab storage events and focus refresh all three surfaces. Failed saves retain form inputs and do not fabricate saved task activity. Stored source strings render as text; only valid explicit HTTP(S) URLs become external links. Removing a reference affects the shared project/task reference and never deletes a provider source file.

## Consequences

- Existing references work without migration or copying document content.
- Scope remains the current project catalog entry, on this browser and origin. There is no cross-device sync or server-enforced access. GitHub Pages demo data and local preview data remain separate origins.
- Registration time is reference metadata, not a provider document version or compliance audit timestamp. Missing linked tasks retain their identifier and can be reassigned.
- Document metadata edits do not generate Work comment/update events. Work's existing file-link actions only append activity after reference persistence succeeds.
- File upload, version history, OCR, structured review, approval, handoff, multi-project discovery and authoritative permissions remain unfinished. They must attach to this domain boundary rather than be simulated by sample records.
- No dependency, API or backend model changes.

## Alternatives considered

A separate document catalog was rejected because it would duplicate Work references. An immediate IndexedDB/backend migration was deferred to keep the frontend increment scoped and backward compatible; a future shared repository should replace this storage adapter without changing the intake/library contracts.
