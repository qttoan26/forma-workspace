import { taskCollectionSchema, type Task } from '@/entities/task/model/task'

const channelName = 'forma-task-sync-v1'
const localEventName = 'forma:project-tasks-updated'

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

  channel.postMessage(createMessage(projectId, tasks))
  channel.close()
}

export function notifyProjectTasks(projectId: string, tasks: Task[]) {
  if (!('dispatchEvent' in globalThis)) return

  globalThis.dispatchEvent(
    new CustomEvent(localEventName, {
      detail: createMessage(projectId, tasks),
    }),
  )
}

export function subscribeProjectTasks(
  projectId: string,
  onTasks: (tasks: Task[]) => void,
) {
  const channel = openChannel()

  function deliver(value: unknown, allowCurrentSource: boolean) {
    const message = parseMessage(value)
    if (!message || message.projectId !== projectId) return
    if (!allowCurrentSource && message.sourceId === sourceId) return
    onTasks(message.tasks)
  }

  const handleLocalEvent = (event: Event) => {
    const customEvent = event as CustomEvent<unknown>
    deliver(customEvent.detail, true)
  }

  if ('addEventListener' in globalThis) {
    globalThis.addEventListener(localEventName, handleLocalEvent)
  }
  if (channel) {
    channel.onmessage = (event: MessageEvent<unknown>) => {
      deliver(event.data, false)
    }
  }

  return () => {
    if ('removeEventListener' in globalThis) {
      globalThis.removeEventListener(localEventName, handleLocalEvent)
    }
    channel?.close()
  }
}

function createMessage(projectId: string, tasks: Task[]): TaskBroadcastMessage {
  return {
    type: 'project-tasks-updated',
    projectId,
    tasks,
    sourceId,
  }
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
