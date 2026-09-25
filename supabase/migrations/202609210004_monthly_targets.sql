-- One book target per temple per calendar month. Coordinators and the admin
-- set these; the public temple page shows progress from published reports.

create table if not exists public.monthly_targets (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year between 1900 and 9998),
  month integer not null check (month between 1 and 12),
  temple_id uuid not null references public.temples(id),
  books bigint not null check (books > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists monthly_targets_scope
  on public.monthly_targets(temple_id, year, month);

alter table public.monthly_targets enable row level security;
revoke all on public.monthly_targets from anon, authenticated;
grant select on public.monthly_targets to anon, authenticated;
grant insert, update, delete on public.monthly_targets to authenticated;

drop policy if exists public_monthly_targets on public.monthly_targets;
create policy public_monthly_targets on public.monthly_targets for select using (true);
drop policy if exists manage_monthly_targets on public.monthly_targets;
create policy manage_monthly_targets on public.monthly_targets for all to authenticated
  using (public.can_manage(temple_id))
  with check (public.can_manage(temple_id));

drop trigger if exists monthly_target_ownership on public.monthly_targets;
create trigger monthly_target_ownership before update on public.monthly_targets
  for each row execute function public.protect_attribution();

drop trigger if exists monthly_target_touch on public.monthly_targets;
create trigger monthly_target_touch before update on public.monthly_targets
  for each row execute function public.touch_updated_at();
