# CRUD Operations and Data Flow

This document explains how data moves through the app for tasks and categories.

## Data Layer Structure

- Supabase client: `src/api/supabase.ts`
- API functions: `src/api/tasks.ts`, `src/api/categories.ts`
- Query/mutation hooks: `src/features/tasks/hooks/useTasks.ts`
- UI screens/components consume hooks and render state

## Read (Fetch)

### Tasks

Hook: `useTasks(dateRange)`

- Uses `useInfiniteQuery`
- Query key is derived from active date filter
- Fetches paginated tasks via `fetchTasks(...)`
- Returns tasks sorted by `position` then `created_at`
- Includes joined category data in task query

### Categories

Hook: `useCategories()`

- Uses `useQuery`
- Calls `fetchCategories()`
- Orders categories alphabetically by `name`

### Date bounds for filtering

Hook: `useTaskDateBounds()`

- Calls `fetchUserTaskDateBounds()`
- Used to drive date filter UI constraints

## Create

### Create task

- UI triggers `useCreateTask().mutate(newTask)`
- Mutation calls `createTask(...)`
- Optimistic row is inserted into cache first
- After settlement, task queries are invalidated and re-fetched

### Create category

- API exists as `createCategory(...)`
- Follows direct insert pattern with Supabase and typed return value

## Update

### Update task fields

- `useUpdateTask().mutate(updatedTask)`
- Calls `updateTask(...)`
- Optimistically patches matching cached task row
- On completion, invalidates task queries

### Reorder tasks

- `useUpdateTaskPositions().mutate([{ id, position }])`
- Calls RPC `update_task_positions`
- Cache is optimistically updated for instant drag-drop feedback

## Delete

### Delete task (soft delete)

- `deleteTask(taskId)` sets `is_deleted = true`
- Not physically removed from DB
- RLS select policy excludes soft-deleted rows from user reads

### Delete category (hard delete)

- `deleteCategory(categoryId)` performs actual `delete()`

## End-to-End Flow Summary

1. UI dispatches action via hook mutation/query.
2. Hook calls API function in `src/api/*`.
3. API function executes Supabase operation.
4. TanStack Query updates cache (optimistic where configured).
5. Query invalidation reconciles cache with server truth.
