import { useEffect, useRef, useState } from 'react'
import { useLoaderData, useNavigate, useSearch } from '@tanstack/react-router'

import {
  refreshConfiguredProjectTasks,
  retryConfiguredProjectTaskSync,
} from '@/entities/task/lib/task-persistence'
import { taskPriorities, type TaskPriority } from '@/entities/task/model/task'
import { WorkspaceShell } from '@/widgets/workspace-shell/workspace-shell'
import {
  type TaskBoardSort,
  taskBoardSorts,
} from '@/widgets/task-board/model/task-board-view'

import { ProjectBoardMemoryRecovery } from './project-board-memory-recovery'
import { ProjectBoardPersistenceAlert } from './project-board-persistence-alert'
import { getProjectBoardShortcut } from './project-board-shortcuts'
import { ProjectBoardStorageHealth } from './project-board-storage-health'
import { ProjectBoardSyncStatus } from './project-board-sync-status'
import { ProjectTaskViews } from './project-task-views'
import {
  projectViewLabels,
  projectViews,
  type ProjectView,
} from './project-view'
import './project-board-page.css'

const projectRoutePath =
  '/workspaces/$workspaceSlug/projects/$projectId' as const
const appBaseUrl = import.meta.env.BASE_URL

export function ProjectBoardPage() {
  const search = useSearch({ from: projectRoutePath })
  const navigate = useNavigate({ from: projectRoutePath })
  const { workspace, project, members, initialTasks } = useLoaderData({
    from: projectRoutePath,
  })
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [hasPersistenceFailure, setHasPersistenceFailure] = useState(false)
  const activeView = search.view ?? 'board'

  useEffect(() => {
    function syncAndRefresh() {
      void retryConfiguredProjectTaskSync(project.id, () => {
        setHasPersistenceFailure(true)
      }).then(() =>
        refreshConfiguredProjectTasks(project.id, () => {
          setHasPersistenceFailure(true)
        }),
      )
    }

    syncAndRefresh()
    window.addEventListener('online', syncAndRefresh)
    return () => window.removeEventListener('online', syncAndRefresh)
  }, [project.id])

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
            'board',
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
          activeView,
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
          activeView,
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
          'board',
        ),
      replace: !isCreating,
    })
  }

  function switchProjectView(view: ProjectView) {
    void navigate({
      search: () =>
        buildSearch(
          search.priority,
          search.assignee,
          search.query,
          search.sort,
          undefined,
          undefined,
          view,
        ),
      replace: true,
    })
  }

  const hasActiveFilters = Boolean(
    search.query || search.priority || search.assignee,
  )
  const filters = {
    ...(search.priority ? { priority: search.priority } : {}),
    ...(search.assignee ? { assigneeId: search.assignee } : {}),
    ...(search.query ? { query: search.query } : {}),
    ...(search.sort ? { sort: search.sort } : {}),
  }

  return (
    <WorkspaceShell
      activeModuleId="work"
      activeSectionId="projects"
      pageLabel={`Work / ${project.name}`}
    >
      <div className="project-board-shell project-detail-page">
        <nav className="project-board-nav" aria-label="Project navigation">
          <a href={`${appBaseUrl}modules/work/projects`}>← Projects</a>
          <span>{workspace.name}</span>
          <span aria-hidden="true">/</span>
          <strong>{project.key}</strong>
        </nav>

        <header className="workspace-header project-board-header">
          <div>
            <p className="eyebrow">Active project</p>
            <h1>{project.name}</h1>
            <p className="project-description">{project.description}</p>
          </div>
          <div className="project-board-members">
            <ProjectBoardSyncStatus projectId={project.id} />
            <span className="project-member-label">Team</span>
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
          </div>
        </header>

        <nav className="project-view-nav" aria-label="Project views">
          {projectViews.map((view) => (
            <button
              className={view === activeView ? 'is-active' : ''}
              type="button"
              key={view}
              aria-current={view === activeView ? 'page' : undefined}
              onClick={() => switchProjectView(view)}
            >
              {projectViewLabels[view]}
            </button>
          ))}
        </nav>

        <ProjectBoardStorageHealth />
        <ProjectBoardMemoryRecovery projectId={project.id} />

        {hasPersistenceFailure ? (
          <ProjectBoardPersistenceAlert
            onDismiss={() => setHasPersistenceFailure(false)}
          />
        ) : null}

        {activeView !== 'files' ? (
          <section className="board-filters" aria-label="Task filters">
            <label className="board-filter-search">
              <span>Search</span>
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search tasks"
                value={search.query ?? ''}
                aria-keyshortcuts="/"
                title="Press / to focus search"
                onChange={(event) =>
                  updateSearch({ query: event.target.value })
                }
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
                onChange={(event) =>
                  updateSearch({ assignee: event.target.value })
                }
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
                className="button-secondary board-filter-clear"
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
                      activeView,
                    ),
                    replace: true,
                  })
                }
              >
                Clear filters
              </button>
            ) : null}
          </section>
        ) : null}

        <ProjectTaskViews
          view={activeView}
          projectId={project.id}
          taskIdPrefix={project.key}
          initialTasks={initialTasks}
          members={members}
          selectedTaskId={search.task ?? null}
          onSelectedTaskChange={selectTask}
          isCreatingTask={search.newTask === '1'}
          onCreatingTaskChange={setCreatingTask}
          onPersistenceFailure={() => setHasPersistenceFailure(true)}
          filters={filters}
        />
      </div>
    </WorkspaceShell>
  )
}

function buildSearch(
  priority?: TaskPriority | '',
  assignee?: string,
  query?: string,
  sort?: TaskBoardSort | '',
  task?: string,
  newTask?: '1',
  view?: ProjectView,
) {
  return {
    ...(priority ? { priority } : {}),
    ...(assignee ? { assignee } : {}),
    ...(query?.trim() ? { query: query.trim() } : {}),
    ...(sort ? { sort } : {}),
    ...(view && view !== 'board' ? { view } : {}),
    ...(task?.trim() ? { task: task.trim() } : {}),
    ...(newTask === '1' ? { newTask } : {}),
  }
}
