import { useProjectCatalog } from './use-project-catalog'
import './work-projects.css'

export function ProjectPicker({
  projectId,
  projectName,
  accountId,
  onChange,
}: {
  projectId: string
  projectName?: string
  accountId?: string | undefined
  onChange: (id: string) => void
}) {
  const catalog = useProjectCatalog(accountId)
  return (
    <div>
      <label className="project-picker">
        Current project
        <select
          value={projectId}
          onChange={(event) => onChange(event.target.value)}
        >
          {!catalog.projects.some((project) => project.id === projectId) ? (
            <option value={projectId}>
              {projectName ?? 'Current project'}
            </option>
          ) : null}
          {catalog.projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      {catalog.error ? (
        <p className="work-data-context" role="alert">
          Other saved projects could not be loaded.{' '}
          <button
            type="button"
            className="button-secondary"
            onClick={catalog.retry}
          >
            Retry projects
          </button>
        </p>
      ) : null}
    </div>
  )
}
