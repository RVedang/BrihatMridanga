-- Public centre names for dashboard/report filters. Safe to re-run.
grant select on public.centres to anon, authenticated;

drop policy if exists public_centres on public.centres;
create policy public_centres on public.centres for select using (true);

drop function if exists public.public_centre_list();
create function public.public_centre_list()
returns table(id uuid, name text, temple_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, c.temple_id
  from public.centres c
  order by c.name;
$$;

revoke all on function public.public_centre_list() from public;
grant execute on function public.public_centre_list() to anon, authenticated;
