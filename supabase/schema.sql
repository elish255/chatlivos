-- Chatlivos isolated Supabase schema
-- SAFE: this script creates ONLY Chatlivos-specific tables, indexes and policies.
-- It does NOT create, alter, drop, rename or modify any existing application table.
-- It only references Supabase's built-in auth.users table for the logged-in user's ID.

create table if not exists public.chatlivos_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  username text not null,
  phone text not null default '',
  country text not null default 'Tanzania',
  is_active boolean not null default false,
  balance numeric(14,2) not null default 0,
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

-- Username uniqueness is isolated to Chatlivos only.
create unique index if not exists chatlivos_profiles_username_uidx
  on public.chatlivos_profiles (lower(username));

create index if not exists chatlivos_profiles_email_idx
  on public.chatlivos_profiles (lower(email));

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

create unique index if not exists chatlivos_payment_orders_order_uidx
  on public.chatlivos_payment_orders (order_id);

create index if not exists chatlivos_payment_orders_user_id_idx
  on public.chatlivos_payment_orders (user_id);

create index if not exists chatlivos_payment_orders_status_idx
  on public.chatlivos_payment_orders (status);

alter table public.chatlivos_profiles enable row level security;
alter table public.chatlivos_payment_orders enable row level security;

drop policy if exists "Chatlivos users can view own profile" on public.chatlivos_profiles;
create policy "Chatlivos users can view own profile"
on public.chatlivos_profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Chatlivos users can update own profile" on public.chatlivos_profiles;
create policy "Chatlivos users can update own profile"
on public.chatlivos_profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Chatlivos users can view own payments" on public.chatlivos_payment_orders;
create policy "Chatlivos users can view own payments"
on public.chatlivos_payment_orders for select
to authenticated
using (auth.uid() = user_id);

-- The Chatlivos server writes these tables using SUPABASE_SERVICE_ROLE_KEY.
-- Never expose SUPABASE_SERVICE_ROLE_KEY or FIMIPAY_SECRET_KEY in VITE_* variables.
