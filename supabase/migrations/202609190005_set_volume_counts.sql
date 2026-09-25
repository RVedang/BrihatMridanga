-- Sets add every physical volume to book_count and record how many sets were distributed.
-- Listed set scores still apply once per set, not per volume.
alter table public.books
  add column if not exists volumes integer not null default 1 check (volumes >= 1);
alter table public.distributions
  add column if not exists set_count bigint not null default 0 check (set_count >= 0);

update public.books set volumes = 18
  where name ~* 'Srimad Bhagavatam Set' and name !~* '\d+\s*Vol';
update public.books set volumes = (regexp_match(name, '(\d+)\s*volumes?', 'i'))[1]::integer
  where name ~* '\d+\s*volumes?';
update public.books set volumes = (regexp_match(name, '\((\d+)\s*Vol', 'i'))[1]::integer
  where name ~* '\(\d+\s*Vol';
update public.books set volumes = 2
  where name ~* 'Vol\.?\s*1\s*&\s*Vol\.?\s*2';

update public.distributions d
set book_count = s.books, set_count = s.sets
from (
  select d2.id,
    sum((l->>'quantity')::bigint * b.volumes)::bigint as books,
    coalesce(sum(case when b.volumes > 1 then (l->>'quantity')::bigint else 0 end), 0)::bigint as sets
  from public.distributions d2
  join lateral jsonb_array_elements(d2.lines) l on true
  join public.books b on b.id = l->>'bookId'
  where d2.mode = 'detailed'
  group by d2.id
) s
where d.id = s.id;

create or replace function public.save_distribution(request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid := auth.uid(); tid uuid := (request->>'templeId')::uuid;
  did uuid := (request->>'id')::uuid; reqid uuid := (request->>'requestId')::uuid;
  day date := (request->>'date')::date; campaign uuid := nullif(request->>'campaignId','')::uuid;
  centre uuid := nullif(request->>'centreId','')::uuid;
  person uuid := nullif(request->>'individualId','')::uuid;
  team uuid := nullif(request->>'teamId','')::uuid;
  chosen_mode text := request->>'mode'; old_row public.distributions; prior public.report_requests;
  line jsonb; book public.books; qty numeric; counted bigint := 0; set_total bigint := 0; scored numeric := 0;
  snapshot jsonb := '[]'; used_ids text[] := '{}'; zone text; revision integer;
begin
  if actor is null or not public.can_manage(tid) then raise exception 'Temple access denied'; end if;
  if did is null or reqid is null or day is null or chosen_mode is null then raise exception 'Missing required report fields'; end if;
  perform pg_advisory_xact_lock(hashtextextended(reqid::text,0));
  select * into prior from public.report_requests where request_id=reqid;
  if found then
    if prior.actor_id <> actor or prior.payload <> request then raise exception 'Request ID already used for different data'; end if;
    return jsonb_build_object('id',prior.distribution_id,'version',prior.version,'replayed',true);
  end if;
  perform pg_advisory_xact_lock(hashtextextended(did::text,1));
  perform pg_advisory_xact_lock(hashtextextended(tid::text,2));
  select * into old_row from public.distributions where id=did for update;
  if found then
    if old_row.temple_id <> tid then raise exception 'Report temple cannot change'; end if;
    if (request->>'version')::integer is distinct from old_row.version then raise exception 'Report changed; reload before correcting'; end if;
    if length(trim(coalesce(request->>'reason',''))) < 3 then raise exception 'A correction reason is required'; end if;
  elsif coalesce((request->>'version')::integer,0) <> 0 then raise exception 'Report no longer exists';
  end if;
  if exists(select 1 from public.period_locks where temple_id=tid and (month=date_trunc('month',day)::date or month=date_trunc('month',old_row.distributed_on)::date)) then
    raise exception 'Reporting period is closed; admin must reopen it';
  end if;
  select timezone into zone from public.temples where id=tid;
  if day > (now() at time zone zone)::date then raise exception 'Distribution date cannot be in the future'; end if;
  if centre is not null and not exists(select 1 from public.centres where id=centre and temple_id=tid) then raise exception 'Invalid centre'; end if;
  if person is not null and not exists(select 1 from public.individuals where id=person and temple_id=tid) then raise exception 'Invalid individual'; end if;
  if team is not null and not exists(select 1 from public.teams where id=team and temple_id=tid) then raise exception 'Invalid team'; end if;
  if campaign is null then
    insert into public.campaigns(name,starts_on,ends_on,fallback_year) values
      ('Whole-Year Marathon '||extract(year from day)::integer,make_date(extract(year from day)::integer,1,1),make_date(extract(year from day)::integer,12,31),extract(year from day)::integer)
      on conflict(fallback_year) do nothing;
    select id into campaign from public.campaigns where fallback_year=extract(year from day)::integer;
  end if;
  perform 1 from public.campaigns where id=campaign and (temple_id is null or temple_id=tid) and day between starts_on and ends_on for share;
  if not found then raise exception 'Campaign is not eligible for this temple and date'; end if;
  if chosen_mode='total' then
    qty := (request->>'total')::numeric;
    if qty is null or qty <= 0 or qty > 1000000 or qty <> trunc(qty) then raise exception 'Invalid total count'; end if;
    if coalesce(request->'lines','[]'::jsonb) <> '[]'::jsonb then raise exception 'Total-only reports cannot contain book lines'; end if;
    counted := qty; set_total := 0; scored := null;
  elsif chosen_mode='detailed' then
    if jsonb_typeof(request->'lines') is distinct from 'array' or jsonb_array_length(request->'lines') not between 1 and 500 then raise exception 'Book details required'; end if;
    for line in select value from jsonb_array_elements(request->'lines') loop
      select * into book from public.books where id=line->>'bookId';
      if not found or book.id=any(used_ids) then raise exception 'Unknown or repeated Book ID'; end if;
      qty := (line->>'quantity')::numeric;
      if qty is null or qty <= 0 or qty > 1000000 or qty <> trunc(qty) then raise exception 'Invalid book quantity'; end if;
      counted := counted + (qty * book.volumes);
      if book.volumes > 1 then set_total := set_total + qty; end if;
      scored := scored + qty*book.score;
      used_ids := array_append(used_ids,book.id);
      snapshot := snapshot || jsonb_build_array(jsonb_build_object('bookId',book.id,'quantity',qty,'score',book.score,'category',book.category,'volumes',book.volumes));
    end loop;
  else raise exception 'Invalid reporting mode';
  end if;
  revision := coalesce(old_row.version,0)+1;
  insert into public.distributions(id,temple_id,centre_id,individual_id,team_id,campaign_id,distributed_on,mode,lines,book_count,set_count,points,version,created_by,updated_by)
    values(did,tid,centre,person,team,campaign,day,chosen_mode,snapshot,counted,set_total,scored,revision,actor,actor)
    on conflict(id) do update set centre_id=excluded.centre_id,individual_id=excluded.individual_id,team_id=excluded.team_id,
      campaign_id=excluded.campaign_id,distributed_on=excluded.distributed_on,mode=excluded.mode,lines=excluded.lines,
      book_count=excluded.book_count,set_count=excluded.set_count,points=excluded.points,version=excluded.version,updated_by=actor,updated_at=now();
  insert into public.audit_log(actor_id,temple_id,entity,entity_id,before_data,after_data,reason)
    select actor,tid,'distributions',did,case when old_row.id is null then null else to_jsonb(old_row) end,to_jsonb(d),coalesce(request->>'reason','') from public.distributions d where id=did;
  insert into public.report_requests values(reqid,actor,request,did,revision);
  return jsonb_build_object('id',did,'version',revision,'books',counted,'sets',set_total,'points',scored,'replayed',false);
end $$;

drop function if exists public.public_scores(integer);
drop function if exists public.public_scores_range(date, date, uuid);

create function public.public_scores(report_year integer)
returns table(temple_id uuid,temple_name text,country text,books bigint,sets bigint,known_points numeric,incomplete_reports bigint)
language sql stable security definer set search_path='' as $$
  select t.id,t.name,t.country,sum(d.book_count)::bigint,sum(d.set_count)::bigint,coalesce(sum(d.points),0),count(*) filter(where d.points is null)
  from public.distributions d join public.temples t on t.id=d.temple_id
  where d.distributed_on>=make_date(report_year,1,1) and d.distributed_on<make_date(report_year+1,1,1)
  group by t.id,t.name,t.country order by coalesce(sum(d.points),0) desc,t.name;
$$;

create function public.public_scores_range(start_date date, end_date date, selected_campaign uuid default null)
returns table(temple_id uuid,temple_name text,country text,books bigint,sets bigint,known_points numeric,incomplete_reports bigint)
language plpgsql stable security definer set search_path='' as $$
begin
  if start_date is null or end_date is null or end_date<start_date then raise exception 'Invalid date range'; end if;
  return query
    select t.id,t.name,t.country,sum(d.book_count)::bigint,sum(d.set_count)::bigint,coalesce(sum(d.points),0),count(*) filter(where d.points is null)
    from public.distributions d join public.temples t on t.id=d.temple_id
    where d.distributed_on between start_date and end_date
      and (selected_campaign is null or d.campaign_id=selected_campaign)
    group by t.id,t.name,t.country order by coalesce(sum(d.points),0) desc,t.name;
end $$;

revoke all on function public.save_distribution(jsonb), public.public_scores(integer), public.public_scores_range(date,date,uuid) from public;
grant execute on function public.save_distribution(jsonb) to authenticated;
grant execute on function public.public_scores(integer), public.public_scores_range(date,date,uuid) to anon, authenticated;
