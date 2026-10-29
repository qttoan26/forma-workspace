export type BrowserStorageArea =
  | 'indexed-db'
  | 'local-storage'
  | 'session-storage'

export type BrowserStorageStatus =
  | 'unknown'
  | 'healthy'
  | 'degraded'
  | 'unavailable'

export interface BrowserStorageHealth {
  area: BrowserStorageArea
  status: BrowserStorageStatus
  lastErrorName: string | null
  updatedAt: string | null
}

const storageHealth = new Map<BrowserStorageArea, BrowserStorageHealth>()

export function getBrowserStorageHealth(
  area: BrowserStorageArea,
): BrowserStorageHealth {
  return (
    storageHealth.get(area) ?? {
      area,
      status: 'unknown',
      lastErrorName: null,
      updatedAt: null,
    }
  )
}

export function reportBrowserStorageSuccess(area: BrowserStorageArea) {
  storageHealth.set(area, {
    area,
    status: 'healthy',
    lastErrorName: null,
    updatedAt: new Date().toISOString(),
  })
}

export function reportBrowserStorageFailure(
  area: BrowserStorageArea,
  error: unknown,
) {
  storageHealth.set(area, {
    area,
    status: classifyStorageFailure(error),
    lastErrorName: getErrorName(error),
    updatedAt: new Date().toISOString(),
  })
}

export function resolveBrowserStorage(
  area: 'local-storage' | 'session-storage',
): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    const storage =
      area === 'local-storage' ? window.localStorage : window.sessionStorage
    reportBrowserStorageSuccess(area)
    return storage
  } catch (error) {
    reportBrowserStorageFailure(area, error)
    return null
  }
}

export function safeStorageGetItem(
  area: 'local-storage' | 'session-storage',
  storage: Storage | null,
  key: string,
): string | null {
  if (!storage) return null

  try {
    const value = storage.getItem(key)
    reportBrowserStorageSuccess(area)
    return value
  } catch (error) {
    reportBrowserStorageFailure(area, error)
    return null
  }
}

export function safeStorageSetItem(
  area: 'local-storage' | 'session-storage',
  storage: Storage | null,
  key: string,
  value: string,
): boolean {
  if (!storage) return false

  try {
    storage.setItem(key, value)
    reportBrowserStorageSuccess(area)
    return true
  } catch (error) {
    reportBrowserStorageFailure(area, error)
    return false
  }
}

export function safeStorageRemoveItem(
  area: 'local-storage' | 'session-storage',
  storage: Storage | null,
  key: string,
): boolean {
  if (!storage) return false

  try {
    storage.removeItem(key)
    reportBrowserStorageSuccess(area)
    return true
  } catch (error) {
    reportBrowserStorageFailure(area, error)
    return false
  }
}

function classifyStorageFailure(error: unknown): BrowserStorageStatus {
  const name = getErrorName(error)
  if (
    name === 'SecurityError' ||
    name === 'InvalidStateError' ||
    name === 'NotSupportedError'
  ) {
    return 'unavailable'
  }
  return 'degraded'
}

function getErrorName(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string' &&
    error.name
  ) {
    return error.name
  }
  return 'UnknownError'
}
