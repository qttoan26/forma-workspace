import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  error?: string
  children: ReactNode
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <label>
      <span>{label}</span>
      {children}
      {error ? <small role="alert">{error}</small> : null}
    </label>
  )
}
