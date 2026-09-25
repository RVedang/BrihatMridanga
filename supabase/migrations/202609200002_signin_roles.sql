-- Readers can sign in without a temple. Coordinators register their temple once.
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'c'
  loop
    execute format('alter table public.profiles drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','temple_coordinator','user'));
alter table public.profiles add constraint profiles_temple_role_check
  check (
    (role = 'admin' and temple_id is null)
    or (role = 'temple_coordinator' and temple_id is not null)
    or (role = 'user' and temple_id is null)
  );

create function public.claim_user_profile(display_name text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  existing public.profiles;
  label text := trim(coalesce(display_name, ''));
begin
  if actor is null then raise exception 'Sign in required'; end if;
  select * into existing from public.profiles where id = actor;
  if found then
    return jsonb_build_object('role', existing.role, 'created', false);
  end if;
  if label = '' then label := 'Friend'; end if;
  insert into public.profiles(id, role, temple_id, display_name)
    values (actor, 'user', null, left(label, 160));
  return jsonb_build_object('role', 'user', 'created', true);
end $$;

create function public.register_temple(request jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  existing public.profiles;
  had_profile boolean := false;
  tid uuid;
  tname text := trim(coalesce(request->>'name', ''));
  country text := trim(coalesce(request->>'country', ''));
  city text := trim(coalesce(request->>'city', ''));
  zone text := trim(coalesce(request->>'timezone', 'Asia/Kolkata'));
  display text := trim(coalesce(request->>'displayName', request->>'display_name', ''));
  centre_name text := trim(coalesce(request->>'centreName', request->>'centre_name', ''));
begin
  if actor is null then raise exception 'Sign in required'; end if;
  select * into existing from public.profiles where id = actor;
  had_profile := found;
  if had_profile and existing.role = 'admin' then
    raise exception 'Admin accounts already have access';
  end if;
  if had_profile and existing.role = 'temple_coordinator' and existing.temple_id is not null then
    return jsonb_build_object('temple_id', existing.temple_id, 'already', true);
  end if;
  if length(tname) not between 1 and 160 then raise exception 'Temple name is required'; end if;
  if length(country) not between 1 and 80 then raise exception 'Country is required'; end if;
  if length(city) > 120 then raise exception 'City is too long'; end if;
  if length(zone) not between 1 and 80 then raise exception 'Time zone is required'; end if;
  if length(display) not between 1 and 160 then raise exception 'Your name is required'; end if;
  if centre_name <> '' and length(centre_name) not between 1 and 160 then
    raise exception 'Centre name is invalid';
  end if;

  insert into public.temples(name, country, city, timezone)
    values (tname, country, city, zone)
    returning id into tid;

  if had_profile then
    update public.profiles
      set role = 'temple_coordinator', temple_id = tid, display_name = display
      where id = actor;
  else
    insert into public.profiles(id, role, temple_id, display_name)
      values (actor, 'temple_coordinator', tid, display);
  end if;

  if centre_name <> '' then
    insert into public.centres(temple_id, name) values (tid, centre_name);
  end if;

  return jsonb_build_object('temple_id', tid, 'already', false);
end $$;

revoke all on function public.claim_user_profile(text), public.register_temple(jsonb) from public;
grant execute on function public.claim_user_profile(text), public.register_temple(jsonb) to authenticated;
