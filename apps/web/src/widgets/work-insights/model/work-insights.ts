import type { Member } from '@/entities/member/model/member'
import {
  taskStatuses,
  taskStatusLabels,
  type Task,
} from '@/entities/task/model/task'

export function summarizeWork(tasks: Task[], members: Member[]) {
  const statuses = taskStatuses.map((status) => ({
    id: status,
    label: taskStatusLabels[status],
    count: 0,
  }))
  const statusById = new Map(statuses.map((item) => [item.id, item]))
  const owners = members.map((member) => ({
    id: member.id,
    name: member.name,
    open: 0,
    completed: 0,
  }))
  const ownerById = new Map(owners.map((owner) => [owner.id, owner]))
  const unassigned = {
    id: '__unassigned__',
    name: 'Unassigned',
    open: 0,
    completed: 0,
  }
  for (const task of tasks) {
    const status = statusById.get(task.status)
    if (status) status.count++
    const owner =
      (task.assigneeId && ownerById.get(task.assigneeId)) || unassigned
    if (task.status === 'done') owner.completed++
    else owner.open++
  }
  if (unassigned.open + unassigned.completed) owners.push(unassigned)
  owners.sort(
    (a, b) =>
      b.open - a.open ||
      b.completed - a.completed ||
      a.name.localeCompare(b.name),
  )
  const completed = statusById.get('done')?.count ?? 0
  return {
    statuses,
    owners,
    total: tasks.length,
    completed,
    completion: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  }
}
