import {
  useNavigate,
  useParams,
  useRouteContext,
  useSearch,
} from '@tanstack/react-router'

import { ModulePage } from '@/pages/module/module-page'
import {
  compactWorkTaskSearch,
  parseWorkTaskSearch,
  type WorkTaskSearch,
} from './work-task-filters'

export function ModuleRoutePage() {
  const params = useParams({ strict: false })
  const moduleId = params.moduleId ?? ''
  const sectionId = params.sectionId
  const search = useSearch({ strict: false })
  const navigate = useNavigate()
  const accountId = useRouteContext({
    strict: false,
    select: (context) => context.user?.id,
  })

  function updateSearch(next: WorkTaskSearch) {
    void navigate({
      to: '.',
      search: compactWorkTaskSearch(next),
      replace: true,
    })
  }

  return (
    <ModulePage
      moduleId={moduleId}
      sectionId={sectionId}
      accountId={accountId}
      taskSearch={parseWorkTaskSearch(search)}
      onTaskSearchChange={updateSearch}
    />
  )
}
