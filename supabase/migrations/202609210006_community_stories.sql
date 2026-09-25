-- Stories-page-only posts from coordinators and the admin, with a type label.
alter table public.content drop constraint if exists content_kind_check;
alter table public.content add constraint content_kind_check
  check (kind in (
    'story','resource','event','testimonial','initiative','photo','community_story'
  ));

alter table public.content
  add column if not exists story_type text not null default '';

alter table public.content drop constraint if exists content_story_type;
alter table public.content add constraint content_story_type
  check (
    (kind <> 'community_story' and story_type = '')
    or (
      kind = 'community_story'
      and story_type in ('experience','festival','training','reflection','update')
    )
  );
