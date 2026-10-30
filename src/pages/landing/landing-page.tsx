import { useEffect, useRef, useState } from 'react'

import './landing-page.css'

const appBaseUrl = import.meta.env.BASE_URL
const workspaceHref = `${appBaseUrl}workspaces/forma/projects/project-1`

const benefits = [
  {
    eyebrow: 'One shared view',
    title: 'See what needs attention before work slips.',
    body: 'Forma brings active projects, ownership, due dates, and priority into one calm workspace so the team can act without searching across chat and spreadsheets.',
  },
  {
    eyebrow: 'Less status chasing',
    title: 'Keep decisions next to the work they affect.',
    body: 'Task context stays visible where the team works. Fewer handoffs disappear into separate threads, and fewer updates need to be reconstructed later.',
  },
  {
    eyebrow: 'Built for focus',
    title: 'Move from overview to the right task in seconds.',
    body: 'Start with the workspace summary, open the project that matters, then narrow down to the task that needs a decision or an owner.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Open the workspace',
    body: 'Start from a concise view of active work, priorities, and the items that need attention today.',
  },
  {
    number: '02',
    title: 'Choose the project',
    body: 'Enter the project board with the same context instead of rebuilding it from messages or spreadsheets.',
  },
  {
    number: '03',
    title: 'Act on the next decision',
    body: 'Update the task, confirm ownership, and keep progress visible to the people who depend on it.',
  },
]

const faqItems = [
  {
    question: 'What is Forma Workspace for?',
    answer:
      'Forma Workspace is a focused project workspace for teams that need clearer ownership, priorities, and task context without adding another noisy layer of process.',
  },
  {
    question: 'Does it replace every tool we already use?',
    answer:
      'No. The goal is to make active project work easier to understand and act on. It can sit alongside the communication and specialist tools your team already uses.',
  },
  {
    question: 'Who is the current experience designed for?',
    answer:
      'The current product is shaped for small product and operations teams that need a shared project board and a reliable view of what needs attention.',
  },
  {
    question: 'Is the page mobile friendly?',
    answer:
      'Yes. The layout collapses into a single reading flow, keeps controls easy to reach, and avoids horizontal content that depends on a desktop viewport.',
  },
  {
    question: 'Can we try the workspace without creating an account?',
    answer:
      'Yes. This prototype links directly to the existing Forma project board so you can inspect the current product experience immediately.',
  },
  {
    question: 'What happens to the existing dashboard?',
    answer:
      'Nothing changes. The existing dashboard remains available at the current home route while this landing page lives separately at the landing route.',
  },
]

const tagline =
  'Know what matters now. Keep the project context close enough that the next action is obvious.'
const taglineWords = tagline.split(' ')

function initialVisibleWords() {
  if (
    typeof window !== 'undefined' &&
    !('IntersectionObserver' in window)
  ) {
    return new Set(taglineWords.map((_, index) => index))
  }

  return new Set<number>()
}

function TaglineReveal() {
  const refs = useRef<Array<HTMLSpanElement | null>>([])
  const [visibleWords, setVisibleWords] = useState(initialVisibleWords)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleWords((current) => {
          const next = new Set(current)
          let changed = false

          entries.forEach((entry) => {
            if (!entry.isIntersecting) return

            const wordIndex = (entry.target as HTMLElement).dataset.wordIndex
            const index = Number(wordIndex)

            if (!next.has(index)) {
              next.add(index)
              changed = true
            }

            observer.unobserve(entry.target)
          })

          return changed ? next : current
        })
      },
      {
        rootMargin: '0px 0px -32% 0px',
        threshold: 0.15,
      },
    )

    refs.current.forEach((node) => {
      if (node) observer.observe(node)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <p className="landing-tagline-copy" aria-label={tagline}>
      {taglineWords.map((word, index) => (
        <span
          aria-hidden="true"
          className={visibleWords.has(index) ? 'is-visible' : undefined}
          data-word-index={index}
          key={`${word}-${index}`}
          ref={(node) => {
            refs.current[index] = node
          }}
        >
          {word}{' '}
        </span>
      ))}
    </p>
  )
}

function ProductPreview() {
  return (
    <div
      className="landing-product-frame"
      aria-label="Forma Workspace project board preview"
    >
      <div className="landing-product-topbar">
        <div className="landing-product-brand">
          <span>F</span>
          <strong>Forma</strong>
        </div>
        <div className="landing-product-avatar">SL</div>
      </div>

      <div className="landing-product-body">
        <aside className="landing-product-sidebar" aria-hidden="true">
          <span className="is-active" />
          <span />
          <span />
          <span />
        </aside>

        <div className="landing-product-main">
          <div className="landing-product-heading">
            <div>
              <small>Product launch</small>
              <strong>Project board</strong>
            </div>
            <span>4 tasks</span>
          </div>

          <div className="landing-product-columns">
            <section>
              <header>
                Todo <span>2</span>
              </header>
              <article>
                <small>FOR 21</small>
                <strong>Build accessible task cards</strong>
                <footer>
                  <span>Urgent</span>
                  <span>SL</span>
                </footer>
              </article>
              <article>
                <small>FOR 24</small>
                <strong>Review onboarding copy</strong>
                <footer>
                  <span>Medium</span>
                  <span>AM</span>
                </footer>
              </article>
            </section>

            <section>
              <header>
                In progress <span>1</span>
              </header>
              <article>
                <small>FOR 18</small>
                <strong>Create board interaction model</strong>
                <footer>
                  <span>High</span>
                  <span>JL</span>
                </footer>
              </article>
            </section>

            <section>
              <header>
                Done <span>1</span>
              </header>
              <article>
                <small>FOR 12</small>
                <strong>Define workspace navigation</strong>
                <footer>
                  <span>Complete</span>
                  <span>SL</span>
                </footer>
              </article>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <main className="landing-page" id="main-content">
      <header className="landing-nav-wrap">
        <nav className="landing-nav" aria-label="Landing page navigation">
          <a
            className="landing-brand"
            href={`${appBaseUrl}landing`}
            aria-label="Forma landing page"
          >
            <span aria-hidden="true">F</span>
            <strong>Forma</strong>
          </a>

          <div className="landing-nav-links">
            <a href="#benefits">Benefits</a>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </div>

          <a className="landing-nav-cta" href={workspaceHref}>
            Open workspace
          </a>
        </nav>
      </header>

      <section
        className="landing-hero"
        aria-labelledby="landing-hero-title"
      >
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">
            Project work with less status chasing
          </p>
          <h1 id="landing-hero-title">
            Keep the work moving without losing the context behind it.
          </h1>
          <p className="landing-hero-lead">
            Forma Workspace gives product and operations teams one clear place
            to see priority, ownership, progress, and the next decision that
            needs attention.
          </p>

          <div className="landing-hero-actions">
            <a className="landing-primary-cta" href={workspaceHref}>
              Open Forma workspace
              <span aria-hidden="true">→</span>
            </a>
            <p>No signup required for this prototype.</p>
          </div>

          <div
            className="landing-proof-strip"
            aria-label="Product proof points"
          >
            <span>
              <strong>4</strong> visible project tasks
            </span>
            <span>
              <strong>3</strong> team roles in context
            </span>
            <span>
              <strong>1</strong> shared project view
            </span>
          </div>
        </div>

        <ProductPreview />
      </section>

      <section
        className="landing-section landing-benefits"
        id="benefits"
        aria-labelledby="benefits-title"
      >
        <div className="landing-section-heading">
          <p className="landing-eyebrow">Why Forma</p>
          <h2 id="benefits-title">
            A calmer path from project overview to the next action.
          </h2>
        </div>

        <div className="landing-benefit-grid">
          {benefits.map((benefit) => (
            <article className="landing-benefit-card" key={benefit.title}>
              <p>{benefit.eyebrow}</p>
              <h3>{benefit.title}</h3>
              <span>{benefit.body}</span>
            </article>
          ))}
        </div>
      </section>

      <section
        className="landing-section landing-steps"
        id="how-it-works"
        aria-labelledby="steps-title"
      >
        <div className="landing-section-heading">
          <p className="landing-eyebrow">How it works</p>
          <h2 id="steps-title">
            Start broad, move closer, act with the right context.
          </h2>
        </div>

        <div className="landing-step-list">
          {steps.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-tagline" aria-label="Forma core benefit">
        <TaglineReveal />
      </section>

      <section
        className="landing-section landing-proof"
        aria-labelledby="proof-title"
      >
        <div className="landing-proof-copy">
          <p className="landing-eyebrow">
            Built around real project pressure
          </p>
          <h2 id="proof-title">
            The most important work should not be the hardest work to find.
          </h2>
          <p>
            The current Forma prototype puts urgent work, active project
            progress, and ownership in the same visual system. The design favors
            quick scanning first, then deeper task context only when you need it.
          </p>
          <a className="landing-text-link" href={workspaceHref}>
            Inspect the project board <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="landing-proof-metrics" aria-label="Prototype metrics">
          <article>
            <strong>25%</strong>
            <span>project completion shown at a glance</span>
          </article>
          <article>
            <strong>2</strong>
            <span>priority items surfaced before opening the board</span>
          </article>
          <article>
            <strong>3</strong>
            <span>team members connected to the active project</span>
          </article>
        </div>
      </section>

      <section
        className="landing-section landing-faq"
        id="faq"
        aria-labelledby="faq-title"
      >
        <div className="landing-section-heading">
          <p className="landing-eyebrow">Questions before you open it</p>
          <h2 id="faq-title">A few useful answers before the first click.</h2>
        </div>

        <div className="landing-faq-list">
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>
                {item.question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        className="landing-final-cta"
        aria-labelledby="final-cta-title"
      >
        <p className="landing-eyebrow">Ready to inspect the product</p>
        <h2 id="final-cta-title">
          Open the workspace and follow the work from overview to task.
        </h2>
        <a className="landing-primary-cta" href={workspaceHref}>
          Open Forma workspace
          <span aria-hidden="true">→</span>
        </a>
        <p>No signup required for this prototype.</p>
      </section>

      <footer className="landing-footer">
        <a className="landing-brand" href={`${appBaseUrl}landing`}>
          <span aria-hidden="true">F</span>
          <strong>Forma</strong>
        </a>
        <p>Project context that stays close to the work.</p>
        <div>
          <a href={`${appBaseUrl}landing#faq`}>Privacy</a>
          <a href={`${appBaseUrl}landing#faq`}>Terms</a>
        </div>
      </footer>
    </main>
  )
}
