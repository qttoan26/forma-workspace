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
import type { DocumentReference } from '@/entities/document/model/document-reference'
import { getDocumentReferenceUrl } from '@/entities/document/lib/document-location'
import type { Task } from '@/entities/task/model/task'
import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'
import { FileStackIcon } from '@/shared/ui/workspace-icons'

export function DocumentLibraryTable({
  references,
  tasks,
  projectHref,
  onEdit,
  disabled,
}: {
  references: DocumentReference[]
  tasks: Task[]
  projectHref: string
  onEdit: (reference: DocumentReference) => void
  disabled: boolean
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const safePagination = {
    ...pagination,
    pageIndex: Math.min(
      pagination.pageIndex,
      Math.max(0, Math.ceil(references.length / pagination.pageSize) - 1),
    ),
  }
  const columns = useMemo<ColumnDef<DocumentReference>[]>(() => {
    const taskById = new Map(tasks.map((task) => [task.id, task]))
    return [
      {
        accessorKey: 'name',
        header: 'Document',
        cell: ({ row }) => (
          <div className="document-name-cell">
            <span className="document-file-icon">
              <FileStackIcon />
            </span>
            <div>
              <button
                type="button"
                className="document-name"
                disabled={disabled}
                onClick={() => onEdit(row.original)}
              >
                {row.original.name}
              </button>
              <span className="document-location">{row.original.location}</span>
            </div>
          </div>
        ),
      },
      {
        id: 'task',
        header: 'Linked task',
        accessorFn: (reference) =>
          reference.taskId
            ? (taskById.get(reference.taskId)?.title ?? reference.taskId)
            : '',
        cell: ({ row }) => {
          const task = row.original.taskId
            ? taskById.get(row.original.taskId)
            : undefined
          return task ? (
            <a
              className="document-task-link"
              href={`${projectHref}?view=files&task=${encodeURIComponent(task.id)}`}
            >
              <span>{task.id}</span>
              {task.title}
            </a>
          ) : row.original.taskId ? (
            <span>Unavailable task · {row.original.taskId}</span>
          ) : (
            <span className="document-scope">Project-level</span>
          )
        },
      },
      {
        id: 'source',
        header: 'Source',
        accessorFn: (reference) =>
          getDocumentReferenceUrl(reference.location)
            ? 'Web link'
            : 'ID / path',
        cell: ({ row, getValue }) => {
          const url = getDocumentReferenceUrl(row.original.location)
          return url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open source for ${row.original.name}`}
            >
              Open source ↗
            </a>
          ) : (
            <span>{getValue<string>()}</span>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Registered',
        cell: ({ getValue }) => {
          const value = getValue<string>()
          const date = new Date(value)
          return Number.isNaN(date.getTime()) ? (
            <span>Unknown date</span>
          ) : (
            <time dateTime={value}>
              {date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          )
        },
      },
    ]
  }, [tasks, projectHref, onEdit, disabled])
  const table = useReactTable({
    data: references,
    columns,
    getRowId: (reference) => reference.id,
    state: { sorting, pagination: safePagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
  return (
    <div className="document-table-panel">
      <ScrollRegion
        label="Document library table"
        className="document-table-scroll"
      >
        <table className="document-table" aria-label="Document references">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      scope="col"
                      key={header.id}
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
                <td colSpan={columns.length} className="document-table-empty">
                  <FileStackIcon />
                  <strong>No matching references</strong>
                  <span>
                    Register a document or clear the filters to see your
                    references.
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollRegion>
      <div className="document-pagination">
        <span role="status">
          {references.length
            ? safePagination.pageIndex * safePagination.pageSize + 1
            : 0}
          –
          {Math.min(
            (safePagination.pageIndex + 1) * safePagination.pageSize,
            references.length,
          )}{' '}
          of {references.length} references
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
        <nav aria-label="Document pagination">
          <button
            type="button"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </button>
          <span>
            Page {references.length ? safePagination.pageIndex + 1 : 0} of{' '}
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
