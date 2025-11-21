---
trigger: always_on
---

# Windsurf Development Rules - November 2025

## Tech Stack
- Use Supabase for PostgreSQL database with Row Level Security (RLS) and Realtime subscriptions.
- Use RPC Functions for complex server-side queries and computed data.
- Use Edge Functions for business logic, third-party integrations, and webhooks.
- Use Database Indexes on foreign keys and frequently queried columns for performance.
- Use Table Partitioning for large tables (orders, logs, events) to improve scalability.
- Use React Query v5 (TanStack Query) for server state management, caching, and optimistic updates.
- Use Zustand for global client state (UI preferences, temporary data, flags).
- Use React Context for dependency injection and providers (Supabase client, theme, i18n).
- Store Server State (API/DB data) in React Query.
- Store Client State (UI preferences, temporary flags) in Zustand.
- Store URL State (filters, pagination) in search params.
- Use React Context for cross-cutting concerns (auth, theme, configuration).

## General Code Style & Formatting
- Use English for all code and french all documentation.
- Always declare the type of each variable and function (parameters and return value).
- Avoid using any - use unknown with type guards when type is uncertain.
- Create necessary types and interfaces.
- Use JSDoc to document public classes, methods, and complex business logic.
- Use meaningful blank lines to separate logical blocks within functions.
- One primary export per file (related types and interfaces can be co-located).

## Naming Conventions
- Use PascalCase for classes, components, types, and interfaces.
- Use camelCase for variables, functions, and methods.
- Use kebab-case for file and directory names.
- Use UPPER_SNAKE_CASE for constants and environment variables.
- Avoid magic numbers and strings - define named constants.
- Use descriptive names that reveal intent.

## Functions & Logic
- Keep functions short and focused (<20 lines ideal, <30 maximum).
- Follow Single Responsibility Principle - one function, one purpose.
- Use early returns to reduce nesting and cognitive load.
- Extract complex logic into utility functions.
- Use higher-order functions (map, filter, reduce) over imperative loops.
- Use arrow functions for callbacks, event handlers, and short inline functions.
- Use named functions for complex business logic and reusable utilities.
- Use default parameter values instead of null/undefined checks.
- Use object parameters (RO-RO pattern) when function has 3+ parameters or parameters may evolve.
- Prefer functional patterns over imperative code.

## Data Handling
- Avoid primitive obsession - encapsulate related data in composite types.
- Create domain-specific types for clarity and type safety.
- Use branded types for IDs and values requiring validation.
- Validate data at boundaries (API inputs, user forms, external sources).
- Use class constructors or factory functions for validation logic.
- Keep business logic pure - validate before calling business functions.
- Prefer immutability for all data structures.
- Use readonly for object properties that should not change.
- Use as const for literal values and configuration objects.
- Prefer const over let for variables.

## Supabase Best Practices

### RPC Functions
- Use RPC functions for complex queries with multiple joins or computed fields.
- Mark RPC functions as security definer when they need elevated privileges.
- Mark RPC functions as stable when they don't modify data.
- Return JSONB for complex computed objects.
- Always handle errors in RPC functions with proper error messages.

### Row Level Security (RLS)
- Always enable RLS on all tables except public lookup tables.
- Create specific policies for SELECT, INSERT, UPDATE, DELETE operations.
- Use auth.uid() to restrict access to user's own data.
- Use security definer functions when users need controlled access to other users' data.
- Test RLS policies thoroughly with different user roles.
- Use policy names that clearly describe what they allow.

### Database Indexes
- Create indexes on all foreign key columns.
- Create indexes on columns used in WHERE clauses frequently.
- Create composite indexes for queries filtering on multiple columns.
- Order composite index columns by selectivity (most selective first).
- Create partial indexes for queries with constant WHERE conditions.
- Use GIN indexes for full-text search on text columns.
- Use BRIN indexes for large tables with naturally ordered data.
- Monitor query performance and add indexes based on slow query logs.

### Table Partitioning
- Partition large tables (>1M rows) by date ranges for time-series data.
- Create monthly or quarterly partitions based on data volume.
- Automate partition creation with scheduled functions.
- Create indexes on partitioned tables for optimal performance.
- Use partition pruning by including partition key in WHERE clauses.

### Edge Functions
- Use Edge Functions for complex business logic that shouldn't be in client code.
- Use Edge Functions for third-party API integrations (Stripe, SendGrid, etc).
- Use Edge Functions for webhooks and background jobs.
- Always use try-catch for error handling in Edge Functions.
- Use Supabase service role key for database operations in Edge Functions.
- Return proper HTTP status codes (200, 400, 500).
- Log errors with console.error for debugging.
- Keep Edge Functions focused on single responsibility.

## React Query Best Practices (v5)

### Query Keys
- Store all query keys in a centralized lib/query-keys.ts file.
- Use hierarchical query key structure for easy invalidation.
- Use factory functions for query keys with parameters.
- Use as const for query key arrays to ensure type safety.
- Follow pattern: ['resource', 'action', ...params].

### Query Hooks
- Create custom hooks for all queries using useQuery.
- Pass Supabase client as parameter to query functions.
- Return only necessary data from custom hooks.
- Configure staleTime based on how often data changes (5min for stable data, 30s for frequently changing data).
- Configure gcTime (formerly cacheTime) for how long to keep unused data in cache.
- Use enabled option to conditionally execute queries.
- Set retry count based on query importance (3 for critical, 1 for optional).

### Mutations
- Create custom hooks for all mutations using useMutation.
- Use onMutate for optimistic updates.
- Cancel outgoing queries in onMutate to prevent race conditions.
- Snapshot previous data in onMutate for rollback capability.
- Rollback changes in onError using snapshot from context.
- Always invalidate affected queries in onSettled.
- Invalidate both detail and list queries when data changes.
- Show user feedback (success/error messages) in mutation callbacks.

### Query Client Configuration
- Set global defaults for staleTime (60s) and gcTime (5min).
- Disable refetchOnWindowFocus for stable data.
- Enable refetchOnReconnect to get fresh data after network reconnection.
- Set retry to 3 for queries, 1 for mutations.
- Use QueryClientProvider at app root.
- Use ReactQueryDevtools in development only.

## Zustand Best Practices

### Store Design
- Use Zustand only for global client state (UI preferences, temporary flags).
- Do NOT use Zustand for server state (use React Query instead).
- Create focused stores for different domains (auth, ui, cart).
- Split large stores into slices for better organization.
- Keep state flat and simple - avoid deep nesting.
- Use devtools middleware in development for debugging.
- Use persist middleware only for data that should survive page refresh.
- Partition persisted state - only store what's necessary.

### Store Structure
- Define separate interfaces for State and Actions.
- Combine State and Actions in a single Store type.
- Group related actions together.
- Use clear, descriptive action names (verbs: set, update, add, remove, toggle).
- Keep actions pure and focused on single responsibility.

### Selectors
- Create selector functions to extract specific state slices.
- Export selectors alongside the store.
- Use selectors in components to prevent unnecessary re-renders.
- Use useShallow hook when selecting multiple values.
- Never select the entire store - only select what component needs.

### Async Actions
- Implement async logic directly in store actions.
- Use set within async actions to update loading and error states.
- Use get() to access current state within actions.
- Handle errors properly with try-catch in async actions.
- Set loading state before async operation, clear after.

## React Context Best Practices
- Use Context for dependency injection, NOT for state management.
- Use Context for cross-cutting concerns (Supabase client, theme, i18n, feature flags).
- Create Provider components with clear names.
- Memoize context values with useMemo to prevent unnecessary re-renders.
- Create custom hooks (useContextName) for consuming context.
- Throw error in custom hooks if context is used outside Provider.
- Keep context value simple and stable.
- Avoid frequent context value changes - they cause all consumers to re-render.

## Project Structure
- Use app directory for Next.js projects.
- Group related features in feature folders.
- Keep components folder for reusable UI components.
- Store custom hooks in hooks folder.
- Store Zustand stores in stores folder.
- Store React contexts in contexts folder.
- Store API clients and services in services folder.
- Store types in types folder.
- Store utility functions in utils or lib folder.
- Store constants in constants folder.
- Use kebab-case for all folder and file names.

## Performance Best Practices
- Use React.memo for expensive components that render often with same props.
- Use useMemo for expensive computations.
- Use useCallback for functions passed as props to memoized components.
- Avoid inline object and array literals in JSX props.
- Use React Query's staleTime to reduce unnecessary refetches.
- Use Zustand selectors to prevent unnecessary re-renders.
- Use virtual scrolling for large lists (react-virtual).
- Lazy load routes and heavy components with React.lazy.
- Code split by route and feature.
- Monitor bundle size with vite-bundle-visualizer.
- Use indexes on all database queries.
- Use RLS policies efficiently - avoid complex subqueries.
- Use database partitioning for large tables.

## Error Handling
- Always use try-catch for async operations.
- Throw custom error classes with meaningful messages.
- Handle errors at appropriate boundaries (component, hook, service).
- Show user-friendly error messages in UI.
- Log errors to console in development.
- Use error boundaries for component-level error handling.
- Return error states from custom hooks.
- Never swallow errors silently.

## Testing Guidelines
- Write tests for complex business logic.
- Write tests for utility functions.
- Use descriptive test names that explain what is being tested.
- Follow Arrange-Act-Assert pattern.
- Mock external dependencies (Supabase, APIs).
- Test error cases and edge cases.
- Use React Testing Library for component tests.
- Test user interactions, not implementation details.

## Documentation
- Document public APIs with JSDoc.
- Document complex algorithms with comments explaining "why".
- Keep README updated with setup instructions and environment variables.
- Document architecture decisions in ADR (Architecture Decision Records).
- Document RLS policies and their purpose.
- Document database schema and relationships.
- Keep comments concise and meaningful.
- Remove commented-out code before committing.

## Security Best Practices
- Always enable RLS on Supabase tables.
- Never expose service role key in client code.
- Validate all user inputs at API boundaries.
- Use environment variables for secrets and API keys.
- Never commit .env files to version control.
- Use HTTPS for all API calls.
- Sanitize user input before database queries.
- Use parameterized queries to prevent SQL injec