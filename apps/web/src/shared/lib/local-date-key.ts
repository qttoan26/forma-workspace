export function localDateKey(date = new Date()) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function calendarDate(key: string) {
  return new Date(`${key}T00:00:00Z`)
}

export function calendarDateKey(date: Date) {
  return date.toISOString().split('T')[0]!
}
