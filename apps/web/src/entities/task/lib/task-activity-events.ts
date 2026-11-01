const eventName = 'forma:task-activity-saved'
const channelName = 'forma-task-activity-v1'

export function notifyTaskActivitySaved(projectId: string) {
  if ('dispatchEvent' in globalThis)
    globalThis.dispatchEvent(new CustomEvent(eventName, { detail: projectId }))
  try {
    const channel = openChannel()
    channel?.postMessage(projectId)
    channel?.close()
  } catch {
    /* Saved activity remains available on refresh. */
  }
}

export function subscribeTaskActivity(projectId: string, onChange: () => void) {
  const onLocal = (event: Event) => {
    if ((event as CustomEvent<unknown>).detail === projectId) onChange()
  }
  globalThis.addEventListener?.(eventName, onLocal)
  const channel = openChannel()
  if (channel)
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (event.data === projectId) onChange()
    }
  return () => {
    globalThis.removeEventListener?.(eventName, onLocal)
    channel?.close()
  }
}

function openChannel() {
  try {
    return typeof BroadcastChannel === 'function'
      ? new BroadcastChannel(channelName)
      : null
  } catch {
    return null
  }
}
