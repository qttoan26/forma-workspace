# Forma Workspace

A production-oriented collaborative workspace for projects, tasks, teams, and complex workflows.

Forma Workspace is an engineering case study focused on scalable frontend architecture, complex interaction patterns, accessibility, performance engineering, and design-system development.

## Status

Architecture and foundation phase. The application is being built incrementally with explicit architectural boundaries and measurable quality gates.

## Engineering principles

- Pages-first architecture with earned complexity.
- Strict TypeScript and explicit domain boundaries.
- State lives as close as possible to its owner.
- Accessibility and performance are product requirements.
- Dependencies are introduced when a concrete use case justifies them.
- Architecture decisions are documented and revisited as the product evolves.

## Architecture

The initial source structure is intentionally small:

```text
src/
├── app/
├── pages/
└── shared/
    ├── api/
    ├── config/
    ├── hooks/
    ├── lib/
    ├── styles/
    ├── types/
    └── ui/
```

`entities`, `features`, and `widgets` are introduced only when product complexity creates a real boundary that benefits from them.

See [`docs/architecture`](docs/architecture/README.md) for the architecture contract.

## Roadmap

1. Architecture contract
2. Strict TypeScript foundation
3. Domain modeling
4. Regression testing
5. Performance baseline
6. React application shell
7. Incremental feature implementation
8. Forma UI design system
9. Accessibility and performance hardening

## Product direction

The first substantial vertical slice will focus on projects and task management, giving the project a realistic surface for complex UI, state ownership, accessibility, testing, and performance work.
