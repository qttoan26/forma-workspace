import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  productionWorkTypeLabels,
  missingProductionSources,
  type ProductionJob,
  type ProductionSourceContext,
} from '@/entities/production/model/production-job'
import type { Task } from '@/entities/task/model/task'
import type { Member } from '@/entities/member/model/member'
import { taskPriorities } from '@/entities/task/model/task'
import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'

export function ProductionQueueTable({
  jobs,
  tasks,
  members,
  context,
  projectHref,
  onEdit,
}: {
  jobs: ProductionJob[]
  tasks: Task[]
  members: Member[]
  context: ProductionSourceContext
  projectHref: string
  onEdit: (job: ProductionJob) => void
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'priority', desc: true },
    { id: 'dueDate', desc: false },
  ])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const safePagination = {
    ...pagination,
    pageIndex: Math.min(
      pagination.pageIndex,
      Math.max(0, Math.ceil(jobs.length / pagination.pageSize) - 1),
    ),
  }
  const columns = useMemo<ColumnDef<ProductionJob>[]>(() => {
    const taskById = new Map(tasks.map((task) => [task.id, task]))
    const ownerById = new Map(members.map((member) => [member.id, member.name]))
    return [
      {
        accessorKey: 'name',
        header: 'Work package',
        cell: ({ row }) => (
          <div className="production-package-cell">
            <button
              className="production-open"
              type="button"
              onClick={() => onEdit(row.original)}
            >
              {row.original.name}
            </button>
            <small>{productionWorkTypeLabels[row.original.workType]}</small>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span className={`production-badge is-${row.original.status}`}>
            {row.original.status === 'draft' ? 'Draft' : 'Queued'}
          </span>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        sortingFn: (a, b) =>
          taskPriorities.indexOf(a.original.priority) -
          taskPriorities.indexOf(b.original.priority),
        cell: ({ row }) => (
          <span className={`priority priority-${row.original.priority}`}>
            {row.original.priority}
          </span>
        ),
      },
      {
        id: 'owner',
        header: 'Owner',
        accessorFn: (job) =>
          job.ownerId
            ? (ownerById.get(job.ownerId) ?? `Unavailable · ${job.ownerId}`)
            : 'Unassigned',
      },
      {
        id: 'sources',
        header: 'Sources',
        enableSorting: false,
        cell: ({ row }) => {
          const job = row.original
          const missing = missingProductionSources(job, context)
          return (
            <div className="production-table-sources">
              <div>
                {job.taskIds.map((id) =>
                  taskById.has(id) ? (
                    <a
                      key={id}
                      href={`${projectHref}?task=${encodeURIComponent(id)}`}
                      title={taskById.get(id)?.title}
                    >
                      {id}
                    </a>
                  ) : (
                    <span className="production-warning" key={id}>
                      {id} unavailable
                    </span>
                  ),
                )}
              </div>
              <small>
                {job.documentReferenceIds.length} document references
              </small>
              {missing.length ? (
                <span className="production-warning" title={missing.join(', ')}>
                  Needs attention · {missing.length} unavailable
                </span>
              ) : null}
            </div>
          )
        },
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
  }, [tasks, members, context, projectHref, onEdit])
  const table = useReactTable({
    data: jobs,
    columns,
    getRowId: (job) => job.id,
    state: { sorting, pagination: safePagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
  return (
    <div className="production-table-panel">
      <ScrollRegion
        label="Production queue table"
        className="production-table-scroll"
      >
        <table className="production-table" aria-label="Work packages">
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
                      {header.column.getCanSort() ? (
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
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
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
                <td className="production-empty" colSpan={columns.length}>
                  <strong>No matching work packages</strong>
                  <p>
                    Create a draft from existing tasks or clear the queue
                    filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollRegion>
      <div className="production-pagination">
        <span role="status">
          {jobs.length
            ? safePagination.pageIndex * safePagination.pageSize + 1
            : 0}
          –
          {Math.min(
            (safePagination.pageIndex + 1) * safePagination.pageSize,
            jobs.length,
          )}{' '}
          of {jobs.length} packages
        </span>
        <label>
          Rows per page
          <select
            value={pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <nav aria-label="Production pagination">
          <button
            type="button"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </button>
          <span>
            Page {jobs.length ? safePagination.pageIndex + 1 : 0} of{' '}
            {table.getPageCount()}
          </span>
          <button
            type="button"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  )
}
