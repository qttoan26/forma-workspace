import { describe, expect, it } from 'vitest'
import { initialTasks, members } from './project-board-data'
import { initialTasks as legacyTasks } from '@/test/fixtures/project-board'
import { upgradeDemoTasks } from './upgrade-demo-tasks'

describe('Avengers demo seed upgrade', () => {
  it('gives each of the six Avengers two descriptive tasks and upgrades the old sample', () => {
    expect(members).toHaveLength(6)
    expect(initialTasks).toHaveLength(12)
    for (const member of members) {
      const assigned = initialTasks.filter(
        (task) => task.assigneeId === member.id,
      )
      expect(assigned).toHaveLength(2)
      expect(
        assigned.every(
          (task) => task.description && task.description.length > 20,
        ),
      ).toBe(true)
    }
    expect(upgradeDemoTasks(legacyTasks)).toEqual(initialTasks)
  })

  it('preserves custom tasks, renamed titles, saved workflow changes, descriptions and deleted old seeds', () => {
    const saved = [
      {
        ...legacyTasks[1]!,
        status: 'done' as const,
        priority: 'low' as const,
        assigneeId: 'member-5',
        dueDate: '2027-01-01',
        description: 'My custom description',
      },
      { ...legacyTasks[2]!, title: 'My custom task title' },
      { ...legacyTasks[3]!, id: 'FOR-99', title: 'My own task' },
    ]
    const upgraded = upgradeDemoTasks(saved)
    expect(upgraded.find((task) => task.id === 'FOR-18')).toMatchObject({
      title: 'Upgrade the Mark LXXXV armor',
      status: 'done',
      priority: 'low',
      assigneeId: 'member-5',
      dueDate: '2027-01-01',
      description: 'My custom description',
    })
    expect(upgraded.find((task) => task.id === 'FOR-21')?.title).toBe(
      'My custom task title',
    )
    expect(upgraded.find((task) => task.id === 'FOR-99')).toEqual(saved[2])
    expect(upgraded.some((task) => task.id === 'FOR-12')).toBe(false)
  })

  it('does not reseed a deleted Avengers task or modify an unrelated project', () => {
    const upgraded = upgradeDemoTasks(legacyTasks).filter(
      (task) => task.id !== 'FOR-29',
    )
    expect(upgradeDemoTasks(upgraded)).toBe(upgraded)
    const otherProject = legacyTasks.map((task) => ({
      ...task,
      projectId: 'another-project',
    }))
    expect(upgradeDemoTasks(otherProject)).toBe(otherProject)
    expect(upgradeDemoTasks([])).toEqual([])
  })
})
