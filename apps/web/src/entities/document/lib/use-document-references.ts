import { useCallback, useSyncExternalStore } from 'react'
import {
  readProjectDocumentReferences,
  subscribeProjectDocumentReferences,
} from './document-reference-storage'
import type { DocumentReference } from '../model/document-reference'

export function useDocumentReferences(projectId: string) {
  const getSnapshot = useCallback(() => {
    try {
      return readProjectDocumentReferences(projectId)
    } catch {
      return null
    }
  }, [projectId])
  const subscribe = useCallback(
    (onChange: () => void) =>
      subscribeProjectDocumentReferences(projectId, onChange),
    [projectId],
  )
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const refresh = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('forma:document-references-change', {
        detail: { projectId },
      }),
    )
  }, [projectId])
  return {
    references: snapshot ?? emptyReferences,
    error: snapshot === null,
    refresh,
  }
}

const emptyReferences: DocumentReference[] = []
