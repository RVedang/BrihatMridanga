-- Apply to a new Supabase project. No public access to individual/team records.
create table public.temples (
  id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name)) between 1 and 160),
  country text not null, city text not null default '', timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','temple_coordinator')),
  temple_id uuid references public.temples(id), display_name text not null,
  check (role = 'admin' or temple_id is not null)
);
create table public.books (
  id text primary key, name text not null, language text not null,
  price numeric(12,2) not null check (price >= 0), currency text not null check (currency = 'INR'),
  score numeric(12,2) not null check (score >= 0),
  category text not null check (category in ('small','medium','big','m-big'))
);
create table public.centres (
  id uuid primary key default gen_random_uuid(), temple_id uuid not null references public.temples(id),
  name text not null check (length(trim(name)) between 1 and 160), unique (id, temple_id)
);
create table public.individuals (
  id uuid primary key default gen_random_uuid(), temple_id uuid not null references public.temples(id),
  name text not null check (length(trim(name)) between 1 and 160), unique (id, temple_id)
);
create table public.teams (
  id uuid primary key default gen_random_uuid(), temple_id uuid not null references public.temples(id),
  name text not null check (length(trim(name)) between 1 and 160),
  coordinator_name text not null check (length(trim(coordinator_name)) between 1 and 160), unique (id, temple_id)
);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(), temple_id uuid references public.temples(id),
  name text not null check (length(trim(name)) between 1 and 160), description text not null default '',
  starts_on date not null, ends_on date not null, fallback_year integer unique,
  check (ends_on >= starts_on),
  check (fallback_year is null or (temple_id is null and starts_on = make_date(fallback_year,1,1) and ends_on = make_date(fallback_year,12,31)))
);
create table public.distributions (
  id uuid primary key, temple_id uuid not null references public.temples(id),
  centre_id uuid, individual_id uuid, team_id uuid,
  campaign_id uuid not null references public.campaigns(id), distributed_on date not null,
  mode text not null check (mode in ('detailed','total')),
  lines jsonb not null default '[]', book_count bigint not null check (book_count > 0),
  points numeric(18,2), version integer not null default 1,
  created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (centre_id,temple_id) references public.centres(id,temple_id),
  foreign key (individual_id,temple_id) references public.individuals(id,temple_id),
  foreign key (team_id,temple_id) references public.teams(id,temple_id),
  check ((mode='total' and points is null and lines='[]'::jsonb) or (mode='detailed' and points is not null and jsonb_array_length(lines)>0))
);
create index distributions_temple_date on public.distributions(temple_id, distributed_on);
create index distributions_campaign on public.distributions(campaign_id);
create table public.period_locks (
  temple_id uuid not null references public.temples(id), month date not null check (extract(day from month)=1),
  primary key(temple_id,month)
);
create table public.audit_log (
  id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id),
  temple_id uuid references public.temples(id), entity text not null, entity_id uuid not null,
  before_data jsonb, after_data jsonb, reason text not null default '', occurred_at timestamptz not null default now()
);
create table public.report_requests (
  request_id uuid primary key, actor_id uuid not null references auth.users(id),
  payload jsonb not null, distribution_id uuid not null references public.distributions(id), version integer not null
);

create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role='admin');
$$;
create function public.can_manage(t uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and (role='admin' or (role='temple_coordinator' and temple_id=t)));
$$;

alter table public.temples enable row level security;
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.centres enable row level security;
alter table public.individuals enable row level security;
alter table public.teams enable row level security;
alter table public.campaigns enable row level security;
alter table public.distributions enable row level security;
alter table public.period_locks enable row level security;
alter table public.audit_log enable row level security;
alter table public.report_requests enable row level security;

-- Reset default Supabase grants before adding the intended access.
revoke all on public.temples, public.profiles, public.books, public.centres, public.individuals, public.teams,
  public.campaigns, public.distributions, public.period_locks, public.audit_log, public.report_requests from anon, authenticated;
grant select on public.temples, public.books, public.campaigns to anon, authenticated;
grant select on public.profiles, public.centres, public.individuals, public.teams, public.distributions, public.period_locks, public.audit_log to authenticated;
grant insert, update on public.temples, public.profiles, public.centres, public.individuals, public.teams, public.campaigns to authenticated;

create policy public_temples on public.temples for select using (true);
create policy manage_temples on public.temples for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy public_books on public.books for select using (true);
create policy own_profile on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
create policy admin_profiles on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy scoped_centres on public.centres for all to authenticated using (public.can_manage(temple_id)) with check (public.can_manage(temple_id));
create policy scoped_individuals on public.individuals for all to authenticated using (public.can_manage(temple_id)) with check (public.can_manage(temple_id));
create policy scoped_teams on public.teams for all to authenticated using (public.can_manage(temple_id)) with check (public.can_manage(temple_id));
create policy public_campaigns on public.campaigns for select using (true);
create policy create_special_campaign on public.campaigns for insert to authenticated with check (fallback_year is null and public.can_manage(temple_id));
create policy update_special_campaign on public.campaigns for update to authenticated using (fallback_year is null and public.can_manage(temple_id)) with check (fallback_year is null and public.can_manage(temple_id));
create policy own_distributions on public.distributions for select to authenticated using (public.can_manage(temple_id));
create policy own_locks on public.period_locks for select to authenticated using (public.can_manage(temple_id));
create policy own_audit on public.audit_log for select to authenticated using (public.can_manage(temple_id));

create function public.protect_attribution() returns trigger language plpgsql set search_path='' as $$
begin
  if old.temple_id is distinct from new.temple_id then raise exception 'Temple ownership cannot be reassigned'; end if;
  return new;
end $$;
create trigger centre_ownership before update on public.centres for each row execute function public.protect_attribution();
create trigger individual_ownership before update on public.individuals for each row execute function public.protect_attribution();
create trigger team_ownership before update on public.teams for each row execute function public.protect_attribution();

create function public.protect_campaign() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if old.temple_id is distinct from new.temple_id or old.fallback_year is distinct from new.fallback_year then raise exception 'Campaign ownership/type cannot be reassigned'; end if;
  if exists(select 1 from public.distributions where campaign_id=old.id and (distributed_on<new.starts_on or distributed_on>new.ends_on)) then
    raise exception 'Campaign dates would exclude existing reports';
  end if;
  return new;
end $$;
create trigger campaign_integrity before update on public.campaigns for each row execute function public.protect_campaign();

create function public.audit_record() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.audit_log(actor_id,temple_id,entity,entity_id,before_data,after_data)
    values(auth.uid(),new.temple_id,tg_table_name,new.id,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
  return new;
end $$;
create trigger audit_individual after insert or update on public.individuals for each row execute function public.audit_record();
create trigger audit_team after insert or update on public.teams for each row execute function public.audit_record();
create trigger audit_centre after insert or update on public.centres for each row execute function public.audit_record();
create trigger audit_special after insert or update on public.campaigns for each row execute function public.audit_record();

-- All report writes pass through this transaction, including correction and retry.
create function public.save_distribution(request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid := auth.uid(); tid uuid := (request->>'templeId')::uuid;
  did uuid := (request->>'id')::uuid; reqid uuid := (request->>'requestId')::uuid;
  day date := (request->>'date')::date; campaign uuid := nullif(request->>'campaignId','')::uuid;
  centre uuid := nullif(request->>'centreId','')::uuid;
  person uuid := nullif(request->>'individualId','')::uuid;
  team uuid := nullif(request->>'teamId','')::uuid;
  chosen_mode text := request->>'mode'; old_row public.distributions; prior public.report_requests;
  line jsonb; book public.books; qty numeric; counted bigint := 0; scored numeric := 0;
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
  -- Serialize new/corrected writes to this report and month-lock changes.
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
    counted := qty; scored := null;
  elsif chosen_mode='detailed' then
    if jsonb_typeof(request->'lines') is distinct from 'array' or jsonb_array_length(request->'lines') not between 1 and 500 then raise exception 'Book details required'; end if;
    for line in select value from jsonb_array_elements(request->'lines') loop
      select * into book from public.books where id=line->>'bookId';
      if not found or book.id=any(used_ids) then raise exception 'Unknown or repeated Book ID'; end if;
      qty := (line->>'quantity')::numeric;
      if qty is null or qty <= 0 or qty > 1000000 or qty <> trunc(qty) then raise exception 'Invalid book quantity'; end if;
      counted := counted + qty;
      scored := scored + qty*book.score;
      used_ids := array_append(used_ids,book.id);
      snapshot := snapshot || jsonb_build_array(jsonb_build_object('bookId',book.id,'quantity',qty,'score',book.score,'category',book.category));
    end loop;
  else raise exception 'Invalid reporting mode';
  end if;
  revision := coalesce(old_row.version,0)+1;
  insert into public.distributions(id,temple_id,centre_id,individual_id,team_id,campaign_id,distributed_on,mode,lines,book_count,points,version,created_by,updated_by)
    values(did,tid,centre,person,team,campaign,day,chosen_mode,snapshot,counted,scored,revision,actor,actor)
    on conflict(id) do update set centre_id=excluded.centre_id,individual_id=excluded.individual_id,team_id=excluded.team_id,
      campaign_id=excluded.campaign_id,distributed_on=excluded.distributed_on,mode=excluded.mode,lines=excluded.lines,
      book_count=excluded.book_count,points=excluded.points,version=excluded.version,updated_by=actor,updated_at=now();
  insert into public.audit_log(actor_id,temple_id,entity,entity_id,before_data,after_data,reason)
    select actor,tid,'distributions',did,case when old_row.id is null then null else to_jsonb(old_row) end,to_jsonb(d),coalesce(request->>'reason','') from public.distributions d where id=did;
  insert into public.report_requests values(reqid,actor,request,did,revision);
  return jsonb_build_object('id',did,'version',revision,'books',counted,'points',scored,'replayed',false);
end $$;

-- Aggregate-only public API; operational identities and raw reports remain private.
create function public.public_scores(report_year integer) returns table(temple_id uuid,temple_name text,country text,books bigint,known_points numeric,incomplete_reports bigint)
language sql stable security definer set search_path='' as $$
  select t.id,t.name,t.country,sum(d.book_count)::bigint,coalesce(sum(d.points),0),count(*) filter(where d.points is null)
  from public.distributions d join public.temples t on t.id=d.temple_id
  where d.distributed_on>=make_date(report_year,1,1) and d.distributed_on<make_date(report_year+1,1,1)
  group by t.id,t.name,t.country order by coalesce(sum(d.points),0) desc,t.name;
$$;
revoke all on function public.is_admin(),public.can_manage(uuid),public.protect_attribution(),public.protect_campaign(),public.audit_record(),public.save_distribution(jsonb),public.public_scores(integer) from public;
grant execute on function public.is_admin(),public.can_manage(uuid),public.save_distribution(jsonb) to authenticated;
grant execute on function public.public_scores(integer) to anon,authenticated;
