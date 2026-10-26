# Folder Structure

## Current structure

Forma Workspace started pages-first and only introduced additional layers when real product behavior justified them. The active source structure is now:

```text
src/
├── app/
├── pages/
├── widgets/
├── features/
├── entities/
└── shared/
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

Owns application composition: router construction, root providers, global configuration, error boundaries, and global styles. It must not become a dumping ground for product features.

### pages

Owns route-level composition. Pages connect URL state and route parameters to lower product layers. Reusable domain or interaction logic should move down once a stable boundary emerges.

### widgets

Owns substantial reusable UI compositions. The task board is the first active widget because it coordinates task domain data and task-management features into a stable workspace region.

### features

Owns meaningful user actions and workflows. Task creation/editing is the first active feature because its validation and form behavior form an independently testable product capability.

### entities

Owns reusable domain concepts and their domain-facing contracts. Task, Project, Workspace, and Member are active entities because the board and task flows share these concepts across composition boundaries.

### shared

Owns reusable technical building blocks that do not encode Forma-specific business behavior: generic UI primitives, HTTP infrastructure, utilities, configuration helpers, common hooks, and foundational technical types.

## Why the layers were earned

The repository did not pre-create empty Feature-Sliced Design layers. They appeared as vertical slices required them:

- `entities` became useful when Task, Project, Workspace, and Member were shared across product flows.
- `widgets` became useful when the task board needed a stable composition boundary.
- `features` became useful when task creation/editing gained validation, form state, and tests.
- URL-driven filters remain page/router state because they are navigational, shareable, and restorable rather than global client state.

This is the default rule for future architecture: add a boundary only when it owns real behavior and reduces coupling.

## Public APIs

As slices become substantial, cross-slice consumers should import through the slice public API.

```ts
import { TaskCard } from '@/entities/task'
```

Avoid coupling consumers to internal structure:

```ts
import { TaskCard } from '@/entities/task/ui/task-card'
```

Internal imports within a slice may remain direct when that improves clarity. Public API cleanup should be incremental rather than a reason to create empty barrel files.

## Avoid empty architecture

Do not add directories merely to make the repository resemble an architecture diagram. New boundaries must contain real code and solve a concrete product or engineering problem.
