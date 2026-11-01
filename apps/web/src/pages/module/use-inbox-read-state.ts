import { useEffect, useState } from 'react'
import { inboxReadPrefix } from './work-inbox-model'

const readEvent = 'forma:inbox-read-changed'

/** One key per item avoids losing other notifications' read state across tabs. */
export function useInboxReadState(projectId: string, userId?: string) {
  const prefix = inboxReadPrefix(projectId, userId)
  const [, setRevision] = useState(0)
  const [error, setError] = useState(false)
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith(prefix)) refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(readEvent, refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(readEvent, refresh)
    }
  }, [prefix])

  function isRead(id: string) {
    try {
      return localStorage.getItem(prefix + encodeURIComponent(id)) === 'read'
    } catch {
      return false
    }
  }
  function mark(ids: string[], read: boolean) {
    try {
      ids.forEach((id) =>
        localStorage.setItem(
          prefix + encodeURIComponent(id),
          read ? 'read' : 'unread',
        ),
      )
      setError(false)
    } catch {
      setError(true)
    }
    window.dispatchEvent(new Event(readEvent))
  }
  return { isRead, mark, error }
}
