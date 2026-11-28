-- Schedule dates are transcribed as supplied and are informational.
-- Confirm the end years for Johor, Trichy and Bellary, and the long Indore period.
create function public.marathon_cumulative_standings() returns jsonb
language sql stable security definer set search_path='' as $$
with roster(name, category, starts_on, ends_on) as (
  values
  ('ISKCON Bangalore', 'Maha Big', date '2026-11-29', date '2027-02-07'),
  ('HKM Hyderabad', 'Big', date '2026-11-22', date '2027-01-31'),
  ('HKM Jaipur', 'Big', date '2026-11-22', date '2027-01-31'),
  ('HKM Ahmedabad', 'Big', date '2026-11-21', date '2027-01-24'),
  ('HKM Vrindavan', 'Big', date '2027-01-17', date '2027-03-21'),
  ('HKM Mumbai', 'Big', date '2026-11-05', date '2026-12-21'),
  ('HKM Hubli', 'Medium', date '2026-11-22', date '2027-01-31'),
  ('HKM Visakhapatnam', 'Medium', date '2026-11-23', date '2027-01-31'),
  ('HKM Chennai', 'Medium', date '2026-12-01', date '2027-01-31'),
  ('HKM Vijayawada', 'Small', date '2026-11-13', date '2027-01-16'),
  ('HKM Mysore', 'Small', date '2026-11-29', date '2027-01-31'),
  ('HKM Guwahati', 'Small', date '2026-11-25', date '2027-01-30'),
  ('HKM Bhilai', 'Small', date '2026-11-22', date '2027-01-24'),
  ('HKM Mangalore', 'Small', date '2026-11-29', date '2027-01-31'),
  ('HKM Kota', 'Small', date '2026-11-07', date '2027-02-07'),
  ('HKM Udaipur', 'Small', date '2026-10-01', date '2027-01-31'),
  ('HKM Jodhpur', 'Small', date '2026-11-28', date '2027-01-31'),
  ('HKM Noida', 'Small', date '2027-01-17', date '2027-03-21'),
  ('HKM Pune', 'Small', date '2026-11-29', date '2027-01-12'),
  ('HKM Puri', 'Small', date '2026-11-01', date '2027-02-02'),
  ('HKM Indore', 'Small', date '2026-11-13', date '2027-11-26'),
  ('HKM Raipur', 'Small', date '2026-11-22', date '2027-01-24'),
  ('HKM Vadodara', 'Small', date '2026-11-21', date '2027-01-24'),
  ('HKM Rajkot', 'Small', date '2026-11-21', date '2027-01-24'),
  ('HKM Hindupur', 'Small', date '2026-11-29', date '2027-02-07'),
  ('IHF Milpitas', 'Maha Small', date '2026-11-21', date '2027-01-24'),
  ('IHF New York/New Jersey', 'Maha Small', date '2026-09-27', date '2026-11-30'),
  ('IHF Boston', 'Maha Small', date '2026-09-26', date '2027-01-01'),
  ('HKM Johor', 'Maha Small', date '2026-11-10', date '2026-01-24'),
  ('HKM Surat', 'Maha Small', date '2026-11-21', date '2027-01-24'),
  ('HKM Gurugram', 'Maha Small', date '2027-01-17', date '2027-03-21'),
  ('HKM Penang', 'Maha Small', date '2026-11-10', date '2027-01-24'),
  ('HKM Trichy', 'Maha Small', date '2026-11-29', date '2026-02-07'),
  ('HKM Tirupati', 'Maha Small', date '2026-11-22', date '2026-12-24'),
  ('HKM Bellary', 'Maha Small', date '2026-12-01', date '2026-01-31'),
  ('HKM Kakinada', 'Maha Small', date '2026-11-23', date '2027-01-31')
), eligible as (
  select m.temple_id,r.name,r.category,
    case when w.week_start+6 <= (now() at time zone t.timezone)::date
      then w.week_start+6
      else greatest(w.week_start, least(w.submitted_on,(now() at time zone t.timezone)::date))
    end reporting_date,
    coalesce((select sum(j.value::numeric * public.category_point_hundredths(j.key))
      from jsonb_each_text(to_jsonb(w)) j where j.key in
      ('magazines','small','medium','big','mahaBig','sbSets','ccSets','lifePatronSets')),0) hundredths
  from roster r
  join public.marathon_temples m on m.name=r.name
  join public.temples t on t.id=m.temple_id and t.approved
  join public.weekly_reports w on w.temple_id=m.temple_id
  where w.week_start <= (now() at time zone t.timezone)::date
    and exists (select from public.campaigns c
      where c.name='Book Distribution Marathon 2026' and c.temple_id is null
      and w.tags->'campaigns' ? c.id::text)
), totals as (
  select temple_id,name,category,sum(hundredths)/100 points
  from eligible group by temple_id,name,category
), ranked as (
  select row_number() over(partition by category order by points desc,name,temple_id) rank,
    name,category,points from totals
)
select jsonb_build_object(
  'rows',coalesce((select jsonb_agg(r order by category,rank) from ranked r),'[]'),
  'asOf',(select max(reporting_date) from eligible),
  'startedCount',(select count(distinct temple_id) from totals),
  'refreshAt',(date_trunc('day',now() at time zone 'Asia/Kolkata')+interval '1 day') at time zone 'Asia/Kolkata'
);
$$;
revoke all on function public.marathon_cumulative_standings() from public;
grant execute on function public.marathon_cumulative_standings() to anon,authenticated;
