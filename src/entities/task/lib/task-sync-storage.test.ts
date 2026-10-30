import { afterEach, beforeEach } from 'vitest'

import {
  resetFrontendAuthSessionProvider,
  setFrontendAuthSessionProvider,
} from '@/shared/lib/auth-session'

import {
  getProjectTaskLastSyncedAt,
  getProjectTaskServerRevision,
  getProjectTaskSyncConflictRevision,
  isProjectTaskSyncPending,
  markProjectTaskSyncPending,
  recordProjectTaskServerRevision,
  recordProjectTaskSyncConflict,
  recordProjectTaskSyncSuccess,
} from './task-sync-storage'

const projectId = 'project-1'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  resetFrontendAuthSessionProvider()
})

afterEach(() => {
  resetFrontendAuthSessionProvider()
})

describe('task sync storage', () => {
  it('isolates pending and revision metadata between authenticated users', () => {
    setFrontendAuthSessionProvider({
      getSubject: () => 'user-a',
      getAccessToken: () => 'token-a',
    })
    markProjectTaskSyncPending(projectId)
    recordProjectTaskServerRevision(projectId, 7)

    setFrontendAuthSessionProvider({
      getSubject: () => 'user-b',
      getAccessToken: () => 'token-b',
    })
    expect(isProjectTaskSyncPending(projectId)).toBe(false)
    expect(getProjectTaskServerRevision(projectId)).toBeNull()

    recordProjectTaskServerRevision(projectId, 2)

    setFrontendAuthSessionProvider({
      getSubject: () => 'user-a',
      getAccessToken: () => 'token-a',
    })
    expect(isProjectTaskSyncPending(projectId)).toBe(true)
    expect(getProjectTaskServerRevision(projectId)).toBe(7)
  })

  it('isolates conflict and last-sync metadata between users', () => {
    setFrontendAuthSessionProvider({
      getSubject: () => 'user-a',
      getAccessToken: () => 'token-a',
    })
    recordProjectTaskSyncConflict(projectId, 4)

    setFrontendAuthSessionProvider({
      getSubject: () => 'user-b',
      getAccessToken: () => 'token-b',
    })
    expect(getProjectTaskSyncConflictRevision(projectId)).toBeUndefined()
    expect(getProjectTaskLastSyncedAt(projectId)).toBeNull()

    recordProjectTaskSyncSuccess(projectId, 1)
    expect(getProjectTaskLastSyncedAt(projectId)).not.toBeNull()

    setFrontendAuthSessionProvider({
      getSubject: () => 'user-a',
      getAccessToken: () => 'token-a',
    })
    expect(getProjectTaskSyncConflictRevision(projectId)).toBe(4)
    expect(getProjectTaskLastSyncedAt(projectId)).toBeNull()
  })
})
