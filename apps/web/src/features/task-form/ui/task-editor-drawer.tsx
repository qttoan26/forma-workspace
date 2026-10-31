import { useEffect, useRef, type ReactNode } from 'react'

import './task-editor-drawer.css'

interface TaskEditorDrawerProps {
  open: boolean
  label: string
  onClose: () => void
  children: ReactNode
}

export function TaskEditorDrawer({
  open,
  label,
  onClose,
  children,
}: TaskEditorDrawerProps) {
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    return () => {
      const trigger = triggerRef.current
      if (trigger?.isConnected) trigger.focus()
      triggerRef.current = null
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="task-editor-backdrop"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return
        onClose()
      }}
    >
      <aside
        className="task-editor-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </aside>
    </div>
  )
}
