-- ============================================================
-- Projects & Tasks Tables
-- Run this in your Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- 1. Create projects table
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  status      text not null default 'active',
  client_id   uuid references public.clients(id) on delete set null,
  deadline    date,
  priority    text default 'medium',
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Enable RLS on projects
alter table public.projects enable row level security;

-- 3. Grants for projects
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;

-- 4. RLS policy for projects (authenticated users can manage their own)
drop policy if exists "projects_all_auth" on public.projects;
create policy "projects_all_auth"
  on public.projects
  for all
  to authenticated
  using (true)
  with check (auth.uid() = created_by);

-- 5. Create tasks table
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'todo',   -- todo | in_progress | done
  priority    text default 'medium',           -- low | medium | high
  assigned_to uuid references auth.users(id) on delete set null,
  deadline    date,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 6. Enable RLS on tasks
alter table public.tasks enable row level security;

-- 7. Grants for tasks
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;

-- 8. RLS policy for tasks
drop policy if exists "tasks_all_auth" on public.tasks;
create policy "tasks_all_auth"
  on public.tasks
  for all
  to authenticated
  using (true)
  with check (auth.uid() = created_by);

-- 9. Auto-update updated_at trigger (requires tg_set_updated_at function)
-- If the function doesn't exist yet, create it:
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 10. Attach triggers
drop trigger if exists trg_projects_u on public.projects;
create trigger trg_projects_u
  before update on public.projects
  for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_tasks_u on public.tasks;
create trigger trg_tasks_u
  before update on public.tasks
  for each row execute function public.tg_set_updated_at();
