import { z } from 'zod'
import {
  taskDueDateSchema,
  taskPrioritySchema,
  type Task,
} from '@/entities/task/model/task'
import type { DocumentReference } from '@/entities/document/model/document-reference'
import type { Member } from '@/entities/member/model/member'

export const productionWorkTypes = [
  'general',
  'scan',
  'ocr',
  'data-entry',
  'bpo',
] as const
export const productionWorkTypeLabels: Record<
  (typeof productionWorkTypes)[number],
  string
> = {
  general: 'General operations',
  scan: 'Scanning',
  ocr: 'OCR preparation',
  'data-entry': 'Data entry',
  bpo: 'BPO services',
}
const referenceIds = z
  .array(z.string().min(1))
  .max(100)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    'Source references must be unique',
  )
export const productionJobInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Package name must be at least 3 characters')
    .max(160),
  workType: z.enum(productionWorkTypes),
  requirements: z.string().trim().max(2000),
  taskIds: referenceIds.refine(
    (ids) => ids.length > 0,
    'Select at least one Work task',
  ),
  documentReferenceIds: referenceIds,
  ownerId: z.string().min(1).optional(),
  priority: taskPrioritySchema,
  dueDate: taskDueDateSchema.optional(),
})
export const productionStatuses = [
  'draft',
  'queued',
  'processing',
  'quality',
  'approved',
  'ready',
  'handed-off',
] as const
export const productionStatusLabels: Record<
  (typeof productionStatuses)[number],
  string
> = {
  draft: 'Draft',
  queued: 'Queued',
  processing: 'Processing',
  quality: 'Quality review',
  approved: 'QC approved',
  ready: 'Ready for handoff',
  'handed-off': 'Handoff recorded',
}
export const productionTransitions: Record<
  (typeof productionStatuses)[number],
  readonly (typeof productionStatuses)[number][]
> = {
  draft: ['queued'],
  queued: ['draft', 'processing'],
  processing: ['queued', 'quality'],
  quality: ['processing', 'approved', 'queued'],
  approved: ['ready', 'processing', 'queued'],
  ready: ['handed-off', 'approved'],
  'handed-off': [],
}
export const productionRecipientSchema = z.string().trim().min(1).max(160)

export const productionJobSchema = productionJobInputSchema.extend({
  id: z.string().min(1),
  projectId: z.string().min(1),
  status: z.enum(productionStatuses),
  workflowHistory: z
    .array(
      z.object({
        from: z.enum(productionStatuses),
        to: z.enum(productionStatuses),
        note: z.string().trim().max(2000),
        reviewerId: z.string().min(1).optional(),
        recipient: productionRecipientSchema.optional(),
        at: z.iso.datetime(),
      }),
    )
    .optional(),
  revision: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export const productionJobCollectionSchema = z
  .array(productionJobSchema)
  .refine(
    (jobs) => new Set(jobs.map((job) => job.id)).size === jobs.length,
    'Duplicate package IDs',
  )
export type ProductionJob = z.infer<typeof productionJobSchema>
export type ProductionJobInput = z.infer<typeof productionJobInputSchema>
export type ProductionSourceContext = {
  projectId: string
  tasks: Pick<Task, 'id' | 'projectId'>[]
  documents: Pick<DocumentReference, 'id' | 'projectId'>[]
  members: Pick<Member, 'id'>[]
}

export function missingProductionSources(
  job: ProductionJobInput,
  context: ProductionSourceContext,
): string[] {
  const tasks = new Set(
    context.tasks
      .filter((task) => task.projectId === context.projectId)
      .map((task) => task.id),
  )
  const documents = new Set(
    context.documents
      .filter((reference) => reference.projectId === context.projectId)
      .map((reference) => reference.id),
  )
  return [
    ...job.taskIds.filter((id) => !tasks.has(id)).map((id) => `Task ${id}`),
    ...job.documentReferenceIds
      .filter((id) => !documents.has(id))
      .map((id) => `Document ${id}`),
    ...(job.ownerId &&
    !context.members.some((member) => member.id === job.ownerId)
      ? [`Owner ${job.ownerId}`]
      : []),
  ]
}

export function assertProductionSources(
  projectId: string,
  input: ProductionJobInput,
  context: ProductionSourceContext,
) {
  if (context.projectId !== projectId)
    throw new Error('Source context does not match this project.')
  if (missingProductionSources(input, context).length)
    throw new Error(
      'Some source tasks, document references or owners are unavailable. Refresh the sources and repair the selection before saving or queuing.',
    )
}
