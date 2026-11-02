// Paths and provider IDs remain plain text; only explicit HTTP(S) locations
// become navigable links. Never interpret stored markup or other protocols.
export function getDocumentReferenceUrl(location: string): string | undefined {
  try {
    const url = new URL(location)
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href
  } catch {
    // A document ID or path is a valid non-navigable reference.
  }
  return undefined
}
