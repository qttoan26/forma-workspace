import type { Task } from '@/entities/task/model/task'

export function inferTaskIdPrefix(tasks: Task[]) {
  for (const task of tasks) {
    const separator = task.id.lastIndexOf('-')
    if (separator <= 0) continue

    const suffix = task.id.slice(separator + 1)
    if (!/^\d+$/.test(suffix)) continue

    return task.id.slice(0, separator)
  }

  return undefined
}

export function nextTaskId(tasks: Task[], prefix: string) {
  const normalizedPrefix = normalizePrefix(prefix)
  const largest = tasks.reduce((max, task) => {
    const match = task.id.match(/^(.+)-(\d+)$/)
    if (!match || match[1] !== normalizedPrefix) return max

    const value = Number(match[2])
    return Number.isFinite(value) ? Math.max(max, value) : max
  }, 0)

  return `${normalizedPrefix}-${String(largest + 1).padStart(2, '0')}`
}

function normalizePrefix(prefix: string) {
  const normalized = prefix
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
  return normalized.replace(/^-+|-+$/g, '') || 'TASK'
}
