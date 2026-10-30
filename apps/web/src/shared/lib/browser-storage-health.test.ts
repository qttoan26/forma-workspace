import { beforeEach } from 'vitest'

import {
  getBrowserStorageHealth,
  reportBrowserStorageSuccess,
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from './browser-storage-health'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

beforeEach(() => {
  reportBrowserStorageSuccess('local-storage')
  reportBrowserStorageSuccess('session-storage')
})

describe('browser storage health', () => {
  it('reports successful storage operations as healthy', () => {
    const storage = new MemoryStorage()

    expect(safeStorageSetItem('local-storage', storage, 'key', 'value')).toBe(
      true,
    )
    expect(safeStorageGetItem('local-storage', storage, 'key')).toBe('value')
    expect(safeStorageRemoveItem('local-storage', storage, 'key')).toBe(true)
    expect(getBrowserStorageHealth('local-storage').status).toBe('healthy')
  })

  it('degrades gracefully when quota is exceeded', () => {
    const storage = new MemoryStorage()
    storage.setItem = () => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
    }

    expect(safeStorageSetItem('local-storage', storage, 'key', 'value')).toBe(
      false,
    )
    expect(getBrowserStorageHealth('local-storage')).toMatchObject({
      status: 'degraded',
      lastErrorName: 'QuotaExceededError',
    })
  })

  it('marks blocked storage as unavailable', () => {
    const storage = new MemoryStorage()
    storage.getItem = () => {
      throw new DOMException('Storage access blocked', 'SecurityError')
    }

    expect(safeStorageGetItem('session-storage', storage, 'key')).toBeNull()
    expect(getBrowserStorageHealth('session-storage')).toMatchObject({
      status: 'unavailable',
      lastErrorName: 'SecurityError',
    })
  })
})
