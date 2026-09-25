-- Interactive public dashboard: filtered aggregates, breakdowns, rankings, trends and annual targets.
-- Everything here is aggregate-only; raw reports stay private. Safe to re-run.

create table if not exists public.targets (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year between 1900 and 9998),
  temple_id uuid references public.temples(id),
  books bigint not null check (books > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- One target per year per scope (temple, or movement-wide when temple_id is null).
create unique index if not exists targets_scope
  on public.targets(year, coalesce(temple_id, '00000000-0000-0000-0000-000000000000'::uuid));

alter table public.targets enable row level security;
revoke all on public.targets from anon, authenticated;
grant select on public.targets to anon, authenticated;
grant insert, update, delete on public.targets to authenticated;

drop policy if exists public_targets on public.targets;
create policy public_targets on public.targets for select using (true);
drop policy if exists manage_targets on public.targets;
create policy manage_targets on public.targets for all to authenticated
  using ((temple_id is null and public.is_admin()) or (temple_id is not null and public.can_manage(temple_id)))
  with check ((temple_id is null and public.is_admin()) or (temple_id is not null and public.can_manage(temple_id)));

drop trigger if exists target_ownership on public.targets;
create trigger target_ownership before update on public.targets for each row execute function public.protect_attribution();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists target_touch on public.targets;
create trigger target_touch before update on public.targets for each row execute function public.touch_updated_at();

-- Filtered dashboard payload. Language/book-type filters work on book lines, so total-only
-- reports (which have no lines) are excluded while those two filters are active; the count
-- of excluded reports is returned so the page can say so.
create or replace function public.public_dashboard(
  start_date date,
  end_date date,
  selected_campaign uuid default null,
  selected_country text default null,
  selected_temple uuid default null,
  selected_language text default null,
  selected_category text default null
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  line_filter boolean := selected_language is not null or selected_category is not null;
  result jsonb;
begin
  if start_date is null or end_date is null or end_date < start_date then raise exception 'Invalid date range'; end if;
  if selected_category is not null and selected_category not in ('small','medium','big','m-big') then raise exception 'Invalid book category'; end if;

  with scoped as (
    select d.id, d.temple_id, t.name as temple_name, t.country, d.centre_id, d.individual_id, d.team_id,
      d.campaign_id, d.distributed_on, x.books, x.sets, x.points, x.language, x.category, x.incomplete
    from public.distributions d
    join public.temples t on t.id = d.temple_id
    cross join lateral (
      select (l->>'quantity')::bigint * b.volumes as books,
        case when b.volumes > 1 then (l->>'quantity')::bigint else 0 end as sets,
        (l->>'quantity')::numeric * (l->>'score')::numeric as points,
        b.language, b.category, false as incomplete
      from jsonb_array_elements(d.lines) l
      join public.books b on b.id = l->>'bookId'
      where d.mode = 'detailed'
      union all
      select d.book_count, d.set_count, null::numeric, null::text, null::text, true
      where d.mode = 'total' and not line_filter
    ) x
    where (selected_campaign is null or d.campaign_id = selected_campaign)
      and (selected_country is null or t.country = selected_country)
      and (selected_temple is null or d.temple_id = selected_temple)
      and (selected_language is null or x.language = selected_language)
      and (selected_category is null or x.category = selected_category)
  ),
  items as (select * from scoped where distributed_on between start_date and end_date),
  previous as (
    select * from scoped
    where distributed_on between (start_date - interval '1 year')::date and (end_date - interval '1 year')::date
  )
  select jsonb_build_object(
    'range', jsonb_build_object('start', start_date, 'end', end_date),
    'totals', (select jsonb_build_object(
        'books', coalesce(sum(books),0), 'sets', coalesce(sum(sets),0), 'points', coalesce(sum(points),0),
        'reports', count(distinct id), 'incomplete_reports', count(distinct id) filter (where incomplete),
        'temples', count(distinct temple_id), 'countries', count(distinct country)) from items),
    'all_time', (select jsonb_build_object(
        'books', coalesce(sum(books),0), 'sets', coalesce(sum(sets),0), 'points', coalesce(sum(points),0),
        'reports', count(distinct id), 'first_date', min(distributed_on)) from scoped),
    'previous', (select jsonb_build_object(
        'books', coalesce(sum(books),0), 'sets', coalesce(sum(sets),0), 'points', coalesce(sum(points),0),
        'start', (start_date - interval '1 year')::date, 'end', (end_date - interval '1 year')::date) from previous),
    'excluded_total_only', (select count(*) from public.distributions d join public.temples t on t.id = d.temple_id
        where line_filter and d.mode = 'total' and d.distributed_on between start_date and end_date
          and (selected_campaign is null or d.campaign_id = selected_campaign)
          and (selected_country is null or t.country = selected_country)
          and (selected_temple is null or d.temple_id = selected_temple)),
    'by_year', coalesce((select jsonb_agg(s) from (
        select extract(year from distributed_on)::integer as year, sum(books) as books, sum(sets) as sets,
          coalesce(sum(points),0) as points, count(distinct id) as reports
        from scoped group by 1 order by 1) s), '[]'::jsonb),
    'by_month', coalesce((select jsonb_agg(s) from (
        select to_char(date_trunc('month', distributed_on), 'YYYY-MM') as month, sum(books) as books, sum(sets) as sets,
          coalesce(sum(points),0) as points, count(distinct id) as reports
        from items group by 1 order by 1) s), '[]'::jsonb),
    'by_country', coalesce((select jsonb_agg(s) from (
        select country, sum(books) as books, sum(sets) as sets, coalesce(sum(points),0) as points,
          count(distinct temple_id) as temples, count(distinct id) as reports
        from items group by 1 order by 2 desc, 1) s), '[]'::jsonb),
    'by_temple', coalesce((select jsonb_agg(s) from (
        select temple_id, temple_name, country, sum(books) as books, sum(sets) as sets, coalesce(sum(points),0) as points,
          count(distinct id) as reports, count(distinct id) filter (where incomplete) as incomplete_reports
        from items group by 1,2,3 order by 4 desc, 2) s), '[]'::jsonb),
    'by_centre', coalesce((select jsonb_agg(s) from (
        select i.centre_id, c.name as centre_name, i.temple_name, i.country, sum(i.books) as books, sum(i.sets) as sets,
          coalesce(sum(i.points),0) as points, count(distinct i.id) as reports
        from items i join public.centres c on c.id = i.centre_id
        group by 1,2,3,4 order by 5 desc, 2) s), '[]'::jsonb),
    'by_category', coalesce((select jsonb_agg(s) from (
        select category, sum(books) as books, sum(sets) as sets, coalesce(sum(points),0) as points
        from items where category is not null group by 1 order by 2 desc) s), '[]'::jsonb),
    'by_language', coalesce((select jsonb_agg(s) from (
        select language, sum(books) as books, sum(sets) as sets, coalesce(sum(points),0) as points
        from items where language is not null group by 1 order by 2 desc, 1) s), '[]'::jsonb),
    'by_individual', coalesce((select jsonb_agg(s) from (
        select i.individual_id, p.name, i.temple_name, i.country, sum(i.books) as books, sum(i.sets) as sets,
          coalesce(sum(i.points),0) as points, count(distinct i.id) as reports
        from items i join public.individuals p on p.id = i.individual_id
        group by 1,2,3,4 order by 5 desc, 2 limit 100) s), '[]'::jsonb),
    'by_team', coalesce((select jsonb_agg(s) from (
        select i.team_id, tm.name, i.temple_name, i.country, sum(i.books) as books, sum(i.sets) as sets,
          coalesce(sum(i.points),0) as points, count(distinct i.id) as reports
        from items i join public.teams tm on tm.id = i.team_id
        group by 1,2,3,4 order by 5 desc, 2 limit 100) s), '[]'::jsonb),
    'targets', coalesce((select jsonb_agg(s) from (
        select g.year, g.temple_id, t.name as temple_name, t.country, g.books
        from public.targets g left join public.temples t on t.id = g.temple_id
        where g.year between extract(year from start_date)::integer and extract(year from end_date)::integer
          and (selected_temple is null or g.temple_id = selected_temple or g.temple_id is null)
          and (selected_country is null or t.country = selected_country or g.temple_id is null)
        order by g.year, t.name nulls first) s), '[]'::jsonb),
    'options', jsonb_build_object(
        'languages', coalesce((select jsonb_agg(distinct language order by language) from public.books), '[]'::jsonb),
        'countries', coalesce((select jsonb_agg(distinct country order by country) from public.temples), '[]'::jsonb))
  ) into result;
  return result;
end $$;

revoke all on function public.public_dashboard(date,date,uuid,text,uuid,text,text) from public;
grant execute on function public.public_dashboard(date,date,uuid,text,uuid,text,text) to anon, authenticated;
