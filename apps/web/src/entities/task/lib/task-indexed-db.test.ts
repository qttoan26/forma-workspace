import { afterEach, beforeEach, vi } from 'vitest'

import { createTaskActivityEntry } from '@/entities/task/model/task-activity'
import {
  getBrowserStorageHealth,
  reportBrowserStorageSuccess,
} from '@/shared/lib/browser-storage-health'

import {
  appendTaskActivityToIndexedDb,
  completeProjectTaskSync,
  loadProjectTaskSnapshotFromIndexedDb,
  loadQueuedProjectTaskSync,
  loadTaskActivityFromIndexedDb,
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
    await expect(
      loadTaskActivityFromIndexedDb('project-1', 'FOR-18'),
    ).resolves.toEqual([])
    await expect(
      completeProjectTaskSync('project-1', 'mutation-1'),
    ).resolves.toBe(false)

    expect(getBrowserStorageHealth('indexed-db')).toMatchObject({
      status: 'unavailable',
      lastErrorName: 'NotSupportedError',
    })
  })

  it('rejects writes without crashing the fallback path', async () => {
    await expect(saveProjectTasksToIndexedDb('project-1', [])).rejects.toThrow(
      'IndexedDB is unavailable',
    )

    const entry = createTaskActivityEntry({
      projectId: 'project-1',
      taskId: 'FOR-18',
      kind: 'comment',
      body: 'Ready for review',
    })
    await expect(
      appendTaskActivityToIndexedDb('project-1', 'FOR-18', entry),
    ).rejects.toThrow('IndexedDB is unavailable')

    expect(getBrowserStorageHealth('indexed-db').status).toBe('unavailable')
  })
})
