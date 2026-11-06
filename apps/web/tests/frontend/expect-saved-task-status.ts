import { expect, type Page } from '@playwright/test'
import type { Task, TaskStatus } from '../../src/entities/task/model/task'

export async function expectSavedTaskStatus(
  page: Page,
  taskId: string,
  status: TaskStatus,
) {
  // A hard navigation can interrupt an in-flight browser write. Assert the
  // committed snapshot before testing that the next page reads that snapshot.
  await expect
    .poll(() =>
      page.evaluate(async (id) => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('forma-workspace', 3)
          request.onsuccess = () => resolve(request.result)
          request.onerror = () =>
            reject(request.error ?? new Error('open failed'))
        })
        try {
          return await new Promise<string | undefined>((resolve, reject) => {
            const request = database
              .transaction('project-tasks', 'readonly')
              .objectStore('project-tasks')
              .get('project-1') as IDBRequest<{ tasks: Task[] } | undefined>
            request.onsuccess = () =>
              resolve(
                request.result?.tasks.find((task) => task.id === id)?.status,
              )
            request.onerror = () =>
              reject(request.error ?? new Error('read failed'))
          })
        } finally {
          database.close()
        }
      }, taskId),
    )
    .toBe(status)
}
