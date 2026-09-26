-- Name of the person a story belongs to. Empty for older rows and other content.
alter table public.content
  add column if not exists person_name text not null default '';

alter table public.content drop constraint if exists content_person_name;
alter table public.content add constraint content_person_name
  check (char_length(person_name) <= 160);
