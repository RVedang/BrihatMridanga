alter table public.teams
  add column centre_id uuid;
alter table public.teams
  add constraint teams_centre_temple_fkey
  foreign key (centre_id, temple_id) references public.centres(id, temple_id);
