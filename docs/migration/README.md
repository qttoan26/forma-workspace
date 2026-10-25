# Migration Strategy

Forma Workspace is an independent product codebase. Reference implementations may be used to understand behavior and engineering trade-offs, but migration is deliberate and incremental.

## Sequence

1. Preserve and document important behavior.
2. Establish strict TypeScript foundations.
3. Add regression coverage around behavior being migrated.
4. Clarify domain and state ownership.
5. Establish performance baselines before major UI migration.
6. Introduce the React application shell.
7. Implement/migrate vertical slices incrementally.
8. Extract stable reusable UI into Forma UI.
9. Harden accessibility and performance continuously.

## Rules

- Do not copy a legacy global state model into the new architecture by default.
- Do not rewrite working behavior without identifying what must remain equivalent.
- Benchmark meaningful interaction paths before and after expensive migrations.
- Check licensing and attribution requirements before copying source from any external/reference repository.
- Prefer small vertical slices that can be tested and measured independently.

## Definition of a successful migration

A migrated slice should have clearer ownership, typed boundaries, regression coverage, accessible interaction behavior, and no unexplained performance regression compared with its baseline.
