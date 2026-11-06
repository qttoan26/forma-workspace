import {
  documentReferenceCollectionSchema,
  type DocumentReference,
} from '@/entities/document/model/document-reference'
import {
  reportBrowserStorageFailure,
  reportBrowserStorageSuccess,
} from '@/shared/lib/browser-storage-health'

const storagePrefix = 'forma-workspace:project-document-references:v1'
export const documentReferenceChangeEvent = 'forma:document-references-change'
const readCache = new Map<
  string,
  { raw: string | null; references: DocumentReference[] }
>()

export function loadProjectDocumentReferences(
  projectId: string,
): DocumentReference[] {
  try {
    return readProjectDocumentReferences(projectId)
  } catch {
    return []
  }
}

// Editors must distinguish unreadable data from an empty collection.
export function readProjectDocumentReferences(
  projectId: string,
): DocumentReference[] {
  try {
    if (!hasLocalStorage()) throw new Error('Local storage is unavailable')
    const raw = globalThis.localStorage.getItem(createStorageKey(projectId))
    const cached = readCache.get(projectId)
    if (cached && cached.raw === raw) return cached.references
    const references = raw
      ? documentReferenceCollectionSchema.parse(JSON.parse(raw))
      : []
    validateScope(projectId, references)
    readCache.set(projectId, { raw, references })
    reportBrowserStorageSuccess('local-storage')
    return references
  } catch (error) {
    reportBrowserStorageFailure('local-storage', error)
    throw error
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
  validateScope(projectId, parsed)

  try {
    globalThis.localStorage.setItem(
      createStorageKey(projectId),
      JSON.stringify(parsed),
    )
    reportBrowserStorageSuccess('local-storage')
    dispatchDocumentReferenceChange(projectId)
  } catch (error) {
    reportBrowserStorageFailure('local-storage', error)
    throw error
  }
}

function validateScope(projectId: string, references: DocumentReference[]) {
  if (!references.every((reference) => reference.projectId === projectId)) {
    throw new Error('Document references do not match project scope')
  }
  if (
    new Set(references.map((reference) => reference.id)).size !==
    references.length
  ) {
    throw new Error('Duplicate document reference IDs')
  }
}

export class DocumentReferenceConflict extends Error {
  constructor() {
    super(
      'This reference changed in another view. Close the editor and reopen the latest reference.',
    )
  }
}

// All interactive writers share this lock and re-read inside it, rather than
// replacing a collection captured when a panel first mounted.
export async function mutateProjectDocumentReference(
  projectId: string,
  mutation:
    | { kind: 'add'; reference: DocumentReference }
    | {
        kind: 'update'
        expected: DocumentReference
        reference: DocumentReference
      }
    | { kind: 'remove'; expected: DocumentReference },
): Promise<DocumentReference[]> {
  function commit() {
    const current = readProjectDocumentReferences(projectId)
    let next: DocumentReference[]
    if (mutation.kind === 'add') {
      if (current.some((reference) => reference.id === mutation.reference.id))
        throw new DocumentReferenceConflict()
      next = [...current, mutation.reference]
    } else {
      const existing = current.find(
        (reference) => reference.id === mutation.expected.id,
      )
      if (
        !existing ||
        JSON.stringify(existing) !== JSON.stringify(mutation.expected)
      )
        throw new DocumentReferenceConflict()
      if (mutation.kind === 'update' && mutation.reference.id !== existing.id)
        throw new Error('Document identity cannot change')
      next =
        mutation.kind === 'remove'
          ? current.filter((reference) => reference.id !== existing.id)
          : current.map((reference) =>
              reference.id === existing.id ? mutation.reference : reference,
            )
    }
    saveProjectDocumentReferences(projectId, next)
    return next
  }
  if (globalThis.navigator?.locks) {
    return navigator.locks.request(createStorageKey(projectId), commit)
  }
  return commit()
}

export function subscribeProjectDocumentReferences(
  projectId: string,
  onChange: () => void,
) {
  function onLocalChange(event: Event) {
    if (
      (event as CustomEvent<{ projectId?: string }>).detail?.projectId ===
      projectId
    )
      onChange()
  }
  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key === createStorageKey(projectId))
      onChange()
  }
  window.addEventListener(documentReferenceChangeEvent, onLocalChange)
  window.addEventListener('storage', onStorage)
  window.addEventListener('focus', onChange)
  return () => {
    window.removeEventListener(documentReferenceChangeEvent, onLocalChange)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('focus', onChange)
  }
}

function dispatchDocumentReferenceChange(projectId: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(documentReferenceChangeEvent, {
      detail: { projectId },
    }),
  )
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
