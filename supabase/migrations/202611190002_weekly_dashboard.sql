create or replace function public.category_point_hundredths(category text)
returns integer language sql immutable set search_path='' as $$
  select case category
    when 'magazines' then 10 when 'small' then 25 when 'medium' then 50
    when 'big' then 100 when 'mahaBig' then 200 when 'sbSets' then 3600
    when 'ccSets' then 1800 when 'lifePatronSets' then 650 else 0 end;
$$;

create or replace function public.public_weekly_dashboard(
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
  result jsonb;
begin
  if start_date is null or end_date is null or end_date < start_date then raise exception 'Invalid date range'; end if;
  with history as (
    select w.id,w.temple_id,w.tags,t.name temple_name,t.country,w.week_start+6 distributed_on,
      f.day,f.centre_id,f.team_id,f.individual_id,f.campaign_id,f.category,
      case when f.category in ('sbSets','ccSets','lifePatronSets') then 0 else f.qty end books,
      case when f.category in ('sbSets','ccSets','lifePatronSets') then f.qty else 0 end sets,
      f.qty::numeric * public.category_point_hundredths(f.category) as point_hundredths,
      f.category='pending' and f.qty>0 incomplete
    from public.weekly_reports w join public.temples t on t.id=w.temple_id
    cross join lateral (
      select d.distributed_on as day,d.centre_id,d.team_id,d.individual_id,d.campaign_id,src.category,src.quantity qty
      from public.distributions d join public.weekly_source_quantities src on src.source_id=d.id
      where w.version=1 and d.temple_id=w.temple_id and d.distributed_on between w.week_start and w.week_start+6
      union all
      select null::date,null::uuid,null::uuid,null::uuid,null::uuid,k.key,k.value::bigint
      from jsonb_each_text(to_jsonb(w)) k
      where k.key in ('magazines','small','medium','big','mahaBig','sbSets','ccSets','lifePatronSets','pending')
      and (w.version>1 or not exists(select from public.distributions d where d.temple_id=w.temple_id and d.distributed_on between w.week_start and w.week_start+6))
    ) f
    where t.approved and (selected_temple is null or t.id=selected_temple)
      and (selected_country is null or t.country=selected_country)
      and (selected_campaign is null or f.campaign_id=selected_campaign or (f.day is null and w.tags->'campaigns' ? selected_campaign::text))
      and (selected_centre is null or f.centre_id=selected_centre or (f.day is null and w.tags->'centres' ? selected_centre::text))
      and (selected_category is null or f.category=selected_category)
  ), scoped as (select * from history),
  items as (select * from scoped where distributed_on between start_date and end_date),
  previous as (
    select * from scoped
    where distributed_on between (start_date - interval '1 year')::date and (end_date - interval '1 year')::date
  )
  select jsonb_build_object(
    'range', jsonb_build_object('start', start_date, 'end', end_date),
    'totals', (select jsonb_build_object(
        'books', coalesce(sum(books),0), 'sets', coalesce(sum(sets),0), 'points', coalesce(sum(point_hundredths),0)/100,
        'reports', count(distinct id), 'incomplete_reports', count(distinct id) filter (where incomplete),
        'temples', count(distinct temple_id), 'countries', count(distinct country)) from items),
    'all_time', (select jsonb_build_object(
        'books', coalesce(sum(books),0), 'sets', coalesce(sum(sets),0), 'points', coalesce(sum(point_hundredths),0)/100,
        'reports', count(distinct id), 'first_date', min(distributed_on)) from history),
    'previous', (select jsonb_build_object(
        'books', coalesce(sum(books),0), 'sets', coalesce(sum(sets),0), 'points', coalesce(sum(point_hundredths),0)/100,
        'start', (start_date - interval '1 year')::date, 'end', (end_date - interval '1 year')::date) from previous),
    'excluded_total_only', 0, 'weekly', coalesce((select jsonb_agg(row order by row.week_start desc,row.temple_name) from (
 select id,temple_name,country,min(distributed_on)-6 week_start,sum(books) books,sum(sets) sets, sum(point_hundredths)/100 as points,
 coalesce(sum(books+sets) filter(where category='magazines'),0) as "magazines",coalesce(sum(books+sets) filter(where category='small'),0) as "small",coalesce(sum(books+sets) filter(where category='medium'),0) as "medium",coalesce(sum(books+sets) filter(where category='big'),0) as "big",coalesce(sum(books+sets) filter(where category='mahaBig'),0) as "mahaBig",coalesce(sum(books+sets) filter(where category='sbSets'),0) as "sbSets",coalesce(sum(books+sets) filter(where category='ccSets'),0) as "ccSets",coalesce(sum(books+sets) filter(where category='lifePatronSets'),0) as "lifePatronSets",coalesce(sum(books+sets) filter(where category='pending'),0) as "pending"
 from items group by id,temple_name,country) row),'[]'::jsonb),
 'by_year', coalesce((select jsonb_agg(s) from (
        select extract(year from distributed_on)::integer as year, sum(books) as books, sum(sets) as sets, sum(point_hundredths)/100 as points,
          count(distinct id) as reports
        from history group by 1 order by 1) s), '[]'::jsonb),
    'by_month', coalesce((select jsonb_agg(s) from (
        select to_char(date_trunc('month', distributed_on), 'YYYY-MM') as month, sum(books) as books, sum(sets) as sets, sum(point_hundredths)/100 as points,
          count(distinct id) as reports
        from items group by 1 order by 1) s), '[]'::jsonb),
    'by_day', coalesce((select jsonb_agg(s) from (
        select day::text as day, sum(books) as books, sum(sets) as sets, sum(point_hundredths)/100 as points,
          count(distinct id) as reports
        from history where day between start_date and end_date group by 1 order by 1) s), '[]'::jsonb),
    'by_campaign', coalesce((select jsonb_agg(s) from (
        select c.id as campaign_id, c.name as campaign_name, c.fallback_year, c.temple_id,
          sum(i.books) as books, sum(i.sets) as sets, sum(i.point_hundredths)/100 as points, count(distinct i.id) as reports, count(distinct i.temple_id) as temples
        from items i join public.campaigns c on c.id = i.campaign_id or (i.day is null and i.tags->'campaigns' ? c.id::text)
        where selected_campaign is null or c.id=selected_campaign
        group by 1,2,3,4 order by 5 desc, 2) s), '[]'::jsonb),
    'by_country', coalesce((select jsonb_agg(s) from (
        select country, sum(books) as books, sum(sets) as sets, sum(point_hundredths)/100 as points, count(distinct temple_id) as temples, count(distinct id) as reports
        from items group by 1 order by 2 desc, 1) s), '[]'::jsonb),
    'by_temple', coalesce((select jsonb_agg(s) from (
        select temple_id, temple_name, country, sum(books) as books, sum(sets) as sets, sum(point_hundredths)/100 as points, count(distinct id) as reports, count(distinct id) filter (where incomplete) as incomplete_reports
        from items group by 1,2,3 order by 4 desc, 2) s), '[]'::jsonb),
    'by_centre', coalesce((select jsonb_agg(s) from (
        select c.id as centre_id, c.name as centre_name, i.temple_name, i.country, sum(i.books) as books, sum(i.sets) as sets, sum(i.point_hundredths)/100 as points,
          count(distinct i.id) as reports
        from items i join public.centres c on c.id = i.centre_id or (i.day is null and i.tags->'centres' ? c.id::text)
        where selected_centre is null or c.id=selected_centre
        group by 1,2,3,4 order by 5 desc, 2) s), '[]'::jsonb),
    'by_category', coalesce((select jsonb_agg(s) from (
        select category, sum(books) as books, sum(sets) as sets, sum(point_hundredths)/100 as points
        from items where category <> 'pending' group by 1 order by 2 desc) s), '[]'::jsonb),
    'by_language', '[]'::jsonb, 'by_individual', coalesce((select jsonb_agg(s) from (
        select i.individual_id, p.name, i.temple_name, i.country, sum(i.books) as books, sum(i.sets) as sets, sum(i.point_hundredths)/100 as points,
          count(distinct i.id) as reports
        from items i join public.individuals p on p.id = i.individual_id
        group by 1,2,3,4 order by 5 desc, 2 limit 100) s), '[]'::jsonb),
    'by_team', coalesce((select jsonb_agg(s) from (
        select i.team_id, tm.name, i.temple_name, i.country, sum(i.books) as books, sum(i.sets) as sets, sum(i.point_hundredths)/100 as points,
          count(distinct i.id) as reports
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
        'languages', '[]'::jsonb,
        'countries', coalesce((select jsonb_agg(distinct country order by country) from public.temples), '[]'::jsonb))
  ) into result;
  return result;
end $$;

revoke all on function public.public_weekly_dashboard(date, date, uuid, text, uuid, text, text, uuid) from public;
grant execute on function public.public_weekly_dashboard(date, date, uuid, text, uuid, text, text, uuid) to anon, authenticated;
revoke execute on function public.public_dashboard(date,date,uuid,text,uuid,text,text,uuid) from public,anon,authenticated;
