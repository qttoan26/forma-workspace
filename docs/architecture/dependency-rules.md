# Dependency Rules

## Direction

Initial dependency direction:

```text
app / pages → shared
```

When additional layers are justified:

```text
app / pages → widgets → features → entities → shared
```

## Rules

1. Lower layers must not import higher layers.
2. `shared` must not import Forma product/domain modules.
3. Avoid circular dependencies.
4. Cross-slice imports should use public APIs once slices expose them.
5. Do not deep-import another slice's internal implementation.
6. Route/page composition may depend on lower product layers, but lower layers must not depend on pages.
7. Generic technical utilities belong in `shared`; business rules do not.
8. A dependency exception that cannot be removed cheaply should be captured as an ADR.

## Why

The goal is not architectural purity. The goal is to preserve changeability: domain and feature modules should remain testable and understandable without knowledge of route composition or application bootstrap details.

## Enforcement

The contract is documented before automated enforcement is introduced. ESLint boundary rules or dedicated architecture tooling may be added when enough real modules exist for the rules to provide value rather than noise.
