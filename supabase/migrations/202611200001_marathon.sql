begin;
create table public.marathon_temples (
  temple_id uuid primary key references public.temples(id),
  name text not null, city text not null, country text not null,
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  spoc text not null, email text not null, phone text not null,
  starts_on date, ends_on date,
  check ((starts_on is null and ends_on is null) or
    (starts_on is not null and ends_on is not null and ends_on>=starts_on))
);
alter table public.marathon_temples enable row level security;
create policy marathon_directory on public.marathon_temples for select to anon,authenticated using(true);
revoke all on public.marathon_temples from public,anon,authenticated;
grant select on public.marathon_temples to anon,authenticated;

create temporary table marathon_seed (
  name text, city text, country text, zone text, lat double precision, lon double precision,
  spoc text, email text, phone text
) on commit drop;
insert into marathon_seed values
  ('ISKCON Bangalore','Bengaluru','India','Asia/Kolkata',12.97194,77.59369,'Pradeepta Narsimha Prabhu','pdnd@hkm-group.org','9845104511'),
  ('HKM Hyderabad','Hyderabad','India','Asia/Kolkata',17.38405,78.45636,'Namamruta Dasa','nmmd@hkmhyderabad.org','919347239792'),
  ('HKM Jaipur','Jaipur','India','Asia/Kolkata',26.91962,75.78781,'JYGD','jygd@hkmjaipur.org','9116168943'),
  ('HKM Ahmedabad','Ahmedabad','India','Asia/Kolkata',23.02579,72.58727,'Ugrasen Dasa','ugsd@harekrishnamandir.org','7359690344'),
  ('HKM Vrindavan','Vrindavan','India','Asia/Kolkata',27.58105,77.69662,'Srikant Govinda Dasa','srinivasan.m@vcm.org.in','9880314373'),
  ('HKM Hubli','Hubballi','India','Asia/Kolkata',15.34776,75.13378,'Mathuresha Dasa','mtrdasa@iskconhubli.org','9341322108'),
  ('HKM Visakhapatnam','Visakhapatnam','India','Asia/Kolkata',17.68009,83.20161,'Sarvajita Rama Dasa','sjrd@hkmvizag.org','7075191278'),
  ('HKM Chennai','Chennai','India','Asia/Kolkata',13.08784,80.27847,'Sudama Vipra Dasa','sdvd@hkmchennai.org','9551286004'),
  ('HKM Mumbai','Mumbai','India','Asia/Kolkata',19.07283,72.88261,'Gaurmandal Prabhu','gmnd@hkmmumbai.org','9784592103'),
  ('HKM Vijayawada','Vijayawada','India','Asia/Kolkata',16.50745,80.6466,'CHAITANYA VALLABHA DASA','cvbd@hkmindia.org','8008609547'),
  ('HKM Mysore','Mysuru','India','Asia/Kolkata',12.29791,76.63925,'Pragosh Krishna Dasa','ces@iskconmysore.org','9242010892'),
  ('HKM Guwahati','Guwahati','India','Asia/Kolkata',26.1844,91.7458,'Narasimha Pr','','9678008916'),
  ('HKM Bhilai','Bhilai','India','Asia/Kolkata',21.20919,81.4285,'Gaura Gopala Pr','gaurgopaldasa@gmail.com','9755098617'),
  ('HKM Mangalore','Mangaluru','India','Asia/Kolkata',12.91723,74.85603,'Hari Charan Dasa','hcd@iskconmangalore.org','9742114969'),
  ('HKM Kota','Kota','India','Asia/Kolkata',25.18254,75.83907,'Chitraratha Pr.','ctrd@hkmkota.org','9773376699'),
  ('HKM Udaipur','Udaipur','India','Asia/Kolkata',24.58584,73.71346,'Sumohan Govind Dasa','shgd@hkmudaipur.org','8947975976'),
  ('HKM Jodhpur','Jodhpur','India','Asia/Kolkata',26.26841,73.00594,'Aindra Dasa','aind@hkmjodhpur.org','9773350133'),
  ('HKM Noida','Noida','India','Asia/Kolkata',28.58,77.33,'Navaneeta Gopala Dasa','nvgd@vcm.org.in','8755905975'),
  ('HKM Pune','Pune','India','Asia/Kolkata',18.51957,73.85535,'Vijaya Gauranga Dasa Pr.','vjgd@hkmpune.org','9342291808'),
  ('HKM Puri','Puri','India','Asia/Kolkata',19.79825,85.82494,'Vasudeva Datta Dasa','','9178622949'),
  ('HKM Indore','Indore','India','Asia/Kolkata',22.71792,75.8333,'Madhavendra Puri Pr','','6366713753'),
  ('HKM Raipur','Raipur','India','Asia/Kolkata',21.23333,81.63333,'Gaura Gopala Pr','gaurgopaldasa@gmail.com','9755098617'),
  ('HKM Vadodara','Vadodara','India','Asia/Kolkata',22.29941,73.20812,'Girdhar Gopal Dasa','grgd@harekrishnamandir.org','6352543319'),
  ('HKM Rajkot','Rajkot','India','Asia/Kolkata',22.29161,70.79322,'Rohini Nandan Pr','rnnd@harekrishnamandir.org','6366713753'),
  ('HKM Hindupur','Hindupur','India','Asia/Kolkata',13.82807,77.49143,'Govinda Charana Dasa','gvcd@iskconbangalore.org','6364303541'),
  ('IHF Milpitas','Milpitas','United States','America/Los_Angeles',37.42827,-121.90662,'Prema Rasa Dasa','prashanth.chennagiri@ihf-usa.org','1(408)3385670'),
  ('IHF New York/New Jersey','New York','United States','America/New_York',40.71427,-74.00597,'Hari Sundar Dasa Pr.','hrsd@ihf-njny.org','1(352)3286157'),
  ('IHF Boston','Boston','United States','America/New_York',42.35843,-71.05977,'Gopala dasa pr.','gopal.dasa@ihfboston.org','1(213) 235-7096'),
  ('HKM Johor','Johor Bahru','Malaysia','Asia/Kuala_Lumpur',1.4655,103.7578,'Tota Gopinath Dasa Pr.','thevindran83@gmail.com','60177377159'),
  ('HKM Dehradun','Dehradun','India','Asia/Kolkata',30.32443,78.03392,'Sankarshana Nitai Dasa','vntd@hkmdehradun.org','8123037733'),
  ('HKM Surat','Surat','India','Asia/Kolkata',21.19594,72.83023,'Rohini Nandan Pr','rnnd@harekrishnamandir.org','9624096039'),
  ('HKM Gurugram','Gurugram','India','Asia/Kolkata',28.4601,77.02635,'','','9555750877'),
  ('HKM Coimbatore','Coimbatore','India','Asia/Kolkata',11.00555,76.96612,'Arun Kumar Subramanian','arunantha@gmail.com','9843870641'),
  ('HKM Penang','Penang','Malaysia','Asia/Kuala_Lumpur',5.37292,100.24963,'Tushta Gaurang Dasa','tustagauranga@gmail.com','(60) 16-4103037'),
  ('HKM Dharmapuri','Dharmapuri','India','Asia/Kolkata',12.1277,78.15794,'Sharadendu Krishna Pr','sdkd@iskconbangalore.org','9606916275'),
  ('HKM Trichy','Tiruchirappalli','India','Asia/Kolkata',10.8155,78.69651,'Kishora Krishna Dasa','kkrd@hkmtrichy.org','9791423111'),
  ('HKM Tirupati','Tirupati','India','Asia/Kolkata',13.63551,79.41989,'Prema Bhakti Pr.','pmbd@hkmhyderabad.org','8184913970'),
  ('HKM Bellary','Ballari','India','Asia/Kolkata',15.14205,76.92398,'ishvara puri dasa','ispd@iskconbangalore.org','9343992464'),
  ('HKM Kakinada','Kakinada','India','Asia/Kolkata',16.96036,82.23809,'Sarvajita Rama Dasa','sjrd@hkmvizag.org','7075191278');
-- Explicit aliases keep previously submitted reports attached to the same temple.
create temporary view marathon_matches as
select s.*,t.id temple_id from marathon_seed s
left join public.temples t on t.name=s.name or
  (t.id='0cff3ef7-ad61-5047-a70e-68116df54620' and s.name='HKM Ahmedabad') or
  (t.id='f0d11e67-cdef-5462-9a93-36a410360717' and s.name='HKM Mumbai');
insert into public.temples(name,city,country,timezone)
select name,city,country,zone from marathon_matches where temple_id is null;
insert into public.marathon_temples(temple_id,name,city,country,lat,lon,spoc,email,phone)
select temple_id,name,city,country,lat,lon,spoc,email,phone from marathon_matches;
drop view marathon_matches;

create unique index marathon_one_shared_campaign on public.campaigns(name)
where name='Book Distribution Marathon 2026' and temple_id is null;

create function public.set_marathon_dates(target uuid, starts date, ends date)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select from public.profiles p where p.id=auth.uid() and
    (p.role='admin' or (p.role='temple_coordinator' and p.temple_id=target))) then
    raise exception 'Temple access denied';
  end if;
  update public.marathon_temples set starts_on=starts,ends_on=ends where temple_id=target;
  if not found then raise exception 'Temple is not participating'; end if;
end $$;
revoke all on function public.set_marathon_dates(uuid,date,date) from public,anon;
grant execute on function public.set_marathon_dates(uuid,date,date) to authenticated;

-- This row contains no report contents or temple identifiers.
create table public.marathon_change (id integer primary key check(id=1), changed_at timestamptz not null);
insert into public.marathon_change values(1,clock_timestamp());
alter table public.marathon_change enable row level security;
revoke all on public.marathon_change from public,anon,authenticated;
grant select on public.marathon_change to anon,authenticated;
create policy marathon_signal on public.marathon_change for select to anon,authenticated using(true);
create function public.signal_marathon_change() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  update public.marathon_change set changed_at=clock_timestamp() where id=1;
  return null;
end $$;
revoke all on function public.signal_marathon_change() from public,anon,authenticated;
create trigger signal_weekly_report after insert or update or delete on public.weekly_reports
for each statement execute function public.signal_marathon_change();
create trigger signal_marathon_dates after insert or update or delete on public.marathon_temples
for each statement execute function public.signal_marathon_change();
do $$ begin
  if exists(select from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.marathon_change;
  end if;
end $$;

create function public.marathon_standings() returns jsonb
language sql stable security definer set search_path='' as $$
with local_days as (
  select m.*,t.timezone,(now() at time zone t.timezone)::date as today
  from public.marathon_temples m join public.temples t on t.id=m.temple_id
  where t.approved
), active as (
  select *,date_trunc('week',today::timestamp)::date as monday
  from local_days where today between starts_on and ends_on
), eligible as (
  select a.name,w.id,coalesce(w.books,0) books,coalesce(w.sets,0) sets,
    coalesce(w."mahaBig",0) maha,coalesce(w.big,0) big,coalesce(w.medium,0) medium,
    coalesce(w.small,0) small,coalesce(w.magazines,0) magazines,
    coalesce((select sum(j.value::numeric * public.category_point_hundredths(j.key))
      from jsonb_each_text(to_jsonb(w)) j where j.key in
      ('magazines','small','medium','big','mahaBig','sbSets','ccSets','lifePatronSets')),0) as hundredths
  from active a
  left join public.weekly_reports w on w.temple_id=a.temple_id and w.week_start=a.monday
    and w.week_start<=a.ends_on and w.week_start+6>=a.starts_on
    and exists(select from public.campaigns c where c.name='Book Distribution Marathon 2026'
      and c.temple_id is null and w.tags->'campaigns' ? c.id::text)
), ranked as (
  select rank() over(order by hundredths desc,sets desc,maha desc,big desc,medium desc,small desc,magazines desc) rank,
    name,books,sets,hundredths/100 as points
  from eligible where exists(select from eligible where id is not null)
)
select jsonb_build_object(
  'rows',coalesce((select jsonb_agg(r order by rank,name) from ranked r),'[]'),
  'refreshAt',(select min((today+1)::timestamp at time zone timezone) from local_days)
);
$$;
revoke all on function public.marathon_standings() from public;
grant execute on function public.marathon_standings() to anon,authenticated;
commit;
