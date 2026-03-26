# Authentication Flow

This app uses Supabase Auth with session persistence in React Native.

## Components Involved

- Supabase client: `src/api/supabase.ts`
- Auth context/provider: `src/features/auth/AuthContext.tsx`
- Auth hook: `src/hooks/useAuth.ts`
- Auth screens: `src/features/auth/screens/LoginScreen.tsx`, `src/features/auth/screens/SignUpScreen.tsx`
- Navigation gate: `src/navigation/AppNavigator.tsx`

## Flow Overview

1. App starts and `AuthProvider` mounts.
2. `AuthProvider` calls `supabase.auth.getSession()` to restore existing session.
3. `AuthProvider` subscribes to `supabase.auth.onAuthStateChange(...)`.
4. `AppNavigator` reads `{ session, isLoading }` from `useAuth()`.
5. While loading, app shows spinner.
6. If session exists, app routes to `TaskListScreen`.
7. If no session, app routes to `AuthNavigator` (Login/SignUp).

## Sign Up

`SignUpScreen` calls:

```ts
supabase.auth.signUp({ email, password })
```

On success, the UI shows a success toast and navigates back to login.

## Sign In

`LoginScreen` calls:

```ts
supabase.auth.signInWithPassword({ email, password })
```

On success, auth state changes, context updates, and app moves into authenticated stack.

## Sign Out

`AuthContext` exposes:

```ts
signOut: () => supabase.auth.signOut()
```

Once sign out completes, auth state updates and app returns to auth stack.

## Token Refresh Behavior

`src/api/supabase.ts` integrates app lifecycle:

- When app is active: `supabase.auth.startAutoRefresh()`
- When app is backgrounded: `supabase.auth.stopAutoRefresh()`

Session persistence uses `AsyncStorage`.
