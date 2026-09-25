-- Campaign pages: participation instructions and a book target for live progress.
-- Safe to re-run.

alter table public.campaigns
  add column if not exists instructions text not null default '';
alter table public.campaigns
  add column if not exists target_books bigint;
do $$ begin
  alter table public.campaigns
    add constraint campaigns_target_books_positive
    check (target_books is null or target_books > 0);
exception when duplicate_object then null;
end $$;
