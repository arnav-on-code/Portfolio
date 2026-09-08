-- Portfolio CMS schema for Supabase/Postgres.
-- Run this entire file in Supabase SQL Editor.
-- Then create your Auth user in Authentication → Users and run the final INSERT shown in README.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_documents (
  id uuid primary key,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  draft_data jsonb not null default '{}'::jsonb,
  published_data jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_public (
  id uuid primary key,
  published_data jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.portfolio_documents enable row level security;
alter table public.portfolio_public enable row level security;

drop policy if exists "admins read own membership" on public.admin_users;
create policy "admins read own membership" on public.admin_users for select to authenticated using (user_id = auth.uid());

drop policy if exists "admins manage document" on public.portfolio_documents;
create policy "admins manage document" on public.portfolio_documents for all to authenticated
using (admin_user_id = auth.uid())
with check (admin_user_id = auth.uid());

drop policy if exists "public reads published portfolio" on public.portfolio_public;
create policy "public reads published portfolio" on public.portfolio_public for select to anon, authenticated using (true);

-- Storage buckets. Public read is intentional: portfolio assets must be visible on the public site.
insert into storage.buckets (id,name,public) values
 ('portfolio-images','portfolio-images',true),
 ('projects','projects',true),
 ('certificates','certificates',true),
 ('resume','resume',true)
on conflict (id) do update set public=true;

drop policy if exists "public portfolio storage read" on storage.objects;
create policy "public portfolio storage read" on storage.objects for select to anon, authenticated
using (bucket_id in ('portfolio-images','projects','certificates','resume'));

drop policy if exists "admins upload portfolio files" on storage.objects;
create policy "admins upload portfolio files" on storage.objects for insert to authenticated
with check (bucket_id in ('portfolio-images','projects','certificates','resume')
  and exists (select 1 from public.admin_users au where au.user_id=auth.uid()));

drop policy if exists "admins update portfolio files" on storage.objects;
create policy "admins update portfolio files" on storage.objects for update to authenticated
using (bucket_id in ('portfolio-images','projects','certificates','resume')
  and exists (select 1 from public.admin_users au where au.user_id=auth.uid()))
with check (bucket_id in ('portfolio-images','projects','certificates','resume')
  and exists (select 1 from public.admin_users au where au.user_id=auth.uid()));

drop policy if exists "admins delete portfolio files" on storage.objects;
create policy "admins delete portfolio files" on storage.objects for delete to authenticated
using (bucket_id in ('portfolio-images','projects','certificates','resume')
  and exists (select 1 from public.admin_users au where au.user_id=auth.uid()));

-- After creating your Auth user, run supabase/seed.sql once.
