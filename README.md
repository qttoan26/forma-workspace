# Forma Workspace

A production-oriented collaborative workspace for projects, tasks, teams, and complex workflows.

Forma Workspace is an engineering case study focused on scalable frontend architecture, complex interaction patterns, accessibility, performance engineering, authentication, browser persistence, and backend API design.

## Status

Active foundation and vertical-slice development. The repository now contains a pnpm monorepo with a React/Vite frontend and a NestJS/MongoDB API, protected by measurable CI, browser smoke, and performance gates.

Frontend demo: https://qttoan26.github.io/forma-workspace/

> The GitHub Pages deployment is an explicit browser/demo build. It does not connect to the production API or OIDC provider. Production authentication remains enabled when `VITE_DEMO_MODE` is not set.

## Engineering principles

- Pages-first architecture with earned complexity.
- Strict TypeScript and explicit domain boundaries.
- State lives as close as possible to its owner.
- Accessibility and performance are product requirements.
- Browser persistence is selected by lifetime and recovery needs.
- Dependencies are introduced when a concrete use case justifies them.
- Architecture decisions are documented and revisited as the product evolves.

## Monorepo structure

The repository uses **pnpm 10.18.3 workspaces** with frontend and backend as independent packages under `apps/*`.

```text
forma-workspace/
├── apps/
│   ├── web/                         # @forma/web
│   │   ├── src/
│   │   │   ├── app/                 # app shell, router, error boundaries
│   │   │   ├── entities/            # domain entities and persistence adapters
│   │   │   ├── features/            # user-facing feature boundaries
│   │   │   ├── pages/               # route-level UI and loaders
│   │   │   ├── shared/              # auth, API, config, hooks, storage, UI primitives
│   │   │   ├── test/                # shared frontend test setup
│   │   │   ├── widgets/             # composed UI such as the task board
│   │   │   └── main.tsx
│   │   ├── tests/                    # Playwright and performance tests
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── api/                          # @forma/api
│       ├── src/
│       │   ├── auth/                 # JWT guard, claims, /api/auth/me
│       │   ├── config/               # production runtime validation
│       │   ├── database/             # shared MongoDB client
│       │   ├── http/                 # HTTP/public-route infrastructure
│       │   ├── tasks/                # owner-scoped task snapshot API
│       │   ├── app.module.ts
│       │   ├── health.controller.ts
│       │   └── main.ts
│       ├── Dockerfile
│       └── package.json
├── docs/architecture/                # architecture contract and decisions
├── .github/workflows/                # CI, smoke, performance, Pages deploy
├── .env.example
├── package.json                      # workspace orchestration scripts
├── pnpm-lock.yaml
└── pnpm-workspace.yaml               # apps/*
```

The frontend started with `app`, `pages`, and `shared`; `entities`, `features`, and `widgets` have now been introduced where product complexity created useful boundaries.

See [`docs/architecture`](docs/architecture/README.md) for the architecture contract.

## Packages and tooling

### Workspace

| Package / tool     | Current role                                       |
| ------------------ | -------------------------------------------------- |
| pnpm `10.18.3`     | workspace package manager and fast cached installs |
| TypeScript `5.9.x` | strict typing across frontend and API              |
| ESLint `9.x`       | type-aware linting                                 |
| Prettier `3.6.2`   | formatting gate                                    |
| Vitest `3.2.x`     | frontend and API unit tests                        |

### Frontend — `@forma/web`

| Package                       | Current role                                        |
| ----------------------------- | --------------------------------------------------- |
| React `19.2.x`                | UI runtime                                          |
| React DOM `19.2.x`            | browser renderer                                    |
| Vite `7.1.x`                  | dev server and production build                     |
| TanStack Router `1.132.x`     | typed routing, protected routes, loaders            |
| TanStack Virtual `3.14.x`     | scalable virtualized UI surfaces                    |
| React Hook Form `7.65.x`      | form state                                          |
| `@hookform/resolvers` `5.2.x` | form/schema integration                             |
| Zod `4.1.x`                   | runtime validation                                  |
| Playwright `1.56.x`           | browser smoke and performance tests                 |
| Testing Library               | component behavior and accessibility-oriented tests |
| jsdom `27.x`                  | browser-like unit-test environment                  |

The frontend uses browser storage intentionally:

- **IndexedDB** for durable task/project data and offline-capable persistence.
- **sessionStorage** for short-lived OIDC PKCE transaction/session state.
- **localStorage/sessionStorage** only when the lifetime of the data justifies it; access tokens are not stored long-term in localStorage.

### API — `@forma/api`

| Package                    | Current role                           |
| -------------------------- | -------------------------------------- |
| NestJS `11.1.x`            | API framework and dependency injection |
| MongoDB driver `6.20.x`    | durable task snapshot persistence      |
| `jose` `6.2.x`             | JWT/JWKS verification                  |
| Zod `4.1.x`                | runtime configuration/input validation |
| RxJS `7.8.x`               | NestJS runtime dependency              |
| `reflect-metadata` `0.2.x` | NestJS metadata support                |

## Getting started

Requirements:

- Node.js `>=22.12.0`
- pnpm `10.18.3`

Install all workspace packages:

```bash
pnpm install
```

Run the frontend:

```bash
pnpm dev:web
```

Build and start the API:

```bash
pnpm build:api
pnpm dev:api
```

Run the common quality checks:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

Or run the full local preflight:

```bash
pnpm preflight
```

Useful focused commands:

```bash
pnpm test:web
pnpm test:api
pnpm test:frontend
pnpm benchmark:task-board
pnpm benchmark:browser
```

## Frontend routing and authentication

The main workspace routes are protected. The browser verifies an authenticated session through `GET /api/auth/me` before entering protected application routes.

The SPA implements provider-neutral **OIDC Authorization Code + PKCE**:

- state and PKCE verifier are stored in `sessionStorage`;
- the callback exchanges the authorization code for an access token;
- duplicate callback exchanges are deduplicated to remain safe under React StrictMode;
- the access token is exposed to API adapters through a configurable bearer-token provider;
- expired or malformed stored sessions are discarded.

Important frontend environment variables:

```text
VITE_API_BASE_URL=
VITE_OIDC_AUTHORIZATION_ENDPOINT=
VITE_OIDC_TOKEN_ENDPOINT=
VITE_OIDC_CLIENT_ID=
VITE_OIDC_REDIRECT_URI=
VITE_OIDC_SCOPE=openid profile email
```

`VITE_DEMO_MODE=true` is reserved for the GitHub Pages demo build. It creates a local demo session and deliberately skips `/api/auth/me`. Do not enable it for a real production deployment.

## GitHub Pages frontend demo

`.github/workflows/deploy-pages.yml` builds `@forma/web` with:

```text
GITHUB_PAGES=true
VITE_DEMO_MODE=true
```

`GITHUB_PAGES=true` configures Vite's base path as `/forma-workspace/`. The workflow also creates a `404.html` SPA fallback so direct navigation to client routes can return the frontend shell.

A real deployed frontend should instead set `VITE_API_BASE_URL` to the deployed API origin and configure the OIDC variables above.

## Backend persistence

The API runs on port `3001` by default. Copy `.env.example` into your local environment configuration and provide `MONGODB_URI` to enable MongoDB persistence. `MONGODB_DB` defaults to `forma_workspace`.

Project tasks are stored as one snapshot document per project in the `project_task_snapshots` collection. Each document contains `ownerId`, the project task array, and its server `revision`. Tasks, ownership, and revision are enforced in the repository boundary so an authenticated user cannot read or overwrite another user's project snapshot.

Because tasks and revision are updated together in a single MongoDB document, the optimistic-concurrency check remains atomic without requiring a multi-document transaction.

When `MONGODB_URI` is not set, task persistence falls back to the in-memory repository for lightweight local development. Production startup fails fast when `MONGODB_URI` is missing so a deployed API cannot accidentally run with ephemeral task storage.

## API authentication

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

The production frontend must build with `VITE_API_BASE_URL` pointing at the deployed API origin. Do not include a path suffix such as `/api`; the frontend client adds API routes itself.

NestJS shutdown hooks are enabled for `SIGTERM` and `SIGINT`. During container restarts or rolling deploys, the shared MongoDB client is closed through `onModuleDestroy` instead of leaving the process to be killed with open database resources.

### API container

Build the production API image from the repository root:

```bash
docker build -f apps/api/Dockerfile -t forma-api .
```

Run MongoDB 8.2 locally:

```bash
docker run --rm -d -p 27017:27017 --name forma-mongo mongo:8.2
```

Then run the production API with MongoDB and a development-only example HMAC verifier:

```bash
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

## Quality gates

Pull requests are protected by four complementary workflows:

1. **CI** — install, typecheck, lint, format, unit tests, build.
2. **Frontend Smoke** — Playwright browser validation of the main user flow.
3. **Performance Baseline** — deterministic performance regression checks.
4. **Browser Performance** — browser-level performance validation.

Pushes to `main` also trigger the GitHub Pages frontend deployment. API container workflows validate the production backend path with MongoDB, authenticated requests, owner isolation, optimistic concurrency, health/readiness behavior, and graceful shutdown.

## Roadmap

1. Architecture contract and monorepo foundation — complete
2. Browser persistence and task vertical slice — active
3. OIDC/JWT authentication boundary — active
4. Production API deployment and hosted identity provider integration
5. Shared workspace membership and role-based access
6. Forma UI design system expansion
7. Accessibility and performance hardening
8. Broader enterprise workspace modules

## Product direction

The first substantial vertical slice focuses on projects and task management, giving the project a realistic surface for complex UI, state ownership, browser persistence, authentication, testing, accessibility, and performance work. The architecture is intended to grow toward a broader internal enterprise workspace without coupling the current task domain to future modules.
