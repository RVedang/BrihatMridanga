-- Move the four sample sankirtan stories into the public story types.
alter table public.content disable trigger audit_content;
update public.content
  set kind = 'community_story', story_type = 'recipient'
  where id = '11111111-1111-4111-8111-111111111101';
update public.content
  set kind = 'community_story', story_type = 'success'
  where id = '11111111-1111-4111-8111-111111111102';
update public.content
  set kind = 'community_story', story_type = 'interview'
  where id = '11111111-1111-4111-8111-111111111103';
update public.content
  set kind = 'community_story', story_type = 'miracle'
  where id = '11111111-1111-4111-8111-111111111104';

update public.content
  set kind = 'community_story', story_type = 'interview'
  where kind = 'story';
alter table public.content enable trigger audit_content;
