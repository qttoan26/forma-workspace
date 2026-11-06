import { useLayoutEffect, useRef, type ComponentPropsWithoutRef } from 'react'

import './modal.css'

type ModalProps = Omit<
  ComponentPropsWithoutRef<'dialog'>,
  'open' | 'onClose'
> & {
  onDismiss: () => void
  dismissOnBackdrop?: boolean
}

export function Modal({
  children,
  className,
  dismissOnBackdrop = false,
  onDismiss,
  ...props
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const trigger = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    dialog.querySelector<HTMLElement>('[data-modal-autofocus]')?.focus()
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
    }
  }, [])

  return (
    <dialog
      {...props}
      ref={dialogRef}
      className={['forma-overlay-enter', className].filter(Boolean).join(' ')}
      onCancel={(event) => {
        event.preventDefault()
        onDismiss()
      }}
      onMouseDown={(event) => {
        if (!dismissOnBackdrop || event.target !== event.currentTarget) return
        const { left, right, top, bottom } =
          event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < left ||
          event.clientX >= right ||
          event.clientY < top ||
          event.clientY >= bottom
        )
          onDismiss()
      }}
    >
      {children}
    </dialog>
  )
}
