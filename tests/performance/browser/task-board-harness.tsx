import { Profiler, useEffect, useMemo, useState } from 'react'
import type { ProfilerOnRenderCallback } from 'react'
import { createRoot } from 'react-dom/client'

import type { Member } from '@/entities/member/model/member'
import { TaskBoard } from '@/widgets/task-board/task-board'
import '@/app/styles/global.css'

import { createBenchmarkTasks } from '../task-fixtures'

interface BrowserBenchmarkSnapshot {
  ready: boolean
  count: number
  mountActualDurationMs?: number
  mountBaseDurationMs?: number
  mountCommitTimeMs?: number
  lastUpdateActualDurationMs?: number
  lastUpdateCommitTimeMs?: number
  updateCount: number
  domNodes?: number
  taskCards?: number
  usedJsHeapSize?: number
  longTasks: number[]
}

declare global {
  interface Window {
    __FORMA_BENCHMARK__?: BrowserBenchmarkSnapshot
  }
}

const count = parseTaskCount(
  new URLSearchParams(window.location.search).get('count'),
)
const benchmark: BrowserBenchmarkSnapshot = {
  ready: false,
  count,
  updateCount: 0,
  longTasks: [],
}

window.__FORMA_BENCHMARK__ = benchmark
observeLongTasks(benchmark)

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Benchmark root element was not found')
}

createRoot(rootElement).render(<TaskBoardBenchmark />)

export function TaskBoardBenchmark() {
  const tasks = useMemo(() => createBenchmarkTasks(count), [])
  const members = useMemo(() => createBenchmarkMembers(12), [])
  const [query, setQuery] = useState<string>()

  const handleRender: ProfilerOnRenderCallback = (
    _id,
    phase,
    actualDuration,
    baseDuration,
    _startTime,
    commitTime,
  ) => {
    if (phase === 'mount') {
      benchmark.mountActualDurationMs = actualDuration
      benchmark.mountBaseDurationMs = baseDuration
      benchmark.mountCommitTimeMs = commitTime
      return
    }

    benchmark.updateCount += 1
    benchmark.lastUpdateActualDurationMs = actualDuration
    benchmark.lastUpdateCommitTimeMs = commitTime
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        benchmark.domNodes = document.getElementsByTagName('*').length
        benchmark.taskCards = document.querySelectorAll('.task-card').length
        const usedJsHeapSize = readUsedJsHeapSize()
        if (usedJsHeapSize !== undefined) {
          benchmark.usedJsHeapSize = usedJsHeapSize
        }
        benchmark.ready = true
      })
    })
  }, [])

  return (
    <main id="main-content">
      <div className="board-toolbar">
        <button
          data-testid="benchmark-filter"
          type="button"
          onClick={() =>
            setQuery((current) =>
              current ? undefined : 'Performance task 1',
            )
          }
        >
          Toggle benchmark filter
        </button>
      </div>
      <Profiler id="TaskBoard" onRender={handleRender}>
        <TaskBoard
          initialTasks={tasks}
          members={members}
          {...(query ? { filters: { query } } : {})}
          persistence={null}
        />
      </Profiler>
    </main>
  )
}

function parseTaskCount(value: string | null) {
  const parsed = Number(value ?? '1000')

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 100_000) {
    return 1_000
  }

  return parsed
}

function createBenchmarkMembers(count: number): Member[] {
  return Array.from({ length: count }, (_, index) => {
    const sequence = index + 1
    return {
      id: `member-${sequence}`,
      name: `Benchmark Member ${sequence}`,
      initials: `M${sequence}`,
      role: 'Engineer',
    }
  })
}

function observeLongTasks(snapshot: BrowserBenchmarkSnapshot) {
  if (
    !('PerformanceObserver' in window) ||
    !PerformanceObserver.supportedEntryTypes.includes('longtask')
  ) {
    return
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      snapshot.longTasks.push(entry.duration)
    }
  })

  observer.observe({ type: 'longtask', buffered: true })
}

function readUsedJsHeapSize() {
  const performanceWithMemory = performance as Performance & {
    memory?: { usedJSHeapSize: number }
  }

  return performanceWithMemory.memory?.usedJSHeapSize
}
