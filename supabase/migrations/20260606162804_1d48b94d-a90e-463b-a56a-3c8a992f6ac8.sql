
create type public.app_role as enum ('owner','admin','manager','sales','member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select to authenticated using (true);
create policy "profiles_update_self" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "roles_select_self" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_count int;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  select count(*) into user_count from auth.users;
  if user_count = 1 then
    insert into public.user_roles (user_id, role) values (new.id, 'owner');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'member');
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  industry text,
  website text,
  phone text,
  email text,
  address text,
  annual_revenue numeric,
  status text not null default 'active',
  notes text,
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;
alter table public.clients enable row level security;
create policy "clients_all_auth" on public.clients for all to authenticated using (true) with check (auth.uid() = created_by);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  full_name text not null,
  title text,
  email text,
  phone text,
  notes text,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.contacts to authenticated;
grant all on public.contacts to service_role;
alter table public.contacts enable row level security;
create policy "contacts_all_auth" on public.contacts for all to authenticated using (true) with check (auth.uid() = created_by);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  value numeric not null default 0,
  currency text not null default 'USD',
  stage text not null default 'new',
  probability int not null default 10,
  expected_close_date date,
  owner_id uuid references auth.users(id) on delete set null,
  notes text,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.deals to authenticated;
grant all on public.deals to service_role;
alter table public.deals enable row level security;
create policy "deals_all_auth" on public.deals for all to authenticated using (true) with check (auth.uid() = created_by);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  provider text,
  login_email text,
  monthly_cost numeric default 0,
  yearly_cost numeric default 0,
  renewal_date date,
  owner_id uuid references auth.users(id) on delete set null,
  status text not null default 'active',
  url text,
  notes text,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "services_all_auth" on public.services for all to authenticated using (true) with check (auth.uid() = created_by);

create extension if not exists pgcrypto with schema extensions;

create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  label text not null,
  kind text not null default 'password',
  username text,
  secret_encrypted bytea not null,
  notes text,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.credentials to authenticated;
grant all on public.credentials to service_role;
alter table public.credentials enable row level security;
create policy "creds_select_admin" on public.credentials for select to authenticated
  using (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'admin'));
create policy "creds_insert_admin" on public.credentials for insert to authenticated
  with check ((public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'admin')) and auth.uid() = created_by);
create policy "creds_update_admin" on public.credentials for update to authenticated
  using (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'admin'));
create policy "creds_delete_admin" on public.credentials for delete to authenticated
  using (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'admin'));

create table public.credential_access_logs (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null references public.credentials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.credential_access_logs to authenticated;
grant all on public.credential_access_logs to service_role;
alter table public.credential_access_logs enable row level security;
create policy "credlogs_select_admin" on public.credential_access_logs for select to authenticated
  using (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'admin'));
create policy "credlogs_insert_self" on public.credential_access_logs for insert to authenticated
  with check (user_id = auth.uid());

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  address text,
  phone text,
  website text,
  rating numeric,
  review_count int,
  category text,
  industry text,
  latitude double precision,
  longitude double precision,
  google_place_id text,
  google_maps_url text,
  opening_hours jsonb,
  has_website boolean generated always as (website is not null and website <> '') stored,
  has_phone boolean generated always as (phone is not null and phone <> '') stored,
  score text default 'medium',
  status text not null default 'not_contacted',
  assigned_to uuid references auth.users(id) on delete set null,
  notes text,
  source text default 'google_maps',
  search_query text,
  search_location text,
  tags text[],
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(google_place_id, created_by)
);
grant select, insert, update, delete on public.leads to authenticated;
grant all on public.leads to service_role;
alter table public.leads enable row level security;
create policy "leads_all_auth" on public.leads for all to authenticated using (true) with check (auth.uid() = created_by);
create index leads_status_idx on public.leads(status);
create index leads_score_idx on public.leads(score);
create index leads_industry_idx on public.leads(industry);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  type text not null,
  content text,
  metadata jsonb,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.activities to authenticated;
grant all on public.activities to service_role;
alter table public.activities enable row level security;
create policy "activities_all_auth" on public.activities for all to authenticated using (true) with check (user_id = auth.uid());
create index activities_entity_idx on public.activities(entity_type, entity_id);

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger trg_clients_u before update on public.clients for each row execute function public.tg_set_updated_at();
create trigger trg_deals_u before update on public.deals for each row execute function public.tg_set_updated_at();
create trigger trg_services_u before update on public.services for each row execute function public.tg_set_updated_at();
create trigger trg_creds_u before update on public.credentials for each row execute function public.tg_set_updated_at();
create trigger trg_leads_u before update on public.leads for each row execute function public.tg_set_updated_at();
