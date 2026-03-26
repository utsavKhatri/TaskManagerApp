# Supabase Setup Guide

This document describes how the app is configured with Supabase, including schema and RLS policies used by the current codebase.

## 1) Project Configuration

- Supabase local config is in `supabase/config.toml`
- SQL schema snapshot is in `supabase/schema.sql`
- Incremental migrations are in `supabase/migrations/`
- Client initialization is in `src/api/supabase.ts`

## 2) Environment Variables

The app requires:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Steps:

1. Copy `.env.example` to `.env`
2. Set your Supabase project URL and anon key

The app uses `react-native-config` to load these values.

## 3) Database Schema (Current)

### `public.tasks`

Core columns used in the app:

- `id` UUID PK
- `user_id` UUID FK to `auth.users`
- `title` text (required)
- `description` text (optional)
- `status` enum-like text (`pending`, `in_progress`, `completed`)
- `prioriy` text (`low`, `medium`, `high`) (note: current column name is spelled `prioriy`)
- `position` double precision for ordering
- `is_deleted` boolean soft-delete flag
- `created_at`, `updated_at` timestamps
- `category_id` UUID FK to `public.categories`

### `public.categories`

- `id` UUID PK
- `user_id` UUID FK to `auth.users`
- `name`, `color`, `icon`
- `created_at`

## 4) RLS Policies

RLS is enabled on both tables and limits users to their own rows.

### Tasks policies

- Select own tasks (`auth.uid() = user_id`) and not soft-deleted (`is_deleted = false`)
- Insert own tasks
- Update own tasks

### Categories policies

- Select own categories
- Insert own categories
- Update own categories
- Delete own categories

Policy definitions are visible in:

- `supabase/schema.sql`
- `supabase/migrations/20260129_rls_performance_fixes.sql`

## 5) RPC for Batch Reorder

Function: `public.update_task_positions(updates jsonb)`

- Runs as `security definer`
- Uses fixed `search_path = public`
- Updates positions only where `t.user_id = auth.uid()`

Relevant migration:

- `supabase/migrations/20260129_secure_rpc_and_extensions.sql`

## 6) Apply Migrations

If using Supabase CLI with this repository:

```sh
supabase db reset
```

Or apply migration files in order in your environment. After applying migrations, verify:

- RLS is enabled on `tasks` and `categories`
- Policies exist and reference `auth.uid()`
- RPC `update_task_positions` exists and is executable
