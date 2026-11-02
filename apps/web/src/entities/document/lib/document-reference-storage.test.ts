import { vi } from 'vitest'
import { createDocumentReference } from '../model/document-reference'
import {
  DocumentReferenceConflict,
  mutateProjectDocumentReference,
  readProjectDocumentReferences,
  saveProjectDocumentReferences,
  subscribeProjectDocumentReferences,
} from './document-reference-storage'
import { getDocumentReferenceUrl } from './document-location'

const projectId = 'document-test-project'
const key = `forma-workspace:project-document-references:v1:${projectId}`
const create = (name: string) =>
  createDocumentReference({ projectId, name, location: `DOC-${name}` })
beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

it('preserves unrelated writes and rejects stale edits and removals', async () => {
  const first = create('first')
  const other = create('other')
  await mutateProjectDocumentReference(projectId, {
    kind: 'add',
    reference: first,
  })
  await mutateProjectDocumentReference(projectId, {
    kind: 'add',
    reference: other,
  })
  await mutateProjectDocumentReference(projectId, {
    kind: 'update',
    expected: first,
    reference: { ...first, name: 'Updated' },
  })
  await expect(
    mutateProjectDocumentReference(projectId, {
      kind: 'remove',
      expected: first,
    }),
  ).rejects.toBeInstanceOf(DocumentReferenceConflict)
  expect(
    readProjectDocumentReferences(projectId).map((reference) => reference.name),
  ).toEqual(['Updated', 'other'])
  await mutateProjectDocumentReference(projectId, {
    kind: 'remove',
    expected: other,
  })
  await expect(
    mutateProjectDocumentReference(projectId, {
      kind: 'update',
      expected: other,
      reference: other,
    }),
  ).rejects.toBeInstanceOf(DocumentReferenceConflict)
})

it.each([
  '{invalid',
  JSON.stringify([{ ...create('wrong'), projectId: 'another-project' }]),
  JSON.stringify([
    create('one'),
    { ...create('two'), id: 'duplicate' },
    { ...create('three'), id: 'duplicate' },
  ]),
])(
  'refuses to overwrite unreadable or incorrectly scoped storage',
  async (raw) => {
    localStorage.setItem(key, raw)
    expect(() => readProjectDocumentReferences(projectId)).toThrow()
    await expect(
      mutateProjectDocumentReference(projectId, {
        kind: 'add',
        reference: create('new'),
      }),
    ).rejects.toThrow()
    expect(localStorage.getItem(key)).toBe(raw)
  },
)

it('does not announce a successful mutation when persistence fails', async () => {
  const changed = vi.fn()
  const unsubscribe = subscribeProjectDocumentReferences(projectId, changed)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError')
  })
  await expect(
    mutateProjectDocumentReference(projectId, {
      kind: 'add',
      reference: create('new'),
    }),
  ).rejects.toThrow()
  expect(changed).not.toHaveBeenCalled()
  unsubscribe()
})

it('validates project scope on a direct collection save', () => {
  expect(() =>
    saveProjectDocumentReferences('another-project', [create('wrong')]),
  ).toThrow('scope')
})

it.each([
  'javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'file:///secret',
  '/source/file.pdf',
  'DOC-10',
  'https://',
])('keeps non-HTTP or malformed locations as plain text: %s', (location) => {
  expect(getDocumentReferenceUrl(location)).toBeUndefined()
})
it('opens valid explicit web sources', () => {
  expect(getDocumentReferenceUrl('HTTPS://example.com/source.pdf')).toBe(
    'https://example.com/source.pdf',
  )
})
