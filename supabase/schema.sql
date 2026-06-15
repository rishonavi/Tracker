-- ════════════════════════════════════════════════════════════════
--  Offset — Supabase schema
--  Run this once in your Supabase project:
--    Dashboard → SQL Editor → New query → paste this → Run
-- ════════════════════════════════════════════════════════════════

-- ── Tables ───────────────────────────────────────────────────────
create table if not exists public.properties (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name            text not null,
  type            text,
  address         text,
  monthly_budget  numeric(14,2),
  notes           text,
  created_at      timestamptz not null default now()
);

-- Add the budget column to pre-existing installs (safe to re-run).
alter table public.properties add column if not exists monthly_budget numeric(14,2);

create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade default auth.uid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  date           date not null,
  amount         numeric(14,2) not null check (amount >= 0),
  category       text,
  vendor         text,
  payment_method text,
  description    text,
  receipt_url    text,
  created_at     timestamptz not null default now()
);

create index if not exists expenses_user_idx     on public.expenses(user_id);
create index if not exists expenses_property_idx  on public.expenses(property_id);
create index if not exists expenses_date_idx      on public.expenses(date);

-- ── Row Level Security: a user only ever sees their own rows ─────
alter table public.properties enable row level security;
alter table public.expenses   enable row level security;

drop policy if exists "own properties" on public.properties;
create policy "own properties" on public.properties
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own expenses" on public.expenses;
create policy "own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Receipt storage (private bucket) ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Files live under a folder named after the user's id:  <uid>/<filename>
drop policy if exists "receipts read own" on storage.objects;
create policy "receipts read own" on storage.objects
  for select using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "receipts insert own" on storage.objects;
create policy "receipts insert own" on storage.objects
  for insert with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "receipts delete own" on storage.objects;
create policy "receipts delete own" on storage.objects
  for delete using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
