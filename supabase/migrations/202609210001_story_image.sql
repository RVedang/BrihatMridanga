-- Photograph attached to a sankirtan story (homepage card + story page).
alter table public.content
  add column if not exists image_url text not null default '';

alter table public.content drop constraint if exists content_image_url;
alter table public.content add constraint content_image_url
  check (image_url = '' or image_url ~ '^https://[^[:space:]]+$');

-- Seed images on the sample stories if they still have none.
alter table public.content disable trigger audit_content;
update public.content set image_url = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1400&q=80'
  where id = '11111111-1111-4111-8111-111111111101' and image_url = '';
update public.content set image_url = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1400&q=80'
  where id = '11111111-1111-4111-8111-111111111102' and image_url = '';
update public.content set image_url = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80'
  where id = '11111111-1111-4111-8111-111111111103' and image_url = '';
update public.content set image_url = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80'
  where id = '11111111-1111-4111-8111-111111111104' and image_url = '';
alter table public.content enable trigger audit_content;

-- Public story-photo bucket when Storage is available (skipped on local PGlite).
do $$
begin
  if not exists (
    select 1 from information_schema.schemata where schema_name = 'storage'
  ) then
    return;
  end if;
  insert into storage.buckets (id, name, public)
  values ('story-photos', 'story-photos', true)
  on conflict (id) do nothing;
  begin
    execute 'create policy story_photos_public_read on storage.objects for select using (bucket_id = ''story-photos'')';
  exception when duplicate_object then null;
  end;
  begin
    execute 'create policy story_photos_authenticated_write on storage.objects for insert to authenticated with check (bucket_id = ''story-photos'')';
  exception when duplicate_object then null;
  end;
  begin
    execute 'create policy story_photos_authenticated_update on storage.objects for update to authenticated using (bucket_id = ''story-photos'')';
  exception when duplicate_object then null;
  end;
end $$;
