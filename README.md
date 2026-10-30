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

The API runs on port `3001` by default. Copy `.env.example` into your local environment configuration and provide `DATABASE_URL` to enable PostgreSQL persistence.

When `DATABASE_URL` is present, the API applies pending SQL migrations from `apps/api/migrations` before NestJS starts accepting requests. Applied migration filenames are tracked in `schema_migrations`, and an advisory lock prevents multiple API instances from applying the same migration concurrently.

When `DATABASE_URL` is not set, task persistence falls back to the in-memory repository for lightweight local development.

The deployment artifact must include the `apps/api/migrations` directory alongside the compiled API output.

## API deployment readiness

The API exposes `GET /api/health` for platform health checks. The response reports whether the process is operational and whether persistence is using PostgreSQL or the in-memory development fallback.

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

Run it locally with the in-memory repository:

```text
docker run --rm -p 3001:3001 forma-api
```

For production, provide `DATABASE_URL` and `CORS_ORIGINS` through the hosting platform. The image includes the SQL migrations and runs them automatically before the API starts listening. The container also defines a health check against `/api/health`.

GitHub Actions validates the image by building it, starting a container, and calling the health endpoint whenever API container inputs change.

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
