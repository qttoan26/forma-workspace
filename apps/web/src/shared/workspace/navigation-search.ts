import { workspaceModules } from './module-registry'
import { getModuleSections, moduleSectionPath } from './module-section-registry'

export type NavigationSearchEntry = {
  id: string
  label: string
  context: string
  description: string
  path: string
  status: 'available' | 'implementation'
}

const navigationEntries: NavigationSearchEntry[] = [
  {
    id: 'workspace-overview',
    label: 'Overview',
    context: 'Workspace',
    description: 'Workspace summary and operational areas',
    path: '/',
    status: 'available',
  },
  ...workspaceModules.flatMap((module) => [
    {
      id: module.id,
      label: module.label,
      context: 'Module overview',
      description: module.description,
      path: module.path,
      status: module.status,
    },
    ...getModuleSections(module.id).map((section) => ({
      id: `${module.id}/${section.id}`,
      label: section.label,
      context: module.label,
      description: section.description,
      path: moduleSectionPath(module.id, section.id),
      status: section.status,
    })),
  ]),
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function searchWorkspaceNavigation(query: string) {
  const normalizedQuery = normalize(query)
  const terms = normalizedQuery.split(/\s+/).filter(Boolean)
  const matches = navigationEntries
    .filter((entry) => {
      const text = normalize(
        `${entry.label} ${entry.context} ${entry.description}`,
      )
      return terms.every((term) => text.includes(term))
    })
    .map((entry, index) => {
      const label = normalize(entry.label)
      const score = !normalizedQuery
        ? 0
        : label === normalizedQuery
          ? 3
          : label.startsWith(normalizedQuery)
            ? 2
            : label.includes(normalizedQuery)
              ? 1
              : 0
      return { entry, score, index }
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
  return {
    entries: matches.slice(0, 10).map(({ entry }) => entry),
    total: matches.length,
  }
}
