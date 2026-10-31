import { useParams } from '@tanstack/react-router'

import { ModulePage } from '@/pages/module/module-page'

export function ModuleRoutePage() {
  const { moduleId } = useParams({ strict: false }) as { moduleId: string }

  return <ModulePage moduleId={moduleId} />
}
