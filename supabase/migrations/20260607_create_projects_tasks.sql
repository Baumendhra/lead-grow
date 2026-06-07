-- ============================================================
-- STEP 1: Run this FIRST — Create projects & tasks tables
-- (Skip if they already exist — use IF NOT EXISTS)
-- ============================================================

-- Helper: auto-update updated_at
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Projects table
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  status      text not null default 'active',
  client_id   uuid references public.clients(id) on delete set null,
  deadline    date,
  priority    text default 'medium',
  sold_price  numeric default 0,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.projects enable row level security;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;

drop policy if exists "projects_all_auth" on public.projects;
create policy "projects_all_auth"
  on public.projects for all to authenticated
  using (true) with check (auth.uid() = created_by);

drop trigger if exists trg_projects_u on public.projects;
create trigger trg_projects_u
  before update on public.projects
  for each row execute function public.tg_set_updated_at();

-- Tasks table
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

alter table public.tasks enable row level security;
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;

drop policy if exists "tasks_all_auth" on public.tasks;
create policy "tasks_all_auth"
  on public.tasks for all to authenticated
  using (true) with check (auth.uid() = created_by);

drop trigger if exists trg_tasks_u on public.tasks;
create trigger trg_tasks_u
  before update on public.tasks
  for each row execute function public.tg_set_updated_at();

-- ============================================================
-- STEP 2: If projects table already exists but lacks sold_price
-- Run only this part if you get "column does not exist" error:
-- ============================================================

alter table public.projects add column if not exists sold_price numeric default 0;
alter table public.projects add column if not exists client_id uuid references public.clients(id) on delete set null;
alter table public.projects add column if not exists deadline date;
