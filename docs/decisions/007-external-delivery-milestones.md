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

1. Frontend hardening (Task 70) is complete. See the [verified frontend progress](../frontend-progress.md). Keep the existing Customers and Vendors sections labeled `Implementation in progress` until they have an authorized source.
2. Establish authoritative identity, organization membership and audience-specific relationships in Admin. Add server-owned delivery transitions and the ability for an authorized operator to publish or revoke a share. Record the actor, scope, revision and time for each publication or revocation.
3. Add the read-only server projection and wire Customers → Service visibility and Vendors → Vendor deliveries to it. Distinguish an empty list from a failed request. Leave existing browser-local package history in Production and require an explicit, authorized server record before any external publication.

### First backend slice

Use the existing NestJS authentication guard and MongoDB service. The guard establishes the account identity. Organization membership is a server-managed record scoped by workspace, organization and account. Reuse the authenticated account identifier, keep membership inactive until provisioned by an authorized operator, and require a delivery-read permission for the relevant audience. Browser profiles and Production's free-text recipient cannot supply any of these attributes.

Build and test the membership lookup before adding publication or external reads. Include active membership, missing permission, revoked membership, the same account in an unrelated organization, and a matching organization in a different workspace. Keep existing task owner authorization in place. Provisioning, relationship records and the publication workflow each need their own authorization checks before their endpoints are exposed.

### Membership administration

The authenticated Admin API uses `GET` and `PUT` on `/api/admin/workspaces/:workspaceId/organizations/:organizationId/:audience/memberships/:accountId/delivery-access`. The server uses the authenticated subject as the actor. The caller must have an active record in `organization_membership_admins` for the exact workspace, organization and `customer` or `vendor` audience. A deployment operator provisions that authority in MongoDB with the key `JSON.stringify([workspaceId, organizationId, audience, actorAccountId])` and `active: true`. Project ownership and delivery-read membership do not grant administration.

`GET` returns `{ deliveryRead, revision }`. A missing membership starts with delivery access disabled and revision zero. Legacy records retain their existing access and start at revision zero. To grant or revoke delivery access, send `{ deliveryRead, expectedRevision }` with the revision from the last read. A stale write returns HTTP 409. Each successful write records the actor, time and new revision on the membership.

### Customer request and vendor assignment relationships

The server registry identifies each relationship by workspace, project, audience
and opaque relationship ID. A `customer` relationship represents a customer
request; a `vendor` relationship represents a vendor assignment. Each has one
current organization, an explicit active flag and a revision. Creating a record
requires an explicit active value; an absent record grants nothing. This registry
establishes the organization binding only. It does not create a package, share,
membership or milestone, and does not import browser-local Production data.

Authenticated internal operators use `GET` and `PUT` on
`/api/admin/workspaces/:workspaceId/projects/:projectId/:audience/relationships/:relationshipId`.
The deployment operator separately provisions `delivery_relationship_admins` in
MongoDB with `_id: JSON.stringify([workspaceId, projectId, audience, actorAccountId])`
and `active: true`. This authority covers relationship reassignment within that
project and audience. Project ownership, organization membership administration
and external delivery-read permission do not grant it. There is no public
provisioning endpoint. Missing or revoked authority returns the same HTTP 404 for
existing and unknown relationship IDs, for both reads and writes.

`GET` returns `{ organizationId, active, revision }`; an absent record returns
`{ organizationId: null, active: false, revision: 0 }`. `PUT` accepts exactly
`{ organizationId, active, expectedRevision }`. Writes atomically check the
revision, increment it and save the authenticated actor and server timestamp in
`delivery_relationships`. Stale writes, including concurrent initial creation,
return HTTP 409. Both responses use `Cache-Control: private, no-store`.

The internal `findActive` lookup reads the primary on every call, returns only
the current organization and revision, and fails closed for inactive or missing
records. Database failures remain errors. Future publication and external-read
services must resolve this relationship again and match its scope, organization
and revision to the share. A reassignment, revocation or reactivation must not
make an old publication valid. Customer and vendor bindings remain independent.

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
