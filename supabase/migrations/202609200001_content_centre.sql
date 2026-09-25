-- Optional centre on testimonials (and other temple content). Safe to re-run.

alter table public.content
  add column if not exists centre_id uuid references public.centres(id);
