# Error Handling Strategy

## Current Approach in Code

## 1) API Layer Throws Typed Errors

In `src/api/tasks.ts` and `src/api/categories.ts`:

- Supabase responses are checked for `error`
- Failures are converted to `throw new Error(error.message)`

This keeps network/data errors propagating to React Query mutation/query handlers.

## 2) Mutation Error Recovery

In `src/features/tasks/hooks/useTasks.ts`:

- `onError` handlers log errors
- Optimistic cache state is rolled back from captured `previousTasks`

This prevents stale optimistic state from persisting after failed writes.

## 3) Auth Screen Error UX

In login/signup screens:

- Validation checks empty fields before network calls
- Supabase auth errors are shown in-page (`setError(...)`)
- Signup success uses toast feedback

## 4) Auth Initialization Safety

In `AuthContext`:

- `getSession()` runs in `try/catch/finally`
- App leaves loading state even if session restore fails

## Recommended Improvements

- Add shared error normalization utility (map Supabase codes to user-friendly text)
- Add global query error boundaries for non-auth screens
- Capture errors to remote logging (Sentry or similar)
- Introduce retry/backoff policy for transient failures
- Add offline messaging for mobile network transitions
