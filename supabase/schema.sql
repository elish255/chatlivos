-- CHATLIVOS ONLY: safe for a shared Supabase database.
-- This script creates/changes ONLY tables whose names start with chatlivos_.
-- It does not touch existing tables belonging to other websites.

create table if not exists public.chatlivos_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  username text not null,
  phone text not null default '',
  country text not null default 'Tanzania',
  is_active boolean not null default false,
  is_banned boolean not null default false,
  ban_reason text,
  banned_at timestamptz,
  balance numeric(14,2) not null default 0,
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

-- These ALTER statements affect only Chatlivos' own table and make the script safe to re-run.
alter table public.chatlivos_profiles add column if not exists is_banned boolean not null default false;
alter table public.chatlivos_profiles add column if not exists ban_reason text;
alter table public.chatlivos_profiles add column if not exists banned_at timestamptz;
alter table public.chatlivos_profiles add column if not exists activated_at timestamptz;

create unique index if not exists chatlivos_profiles_username_uidx on public.chatlivos_profiles (lower(username));
create index if not exists chatlivos_profiles_email_idx on public.chatlivos_profiles (lower(email));
create index if not exists chatlivos_profiles_created_at_idx on public.chatlivos_profiles (created_at desc);

create table if not exists public.chatlivos_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.chatlivos_profiles(id) on delete cascade,
  order_id text not null,
  paid_phone text not null,
  paid_phone_international text not null,
  amount numeric(14,2) not null,
  currency text not null default 'TZS',
  status text not null default 'PENDING',
  provider_status text,
  transid text,
  channel text,
  environment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists chatlivos_payment_orders_order_uidx on public.chatlivos_payment_orders (order_id);
create index if not exists chatlivos_payment_orders_user_id_idx on public.chatlivos_payment_orders (user_id);
create index if not exists chatlivos_payment_orders_status_idx on public.chatlivos_payment_orders (status);

create table if not exists public.chatlivos_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.chatlivos_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.chatlivos_profiles(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists chatlivos_notifications_user_id_idx on public.chatlivos_notifications (user_id, created_at desc);
create index if not exists chatlivos_notifications_created_at_idx on public.chatlivos_notifications (created_at desc);

alter table public.chatlivos_profiles enable row level security;
alter table public.chatlivos_payment_orders enable row level security;
alter table public.chatlivos_admin_users enable row level security;
alter table public.chatlivos_notifications enable row level security;

-- User policies. Server-side admin/service-role operations bypass RLS.
drop policy if exists "Chatlivos users can view own profile" on public.chatlivos_profiles;
create policy "Chatlivos users can view own profile" on public.chatlivos_profiles for select to authenticated using (auth.uid() = id);

drop policy if exists "Chatlivos users can update own profile" on public.chatlivos_profiles;
create policy "Chatlivos users can update own profile" on public.chatlivos_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Chatlivos users can view own payments" on public.chatlivos_payment_orders;
create policy "Chatlivos users can view own payments" on public.chatlivos_payment_orders for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Chatlivos users can view notifications" on public.chatlivos_notifications;
create policy "Chatlivos users can view notifications" on public.chatlivos_notifications for select to authenticated using (user_id is null or auth.uid() = user_id);

-- Admin setup:
-- 1. Create an ordinary Supabase Auth user for the admin account.
-- 2. Insert that Auth user's UUID here:
-- insert into public.chatlivos_admin_users(user_id,email) values ('AUTH-USER-UUID','admin@example.com');
-- The website never exposes the service-role key to the browser.
