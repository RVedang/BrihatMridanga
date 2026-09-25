create table public.content (
  id uuid primary key default gen_random_uuid(), temple_id uuid references public.temples(id),
  kind text not null check(kind in ('story','resource','event')),
  title text not null check(length(trim(title)) between 1 and 160), body text not null default '',
  language text not null default 'English', link_url text not null default '' check(link_url='' or link_url ~ '^https://[^[:space:]]+$'),
  published boolean not null default false, starts_at timestamptz, ends_at timestamptz, location text not null default '',
  created_at timestamptz not null default now(),
  check(kind <> 'event' or (starts_at is not null and ends_at is not null and ends_at>=starts_at))
);
alter table public.content enable row level security;
revoke all on public.content from anon,authenticated;
grant select on public.content to anon,authenticated;
grant insert,update on public.content to authenticated;
create policy published_content on public.content for select using (published);
create policy manage_content on public.content for all to authenticated using(public.can_manage(temple_id)) with check(public.can_manage(temple_id));
create trigger content_ownership before update on public.content for each row execute function public.protect_attribution();
create trigger audit_content after insert or update on public.content for each row execute function public.audit_record();
