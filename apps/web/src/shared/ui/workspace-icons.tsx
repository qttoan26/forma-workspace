import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      {...props}
    >
      {children}
    </svg>
  )
}

const strokeProps = {
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.8,
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.75 10.5 12 3.75l8.25 6.75" {...strokeProps} />
      <path d="M5.75 9.5v10.25h12.5V9.5" {...strokeProps} />
      <path d="M9.5 19.75v-6h5v6" {...strokeProps} />
    </IconBase>
  )
}

export function ClipboardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="4.5" width="14" height="16" rx="2.5" {...strokeProps} />
      <path d="M9 4.5v-1h6v1" {...strokeProps} />
      <path d="M8.5 10h7M8.5 14h7M8.5 18h4.5" {...strokeProps} />
    </IconBase>
  )
}

export function FactoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.5 20.25V9.75l5 2.75V8.75l5 2.75V5.5h4v14.75Z" {...strokeProps} />
      <path d="M7.25 16h2.5M13 16h2.5" {...strokeProps} />
    </IconBase>
  )
}

export function FileStackIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3.75h7l3 3v10.5A2.75 2.75 0 0 1 14.25 20H7A2.75 2.75 0 0 1 4.25 17.25V6.5A2.75 2.75 0 0 1 7 3.75Z" {...strokeProps} />
      <path d="M14 3.75V7h3" {...strokeProps} />
      <path d="M8 11h5.5M8 14.5h5.5" {...strokeProps} />
    </IconBase>
  )
}

export function SparkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4Z" {...strokeProps} />
      <path d="m18.5 14.5.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7Z" {...strokeProps} />
    </IconBase>
  )
}

export function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8.75 11a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" {...strokeProps} />
      <path d="M3.75 19.5c0-3.2 2.15-5.5 5-5.5s5 2.3 5 5.5" {...strokeProps} />
      <path d="M15 5.25a3 3 0 0 1 0 5.5M16.25 14.25c2.3.45 4 2.4 4 5.25" {...strokeProps} />
    </IconBase>
  )
}

export function BuildingIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 20.25V4.5h10v15.75M15 8h4v12.25H3" {...strokeProps} />
      <path d="M8 8h1M11 8h1M8 11.5h1M11 11.5h1M8 15h1M11 15h1" {...strokeProps} />
    </IconBase>
  )
}

export function ShieldIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5 19 6v5.25c0 4.35-2.75 7.45-7 9.25-4.25-1.8-7-4.9-7-9.25V6Z" {...strokeProps} />
      <path d="m9 12 2 2 4-4" {...strokeProps} />
    </IconBase>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" {...strokeProps} />
      <path d="M19 12a7.5 7.5 0 0 0-.1-1.2l2-1.55-2-3.45-2.45 1a8 8 0 0 0-2.1-1.2L14 3h-4l-.35 2.6a8 8 0 0 0-2.1 1.2l-2.45-1-2 3.45 2 1.55A7.5 7.5 0 0 0 5 12c0 .4.03.8.1 1.2l-2 1.55 2 3.45 2.45-1a8 8 0 0 0 2.1 1.2L10 21h4l.35-2.6a8 8 0 0 0 2.1-1.2l2.45 1 2-3.45-2-1.55c.07-.4.1-.8.1-1.2Z" {...strokeProps} />
    </IconBase>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="10.75" cy="10.75" r="5.75" {...strokeProps} />
      <path d="m15.25 15.25 4 4" {...strokeProps} />
    </IconBase>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6.5 10.5a5.5 5.5 0 0 1 11 0v3.25l1.5 2.5H5l1.5-2.5Z" {...strokeProps} />
      <path d="M9.75 19a2.5 2.5 0 0 0 4.5 0" {...strokeProps} />
    </IconBase>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" {...strokeProps} />
    </IconBase>
  )
}

export function XIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 6 12 12M18 6 6 18" {...strokeProps} />
    </IconBase>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m7 9 5 5 5-5" {...strokeProps} />
    </IconBase>
  )
}
