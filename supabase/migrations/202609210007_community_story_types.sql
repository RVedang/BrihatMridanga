-- Stories-tab posts: distributor, recipient, temple success, interview, media, miracle.
-- Safe to run even if 202609210006 was not applied (column and kind may be missing).
alter table public.content drop constraint if exists content_kind_check;
alter table public.content add constraint content_kind_check
  check (kind in (
    'story','resource','event','testimonial','initiative','photo','community_story'
  ));

alter table public.content
  add column if not exists story_type text not null default '';

alter table public.content drop constraint if exists content_story_type;

update public.content
  set story_type = 'recipient'
  where kind = 'community_story' and story_type = 'experience';
update public.content
  set story_type = 'success'
  where kind = 'community_story' and story_type in ('festival', 'training', 'update');
update public.content
  set story_type = 'interview'
  where kind = 'community_story' and story_type = 'reflection';

alter table public.content add constraint content_story_type
  check (
    (kind <> 'community_story' and story_type = '')
    or (
      kind = 'community_story'
      and story_type in (
        'distributor',
        'recipient',
        'success',
        'interview',
        'media',
        'miracle'
      )
    )
  );
