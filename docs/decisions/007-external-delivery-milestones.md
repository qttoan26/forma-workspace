# ADR-007: Authorized customer and vendor delivery milestones

- Status: Proposed
- Date: 2026-11-06

## Context

Production owns package readiness and manual handoff. Its current records live in the operator's browser and contain internal notes, source references and a free-text recipient. The current API authorizes project owners. Customers and Vendors need a read-only service view once Forma has authoritative organization membership and delivery records.

## Decision

Production remains the source for delivery transitions. Customers reads milestones for a linked customer request. Vendors reads milestones for a linked vendor assignment. Each audience receives a separate, explicit share for a package through its own relationship. A share starts inactive until an authorized internal operator publishes an eligible milestone to that organization. A package can serve both audiences through independent shares.

| Production state or event | External view for the explicitly shared organization                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft through QC approved | No milestone                                                                                                                                              |
| Ready for handoff         | `Ready for handoff` after explicit publication                                                                                                            |
| Readiness withdrawn       | Hide the published readiness milestone. A new readiness transition requires a new publication.                                                            |
| Handoff recorded          | `Handoff recorded` after explicit publication. Its timestamp describes the recorded handoff. Receipt or acceptance would require a separate confirmation. |

The first view shows a single current milestone per share. When Production records handoff, any earlier readiness publication stops appearing. Publishing the handoff makes the new milestone visible. Server-side publication must check the latest package revision and the current request or assignment link so a stale action cannot expose an obsolete milestone.

### Authorization and response

At read time, the server resolves the authenticated account's active organization membership and delivery-read permission. It then requires an active share for that same organization and audience, a current request or assignment relationship, and matching workspace, project and package scope. A customer membership cannot use a vendor share, and vice versa. The same checks apply to list results, counts, and direct links. An authenticated caller who cannot see a direct record receives the same response as for an unknown record.

Allow four fields in the external response. Return the opaque share ID, approved external label or reference, milestone status, and recorded timestamp. Internal titles, package IDs, Work tasks, document references or URLs, requirements, notes, reviewer and owner identities, and recipient text stay in Production. Resolve shares and authorization on every request, and use a private, non-storable response. A membership removal, share revocation, or relationship reassignment takes effect on the next read.

### Implementation order

1. Complete frontend hardening (Task 70). Keep the existing Customers and Vendors sections labeled `Implementation in progress` until they have an authorized source.
2. Establish authoritative identity, organization membership and audience-specific relationships in Admin. Add server-owned delivery transitions and the ability for an authorized operator to publish or revoke a share. Record the actor, scope, revision and time for each publication or revocation.
3. Add the read-only server projection and wire Customers → Service visibility and Vendors → Vendor deliveries to it. Distinguish an empty list from a failed request. Leave existing browser-local package history in Production and require an explicit, authorized server record before any external publication.

### Acceptance cases

- A permitted customer sees only publications for its linked requests. A permitted vendor sees only publications for its linked assignments. Verify isolation with unrelated organizations in the same workspace and with another workspace.
- An authenticated account without delivery-read permission sees an empty list and the same direct-link response as for an unknown record. List counts reflect only authorized rows.
- A withdrawn or superseded readiness record disappears. A newly ready package requires a fresh publication. A stale publication request fails without restoring any hidden milestone.
- Revoking a share, removing membership, or reassigning a relationship removes access on the next list and direct read. The other audience's independent share remains available when its conditions still hold.
- The response contains only the four allowed fields. Browser-local jobs, forged package IDs and recipient strings grant no access.

## Consequences

An operator decides what to share with each organization, and Production retains one workflow for internal execution. The customer and vendor views depend on server-owned identity, relationships, and delivery data. Until those are available, browser-local Production remains the place for readiness and handoff records.

## Alternatives considered

Sharing every milestone with all project participants would be simpler, but would give every project participant the same visibility. Copying Production records into customer and vendor data stores would allow independent views at the cost of keeping the copies synchronized when readiness is withdrawn or a relationship changes.
