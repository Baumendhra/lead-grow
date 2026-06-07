-- ============================================================
-- Invoices + Vault Project Credentials Migration
-- Run in Supabase → SQL Editor
-- ============================================================

-- 1. INVOICES table with auto-generated LIZ-XXX numbers
-- ──────────────────────────────────────────────────────────

-- Sequence that powers LIZ-001, LIZ-002, etc.
create sequence if not exists public.invoice_number_seq start 1 increment 1;

-- Helper function: generates LIZ-001 style numbers
create or replace function public.generate_invoice_number()
returns text language plpgsql as $$
declare
  next_val int;
begin
  next_val := nextval('public.invoice_number_seq');
  return 'LIZ-' || lpad(next_val::text, 3, '0');
end;
$$;

create table if not exists public.invoices (
  id             uuid        primary key default gen_random_uuid(),
  invoice_number text        not null unique default public.generate_invoice_number(),
  client_id      uuid        references public.clients(id) on delete set null,
  project_id     uuid        references public.projects(id) on delete set null,
  amount         numeric     not null default 0,
  currency       text        not null default 'INR',
  status         text        not null default 'draft',  -- draft | sent | paid | overdue | cancelled
  due_date       date,
  notes          text,
  created_by     uuid        not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.invoices enable row level security;
grant select, insert, update, delete on public.invoices to authenticated;
grant all on public.invoices to service_role;
grant usage, select on sequence public.invoice_number_seq to authenticated;
grant usage, select on sequence public.invoice_number_seq to service_role;

drop policy if exists "invoices_all_auth" on public.invoices;
create policy "invoices_all_auth"
  on public.invoices for all to authenticated
  using (true)
  with check (auth.uid() = created_by);

-- Auto-update updated_at
drop trigger if exists trg_invoices_u on public.invoices;
create trigger trg_invoices_u
  before update on public.invoices
  for each row execute function public.tg_set_updated_at();


-- 2. Add project_id to credentials (Vault project sections)
-- ──────────────────────────────────────────────────────────

alter table public.credentials
  add column if not exists project_id uuid references public.projects(id) on delete set null;


-- 3. Add sold_price + deadline + client_id to projects (if not already done)
-- ──────────────────────────────────────────────────────────────────────────

alter table public.projects add column if not exists sold_price numeric default 0;
alter table public.projects add column if not exists deadline   date;
alter table public.projects add column if not exists client_id  uuid references public.clients(id) on delete set null;


-- 4. Tasks table (with description column so the error is gone)
-- ──────────────────────────────────────────────────────────────

create table if not exists public.tasks (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        references public.projects(id) on delete cascade,
  title       text        not null,
  status      text        not null default 'todo',
  priority    text        default 'medium',
  assigned_to uuid        references auth.users(id) on delete set null,
  deadline    date,
  created_by  uuid        not null references auth.users(id) on delete cascade,
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


-- 5. Projects table (in case it doesn't exist yet)
-- ──────────────────────────────────────────────────────────

create table if not exists public.projects (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  status      text        not null default 'active',
  client_id   uuid        references public.clients(id) on delete set null,
  deadline    date,
  priority    text        default 'medium',
  sold_price  numeric     default 0,
  created_by  uuid        not null references auth.users(id) on delete cascade,
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
