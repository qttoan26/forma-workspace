# Folder Structure

## Initial structure

Forma Workspace starts with a pages-first structure:

```text
src/
├── app/
│   ├── config/
│   ├── providers/
│   ├── router/
│   └── styles/
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

The repository also separates engineering documentation and non-unit test suites:

```text
docs/
├── architecture/
├── decisions/
├── migration/
├── performance/
└── testing/

tests/
├── accessibility/
├── e2e/
├── integration/
└── performance/
```

## Responsibilities

### app

Owns application composition. Examples include router construction, root providers, global configuration, error boundaries, and global styles. It should not become a dumping ground for product features.

### pages

Owns route-level composition. A page may coordinate lower-level modules but should avoid becoming the permanent home of reusable domain logic.

### shared

Owns reusable technical building blocks that do not encode Forma-specific business behavior. Examples include generic UI primitives, HTTP infrastructure, utilities, configuration helpers, common hooks, and foundational types.

## When to introduce entities

Introduce `entities` when a domain concept such as Task, Project, Workspace, or Member develops reusable behavior or UI used by multiple product flows.

Do not create an entity solely because a TypeScript interface exists.

## When to introduce features

Introduce `features` when a user action becomes independently meaningful and reusable, for example creating a task, filtering tasks, assigning a member, or changing task status.

A feature should represent user/product capability rather than a generic component category.

## When to introduce widgets

Introduce `widgets` when multiple entities/features need stable composition into a substantial reusable UI region such as a task board, project sidebar, or data table workspace.

## Public APIs

Once slices become substantial, cross-slice consumers should import through the slice public API.

```ts
import { TaskCard } from '@/entities/task'
```

Avoid coupling consumers to internal structure:

```ts
import { TaskCard } from '@/entities/task/ui/task-card'
```

Internal imports within a slice may remain direct when that improves clarity.

## Avoid empty architecture

Do not add directories merely to make the repository resemble an architecture diagram. New boundaries should contain real code and solve a concrete problem.
