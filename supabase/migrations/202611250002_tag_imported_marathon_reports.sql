begin;

create temporary table imported_marathon_reports (
  temple_name text not null,
  week_start date not null,
  primary key (temple_name,week_start)
) on commit drop;

insert into imported_marathon_reports values
  ('HKM Indore','2026-11-09'),
  ('IHF New York/New Jersey','2026-09-21'),
  ('IHF New York/New Jersey','2026-09-28'),
  ('IHF New York/New Jersey','2026-10-05'),
  ('IHF New York/New Jersey','2026-10-12'),
  ('IHF New York/New Jersey','2026-10-19'),
  ('IHF New York/New Jersey','2026-10-26'),
  ('IHF New York/New Jersey','2026-11-02'),
  ('IHF New York/New Jersey','2026-11-09'),
  ('HKM Puri','2026-11-02'),
  ('HKM Puri','2026-11-09'),
  ('HKM Puri','2026-11-16'),
  ('HKM Indore','2026-11-16'),
  ('Hare Krishna Mandir - Ahmedabad','2026-11-16'),
  ('HKM Udaipur','2026-11-16'),
  ('HKM Hubli','2026-11-16');

do $$
declare affected integer;
begin
  update public.weekly_reports w
  set tags=jsonb_set(w.tags,'{campaigns}',jsonb_build_array(c.id::text),true)
  from public.temples t, public.campaigns c, imported_marathon_reports i
  where w.temple_id=t.id
    and t.name=i.temple_name
    and w.week_start=i.week_start
    and c.name='Book Distribution Marathon 2026'
    and c.temple_id is null;
  get diagnostics affected=row_count;
  if affected<>16 then
    raise exception 'Expected to tag 16 imported marathon reports, tagged %',affected;
  end if;
end $$;

create or replace function public.marathon_standings() returns jsonb
language sql stable security definer set search_path='' as $$
with campaign as (
  select id,starts_on,ends_on
  from public.campaigns
  where name='Book Distribution Marathon 2026' and temple_id is null
), local_days as (
  select m.*,t.timezone,(now() at time zone t.timezone)::date as today,
    c.id campaign_id,
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
    and w.tags->'campaigns' ? a.campaign_id::text
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
    and w.tags->'campaigns' ? a.campaign_id::text
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

commit;
