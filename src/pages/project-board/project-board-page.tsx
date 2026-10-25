import { TaskBoard } from '@/widgets/task-board/task-board'

import { initialTasks, members, project, workspace } from './project-board-data'

export function ProjectBoardPage() {
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
            <span
              key={member.id}
              title={`${member.name} · ${member.role}`}
            >
              {member.initials}
            </span>
          ))}
        </div>
      </header>
      <TaskBoard initialTasks={initialTasks} members={members} />
    </main>
  )
}
