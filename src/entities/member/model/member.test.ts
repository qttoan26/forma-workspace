import { memberSchema } from './member'

describe('member schema', () => {
  it('trims valid member text fields', () => {
    const result = memberSchema.parse({
      id: ' member-1 ',
      name: ' Alex Morgan ',
      initials: ' AM ',
      role: ' Design ',
    })

    expect(result).toEqual({
      id: 'member-1',
      name: 'Alex Morgan',
      initials: 'AM',
      role: 'Design',
    })
  })

  it('rejects blank required fields', () => {
    expect(
      memberSchema.safeParse({
        id: 'member-1',
        name: '   ',
        initials: 'AM',
        role: 'Design',
      }).success,
    ).toBe(false)
  })
})
