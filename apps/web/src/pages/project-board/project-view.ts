export const projectViews = [
  'board',
  'list',
  'table',
  'calendar',
  'timeline',
  'files',
] as const

export type ProjectView = (typeof projectViews)[number]

export const projectViewLabels: Record<ProjectView, string> = {
  board: 'Board',
  list: 'List',
  table: 'Table',
  calendar: 'Calendar',
  timeline: 'Timeline',
  files: 'Files',
}

export function isProjectView(value: unknown): value is ProjectView {
  return (
    typeof value === 'string' &&
    projectViews.includes(value as ProjectView)
  )
}
