-- Team membership for public temple pages. Safe to re-run.
create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  individual_id uuid not null references public.individuals(id) on delete cascade,
  primary key (team_id, individual_id)
);

create or replace function public.team_member_same_temple()
returns trigger language plpgsql set search_path = '' as $$
declare
  team_temple uuid;
  person_temple uuid;
begin
  select temple_id into team_temple from public.teams where id = new.team_id;
  select temple_id into person_temple from public.individuals where id = new.individual_id;
  if team_temple is null or person_temple is null or team_temple is distinct from person_temple then
    raise exception 'Team members must belong to the same temple as the team';
  end if;
  return new;
end $$;

drop trigger if exists team_member_temple on public.team_members;
create trigger team_member_temple
  before insert or update on public.team_members
  for each row execute function public.team_member_same_temple();

alter table public.team_members enable row level security;
revoke all on public.team_members from anon, authenticated;
grant select, insert, delete on public.team_members to authenticated;

drop policy if exists manage_team_members on public.team_members;
create policy manage_team_members on public.team_members
  for all to authenticated
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_id and public.can_manage(t.temple_id)
    )
  )
  with check (
    exists (
      select 1 from public.teams t
      where t.id = team_id and public.can_manage(t.temple_id)
    )
  );

drop function if exists public.public_temple_teams(uuid);
create function public.public_temple_teams(tid uuid)
returns table(
  id uuid,
  name text,
  centre_id uuid,
  centre_name text,
  coordinator_name text,
  members jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.id,
    t.name,
    t.centre_id,
    c.name,
    t.coordinator_name,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'name', i.name,
          'coordinator', lower(trim(i.name)) = lower(trim(t.coordinator_name))
        )
        order by (lower(trim(i.name)) = lower(trim(t.coordinator_name))) desc, i.name
      )
      from public.team_members m
      join public.individuals i on i.id = m.individual_id
      where m.team_id = t.id
    ), '[]'::jsonb)
  from public.teams t
  left join public.centres c on c.id = t.centre_id
  where t.temple_id = tid
  order by t.name;
$$;

revoke all on function public.public_temple_teams(uuid) from public;
grant execute on function public.public_temple_teams(uuid) to anon, authenticated;
