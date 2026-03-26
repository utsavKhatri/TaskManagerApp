# Architecture Decisions and Patterns

This app follows a feature-oriented React Native architecture with a thin data API layer and TanStack Query for server state.

## Core Decisions

## 1) Supabase as Backend

- Chosen for auth + Postgres + RLS in one managed platform
- Keeps backend complexity low for a mobile-first task app

## 2) React Context for Auth Session

- `AuthProvider` centralizes session state and sign out behavior
- Navigation access control is driven by a single auth source of truth

## 3) TanStack Query for Server State

- Query and mutation lifecycle handled in hooks (`useTasks.ts`)
- Cache invalidation strategy provides consistency after mutations
- Infinite query supports incremental task list loading

## 4) API Layer Boundary (`src/api/*`)

- Supabase calls are encapsulated away from UI components
- Keeps screens focused on presentation and user interaction
- Easier to test and refactor data logic independently

## 5) RLS-First Data Security

- Security enforced in database policies, not only client-side checks
- User ownership constraints rely on `auth.uid() = user_id`

## 6) Soft Delete for Tasks

- Deleted tasks are marked via `is_deleted`
- Supports recovery/auditing opportunities and avoids hard-delete race cases
- Read policy and read queries both exclude soft-deleted tasks

## 7) Batch Reordering via RPC

- Drag/drop ordering writes are grouped through `update_task_positions`
- Avoids multiple row updates from client loops and reduces round-trips

## Patterns in Use

- Provider composition at app root (`App.tsx`)
- Feature folders under `src/features/*`
- Custom hooks for stateful task workflows
- Strong typing through generated `Database` types in `src/types/database.ts`
