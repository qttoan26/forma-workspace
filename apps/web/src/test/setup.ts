import '@testing-library/jest-dom/vitest'

// jsdom leaves native dialog opening and closing unimplemented.
if (!Reflect.has(HTMLDialogElement.prototype, 'showModal')) {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    value(this: HTMLDialogElement) {
      this.open = true
    },
  })
}
if (!Reflect.has(HTMLDialogElement.prototype, 'close')) {
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    value(this: HTMLDialogElement) {
      this.open = false
    },
  })
}
