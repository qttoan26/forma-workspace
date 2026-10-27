export type ProjectBoardShortcut = 'focus-search' | 'create-task'

interface ShortcutEvent {
  key: string
  target: EventTarget | null
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
}

export function getProjectBoardShortcut(
  event: ShortcutEvent,
): ProjectBoardShortcut | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null
  if (isEditableTarget(event.target)) return null

  if (event.key === '/') return 'focus-search'
  if (event.key.toLowerCase() === 'n') return 'create-task'

  return null
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false

  const editableAncestor = target.closest('[contenteditable]')
  const isWithinEditableContent =
    editableAncestor instanceof HTMLElement &&
    editableAncestor.getAttribute('contenteditable') !== 'false'

  return (
    target.isContentEditable ||
    isWithinEditableContent ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}
