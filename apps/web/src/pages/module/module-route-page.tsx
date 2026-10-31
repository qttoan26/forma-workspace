import { useParams } from '@tanstack/react-router'

import { ModulePage } from '@/pages/module/module-page'

export function ModuleRoutePage() {
  const { moduleId } = useParams({ strict: false })

  return <ModulePage moduleId={moduleId} />
}
