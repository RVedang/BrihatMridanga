-- New temples wait for an admin before they appear publicly or can publish.
-- Existing temples stay approved. Safe to re-run.
alter table public.temples
  add column if not exists approved boolean not null default true;

create or replace function public.my_temple() returns uuid
language sql stable security definer set search_path = '' as $$
  select temple_id from public.profiles where id = auth.uid();
$$;
grant execute on function public.my_temple() to anon, authenticated;

create or replace function public.can_manage(t uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or (
          p.role = 'temple_coordinator'
          and p.temple_id = t
          and exists(select 1 from public.temples x where x.id = t and x.approved)
        )
      )
  );
$$;

drop policy if exists public_temples on public.temples;
create policy public_temples on public.temples for select
  using (approved or public.is_admin() or id = public.my_temple());

-- SQL editor sessions have no auth.uid(); they may still change approval.
create or replace function public.protect_temple_approval() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.approved is distinct from old.approved
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can approve a temple';
  end if;
  return new;
end $$;
drop trigger if exists protect_temple_approval on public.temples;
create trigger protect_temple_approval before update on public.temples
  for each row execute function public.protect_temple_approval();

drop function if exists public.public_centre_list();
create function public.public_centre_list()
returns table(id uuid, name text, temple_id uuid)
language sql stable security definer set search_path = '' as $$
  select c.id, c.name, c.temple_id
  from public.centres c
  join public.temples t on t.id = c.temple_id
  where t.approved
  order by c.name;
$$;
revoke all on function public.public_centre_list() from public;
grant execute on function public.public_centre_list() to anon, authenticated;

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

  insert into public.temples(name, country, city, timezone, information, contact, approved)
    values (tname, country, city, zone, information, contact, false)
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

  return jsonb_build_object('temple_id', tid, 'already', false, 'pending', true);
end $$;

-- Story photographs: only admins and coordinators of approved temples may upload.
create or replace function public.can_upload_story_photo() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or (
          p.role = 'temple_coordinator'
          and exists(select 1 from public.temples x where x.id = p.temple_id and x.approved)
        )
      )
  );
$$;
grant execute on function public.can_upload_story_photo() to authenticated;

do $$
begin
  if not exists (
    select 1 from information_schema.schemata where schema_name = 'storage'
  ) then
    return;
  end if;
  begin
    execute $sql$
      update storage.buckets
        set file_size_limit = 6291456,
            allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
        where id = 'story-photos'
    $sql$;
  exception when undefined_column then null;
  end;
  execute 'drop policy if exists story_photos_authenticated_write on storage.objects';
  execute 'drop policy if exists story_photos_authenticated_update on storage.objects';
  execute 'drop policy if exists story_photos_manager_write on storage.objects';
  execute 'drop policy if exists story_photos_manager_update on storage.objects';
  execute 'create policy story_photos_manager_write on storage.objects for insert to authenticated with check (bucket_id = ''story-photos'' and public.can_upload_story_photo())';
  execute 'create policy story_photos_manager_update on storage.objects for update to authenticated using (bucket_id = ''story-photos'' and public.can_upload_story_photo())';
end $$;
