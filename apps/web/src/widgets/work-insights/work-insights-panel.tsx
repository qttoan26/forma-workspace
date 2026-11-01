import { lazy, Suspense } from 'react'

import type { Member } from '@/entities/member/model/member'
import type { Task } from '@/entities/task/model/task'

const LazyWorkInsights = lazy(() =>
  import('./work-insights').then((module) => ({
    default: module.WorkInsights,
  })),
)

export function WorkInsightsPanel(props: {
  tasks: Task[]
  members: Member[]
  projectName: string
}) {
  return (
    <Suspense
      fallback={
        <p role="status" style={{ minHeight: '20rem' }}>
          Loading project analytics…
        </p>
      }
    >
      <LazyWorkInsights {...props} />
    </Suspense>
  )
}
