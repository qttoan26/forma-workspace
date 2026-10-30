import type { Task } from '@/entities/task/model/task'
import {
  resetFrontendAuthSessionProvider,
  setFrontendAuthSessionProvider,
} from '@/shared/lib/auth-session'

import { loadProjectTasks, saveProjectTasks } from './task-storage'

const fallbackTask: Task = {
  id: 'FOR-01',
  projectId: 'project-1',
  title: 'Seed task',
  status: 'todo',
  priority: 'medium',
}

const fallback: Task[] = [fallbackTask]

describe('task storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetFrontendAuthSessionProvider()
  })

  afterEach(() => {
    resetFrontendAuthSessionProvider()
  })

  it('round-trips valid project tasks', () => {
    const tasks: Task[] = [
      {
        ...fallbackTask,
        title: 'Persisted task',
      },
    ]

    saveProjectTasks('project-1', tasks)

    expect(loadProjectTasks('project-1', fallback)).toEqual(tasks)
  })

  it('migrates the legacy local-development task key', () => {
    const tasks = [{ ...fallbackTask, title: 'Legacy task' }]
    window.localStorage.setItem(
      'forma:tasks:v1:project-1',
      JSON.stringify(tasks),
    )

    expect(loadProjectTasks('project-1', fallback)).toEqual(tasks)
    expect(window.localStorage.getItem('forma:tasks:v1:project-1')).toBeNull()
    expect(
      window.localStorage.getItem(
        'forma:tasks:v2:local-development-user:project-1',
      ),
    ).toBe(JSON.stringify(tasks))
  })

  it('isolates cached tasks between authenticated users', () => {
    setFrontendAuthSessionProvider({
      getSubject: () => 'user-a',
      getAccessToken: () => 'token-a',
    })
    const userATasks = [{ ...fallbackTask, title: 'User A task' }]
    saveProjectTasks('project-1', userATasks)

    setFrontendAuthSessionProvider({
      getSubject: () => 'user-b',
      getAccessToken: () => 'token-b',
    })

    expect(loadProjectTasks('project-1', fallback)).toEqual(fallback)

    const userBTasks = [{ ...fallbackTask, title: 'User B task' }]
    saveProjectTasks('project-1', userBTasks)

    setFrontendAuthSessionProvider({
      getSubject: () => 'user-a',
      getAccessToken: () => 'token-a',
    })
    expect(loadProjectTasks('project-1', fallback)).toEqual(userATasks)
  })

  it('does not expose legacy local-development tasks to authenticated users', () => {
    window.localStorage.setItem(
      'forma:tasks:v1:project-1',
      JSON.stringify([{ ...fallbackTask, title: 'Legacy task' }]),
    )
    setFrontendAuthSessionProvider({
      getSubject: () => 'user-a',
      getAccessToken: () => 'token-a',
    })

    expect(loadProjectTasks('project-1', fallback)).toEqual(fallback)
  })

  it('falls back when persisted tasks belong to another project', () => {
    window.localStorage.setItem(
      'forma:tasks:v1:project-1',
      JSON.stringify([{ ...fallbackTask, projectId: 'project-2' }]),
    )

    expect(loadProjectTasks('project-1', fallback)).toEqual(fallback)
  })

  it('falls back when persisted tasks fail the shared task schema', () => {
    window.localStorage.setItem(
      'forma:tasks:v1:project-1',
      JSON.stringify([{ ...fallbackTask, priority: 'critical' }]),
    )

    expect(loadProjectTasks('project-1', fallback)).toEqual(fallback)
  })

  it('falls back when persisted tasks contain duplicate IDs', () => {
    const duplicateTasks = [
      fallbackTask,
      {
        ...fallbackTask,
        title: 'Duplicate task ID',
      },
    ]

    window.localStorage.setItem(
      'forma:tasks:v1:project-1',
      JSON.stringify(duplicateTasks),
    )

    expect(loadProjectTasks('project-1', fallback)).toEqual(fallback)
  })
})
