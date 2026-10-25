# Frontend Architecture

**Status:** Accepted, evolving

This document defines the architecture contract for Forma Workspace. It describes the direction of the codebase rather than freezing a final taxonomy before the product earns it.

## Goals

- Keep the initial architecture easy to navigate and change.
- Make dependency direction explicit.
- Keep product state close to its owner.
- Support complex, data-heavy interfaces without coupling the product to a single global store.
- Make accessibility, testing, and performance first-class engineering concerns.
- Allow architectural complexity to emerge from real product requirements.

## Non-goals

- Pre-create every possible architectural layer.
- Turn folder taxonomy into an end goal.
- Centralize all state in one client store.
- Build a reusable design system before product components demonstrate stable reuse.
- Perform a blind rewrite of a reference implementation.

## Initial architecture

```text
app / pages
     ↓
   shared
```

The first implementation uses three top-level source areas:

- `app`: application composition, providers, routing, configuration, and global styles.
- `pages`: route-level product composition.
- `shared`: reusable technical primitives with no Forma-specific business rules.

## Earned complexity

As the application grows, the architecture may introduce `widgets`, `features`, and `entities` when those boundaries solve concrete coupling, ownership, reuse, or navigation problems.

A likely mature dependency direction is:

```text
app / pages
     ↓
   widgets
     ↓
   features
     ↓
   entities
     ↓
   shared
```

These layers are not milestones by themselves. They are tools that must justify their existence.

## Core principles

1. Dependencies point downward.
2. Shared code contains no product business rules.
3. State stays close to its owner.
4. Server state is not duplicated into a general-purpose global store.
5. Shareable navigation state belongs in the URL where practical.
6. Public module APIs are preferred over deep cross-module imports.
7. Architectural exceptions require an explicit decision record when they become meaningful.
8. Performance and accessibility regressions are treated as engineering defects.

## Migration approach

Forma Workspace is developed as an independent product codebase. Existing/reference behavior may inform product decisions, but implementation is migrated deliberately rather than copied wholesale.

The migration sequence is documented in [`../migration/README.md`](../migration/README.md).
