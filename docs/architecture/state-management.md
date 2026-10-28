# State Management

Forma Workspace classifies state by ownership before selecting a library.

## Principles

- Keep state as close as possible to the code that owns it.
- Derive values instead of storing duplicate state.
- Prefer the URL for state users expect to share, bookmark, or navigate with.
- Treat server data as server state rather than copying it into a general-purpose client store.
- Persist only intentional user preferences or offline/product data.
- Introduce a cross-feature client store only when React composition is no longer the clearest ownership model.

## State categories

| State                      | Target owner/tool            |
| -------------------------- | ---------------------------- |
| Server/cache state         | TanStack Query               |
| Route/search/filter state  | TanStack Router              |
| Form state                 | React Hook Form + Zod        |
| Local interaction state    | React state                  |
| Persisted preferences      | Dedicated preference adapter |
| Cross-feature client state | Zustand only when justified  |

The target tools describe intended ownership. They are installed only when a concrete product requirement uses them.

## Server state

Remote data should retain query identity, loading/error state, invalidation, and caching semantics. Avoid mirroring query data into a second global store.

Route loaders may own initial page-level data acquisition when navigation requires the data before rendering. Pages consume normalized loader results and pass domain data down to widgets. Repositories isolate the current data source from route and UI composition so fixture, HTTP, or cached implementations can evolve without changing widget contracts.

TanStack Query should be introduced when remote data needs cache lifetimes, background refetching, invalidation, mutations, optimistic updates, or other server-state behavior beyond route loading.

## URL state

Search terms, filters, sorting, selected views, pagination, and similar navigation state should be evaluated for URL ownership. If users reasonably expect refresh/back/share to preserve the state, URL ownership is usually preferred.

## Local UI state

Transient concerns such as dialog visibility, hover/selection details, temporary editing state, and component interaction state should remain local unless multiple distant owners genuinely coordinate it.

## Persisted preferences

Theme, density, sidebar behavior, and similar preferences should use a small persistence boundary rather than allowing arbitrary components to read/write storage directly.

## Global client stores

A global client store is not the default architecture. Zustand may be introduced for state that is truly client-owned, spans meaningful product boundaries, and becomes harder to model through composition or URL/server state.
