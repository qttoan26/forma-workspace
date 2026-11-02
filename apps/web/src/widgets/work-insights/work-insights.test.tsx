import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initialTasks, members } from '@/test/fixtures/project-board'

import { WorkInsights } from './work-insights'

const chartMocks = vi.hoisted(() => ({ destroy: vi.fn() }))
vi.mock('chart.js', () => ({
  Chart: class {
    static register() {}
    destroy = chartMocks.destroy
  },
  ArcElement: {},
  BarController: {},
  BarElement: {},
  CategoryScale: {},
  DoughnutController: {},
  LinearScale: {},
  Tooltip: {},
}))
beforeEach(() => vi.clearAllMocks())

describe('WorkInsights', () => {
  it('provides readable chart data and updates the same saved task snapshot', () => {
    const { rerender, unmount } = render(
      <WorkInsights
        tasks={initialTasks}
        members={members}
        projectName="Product launch"
      />,
    )
    expect(
      screen.getByRole('img', { name: 'Task status distribution' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1 of 4 tasks completed (25%).')).toBeVisible()
    const table = screen.getByRole('table', {
      name: 'Tasks by owner',
      hidden: true,
    })
    expect(within(table).getByText('Sam Lee')).toBeInTheDocument()
    rerender(
      <WorkInsights
        tasks={initialTasks.map((task) => ({ ...task, status: 'done' }))}
        members={members}
        projectName="Product launch"
      />,
    )
    expect(screen.getByText('4 of 4 tasks completed (100%).')).toBeVisible()
    unmount()
    expect(chartMocks.destroy).toHaveBeenCalledTimes(4)
  })

  it('shows explicit empty states instead of empty or fabricated charts', () => {
    render(
      <WorkInsights
        tasks={[]}
        members={members}
        projectName="Product launch"
      />,
    )
    expect(
      screen.getByText(
        'No tasks yet. Create a task to see the status breakdown.',
      ),
    ).toBeVisible()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
