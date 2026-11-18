// Keep project context across modules that consume the same Work sources.
// The project catalog and unrelated modules have no selected-project scope.
export function projectContextHref(path: string, projectId?: string) {
  const href = `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
  const match = /^\/modules\/(work|documents|production)(?:\/([^/?#]+))?$/.exec(
    path,
  )
  return projectId &&
    projectId !== 'project-1' &&
    match &&
    !(match[1] === 'work' && match[2] === 'projects')
    ? `${href}?project=${encodeURIComponent(projectId)}`
    : href
}
