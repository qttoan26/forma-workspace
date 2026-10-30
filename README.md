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

Project tasks are stored as one snapshot document per project in the `project_task_snapshots` collection. Each document contains `ownerId`, the project task array, and its server `revision`. Tasks, ownership, and revision are enforced in the repository boundary so an authenticated user cannot read or overwrite another user's project snapshot.

Because tasks and revision are updated together in a single MongoDB document, the optimistic-concurrency check remains atomic without requiring a multi-document transaction.

When `MONGODB_URI` is not set, task persistence falls back to the in-memory repository for lightweight local development. Production startup fails fast when `MONGODB_URI` is missing so a deployed API cannot accidentally run with ephemeral task storage.

## Authentication

Business API routes are protected by a global bearer-token guard. Health endpoints remain public for platform probes, and `GET /api/auth/me` returns the authenticated subject for client session verification.

JWT verification is provider-agnostic:

- `AUTH_ISSUER` and `AUTH_AUDIENCE` identify the trusted token issuer and API audience.
- `AUTH_JWKS_URL` is the recommended verifier for an external OIDC provider. Production requires an HTTPS JWKS URL.
- `AUTH_JWT_SECRET` is an alternative HS256 verifier for self-hosted deployments and must contain at least 32 characters.
- Configure exactly one of `AUTH_JWKS_URL` or `AUTH_JWT_SECRET`.

Production startup fails when auth configuration is missing or incomplete. Development can omit auth configuration; in that mode requests use `AUTH_DEV_USER_ID`, defaulting to `local-development-user`, so local frontend work does not require an identity provider.

Project task snapshots are owner-scoped using the JWT `sub` claim. Reads by a different user return an empty snapshot rather than revealing whether the project exists, while cross-user writes are rejected as not found. Shared workspace membership and role-based access can be layered on top of this owner boundary later without weakening the current isolation.

## API deployment readiness

The API exposes two health endpoints:

- `GET /api/health` is a lightweight liveness check for the NestJS process.
- `GET /api/health/ready` is the traffic-readiness check. When MongoDB is configured, it pings the configured database and returns HTTP `503` while MongoDB is unavailable.

MongoDB uses one shared client across task persistence and readiness checks. This avoids opening separate pools for each API concern and lets container health reflect the same database path used by task requests.

Production runtime configuration is validated before NestJS starts. `MONGODB_URI`, `CORS_ORIGINS`, and complete authentication configuration are required when `NODE_ENV=production`, and an invalid `PORT` is rejected instead of silently starting with a broken listener configuration.

Cross-origin browser access is restricted by `CORS_ORIGINS`, a comma-separated allowlist. Local Vite origins are allowed by default during development. `Content-Type` and `Authorization` are accepted request headers. A production backend serving the deployed GitHub Pages frontend should set:

```text
CORS_ORIGINS=https://qttoan26.github.io
```

The frontend deployment must also build with `VITE_API_BASE_URL` pointing at the deployed API origin. Do not include a path suffix such as `/api`; the frontend client adds the API routes itself. When production auth is connected, the frontend API adapter must send the session bearer token on protected requests.

NestJS shutdown hooks are enabled for `SIGTERM` and `SIGINT`. During container restarts or rolling deploys, the shared MongoDB client is closed through `onModuleDestroy` instead of leaving the process to be killed with open database resources.

### API container

Build the production API image from the repository root:

```text
docker build -f apps/api/Dockerfile -t forma-api .
```

Run MongoDB 8.2 locally:

```text
docker run --rm -d -p 27017:27017 --name forma-mongo mongo:8.2
```

Then run the production API with MongoDB and a development-only example HMAC verifier:

```text
docker run --rm -p 3001:3001 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017 \
  -e MONGODB_DB=forma_workspace \
  -e CORS_ORIGINS=http://localhost:5173 \
  -e AUTH_ISSUER=https://issuer.example.com \
  -e AUTH_AUDIENCE=forma-api \
  -e AUTH_JWT_SECRET=replace-with-at-least-32-random-characters \
  forma-api
```

For a hosted production identity provider, prefer `AUTH_JWKS_URL` instead of distributing a shared JWT signing secret. The container health check uses `/api/health/ready`, so an API instance with an unavailable MongoDB dependency is removed from traffic instead of appearing healthy.

GitHub Actions validates the production path by starting MongoDB 8.2 and the API in containers, minting short-lived JWTs, requiring unauthenticated task requests to return `401`, verifying `/api/auth/me`, writing and reading an owner-scoped revisioned task snapshot, checking stale writes return `409`, proving a second user cannot read or overwrite the owner's data, stopping MongoDB and confirming liveness stays up while readiness returns `503`, then sending `SIGTERM` and requiring the API container to exit cleanly.

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
