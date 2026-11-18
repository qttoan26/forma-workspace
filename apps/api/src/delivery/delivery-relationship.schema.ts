import { z } from 'zod'

const identifier = z
  .string()
  .min(1)
  .max(256)
  .refine((value) => value.trim().length > 0)

export const deliveryRelationshipScope = z.object({
  workspaceId: identifier,
  projectId: identifier,
  audience: z.enum(['customer', 'vendor']),
})

export const deliveryRelationshipParams = deliveryRelationshipScope.extend({
  relationshipId: identifier,
})

export const deliveryRelationshipChange = z.strictObject({
  organizationId: identifier,
  active: z.boolean(),
  expectedRevision: z
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER - 1),
})

export type DeliveryRelationshipScope = z.infer<
  typeof deliveryRelationshipScope
>
export type DeliveryRelationshipChange = z.infer<
  typeof deliveryRelationshipChange
>

export interface DeliveryRelationship {
  _id: string
  organizationId: string
  active: boolean
  revision: number
  updatedBy: string
  updatedAt: Date
}

export const deliveryRelationshipCollection = 'delivery_relationships'
export const deliveryRelationshipAdminCollection =
  'delivery_relationship_admins'

export function deliveryRelationshipId(
  scope: DeliveryRelationshipScope,
  relationshipOrAccountId: string,
): string {
  return JSON.stringify([
    scope.workspaceId,
    scope.projectId,
    scope.audience,
    relationshipOrAccountId,
  ])
}
