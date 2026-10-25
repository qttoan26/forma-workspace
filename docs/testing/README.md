# Testing Strategy

Forma Workspace uses tests to protect behavior and architectural change rather than maximizing coverage percentages.

## Layers

- Unit tests: pure utilities, domain rules, and focused hooks/components.
- Integration tests: meaningful component/module collaboration.
- End-to-end tests: critical user workflows in a real browser.
- Accessibility tests: automated checks plus keyboard/focus behavior coverage.
- Performance tests: repeatable scenarios for data-heavy interactions.

## Target tooling

- Vitest
- Testing Library
- Playwright
- axe-based automated accessibility checks

Tools are introduced with the phase that uses them.

## Principles

1. Prefer behavior assertions over implementation-detail assertions.
2. Regression tests should accompany migrated behavior.
3. Critical keyboard and focus flows deserve explicit tests.
4. E2E coverage should focus on high-value workflows rather than duplicate unit tests.
5. Performance tests require documented datasets and environments to make comparisons meaningful.
