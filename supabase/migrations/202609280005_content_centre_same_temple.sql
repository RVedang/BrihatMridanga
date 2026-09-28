-- A story's centre must belong to the story's temple, matching distributions.
-- The portal never sets a centre on content today, so this only clears strays.

update public.content c
set centre_id = null
where c.centre_id is not null
  and (c.temple_id is null
    or not exists (
      select 1 from public.centres x where x.id = c.centre_id and x.temple_id = c.temple_id));

alter table public.content drop constraint if exists content_centre_same_temple;
alter table public.content
  add constraint content_centre_same_temple
  foreign key (centre_id, temple_id) references public.centres(id, temple_id);

alter table public.content drop constraint if exists content_centre_needs_temple;
alter table public.content
  add constraint content_centre_needs_temple
  check (centre_id is null or temple_id is not null);
