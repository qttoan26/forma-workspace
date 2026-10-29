import { taskCollectionSchema, type Task } from '@/entities/task/model/task'

const channelName = 'forma-task-sync-v1'

interface TaskBroadcastMessage {
  type: 'project-tasks-updated'
  projectId: string
  tasks: Task[]
  sourceId: string
}

const sourceId = createSourceId()

export function publishProjectTasks(projectId: string, tasks: Task[]) {
  const channel = openChannel()
  if (!channel) return

  channel.postMessage({
    type: 'project-tasks-updated',
    projectId,
    tasks,
    sourceId,
  } satisfies TaskBroadcastMessage)
  channel.close()
}

export function subscribeProjectTasks(
  projectId: string,
  onTasks: (tasks: Task[]) => void,
) {
  const channel = openChannel()
  if (!channel) return () => undefined

  channel.onmessage = (event: MessageEvent<unknown>) => {
    const message = parseMessage(event.data)
    if (!message) return
    if (message.sourceId === sourceId || message.projectId !== projectId) return
    onTasks(message.tasks)
  }

  return () => channel.close()
}

function parseMessage(value: unknown): TaskBroadcastMessage | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<TaskBroadcastMessage>
  if (candidate.type !== 'project-tasks-updated') return null
  if (typeof candidate.projectId !== 'string') return null
  if (typeof candidate.sourceId !== 'string') return null

  const tasks = taskCollectionSchema.safeParse(candidate.tasks)
  if (!tasks.success) return null
  if (!tasks.data.every((task) => task.projectId === candidate.projectId)) {
    return null
  }

  return {
    type: candidate.type,
    projectId: candidate.projectId,
    tasks: tasks.data,
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
