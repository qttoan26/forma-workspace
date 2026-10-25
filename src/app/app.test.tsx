import { render, screen } from '@testing-library/react'
import { App } from './app'

describe('App', () => {
  it('renders the Forma Workspace foundation', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /work, shaped around your team/i }),
    ).toBeInTheDocument()
  })
})
