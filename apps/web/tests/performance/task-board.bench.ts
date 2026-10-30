import { bench, describe } from 'vitest'

import {
  filterTasks,
  groupTasksByStatus,
  updateTaskStatus,
} from '@/widgets/task-board/model/task-board-view'

import { benchmarkTaskCounts, createBenchmarkTasks } from './task-fixtures'

for (const count of benchmarkTaskCounts) {
  describe(`${count.toLocaleString()} tasks`, () => {
    const tasks = createBenchmarkTasks(count)
    const targetTaskId = tasks[Math.floor(tasks.length / 2)]?.id ?? 'PERF-1'

    bench('filter + group visible tasks', () => {
      const visibleTasks = filterTasks(tasks, {
        priority: 'high',
        assigneeId: 'member-3',
        query: 'performance',
      })
      groupTasksByStatus(visibleTasks)
    })

    bench('move one task', () => {
      updateTaskStatus(tasks, targetTaskId, 'done')
    })
  })
}
