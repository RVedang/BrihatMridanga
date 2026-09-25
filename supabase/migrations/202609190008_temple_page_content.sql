-- Temple pages: photographs, testimonials, local initiatives (events already exist).
alter table public.content drop constraint if exists content_kind_check;
alter table public.content add constraint content_kind_check
  check (kind in ('story','resource','event','testimonial','initiative','photo'));

alter table public.content drop constraint if exists content_photo_url;
alter table public.content add constraint content_photo_url
  check (kind <> 'photo' or link_url ~ '^https://[^[:space:]]+$');
