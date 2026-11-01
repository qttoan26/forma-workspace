import type {
  CollisionDetection,
  KeyboardCoordinateGetter,
} from '@dnd-kit/core'
import { pointerWithin, rectIntersection } from '@dnd-kit/core'

import { taskStatuses } from '@/entities/task/model/task'

export function readTaskStatus(value: unknown) {
  return taskStatuses.find((status) => status === value)
}

// Pointer drops outside the board must not snap to the nearest column.
export const boardCollisionDetection: CollisionDetection = (args) =>
  args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args)

// One arrow press moves to the adjacent status, including empty columns.
export const boardKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { context },
) => {
  if (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') return
  event.preventDefault()

  const status = readTaskStatus(
    context.over?.data.current?.status ?? context.active?.data.current?.status,
  )
  if (!status) return
  const index = taskStatuses.indexOf(status)
  if (index < 0) return
  const nextStatus =
    taskStatuses[index + (event.code === 'ArrowRight' ? 1 : -1)]
  if (!nextStatus) return
  const rect = context.droppableRects.get(`status-${nextStatus}`)
  if (!rect || !context.collisionRect) return

  return {
    x: rect.left + (rect.width - context.collisionRect.width) / 2,
    y: rect.top + 60,
  }
}
