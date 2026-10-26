# Dependency Rules

## Current direction

The active product layers now follow this dependency direction:

```text
app / pages → widgets → features → entities → shared
```

This diagram describes allowed downward dependency flow, not a requirement that every module pass through every intermediate layer.

Examples:

- `pages` may compose widgets and may directly consume features, entities, or shared modules when composition stays clear.
- `widgets` may consume features, entities, and shared modules.
- `features` may consume entities and shared modules.
- `entities` may consume shared modules.
- `shared` must remain independent of Forma product/domain layers.

## Rules

1. Lower layers must not import higher layers.
2. `shared` must not import Forma product/domain modules.
3. `entities` must not depend on features, widgets, pages, or app composition.
4. `features` must not depend on widgets, pages, or app composition.
5. `widgets` must not depend on pages or app composition.
6. Avoid circular dependencies.
7. Cross-slice imports should use public APIs once slices expose meaningful public surfaces.
8. Do not deep-import another slice's private implementation after a public API exists.
9. Route/page composition owns navigational concerns such as validated URL search state; lower product layers receive normalized values through props or explicit contracts.
10. Generic technical utilities belong in `shared`; business rules do not.
11. A dependency exception that cannot be removed cheaply should be captured as an ADR.

## Why

The goal is not architectural purity. The goal is changeability. Domain and feature modules should remain testable and understandable without knowledge of route composition or application bootstrap details.

The current task-board vertical slice demonstrates the intended split: the page owns route search state, the widget owns board composition and local task interaction state, the task-form feature owns validation/form behavior, and entities define the shared domain contracts.

## Enforcement

The contract remains documentation-first. Automated boundary enforcement should be added when the number of slices makes accidental cross-layer imports a recurring risk. Until then, TypeScript, ESLint, tests, and pull-request review provide the lighter-weight guardrail.
