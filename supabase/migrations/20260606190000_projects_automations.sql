-- Add projects and tasks tables
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active',
  client_id uuid references public.clients(id) on delete set null,
  deadline date,
  priority text default 'medium',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "projects_all_auth" on public.projects for all to authenticated using (true) with check (auth.uid() = created_by);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo', -- todo, in_progress, done
  priority text default 'medium',
  assigned_to uuid references auth.users(id) on delete set null,
  deadline date,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
create policy "tasks_all_auth" on public.tasks for all to authenticated using (true) with check (auth.uid() = created_by);

create trigger trg_projects_u before update on public.projects for each row execute function public.tg_set_updated_at();
create trigger trg_tasks_u before update on public.tasks for each row execute function public.tg_set_updated_at();

-- Automations Engine via DB Triggers

-- 1. When a new lead is added, automatically create a follow-up activity
create or replace function public.trigger_lead_followup()
returns trigger language plpgsql security definer as $$
begin
  insert into public.activities (entity_type, entity_id, type, content, user_id)
  values ('lead', new.id, 'follow_up', 'Automated: Follow up with new lead "' || new.business_name || '"', new.created_by);
  return new;
end;
$$;

create trigger trg_lead_followup
  after insert on public.leads
  for each row execute function public.trigger_lead_followup();

-- 2. When a deal is marked as won, automatically log a win activity
create or replace function public.trigger_deal_won()
returns trigger language plpgsql security definer as $$
begin
  if new.stage = 'won' and old.stage != 'won' then
    insert into public.activities (entity_type, entity_id, type, content, user_id)
    values ('deal', new.id, 'deal_won', 'Automated: Deal won! "' || new.title || '"', new.created_by);
  end if;
  return new;
end;
$$;

create trigger trg_deal_won
  after update on public.deals
  for each row execute function public.trigger_deal_won();
