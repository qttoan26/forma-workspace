export function projectHref(workspaceSlug: string, projectId: string) {
  return `${import.meta.env.BASE_URL}workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectId)}`
}
