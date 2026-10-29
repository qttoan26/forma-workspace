import { afterEach, beforeEach, vi } from 'vitest'

import {
  getBrowserStorageHealth,
  reportBrowserStorageSuccess,
} from '@/shared/lib/browser-storage-health'

import {
  completeProjectTaskSync,
  loadProjectTaskSnapshotFromIndexedDb,
  loadQueuedProjectTaskSync,
  saveProjectTasksToIndexedDb,
} from './task-indexed-db'

beforeEach(() => {
  reportBrowserStorageSuccess('indexed-db')
  vi.stubGlobal('indexedDB', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('task IndexedDB fallback', () => {
  it('returns safe empty values when IndexedDB is unavailable', async () => {
    await expect(
      loadProjectTaskSnapshotFromIndexedDb('project-1'),
    ).resolves.toBeNull()
    await expect(loadQueuedProjectTaskSync('project-1')).resolves.toBeNull()
    await expect(completeProjectTaskSync('project-1', 'mutation-1')).resolves.toBe(
      false,
    )

    expect(getBrowserStorageHealth('indexed-db')).toMatchObject({
      status: 'unavailable',
      lastErrorName: 'NotSupportedError',
    })
  })

  it('rejects writes without crashing the fallback path', async () => {
    await expect(saveProjectTasksToIndexedDb('project-1', [])).rejects.toThrow(
      'IndexedDB is unavailable',
    )
    expect(getBrowserStorageHealth('indexed-db').status).toBe('unavailable')
  })
})
