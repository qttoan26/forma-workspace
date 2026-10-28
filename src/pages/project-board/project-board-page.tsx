import { useEffect, useRef } from 'react'
import { useLoaderData, useNavigate, useSearch } from '@tanstack/react-router'

import {
  loadProjectTasks,
  saveProjectTasks,
} from '@/entities/task/lib/task-storage'
import { taskPriorities, type TaskPriority } from '@/entities/task/model/task'
import {
  type TaskBoardSort,
  taskBoardSorts,
} from '@/widgets/task-board/model/task-board-view'
import { TaskBoard } from '@/widgets/task-board/task-board'

import { getProjectBoardShortcut } from './project-board-shortcuts'

const projectRoutePath =
  '/workspaces/$workspaceSlug/projects/$projectId' as const

const projectTaskPersistence = {
  load: loadProjectTasks,
  save: saveProjectTasks,
}

export function ProjectBoardPage() {
  const search = useSearch({ from: projectRoutePath })
  const navigate = useNavigate({ from: projectRoutePath })
  const { workspace, project, members, initialTasks } = useLoaderData({
    from: projectRoutePath,
  })
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const shortcut = getProjectBoardShortcut(event)
      if (!shortcut) return

      event.preventDefault()
      if (shortcut === 'focus-search') {
        searchInputRef.current?.focus()
        return
      }

      void navigate({
        search: () =>
          buildSearch(
            search.priority,
            search.assignee,
            search.query,
            search.sort,
            undefined,
            '1',
          ),
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, search.assignee, search.priority, search.query, search.sort])

  function updateSearch(next: {
    priority?: TaskPriority | ''
    assignee?: string
    query?: string
    sort?: TaskBoardSort | ''
  }) {
    void navigate({
      search: () =>
        buildSearch(
          next.priority ?? search.priority,
          next.assignee ?? search.assignee,
          next.query ?? search.query,
          next.sort ?? search.sort,
          search.task,
          search.newTask,
        ),
      replace: true,
    })
  }

  function selectTask(taskId: string | null) {
    void navigate({
      search: () =>
        buildSearch(
          search.priority,
          search.assignee,
          search.query,
          search.sort,
          taskId ?? undefined,
          undefined,
        ),
      replace: taskId === null,
    })
  }

  function setCreatingTask(isCreating: boolean) {
    void navigate({
      search: () =>
        buildSearch(
          search.priority,
          search.assignee,
          search.query,
          search.sort,
          undefined,
          isCreating ? '1' : undefined,
        ),
      replace: !isCreating,
    })
  }

  const hasActiveFilters = Boolean(
    search.query || search.priority || search.assignee,
  )

  return (
    <main className="workspace-shell" id="main-content">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">
            {workspace.name} / {project.key}
          </p>
          <h1>{project.name}</h1>
          <p className="project-description">{project.description}</p>
        </div>
        <div
          className="member-stack"
          aria-label={`${members.length} project members`}
        >
          {members.map((member) => (
            <span key={member.id} title={`${member.name} · ${member.role}`}>
              {member.initials}
            </span>
          ))}
        </div>
      </header>

      <section className="board-filters" aria-label="Task filters">
        <label>
          <span>Search</span>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search tasks"
            value={search.query ?? ''}
            aria-keyshortcuts="/"
            title="Press / to focus search"
            onChange={(event) => updateSearch({ query: event.target.value })}
          />
        </label>

        <label>
          <span>Priority</span>
          <select
            value={search.priority ?? ''}
            onChange={(event) =>
              updateSearch({
                priority: event.target.value as TaskPriority | '',
              })
            }
          >
            <option value="">All priorities</option>
            {taskPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Assignee</span>
          <select
            value={search.assignee ?? ''}
            onChange={(event) => updateSearch({ assignee: event.target.value })}
          >
            <option value="">All assignees</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Sort</span>
          <select
            value={search.sort ?? ''}
            onChange={(event) =>
              updateSearch({
                sort: event.target.value as TaskBoardSort | '',
              })
            }
          >
            <option value="">Board order</option>
            {taskBoardSorts.map((sort) => (
              <option key={sort} value={sort}>
                {sort === 'priority' ? 'Priority' : 'Due date'}
              </option>
            ))}
          </select>
        </label>

        {hasActiveFilters ? (
          <button
            className="button-secondary"
            type="button"
            onClick={() =>
              void navigate({
                search: buildSearch(
                  undefined,
                  undefined,
                  undefined,
                  search.sort,
                  search.task,
                  search.newTask,
                ),
                replace: true,
              })
            }
          >
            Clear filters
          </button>
        ) : null}
      </section>

      <TaskBoard
        projectId={project.id}
        taskIdPrefix={project.key}
        initialTasks={initialTasks}
        members={members}
        selectedTaskId={search.task ?? null}
        onSelectedTaskChange={selectTask}
        isCreatingTask={search.newTask === '1'}
        onCreatingTaskChange={setCreatingTask}
        persistence={projectTaskPersistence}
        filters={{
          ...(search.priority ? { priority: search.priority } : {}),
          ...(search.assignee ? { assigneeId: search.assignee } : {}),
          ...(search.query ? { query: search.query } : {}),
          ...(search.sort ? { sort: search.sort } : {}),
        }}
      />
    </main>
  )
}

function buildSearch(
  priority?: TaskPriority | '',
  assignee?: string,
  query?: string,
  sort?: TaskBoardSort | '',
  task?: string,
  newTask?: '1',
) {
  return {
    ...(priority ? { priority } : {}),
    ...(assignee ? { assignee } : {}),
    ...(query?.trim() ? { query: query.trim() } : {}),
    ...(sort ? { sort } : {}),
    ...(task?.trim() ? { task: task.trim() } : {}),
    ...(newTask === '1' ? { newTask } : {}),
  }
}
