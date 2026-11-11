import type { ChartConfiguration } from 'chart.js'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initialTasks, members } from '@/test/fixtures/project-board'

import { WorkInsights } from './work-insights'

const chartMocks = vi.hoisted(() => ({
  create:
    vi.fn<(canvas: HTMLCanvasElement, config: ChartConfiguration) => void>(),
  destroy: vi.fn(),
}))
vi.mock('chart.js', () => ({
  Chart: class {
    static register() {}

    constructor(canvas: HTMLCanvasElement, config: ChartConfiguration) {
      chartMocks.create(canvas, config)
    }

    destroy = chartMocks.destroy
  },
  ArcElement: {},
  BarController: {},
  BarElement: {},
  CategoryScale: {},
  DoughnutController: {},
  LinearScale: {},
  PieController: {},
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

  it('switches each chart independently and keeps the saved values and data table', () => {
    render(
      <WorkInsights
        tasks={initialTasks}
        members={members}
        projectName="Product launch"
      />,
    )
    const status = screen.getByRole('group', {
      name: 'Task status chart type',
    })
    const workload = screen.getByRole('group', {
      name: 'Owner workload chart type',
    })
    const statusCanvas = screen.getByRole('img', {
      name: 'Task status distribution',
    })
    const workloadCanvas = screen.getByRole('img', {
      name: 'Open and completed tasks by owner',
    })
    expect(
      within(status).getByRole('button', { name: 'Doughnut', pressed: true }),
    ).toBeVisible()
    expect(
      within(workload).getByRole('button', {
        name: 'Stacked bars',
        pressed: true,
      }),
    ).toBeVisible()
    const statusData = chartMocks.create.mock.calls[0]?.[1].data
    const workloadData = chartMocks.create.mock.calls[1]?.[1].data

    fireEvent.click(within(status).getByRole('button', { name: 'Pie' }))
    expect(chartMocks.create.mock.lastCall?.[0]).toBe(statusCanvas)
    expect(chartMocks.create.mock.lastCall?.[1]).toMatchObject({
      type: 'pie',
      data: statusData,
    })
    fireEvent.click(
      within(status).getByRole('button', { name: 'Horizontal bars' }),
    )
    const statusBars = chartMocks.create.mock.lastCall?.[1]
    expect(statusBars).toMatchObject({
      type: 'bar',
      options: { indexAxis: 'y' },
    })
    expect(statusBars?.data.labels).toEqual(statusData?.labels)
    expect(statusBars?.data.datasets[0]?.data).toEqual(
      statusData?.datasets[0]?.data,
    )

    fireEvent.click(
      within(workload).getByRole('button', { name: 'Grouped bars' }),
    )
    expect(chartMocks.create.mock.lastCall?.[0]).toBe(workloadCanvas)
    expect(chartMocks.create.mock.lastCall?.[1]).toMatchObject({
      type: 'bar',
      data: workloadData,
      options: {
        scales: { x: { stacked: false }, y: { stacked: false } },
      },
    })
    expect(chartMocks.create).toHaveBeenCalledTimes(5)
    expect(chartMocks.destroy).toHaveBeenCalledTimes(3)
    expect(
      within(status).getAllByRole('button', { pressed: true }),
    ).toHaveLength(1)
    expect(
      within(status).getByRole('button', {
        name: 'Horizontal bars',
        pressed: true,
      }),
    ).toBeVisible()
    expect(
      within(workload).getAllByRole('button', { pressed: true }),
    ).toHaveLength(1)
    expect(
      within(workload).getByRole('button', {
        name: 'Grouped bars',
        pressed: true,
      }),
    ).toBeVisible()
    fireEvent.click(
      within(status).getByRole('button', { name: 'Horizontal bars' }),
    )
    expect(chartMocks.create).toHaveBeenCalledTimes(5)
    expect(
      within(status).getByRole('button', {
        name: 'Horizontal bars',
        pressed: true,
      }),
    ).toBeVisible()
    expect(screen.getByText('1 of 4 tasks completed (25%).')).toBeVisible()
    expect(
      screen.getByRole('table', { name: 'Tasks by owner', hidden: true }),
    ).toBeInTheDocument()
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
