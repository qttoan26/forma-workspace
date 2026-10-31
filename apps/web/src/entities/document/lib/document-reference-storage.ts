import {
  documentReferenceCollectionSchema,
  type DocumentReference,
} from '@/entities/document/model/document-reference'
import {
  reportBrowserStorageFailure,
  reportBrowserStorageSuccess,
} from '@/shared/lib/browser-storage-health'

const storagePrefix = 'forma-workspace:project-document-references:v1'

export function loadProjectDocumentReferences(
  projectId: string,
): DocumentReference[] {
  if (!hasLocalStorage()) return []

  try {
    const raw = globalThis.localStorage.getItem(createStorageKey(projectId))
    if (!raw) return []

    const result = documentReferenceCollectionSchema.safeParse(JSON.parse(raw))
    if (!result.success) return []

    const references = result.data.filter(
      (reference) => reference.projectId === projectId,
    )
    reportBrowserStorageSuccess('local-storage')
    return references
  } catch (error) {
    reportBrowserStorageFailure('local-storage', error)
    return []
  }
}

export function saveProjectDocumentReferences(
  projectId: string,
  references: DocumentReference[],
) {
  if (!hasLocalStorage()) {
    throw new Error('Local storage is unavailable')
  }

  const parsed = documentReferenceCollectionSchema.parse(references)
  if (!parsed.every((reference) => reference.projectId === projectId)) {
    throw new Error('Document references do not match project scope')
  }

  try {
    globalThis.localStorage.setItem(
      createStorageKey(projectId),
      JSON.stringify(parsed),
    )
    reportBrowserStorageSuccess('local-storage')
  } catch (error) {
    reportBrowserStorageFailure('local-storage', error)
    throw error
  }
}

function createStorageKey(projectId: string) {
  return `${storagePrefix}:${projectId}`
}

function hasLocalStorage() {
  try {
    return 'localStorage' in globalThis && Boolean(globalThis.localStorage)
  } catch (error) {
    reportBrowserStorageFailure('local-storage', error)
    return false
  }
}
