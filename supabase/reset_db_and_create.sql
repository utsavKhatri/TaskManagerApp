drop function if exists public.update_task_positions (jsonb);
drop table if exists public.tasks cascade;
drop table if exists public.categories cascade;

create schema if not exists extensions;
grant usage on schema extensions to postgres, anon, authenticated, service_role;

create extension if not exists pg_trgm with schema extensions;
create extension if not exists moddatetime with schema extensions;

create table public.categories (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id),
  name text not null,
  color text not null,
  icon text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint categories_pkey primary key (id)
);

create table public.tasks (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) > 0),
  description text,
  status text not null default 'pending' check (
    status in ('pending', 'in_progress', 'completed')
  ),
  prioriy text not null default 'medium' check (prioriy in ('low', 'medium', 'high')),
  is_deleted boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  category_id uuid references public.categories (id),
  position double precision not null default extract(epoch from now()),
  constraint tasks_pkey primary key (id)
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_status_idx on public.tasks (status);
create index tasks_created_at_idx on public.tasks (created_at desc);
create index tasks_title_search_idx on public.tasks using gin (title gin_trgm_ops);

create index tasks_user_position_idx on public.tasks (user_id, position);
create index tasks_category_id_idx on public.tasks (category_id);
create index tasks_active_user_position_idx on public.tasks (user_id, position)
  where is_deleted = false;

create index categories_user_id_idx on public.categories (user_id);

create trigger handle_updated_at
before update on public.tasks
for each row
execute procedure extensions.moddatetime (updated_at);

alter table public.tasks enable row level security;
alter table public.categories enable row level security;

create policy "Users can view their own tasks" on public.tasks
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert their own tasks" on public.tasks
  for insert with check ((select auth.uid()) = user_id);

create policy "Users can update their own tasks" on public.tasks
  for update using ((select auth.uid()) = user_id);

create policy "Users can view their own categories" on public.categories
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert their own categories" on public.categories
  for insert with check ((select auth.uid()) = user_id);

create policy "Users can update their own categories" on public.categories
  for update using ((select auth.uid()) = user_id);

create policy "Users can delete their own categories" on public.categories
  for delete using ((select auth.uid()) = user_id);

create or replace function public.update_task_positions (updates jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tasks as t
  set position = (x.position)::double precision
  from (
    select
      (elem->>'id')::uuid as id,
      (elem->>'position')::double precision as position
    from jsonb_array_elements(updates) as elem
  ) as x
  where t.id = x.id
    and t.user_id = auth.uid();
end;
$$;
