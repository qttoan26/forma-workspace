import '@testing-library/jest-dom/vitest'

// jsdom leaves native dialog opening and closing unimplemented.
HTMLDialogElement.prototype.showModal ??= function () {
  this.open = true
}
HTMLDialogElement.prototype.close ??= function () {
  this.open = false
}
