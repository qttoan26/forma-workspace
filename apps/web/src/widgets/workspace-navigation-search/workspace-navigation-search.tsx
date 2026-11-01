import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

import { SearchIcon, XIcon } from '@/shared/ui/workspace-icons'
import { searchWorkspaceNavigation } from '@/shared/workspace/navigation-search'

import './workspace-navigation-search.css'

export function WorkspaceNavigationSearch({
  disabled = false,
}: {
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLElement>(null)
  const titleId = useId()
  const resultsId = useId()
  const { entries, total } = searchWorkspaceNavigation(query)

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (
        disabled ||
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.shiftKey ||
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== 'k'
      )
        return
      const otherDialogOpen = Array.from(
        document.querySelectorAll<HTMLElement>(
          'dialog[open], [role="dialog"][aria-modal="true"]',
        ),
      ).some((dialog) => dialog !== dialogRef.current)
      if (otherDialogOpen) return
      event.preventDefault()
      setQuery('')
      setIsOpen((open) => !open)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [disabled])

  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current
    if (!dialog) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus()
    }
  }, [isOpen])

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Enter') {
      event.preventDefault()
      resultsRef.current?.querySelector<HTMLAnchorElement>('a[href]')?.click()
      return
    }
    moveFocus(event)
  }

  function moveFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const links = Array.from(
      resultsRef.current?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? [],
    )
    if (!links.length) return
    event.preventDefault()
    const current = links.findIndex((link) => link === document.activeElement)
    const next =
      current < 0
        ? event.key === 'ArrowDown'
          ? 0
          : links.length - 1
        : current + (event.key === 'ArrowDown' ? 1 : -1)
    if (next < 0 || next >= links.length) inputRef.current?.focus()
    else links[next]?.focus()
  }

  return (
    <>
      <button
        className="workspace-search-button"
        type="button"
        disabled={disabled}
        aria-label="Search workspace navigation"
        aria-haspopup="dialog"
        onClick={() => {
          setQuery('')
          setIsOpen(true)
        }}
        title="Search modules and sections (Ctrl/Cmd + K)"
      >
        <SearchIcon />
        <span>Search</span>
        <kbd>Ctrl / ⌘ K</kbd>
      </button>
      <dialog
        className="workspace-navigation-search"
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setIsOpen(false)}
        onCancel={(event) => {
          event.preventDefault()
          setIsOpen(false)
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            setIsOpen(false)
        }}
      >
        <div className="workspace-navigation-search-heading">
          <div>
            <h2 id={titleId}>Find your workspace tools</h2>
            <p>Search modules and sidebar sections.</p>
          </div>
          <button
            type="button"
            aria-label="Close navigation search"
            onClick={() => setIsOpen(false)}
          >
            <XIcon />
          </button>
        </div>
        <div className="workspace-navigation-search-field">
          <SearchIcon />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            aria-label="Find a module or section"
            aria-controls={resultsId}
            placeholder="Try Projects, OCR, or permissions…"
            autoComplete="off"
          />
        </div>
        <p className="workspace-navigation-search-summary" role="status">
          {total
            ? query.trim()
              ? `${total} matching ${total === 1 ? 'destination' : 'destinations'}${total > entries.length ? ` · Showing ${entries.length}` : ''}`
              : 'Quick destinations · Type to search all tools'
            : `No destinations found for “${query.trim()}”.`}
        </p>
        <nav
          className="workspace-navigation-search-results"
          id={resultsId}
          ref={resultsRef}
          aria-label="Navigation search results"
          onKeyDown={moveFocus}
        >
          {entries.length ? (
            <ul>
              {entries.map((entry) => (
                <li key={entry.id}>
                  <a
                    href={`${import.meta.env.BASE_URL}${entry.path.replace(/^\//, '')}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="workspace-navigation-search-result-copy">
                      <small>{entry.context}</small>
                      <strong>{entry.label}</strong>
                      <span>{entry.description}</span>
                    </span>
                    <span className="workspace-navigation-search-result-meta">
                      {entry.status === 'implementation' ? (
                        <small>In progress</small>
                      ) : null}
                      <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="workspace-navigation-search-empty">
              <strong>Try another name</strong>
              <p>
                Use a module name or a section such as Tasks, Document intake,
                or Teams.
              </p>
            </div>
          )}
        </nav>
        <footer className="workspace-navigation-search-footer">
          <span>↑ ↓ to move · Enter to open</span>
          <span>Esc to close</span>
        </footer>
      </dialog>
    </>
  )
}
