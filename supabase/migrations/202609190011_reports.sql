-- Reports: centre filter, daily rows, campaign breakdown. Safe to re-run.

drop function if exists public.public_dashboard(date, date, uuid, text, uuid, text, text);
drop function if exists public.public_dashboard(date, date, uuid, text, uuid, text, text, uuid);

create function public.public_dashboard(
  start_date date,
  end_date date,
  selected_campaign uuid default null,
  selected_country text default null,
  selected_temple uuid default null,
  selected_language text default null,
  selected_category text default null,
  selected_centre uuid default null
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
      and (selected_centre is null or d.centre_id = selected_centre)
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
          and (selected_temple is null or d.temple_id = selected_temple)
          and (selected_centre is null or d.centre_id = selected_centre)),
    'by_year', coalesce((select jsonb_agg(s) from (
        select extract(year from distributed_on)::integer as year, sum(books) as books, sum(sets) as sets,
          coalesce(sum(points),0) as points, count(distinct id) as reports
        from scoped group by 1 order by 1) s), '[]'::jsonb),
    'by_month', coalesce((select jsonb_agg(s) from (
        select to_char(date_trunc('month', distributed_on), 'YYYY-MM') as month, sum(books) as books, sum(sets) as sets,
          coalesce(sum(points),0) as points, count(distinct id) as reports
        from items group by 1 order by 1) s), '[]'::jsonb),
    'by_day', coalesce((select jsonb_agg(s) from (
        select distributed_on::text as day, sum(books) as books, sum(sets) as sets,
          coalesce(sum(points),0) as points, count(distinct id) as reports
        from items group by 1 order by 1) s), '[]'::jsonb),
    'by_campaign', coalesce((select jsonb_agg(s) from (
        select i.campaign_id, c.name as campaign_name, c.fallback_year, c.temple_id,
          sum(i.books) as books, sum(i.sets) as sets, coalesce(sum(i.points),0) as points,
          count(distinct i.id) as reports, count(distinct i.temple_id) as temples
        from items i join public.campaigns c on c.id = i.campaign_id
        group by 1,2,3,4 order by 5 desc, 2) s), '[]'::jsonb),
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

revoke all on function public.public_dashboard(date, date, uuid, text, uuid, text, text, uuid) from public;
grant execute on function public.public_dashboard(date, date, uuid, text, uuid, text, text, uuid) to anon, authenticated;
