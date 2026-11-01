import type { ReactNode } from 'react'

import './scroll-region.css'

export function ScrollRegion({
  label,
  className = '',
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={`content-scroll-region ${className}`}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  )
}
