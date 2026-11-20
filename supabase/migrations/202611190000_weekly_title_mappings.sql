-- Explicit classifications for historical editions that cannot be inferred from the catalog.
create table if not exists public.weekly_title_mappings (
 book_id text primary key references public.books,
 category text not null check (category in ('magazines','small','medium','big','mahaBig','sbSets','ccSets','lifePatronSets')),
 units_per_copy integer not null check (units_per_copy>0)
);
alter table public.weekly_title_mappings enable row level security;
revoke all on public.weekly_title_mappings from public,anon,authenticated;
-- Confirmed seven-volume Marathi edition. Install only when that historical catalog item exists.
insert into public.weekly_title_mappings(book_id,category,units_per_copy)
select id,'big',7 from public.books where id='legacy-lilamrita-mr' and name='Srila Prabhupada Lilamrita' and language='Marathi' and volumes=7
on conflict(book_id) do nothing;
