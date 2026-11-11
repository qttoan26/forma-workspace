import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Chart,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  LinearScale,
  PieController,
  Tooltip,
} from 'chart.js'

import type { Member } from '@/entities/member/model/member'
import type { Task } from '@/entities/task/model/task'
import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'
import {
  DoughnutChartIcon,
  GroupedBarChartIcon,
  HorizontalBarChartIcon,
  PieChartIcon,
  StackedBarChartIcon,
} from '@/shared/ui/workspace-icons'

import { ChartTypeToggle } from './chart-type-toggle'
import { summarizeWork } from './model/work-insights'
import './work-insights.css'

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  LinearScale,
  PieController,
  Tooltip,
)

const statusColors = ['#8295a7', '#4078bc', '#cc8a26', '#19816b']
const workloadColors = ['#4078bc', '#19816b']

type StatusChartKind = 'doughnut' | 'pie' | 'bar'
type WorkloadChartMode = 'stacked' | 'grouped'

const statusChartOptions = [
  { value: 'doughnut', label: 'Doughnut', icon: DoughnutChartIcon },
  { value: 'pie', label: 'Pie', icon: PieChartIcon },
  { value: 'bar', label: 'Horizontal bars', icon: HorizontalBarChartIcon },
] as const
const workloadChartOptions = [
  { value: 'stacked', label: 'Stacked bars', icon: StackedBarChartIcon },
  { value: 'grouped', label: 'Grouped bars', icon: GroupedBarChartIcon },
] as const

export function WorkInsights({
  tasks,
  members,
  projectName,
}: {
  tasks: Task[]
  members: Member[]
  projectName: string
}) {
  const [statusKind, setStatusKind] = useState<StatusChartKind>('doughnut')
  const [workloadMode, setWorkloadMode] = useState<WorkloadChartMode>('stacked')
  const summary = useMemo(() => summarizeWork(tasks, members), [tasks, members])
  const statusSeries = useMemo(
    () => [
      { label: 'Tasks', values: summary.statuses.map((item) => item.count) },
    ],
    [summary],
  )
  const workloadSeries = useMemo(
    () => [
      { label: 'Open', values: summary.owners.map((owner) => owner.open) },
      {
        label: 'Completed',
        values: summary.owners.map((owner) => owner.completed),
      },
    ],
    [summary],
  )
  const statusLabels = useMemo(
    () => summary.statuses.map((item) => item.label),
    [summary],
  )
  const ownerLabels = useMemo(
    () => summary.owners.map((owner) => owner.name),
    [summary],
  )
  const statusHeading = useId()
  const workloadHeading = useId()

  return (
    <section className="work-insights" aria-label="Current project analytics">
      <article className="work-insight-card" aria-labelledby={statusHeading}>
        <header>
          <div>
            <small>Delivery snapshot</small>
            <h2 id={statusHeading}>Task status</h2>
          </div>
          <span>{summary.total} tasks</span>
        </header>
        <p className="work-insight-context">
          {projectName} · Current saved tasks
        </p>
        {summary.total ? (
          <>
            <ChartTypeToggle
              label="Task status chart type"
              value={statusKind}
              options={statusChartOptions}
              onChange={setStatusKind}
            />
            <div
              className="work-insight-status-layout"
              data-chart-kind={statusKind}
            >
              <div className="work-insight-status-chart">
                <InsightChart
                  kind={statusKind}
                  label="Task status distribution"
                  labels={statusLabels}
                  series={statusSeries}
                  colors={statusColors}
                />
                {statusKind === 'doughnut' ? (
                  <div className="work-insight-completion" aria-hidden="true">
                    <strong>{summary.completion}%</strong>
                    <span>complete</span>
                  </div>
                ) : null}
              </div>
              <dl className="work-insight-status-data">
                {summary.statuses.map((item, index) => (
                  <div key={item.id}>
                    <dt>
                      <i
                        style={{ backgroundColor: statusColors[index] }}
                        aria-hidden="true"
                      />
                      {item.label}
                    </dt>
                    <dd>{item.count}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="work-insight-footnote">
              {summary.completed} of {summary.total} tasks completed (
              {summary.completion}%).
            </p>
          </>
        ) : (
          <p className="work-insight-empty">
            No tasks yet. Create a task to see the status breakdown.
          </p>
        )}
      </article>
      <article className="work-insight-card" aria-labelledby={workloadHeading}>
        <header>
          <div>
            <small>Team workload</small>
            <h2 id={workloadHeading}>Tasks by owner</h2>
          </div>
          <span>{summary.owners.length} owners</span>
        </header>
        <p className="work-insight-context">
          Open and completed task counts, including unassigned work.
        </p>
        {summary.total ? (
          <>
            <div className="work-insight-workload-controls">
              <ChartTypeToggle
                label="Owner workload chart type"
                value={workloadMode}
                options={workloadChartOptions}
                onChange={setWorkloadMode}
              />
              <div className="work-insight-legend">
                <span>
                  <i
                    style={{ backgroundColor: workloadColors[0] }}
                    aria-hidden="true"
                  />
                  Open
                </span>
                <span>
                  <i
                    style={{ backgroundColor: workloadColors[1] }}
                    aria-hidden="true"
                  />
                  Completed
                </span>
              </div>
            </div>
            <ScrollRegion
              label="Owner workload chart"
              className="work-insight-chart-scroll"
            >
              <div
                className="work-insight-bar"
                style={{
                  height: `${Math.max(
                    10.625,
                    summary.owners.length *
                      (workloadMode === 'stacked' ? 2.375 : 3),
                  )}rem`,
                }}
              >
                <InsightChart
                  kind="bar"
                  stacked={workloadMode === 'stacked'}
                  label="Open and completed tasks by owner"
                  labels={ownerLabels}
                  series={workloadSeries}
                  colors={workloadColors}
                />
              </div>
            </ScrollRegion>
            <details className="work-insight-data">
              <summary>View workload data</summary>
              <ScrollRegion label="Workload data table">
                <table>
                  <caption>Tasks by owner</caption>
                  <thead>
                    <tr>
                      <th scope="col">Owner</th>
                      <th scope="col">Open</th>
                      <th scope="col">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.owners.map((owner) => (
                      <tr key={owner.id}>
                        <th scope="row">{owner.name}</th>
                        <td>{owner.open}</td>
                        <td>{owner.completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>
            </details>
          </>
        ) : (
          <p className="work-insight-empty">
            No task assignments to summarize.
          </p>
        )}
      </article>
    </section>
  )
}

interface InsightChartProps {
  kind: StatusChartKind
  stacked?: boolean
  label: string
  labels: string[]
  series: { label: string; values: number[] }[]
  colors: string[]
}

function InsightChart({
  kind,
  stacked = false,
  label,
  labels,
  series,
  colors,
}: InsightChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const font = { family: getComputedStyle(canvas).fontFamily }
    const chart = new Chart(canvas, {
      type: kind,
      data: {
        labels,
        datasets: series.map((item, index) => ({
          label: item.label,
          data: item.values,
          backgroundColor: series.length === 1 ? colors : colors[index],
          borderWidth: 0,
          ...(kind === 'bar' ? { borderRadius: 4, maxBarThickness: 24 } : {}),
        })),
      },
      options: {
        font,
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        resizeDelay: 80,
        ...(kind === 'bar'
          ? {
              indexAxis: 'y' as const,
              scales: {
                x: {
                  stacked,
                  beginAtZero: true,
                  ticks: { precision: 0, color: '#52646f' },
                  grid: { color: '#e8eef0' },
                },
                y: {
                  stacked,
                  ticks: { color: '#344b57' },
                  grid: { display: false },
                },
              },
            }
          : { cutout: kind === 'doughnut' ? '74%' : 0 }),
        plugins: {
          tooltip: { enabled: true, bodyFont: font, titleFont: font },
        },
      },
    })
    let disposed = false
    // Re-measure canvas labels after the fallback webfont has loaded.
    void document.fonts?.ready.then(() => {
      if (!disposed) chart.update('none')
    })
    return () => {
      disposed = true
      chart.destroy()
    }
  }, [kind, stacked, labels, series, colors])
  return (
    <canvas ref={canvasRef} role="img" aria-label={label}>
      Chart data is also available in the adjacent labels or workload data
      table.
    </canvas>
  )
}
