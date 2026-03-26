# Optimistic UI Implementation Approach

The app implements optimistic UI for task mutations in `src/features/tasks/hooks/useTasks.ts`.

## Why Optimistic UI Here

- Faster perceived response for create/update/delete/reorder
- Better UX for drag-and-drop ordering
- Reduced visible latency on mobile networks

## Pattern Used

For each mutation:

1. Cancel active `tasks` queries.
2. Snapshot previous cache (`previousTasks`).
3. Apply optimistic cache update with `queryClient.setQueryData(...)`.
4. If request fails, rollback cache from snapshot in `onError`.
5. Invalidate related queries in `onSettled` to sync with server truth.

## Mutation-Specific Notes

## Create Task

- Adds temporary task with id prefix `temp-`
- Inserts into first page of `['tasks', 'all']` cache
- Revalidated after network response

## Update Task

- Patches matching task fields in cached pages
- Rolls back on failure

## Delete Task

- Removes task from cache immediately
- Backend performs soft delete (`is_deleted = true`)

## Reorder Task Positions

- Updates cached `position` values immediately
- Persists order through RPC `update_task_positions`

## Tradeoffs

- Temporary mismatch can occur until settlement if server applies additional transformations
- Current optimistic writes target `['tasks', 'all']`; filtered query caches may rely on invalidation for consistency

## Suggested Hardening

- Centralize optimistic update helpers to reduce duplication
- Use stable temporary id strategy to avoid collision in edge cases
- Extend optimistic behavior to all active filtered keys when needed
