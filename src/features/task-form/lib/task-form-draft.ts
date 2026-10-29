import { z } from 'zod'

import {
  taskPrioritySchema,
  taskStatusSchema,
} from '@/entities/task/model/task'

import type { TaskFormValues } from '../model/task-form-schema'

const draftVersion = 'v1'

const taskFormDraftSchema = z.object({
  title: z.string(),
  description: z.string(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  assigneeId: z.string(),
  dueDate: z.string(),
})

export function createTaskFormDraftKey(projectId: string, taskId?: string) {
  const scope = taskId ? `edit:${taskId}` : 'new'
  return `forma:task-draft:${draftVersion}:${projectId}:${scope}`
}

export function loadTaskFormDraft(
  key: string,
  storage?: Storage,
): TaskFormValues | null {
  const target = resolveStorage(storage)
  if (!target) return null

  try {
    const raw = target.getItem(key)
    if (!raw) return null

    const result = taskFormDraftSchema.safeParse(JSON.parse(raw) as unknown)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function saveTaskFormDraft(
  key: string,
  values: unknown,
  storage?: Storage,
) {
  const target = resolveStorage(storage)
  if (!target) return

  const result = taskFormDraftSchema.safeParse(values)
  if (!result.success) return

  try {
    target.setItem(key, JSON.stringify(result.data))
  } catch {
    // Draft persistence is best-effort and must not block form editing.
  }
}

export function clearTaskFormDraft(key: string, storage?: Storage) {
  const target = resolveStorage(storage)
  if (!target) return

  try {
    target.removeItem(key)
  } catch {
    // Draft cleanup is best-effort.
  }
}

function resolveStorage(storage?: Storage) {
  if (storage) return storage

  try {
    return globalThis.sessionStorage ?? null
  } catch {
    return null
  }
}
