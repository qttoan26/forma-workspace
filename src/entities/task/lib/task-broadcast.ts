import { taskCollectionSchema, type Task } from '@/entities/task/model/task'
import { getFrontendAuthStorageScope } from '@/shared/lib/auth-session'

import {
  loadProjectTaskSnapshotFromIndexedDb,
  type ProjectTaskSnapshot,
} from './task-indexed-db'

const channelName = 'forma-task-sync-v2'
const localEventName = 'forma:project-tasks-updated'

interface TaskBroadcastMessage {
  type: 'project-tasks-updated'
  authScope: string
  projectId: string
  tasks: Task[]
  revision: number | null
  sourceId: string
}

const sourceId = createSourceId()

export function publishProjectTasks(
  projectId: string,
  tasks: Task[],
  revision: number | null,
) {
  const channel = openChannel()
  if (!channel) return

  channel.postMessage(createMessage(projectId, tasks, revision))
  channel.close()
}

export function notifyProjectTasks(
  projectId: string,
  tasks: Task[],
  revision: number | null,
) {
  if (!('dispatchEvent' in globalThis)) return

  globalThis.dispatchEvent(
    new CustomEvent(localEventName, {
      detail: createMessage(projectId, tasks, revision),
    }),
  )
}

export function subscribeProjectTasks(
  projectId: string,
  onSnapshot: (snapshot: ProjectTaskSnapshot) => void,
) {
  const channel = openChannel()
  let lastDeliveredRevision = -1

  async function deliver(value: unknown, allowCurrentSource: boolean) {
    const message = parseMessage(value)
    if (!message || message.projectId !== projectId) return
    if (message.authScope !== getFrontendAuthStorageScope()) return
    if (!allowCurrentSource && message.sourceId === sourceId) return

    const storedSnapshot = await loadProjectTaskSnapshotFromIndexedDb(
      projectId,
    ).catch(() => null)
    if (storedSnapshot) {
      if (
        message.revision !== null &&
        storedSnapshot.revision < message.revision
      ) {
        return
      }
      if (storedSnapshot.revision <= lastDeliveredRevision) return

      lastDeliveredRevision = storedSnapshot.revision
      onSnapshot(storedSnapshot)
      return
    }

    const fallbackRevision =
      message.revision ?? Math.max(lastDeliveredRevision + 1, 0)
    if (fallbackRevision <= lastDeliveredRevision) return

    lastDeliveredRevision = fallbackRevision
    onSnapshot({
      projectId,
      tasks: message.tasks,
      revision: fallbackRevision,
      updatedAt: new Date().toISOString(),
    })
  }

  const handleLocalEvent = (event: Event) => {
    const customEvent = event as CustomEvent<unknown>
    void deliver(customEvent.detail, true)
  }

  if ('addEventListener' in globalThis) {
    globalThis.addEventListener(localEventName, handleLocalEvent)
  }
  if (channel) {
    channel.onmessage = (event: MessageEvent<unknown>) => {
      void deliver(event.data, false)
    }
  }

  return () => {
    if ('removeEventListener' in globalThis) {
      globalThis.removeEventListener(localEventName, handleLocalEvent)
    }
    channel?.close()
  }
}

function createMessage(
  projectId: string,
  tasks: Task[],
  revision: number | null,
): TaskBroadcastMessage {
  return {
    type: 'project-tasks-updated',
    authScope: getFrontendAuthStorageScope(),
    projectId,
    tasks,
    revision,
    sourceId,
  }
}

function parseMessage(value: unknown): TaskBroadcastMessage | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<TaskBroadcastMessage>
  if (candidate.type !== 'project-tasks-updated') return null
  if (typeof candidate.authScope !== 'string') return null
  if (typeof candidate.projectId !== 'string') return null
  if (typeof candidate.sourceId !== 'string') return null
  if (
    candidate.revision !== null &&
    (typeof candidate.revision !== 'number' ||
      !Number.isInteger(candidate.revision) ||
      candidate.revision < 0)
  ) {
    return null
  }

  const tasks = taskCollectionSchema.safeParse(candidate.tasks)
  if (!tasks.success) return null
  if (!tasks.data.every((task) => task.projectId === candidate.projectId)) {
    return null
  }

  return {
    type: candidate.type,
    authScope: candidate.authScope,
    projectId: candidate.projectId,
    tasks: tasks.data,
    revision: candidate.revision ?? null,
    sourceId: candidate.sourceId,
  }
}

function openChannel() {
  if (!('BroadcastChannel' in globalThis)) return null
  return new BroadcastChannel(channelName)
}

function createSourceId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
