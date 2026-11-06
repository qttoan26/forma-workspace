import type { ReactNode } from 'react'

import { Modal } from '@/shared/ui/modal/modal'

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
  if (!open) return null

  return (
    <Modal
      className="task-editor-drawer"
      aria-label={label}
      onDismiss={onClose}
      dismissOnBackdrop
    >
      {children}
    </Modal>
  )
}
