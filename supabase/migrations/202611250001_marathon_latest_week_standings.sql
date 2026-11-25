create or replace function public.marathon_standings() returns jsonb
language sql stable security definer set search_path='' as $$
with campaign as (
  select starts_on,ends_on
  from public.campaigns
  where name='Book Distribution Marathon 2026' and temple_id is null
), local_days as (
  select m.*,t.timezone,(now() at time zone t.timezone)::date as today,
    coalesce(m.starts_on,c.starts_on) effective_start,
    coalesce(m.ends_on,c.ends_on) effective_end
  from public.marathon_temples m
  join public.temples t on t.id=m.temple_id
  cross join campaign c
  where t.approved
), active as (
  select *
  from local_days
  where today between effective_start and effective_end
), latest_week as (
  select max(w.week_start) week_start
  from active a
  join public.weekly_reports w on w.temple_id=a.temple_id
  where w.week_start<=date_trunc('week',a.today::timestamp)::date
    and w.week_start<=a.effective_end
    and w.week_start+6>=a.effective_start
), eligible as (
  select a.name,w.id,coalesce(w.books,0) books,coalesce(w.sets,0) sets,
    coalesce(w."mahaBig",0) maha,coalesce(w.big,0) big,
    coalesce(w.medium,0) medium,coalesce(w.small,0) small,
    coalesce(w.magazines,0) magazines,
    coalesce((select sum(j.value::numeric * public.category_point_hundredths(j.key))
      from jsonb_each_text(to_jsonb(w)) j where j.key in
      ('magazines','small','medium','big','mahaBig','sbSets','ccSets','lifePatronSets')),0) as hundredths
  from active a
  cross join latest_week l
  join public.weekly_reports w on w.temple_id=a.temple_id and w.week_start=l.week_start
    and w.week_start<=a.effective_end and w.week_start+6>=a.effective_start
), ranked as (
  select rank() over(order by hundredths desc,sets desc,maha desc,big desc,medium desc,small desc,magazines desc) rank,
    name,books,sets,hundredths/100 as points
  from eligible
)
select jsonb_build_object(
  'rows',coalesce((select jsonb_agg(r order by rank,name) from ranked r),'[]'),
  'refreshAt',(select min((today+1)::timestamp at time zone timezone) from local_days)
);
$$;
revoke all on function public.marathon_standings() from public;
grant execute on function public.marathon_standings() to anon,authenticated;
