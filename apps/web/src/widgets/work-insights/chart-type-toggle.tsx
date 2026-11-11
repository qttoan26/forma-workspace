import { useId } from 'react'
import type { ComponentType, SVGProps } from 'react'

interface ChartTypeOption<Value extends string> {
  value: Value
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export function ChartTypeToggle<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: Value
  options: readonly ChartTypeOption<Value>[]
  onChange: (value: Value) => void
}) {
  const labelId = useId()

  return (
    <div className="work-insight-chart-type">
      <span id={labelId}>Chart type</span>
      <div
        className="work-insight-chart-toggle"
        role="group"
        aria-label={label}
        aria-describedby={labelId}
      >
        {options.map(({ value: option, label: name, icon: Icon }) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            title={name}
            onClick={() => onChange(option)}
          >
            <Icon />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
