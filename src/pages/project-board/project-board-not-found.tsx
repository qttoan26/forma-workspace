import { Link } from '@tanstack/react-router'

interface ProjectBoardNotFoundProps {
  data?: unknown
}

function readRouteIdentity(data: unknown) {
  if (
    typeof data === 'object' &&
    data !== null &&
    'workspaceSlug' in data &&
    'projectId' in data &&
    typeof data.workspaceSlug === 'string' &&
    typeof data.projectId === 'string'
  ) {
    return {
      workspaceSlug: data.workspaceSlug,
      projectId: data.projectId,
    }
  }

  return null
}

export function ProjectBoardNotFound({ data }: ProjectBoardNotFoundProps) {
  const identity = readRouteIdentity(data)

  return (
    <main className="home-shell" id="main-content">
      <section className="hero" aria-labelledby="project-not-found-title">
        <p className="eyebrow">Forma Workspace</p>
        <h1 id="project-not-found-title">Project not found</h1>
        <p className="hero-copy">
          {identity
            ? `We could not find project ${identity.projectId} in workspace ${identity.workspaceSlug}.`
            : 'We could not find the project you requested.'}
        </p>
        <Link to="/">Back to workspace home</Link>
      </section>
    </main>
  )
}
