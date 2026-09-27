-- Every published community story and testimonial belongs to Hare Krishna Movement Mumbai.
alter table public.content disable trigger audit_content;
alter table public.content disable trigger content_ownership;

update public.content
set temple_id = mumbai.id
from public.temples as mumbai
where mumbai.name = 'Hare Krishna Movement - Mumbai'
  and public.content.kind in ('community_story', 'story', 'photo', 'testimonial')
  and public.content.temple_id is distinct from mumbai.id;

alter table public.content enable trigger content_ownership;
alter table public.content enable trigger audit_content;
