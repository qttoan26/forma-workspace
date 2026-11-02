import { useCallback, useSyncExternalStore } from 'react'
import {
  readProductionJobs,
  refreshProductionJobs,
  subscribeProductionJobs,
} from './production-job-storage'
import type { ProductionJob } from '../model/production-job'

const emptyJobs: ProductionJob[] = []
export function useProductionJobs(projectId: string) {
  const getSnapshot = useCallback(() => {
    try {
      return readProductionJobs(projectId)
    } catch {
      return null
    }
  }, [projectId])
  const subscribe = useCallback(
    (onChange: () => void) => subscribeProductionJobs(projectId, onChange),
    [projectId],
  )
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const refresh = useCallback(
    () => refreshProductionJobs(projectId),
    [projectId],
  )
  return { jobs: snapshot ?? emptyJobs, error: snapshot === null, refresh }
}
