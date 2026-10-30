import { getCorsOrigins } from './cors'

describe('getCorsOrigins', () => {
  it('uses local frontend origins when no allowlist is configured', () => {
    expect(getCorsOrigins('')).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ])
  })

  it('parses, trims, and deduplicates configured origins', () => {
    expect(
      getCorsOrigins(
        'https://qttoan26.github.io, https://app.example.com,https://qttoan26.github.io',
      ),
    ).toEqual(['https://qttoan26.github.io', 'https://app.example.com'])
  })
})
