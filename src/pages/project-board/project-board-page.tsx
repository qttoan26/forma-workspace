import { useNavigate, useSearch } from '@tanstack/react-router'

import {
  taskPriorities,
  type TaskPriority,
} from '@/entities/task/model/task'
import { TaskBoard } from '@/widgets/task-board/task-board'

import { initialTasks, members, project, workspace } from './project-board-data'

const projectRoutePath = '/workspaces/$workspaceSlug/projects/$projectId' as const

export function ProjectBoardPage() {
  const search = useSearch({ from: projectRoutePath })
  const navigate = useNavigate({ from: projectRoutePath })

  function setPriority(priority: TaskPriority | '') {
    void navigate({
      search: (previous) => {
        const { priority: _priority, ...rest } = previous
        return priority ? { ...rest, priority } : rest
      },
    })
  }

  function setAssignee(assignee: string) {
    void navigate({
      search: (previous) => {
        const { assignee: _assignee, ...rest } = previous
        return assignee ? { ...rest, assignee } : rest
      },
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
          <span>Priority</span>
          <select
            value={search.priority ?? ''}
            onChange={(event) =>
              setPriority(event.target.value as TaskPriority | '')
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
            onChange={(event) => setAssignee(event.target.value)}
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
        }}
      />
    </main>
  )
}
