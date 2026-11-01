import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table'

import type { Member } from '@/entities/member/model/member'
import {
  taskPriorities,
  taskStatuses,
  taskStatusLabels,
  type Task,
} from '@/entities/task/model/task'

import './task-table.css'

interface TaskTableProps {
  tasks: Task[]
  members: Member[]
  onOpenTask: (taskId: string) => void
}

export function TaskTable({ tasks, members, onOpenTask }: TaskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  // Filtered data can shrink before Table's deferred auto-reset runs.
  const safePagination = {
    ...pagination,
    pageIndex: Math.min(
      pagination.pageIndex,
      Math.max(0, Math.ceil(tasks.length / pagination.pageSize) - 1),
    ),
  }
  const columns = useMemo<ColumnDef<Task>[]>(() => {
    const memberById = new Map(members.map((member) => [member.id, member]))

    return [
      { accessorKey: 'id', header: 'ID' },
      {
        accessorKey: 'title',
        header: 'Task',
        cell: ({ row }) => (
          <button
            className="task-table-open"
            type="button"
            aria-label={`Open ${row.original.title}`}
            onClick={() => onOpenTask(row.original.id)}
          >
            {row.original.title}
          </button>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        sortingFn: (left, right) =>
          taskStatuses.indexOf(left.original.status) -
          taskStatuses.indexOf(right.original.status),
        cell: ({ row }) => (
          <span className={`task-table-status is-${row.original.status}`}>
            {taskStatusLabels[row.original.status]}
          </span>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        sortingFn: (left, right) =>
          taskPriorities.indexOf(left.original.priority) -
          taskPriorities.indexOf(right.original.priority),
        cell: ({ row }) => (
          <span className={`priority priority-${row.original.priority}`}>
            {row.original.priority}
          </span>
        ),
      },
      {
        id: 'assignee',
        accessorFn: (task) =>
          (task.assigneeId && memberById.get(task.assigneeId)?.name) ||
          'Unassigned',
        header: 'Assignee',
      },
      {
        accessorKey: 'dueDate',
        header: 'Due',
        sortUndefined: 'last',
        cell: ({ row }) =>
          row.original.dueDate ? (
            <time dateTime={row.original.dueDate}>{row.original.dueDate}</time>
          ) : (
            'No due date'
          ),
      },
    ]
  }, [members, onOpenTask])
  const table = useReactTable({
    data: tasks,
    columns,
    getRowId: (task) => task.id,
    state: { sorting, pagination: safePagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
  const { pageIndex, pageSize } = table.getState().pagination
  const rows = table.getRowModel().rows

  return (
    <>
      <div
        className="task-table-scroll"
        role="region"
        aria-label="Scrollable task table"
        tabIndex={0}
      >
        <table className="task-table" aria-label="Tasks">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <span aria-hidden="true">
                          {sorted === 'asc'
                            ? '↑'
                            : sorted === 'desc'
                              ? '↓'
                              : '↕'}
                        </span>
                      </button>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="task-table-empty">
                  No matching tasks. Try clearing the project filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="task-table-pagination">
        <span role="status" aria-live="polite">
          {tasks.length ? pageIndex * pageSize + 1 : 0}–
          {Math.min((pageIndex + 1) * pageSize, tasks.length)} of {tasks.length}{' '}
          tasks
        </span>
        <label>
          Rows per page
          <select
            value={pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="task-table-page-actions" aria-label="Table pagination">
          <button
            type="button"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </button>
          <span>
            Page {tasks.length ? pageIndex + 1 : 0} of {table.getPageCount()}
          </span>
          <button
            type="button"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </>
  )
}
