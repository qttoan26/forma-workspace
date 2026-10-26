import {
  taskPriorities,
  taskStatuses,
  type Task,
} from '@/entities/task/model/task'

export const benchmarkTaskCounts = [1_000, 10_000, 50_000, 100_000] as const

export function createBenchmarkTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, index) => {
    const status = taskStatuses[index % taskStatuses.length] ?? 'todo'
    const priority = taskPriorities[index % taskPriorities.length] ?? 'medium'
    const sequence = index + 1

    return {
      id: `PERF-${sequence}`,
      projectId: 'performance-project',
      title: `Performance task ${sequence}`,
      status,
      priority,
      assigneeId: `member-${(index % 12) + 1}`,
      dueDate: `2026-11-${String((index % 28) + 1).padStart(2, '0')}`,
    }
  })
}
