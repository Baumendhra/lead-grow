-- ============================================================
-- App Settings and Project Links/Vault Passwords Migration
-- Run in Supabase → SQL Editor
-- ============================================================

-- 1. Create app_settings table for global settings (like general_vault_password)
create table if not exists public.app_settings (
  id text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
grant select, insert, update, delete on public.app_settings to authenticated;
grant all on public.app_settings to service_role;

drop policy if exists "app_settings_all_auth" on public.app_settings;
create policy "app_settings_all_auth"
  on public.app_settings for all to authenticated
  using (true)
  with check (true);

-- 2. Add project_url and vault_password to projects
alter table public.projects add column if not exists project_url text;
alter table public.projects add column if not exists vault_password text;
