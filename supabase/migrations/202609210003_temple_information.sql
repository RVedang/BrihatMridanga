-- Public temple page: coordinator/admin-supplied information and contact details.
alter table public.temples
  add column if not exists information text not null default '',
  add column if not exists contact text not null default '';

alter table public.temples drop constraint if exists temples_information_length;
alter table public.temples add constraint temples_information_length
  check (length(information) <= 2000);
alter table public.temples drop constraint if exists temples_contact_length;
alter table public.temples add constraint temples_contact_length
  check (length(contact) <= 500);

create or replace function public.register_temple(request jsonb)
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
  information text := trim(coalesce(request->>'information', ''));
  contact text := trim(coalesce(request->>'contact', ''));
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
  if length(information) > 2000 then raise exception 'Temple information is too long'; end if;
  if length(contact) > 500 then raise exception 'Contact details are too long'; end if;

  insert into public.temples(name, country, city, timezone, information, contact)
    values (tname, country, city, zone, information, contact)
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
