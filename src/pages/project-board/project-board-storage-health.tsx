import { useEffect, useState } from 'react'

import {
  browserStorageHealthChangeEvent,
  getBrowserStorageHealth,
  type BrowserStorageArea,
  type BrowserStorageHealth,
} from '@/shared/lib/browser-storage-health'

const areas: BrowserStorageArea[] = [
  'indexed-db',
  'local-storage',
  'session-storage',
]

export function ProjectBoardStorageHealth() {
  const [health, setHealth] = useState(readHealth)

  useEffect(() => {
    function handleHealthChange() {
      setHealth(readHealth())
    }

    window.addEventListener(browserStorageHealthChangeEvent, handleHealthChange)
    return () =>
      window.removeEventListener(
        browserStorageHealthChangeEvent,
        handleHealthChange,
      )
  }, [])

  const problem = selectMostSevereProblem(health)
  if (!problem) return null

  const unavailable = problem.status === 'unavailable'

  return (
    <div className="persistence-alert" role="status" aria-live="polite">
      <div>
        <strong>
          {unavailable
            ? 'Local browser storage is unavailable.'
            : 'Local browser storage is limited.'}
        </strong>
        <p>
          {unavailable
            ? 'Forma will keep working where possible, but offline recovery may be unavailable in this browser session.'
            : 'Forma will keep working, but some local changes may not survive a refresh if browser storage is full or restricted.'}
        </p>
      </div>
    </div>
  )
}

function readHealth() {
  return areas.map((area) => getBrowserStorageHealth(area))
}

function selectMostSevereProblem(health: BrowserStorageHealth[]) {
  return (
    health.find((item) => item.status === 'unavailable') ??
    health.find((item) => item.status === 'degraded') ??
    null
  )
}
