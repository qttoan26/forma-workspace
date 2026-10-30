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

## Backend persistence

The API runs on port `3001` by default. Copy `.env.example` into your local environment configuration and provide `MONGODB_URI` to enable MongoDB persistence. `MONGODB_DB` defaults to `forma_workspace`.

Project tasks are stored as one snapshot document per project in the `project_task_snapshots` collection. Each document contains the project task array and its server `revision`. Because tasks and revision are updated together in a single MongoDB document, the optimistic-concurrency check remains atomic without requiring a multi-document transaction.

When `MONGODB_URI` is not set, task persistence falls back to the in-memory repository for lightweight local development.

## API deployment readiness

The API exposes `GET /api/health` for platform health checks. The response reports whether the process is operational and whether persistence is using MongoDB or the in-memory development fallback.

Cross-origin browser access is restricted by `CORS_ORIGINS`, a comma-separated allowlist. Local Vite origins are allowed by default. A production backend serving the deployed GitHub Pages frontend should set:

```text
CORS_ORIGINS=https://qttoan26.github.io
```

The frontend deployment must also build with `VITE_API_BASE_URL` pointing at the deployed API origin. Do not include a path suffix such as `/api`; the frontend client adds the API routes itself.

### API container

Build the production API image from the repository root:

```text
docker build -f apps/api/Dockerfile -t forma-api .
```

Run MongoDB locally:

```text
docker run --rm -d -p 27017:27017 --name forma-mongo mongo:8
```

Then run the API with MongoDB persistence:

```text
docker run --rm -p 3001:3001 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017 \
  -e MONGODB_DB=forma_workspace \
  forma-api
```

For production, provide `MONGODB_URI`, `MONGODB_DB` and `CORS_ORIGINS` through the hosting platform. The container defines a health check against `/api/health`.

GitHub Actions validates the production path by starting MongoDB and the API in containers, waiting for the MongoDB-backed health response, writing a task snapshot with revision `0`, and reading it back at revision `1`.

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
