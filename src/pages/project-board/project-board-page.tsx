import { useNavigate, useSearch } from '@tanstack/react-router'

import { taskPriorities, type TaskPriority } from '@/entities/task/model/task'
import { TaskBoard } from '@/widgets/task-board/task-board'

import { initialTasks, members, project, workspace } from './project-board-data'

const projectRoutePath =
  '/workspaces/$workspaceSlug/projects/$projectId' as const

export function ProjectBoardPage() {
  const search = useSearch({ from: projectRoutePath })
  const navigate = useNavigate({ from: projectRoutePath })

  function updateSearch(next: {
    priority?: TaskPriority | ''
    assignee?: string
    query?: string
  }) {
    void navigate({
      search: () =>
        buildSearch(
          next.priority ?? search.priority,
          next.assignee ?? search.assignee,
          next.query ?? search.query,
        ),
      replace: true,
    })
  }

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
            type="search"
            placeholder="Search tasks"
            value={search.query ?? ''}
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
      </section>

      <TaskBoard
        initialTasks={initialTasks}
        members={members}
        filters={{
          ...(search.priority ? { priority: search.priority } : {}),
          ...(search.assignee ? { assigneeId: search.assignee } : {}),
          ...(search.query ? { query: search.query } : {}),
        }}
      />
    </main>
  )
}

function buildSearch(
  priority?: TaskPriority | '',
  assignee?: string,
  query?: string,
) {
  return {
    ...(priority ? { priority } : {}),
    ...(assignee ? { assignee } : {}),
    ...(query?.trim() ? { query: query.trim() } : {}),
  }
}
