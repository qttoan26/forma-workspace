import { useParams } from '@tanstack/react-router'

import { ModulePage } from '@/pages/module/module-page'

export function ModuleRoutePage() {
  const params = useParams({ strict: false })
  const moduleId = params.moduleId ?? ''
  const sectionId = params.sectionId

  return <ModulePage moduleId={moduleId} sectionId={sectionId} />
}
