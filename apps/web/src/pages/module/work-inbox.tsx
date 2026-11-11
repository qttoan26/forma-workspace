import { useRef, useState } from 'react'
import type { ProjectBoardData } from '@/pages/project-board/project-board-data-parser'
import { ScrollRegion } from '@/shared/ui/scroll-region/scroll-region'
import {
  DoubleCheckIcon,
  MailIcon,
  SearchIcon,
  UserIcon,
} from '@/shared/ui/workspace-icons'
import {
  buildInboxItems,
  inboxCategories,
  type InboxCategory,
} from './work-inbox-model'
import { useInboxActivity } from './use-inbox-activity'
import { useInboxReadState } from './use-inbox-read-state'
import { InboxConversation } from './work-inbox-conversation'
import './work-inbox.css'

export function WorkInbox({
  data,
  userId,
}: {
  data: ProjectBoardData
  userId: string | undefined
}) {
  const activity = useInboxActivity(
    data.project.id,
    data.initialTasks.map((task) => task.id),
  )
  const readState = useInboxReadState(data.project.id, userId)
  const [category, setCategory] = useState<InboxCategory>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [limit, setLimit] = useState(50)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const selectedTrigger = useRef<HTMLButtonElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const items = buildInboxItems(data, activity.entries, userId)
  const selected = items.find((item) => item.id === selectedId)
  const selectedTask = data.initialTasks.find(
    (task) => task.id === selected?.taskId,
  )
  const tasks = new Map(data.initialTasks.map((task) => [task.id, task]))
  const unreadCount = (value: InboxCategory) =>
    items.filter(
      (item) =>
        (value === 'all' || item.category === value) &&
        !readState.isRead(item.id),
    ).length
  const normalized = query.trim().toLocaleLowerCase()
  const filtered = items.filter(
    (item) =>
      (category === 'all' || item.category === category) &&
      (!unreadOnly || !readState.isRead(item.id)) &&
      (!normalized ||
        [
          item.actor,
          item.snippet,
          item.taskId,
          tasks.get(item.taskId)?.title,
        ].some((value) => value?.toLocaleLowerCase().includes(normalized))),
  )

  function changeCategory(value: InboxCategory) {
    setCategory(value)
    setLimit(50)
  }

  return (
    <section
      className={`work-inbox ${selected && selectedTask ? 'has-preview' : ''}`}
      aria-label="Project inbox"
    >
      <div className="inbox-master">
        <div className="inbox-toolbar">
          <strong>
            Inbox <span className="inbox-total">{unreadCount('all')}</span>
          </strong>
          <label className="inbox-unread-toggle">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) => {
                setUnreadOnly(event.target.checked)
                setLimit(50)
              }}
            />{' '}
            Unread
          </label>
          <button
            className="inbox-icon-button"
            type="button"
            aria-label="Mark all as read"
            title="Mark all as read"
            disabled={!unreadCount('all')}
            onClick={() =>
              readState.mark(
                items.map((item) => item.id),
                true,
              )
            }
          >
            <DoubleCheckIcon />
          </button>
        </div>
        <div
          className="inbox-tabs"
          role="tablist"
          aria-label="Inbox categories"
        >
          {inboxCategories.map(([value, label], index) => (
            <button
              key={value}
              id={`inbox-tab-${value}`}
              role="tab"
              type="button"
              aria-selected={category === value}
              aria-controls="inbox-results"
              tabIndex={category === value ? 0 : -1}
              onClick={() => changeCategory(value)}
              onKeyDown={(event) => {
                const next =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? inboxCategories.length - 1
                      : event.key === 'ArrowRight'
                        ? (index + 1) % inboxCategories.length
                        : event.key === 'ArrowLeft'
                          ? (index + inboxCategories.length - 1) %
                            inboxCategories.length
                          : null
                if (next === null) return
                event.preventDefault()
                const nextCategory = inboxCategories[next]
                if (nextCategory) {
                  changeCategory(nextCategory[0])
                  document
                    .getElementById(`inbox-tab-${nextCategory[0]}`)
                    ?.focus()
                }
              }}
            >
              {label}{' '}
              {unreadCount(value) ? <span>{unreadCount(value)}</span> : null}
            </button>
          ))}
        </div>
        <div className="inbox-search">
          <SearchIcon width={16} height={16} />
          <input
            type="search"
            aria-label="Search inbox"
            placeholder="Search inbox…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setLimit(50)
            }}
          />
        </div>
        <p className="inbox-source">{data.project.name} · This browser</p>
        {!data.members.some((member) => member.id === userId) ? (
          <p className="inbox-notice">
            Link your account to a project member to see personal assignments
            and mentions.
          </p>
        ) : null}
        {readState.error ? (
          <p className="inbox-notice" role="alert">
            Read status could not be saved. Allow browser storage and try again.
          </p>
        ) : null}
        {activity.status === 'loading' ? (
          <p className="inbox-notice" role="status">
            Loading saved notifications…
          </p>
        ) : null}
        {activity.status === 'error' ? (
          <div className="inbox-notice" role="alert">
            Saved activity could not be loaded.{' '}
            <button
              type="button"
              className="inbox-text-button"
              onClick={activity.retry}
            >
              Try again
            </button>
          </div>
        ) : null}
        <div
          ref={resultsRef}
          id="inbox-results"
          className="inbox-results"
          role="tabpanel"
          aria-labelledby={`inbox-tab-${category}`}
          tabIndex={-1}
        >
          <ScrollRegion
            label="Inbox notifications"
            className="inbox-list-scroll"
          >
            {filtered.length ? (
              <ol className="inbox-list">
                {filtered.slice(0, limit).map((item) => {
                  const read = readState.isRead(item.id)
                  const title = tasks.get(item.taskId)?.title ?? item.taskId
                  return (
                    <li
                      key={item.id}
                      className={`${selectedId === item.id ? 'is-selected' : ''} ${read ? '' : 'is-unread'}`}
                    >
                      <button
                        type="button"
                        className="inbox-item"
                        aria-label={`${item.actor ? `${item.actor} ` : ''}${item.action} ${title}. ${item.snippet}. ${read ? 'Read' : 'Unread'}`}
                        aria-pressed={selectedId === item.id}
                        onClick={(event) => {
                          selectedTrigger.current = event.currentTarget
                          setSelectedId(item.id)
                          readState.mark([item.id], true)
                        }}
                      >
                        <span
                          className={`inbox-avatar inbox-avatar-${item.category}`}
                          aria-hidden="true"
                        >
                          {item.actor ? (
                            item.actor
                              .split(/\s+/)
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join('')
                          ) : (
                            <UserIcon width={16} height={16} />
                          )}
                        </span>
                        <span className="inbox-item-copy">
                          <span className="inbox-item-title">
                            {item.actor ? <strong>{item.actor} </strong> : null}
                            {item.action} <strong>{title}</strong>
                          </span>
                          <span className="inbox-snippet">{item.snippet}</span>
                          <span className="inbox-item-meta">
                            <span aria-hidden="true">
                              {item.category === 'mention'
                                ? '@'
                                : item.category === 'comment'
                                  ? '↳'
                                  : item.category === 'assignment'
                                    ? '↗'
                                    : '↻'}
                            </span>
                            {data.project.name} ·{' '}
                            {item.createdAt ? (
                              <time dateTime={item.createdAt}>
                                {formatInboxTime(item.createdAt)}
                              </time>
                            ) : (
                              'Current assignment'
                            )}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="inbox-icon-button inbox-read-button"
                        aria-label={`${read ? 'Mark as unread' : 'Mark as read'}: ${title}`}
                        title={read ? 'Mark as unread' : 'Mark as read'}
                        onClick={() => readState.mark([item.id], !read)}
                      >
                        <MailIcon open={!read} width={16} height={16} />
                      </button>
                    </li>
                  )
                })}
              </ol>
            ) : activity.status !== 'loading' ? (
              <div className="inbox-empty">
                <MailIcon open width={30} height={30} />
                <h2>
                  {query
                    ? 'No matching notifications'
                    : unreadOnly
                      ? 'You’re all caught up'
                      : 'No notifications yet'}
                </h2>
                <p>
                  {query
                    ? 'Try another search or category.'
                    : 'Mentions, comments, saved updates and your current assignments appear here.'}
                </p>
              </div>
            ) : null}
            {filtered.length > limit ? (
              <button
                className="inbox-load-more"
                type="button"
                onClick={() => setLimit((value) => value + 50)}
              >
                Show more · {filtered.length - limit} remaining
              </button>
            ) : null}
          </ScrollRegion>
        </div>
      </div>
      <div className="inbox-preview" aria-label="Notification detail">
        {selected && selectedTask ? (
          <InboxConversation
            key={`${userId ?? 'unlinked'}:${selectedTask.id}`}
            task={selectedTask}
            item={selected}
            data={data}
            userId={userId}
            entries={activity.entries}
            status={activity.status}
            onRetry={activity.retry}
            draft={drafts[selectedTask.id] ?? ''}
            onDraftChange={(value) =>
              setDrafts((current) => ({ ...current, [selectedTask.id]: value }))
            }
            onReplySaved={(id) => readState.mark([`activity:${id}`], true)}
            onBack={() => {
              setSelectedId(null)
              requestAnimationFrame(() => {
                const target = selectedTrigger.current
                if (target?.isConnected) target.focus({ preventScroll: true })
                else resultsRef.current?.focus({ preventScroll: true })
              })
            }}
          />
        ) : (
          <div className="inbox-empty inbox-preview-empty">
            <MailIcon open width={36} height={36} />
            <h2>Select a notification</h2>
            <p>Read the conversation and reply without leaving your inbox.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function formatInboxTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
