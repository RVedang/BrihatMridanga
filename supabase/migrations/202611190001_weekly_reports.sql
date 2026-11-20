begin;
lock table public.distributions in share row exclusive mode;
create table if not exists public.weekly_reports (
 id uuid primary key default gen_random_uuid(), temple_id uuid not null references public.temples,
 week_start date not null check(extract(isodow from week_start)=1),
 submitted_on date not null, version integer not null default 1,
 "magazines" bigint not null default 0 check ("magazines">=0),
 "small" bigint not null default 0 check ("small">=0),
 "medium" bigint not null default 0 check ("medium">=0),
 "big" bigint not null default 0 check ("big">=0),
 "mahaBig" bigint not null default 0 check ("mahaBig">=0),
 "sbSets" bigint not null default 0 check ("sbSets">=0),
 "ccSets" bigint not null default 0 check ("ccSets">=0),
 "lifePatronSets" bigint not null default 0 check ("lifePatronSets">=0),
 pending bigint not null default 0 check(pending>=0),
 books bigint generated always as (magazines+small+medium+big+"mahaBig"+pending) stored,
 sets bigint generated always as ("sbSets"+"ccSets"+"lifePatronSets") stored,
 tags jsonb not null default '{}', unique(temple_id,week_start)
);
alter table public.weekly_reports enable row level security;
drop policy if exists weekly_read on public.weekly_reports;
create policy weekly_read on public.weekly_reports for select to authenticated using
(exists(select 1 from public.profiles p where p.id=auth.uid() and
(p.role='admin' or (p.role='temple_coordinator' and p.temple_id=weekly_reports.temple_id))));
revoke all on public.weekly_reports from public,anon,authenticated;
grant select on public.weekly_reports to authenticated;

-- Once cut over, only the weekly writer accepts application submissions.
revoke execute on function public.save_distribution(jsonb) from public,anon,authenticated;
revoke insert,update,delete on public.distributions from public,anon,authenticated;

create temporary table converted on commit drop as
select d.id,d.temple_id,date_trunc('week',d.distributed_on::timestamp)::date week_start,
 (d.created_at at time zone t.timezone)::date submitted_on,
 case when d.mode='total' then 'pending'
 when m.category is not null then m.category
 when b.id is null then null
 when b.name ilike '%srimad bhagavatam%' and b.name not ilike '%1st canto%' and (b.name ilike '%set%' or b.name ilike '%volumes%') then 'sbSets'
 when b.name ilike '%chaitanya charitamrita%volumes%' then 'ccSets'
 when b.name ilike '%path of perfection%' or b.name ilike '%perfection of yoga%' then 'medium'
 when b.name ilike '%journey of self discovery%' or b.name ilike '%science of self%' then 'big'
 when b.name ilike '%bhagavad gita as it is%' or b.name ilike '%supreme personality of godhead%' or b.name ilike '%1st canto%' then 'mahaBig'
 when b.name ilike '%perfect question%' or b.name ilike '%raja-vidya%' then 'small'
 when coalesce((l->>'volumes')::integer,b.volumes,1)>1 then null
 when coalesce(l->>'category',b.category)='m-big' then 'mahaBig'
 else coalesce(l->>'category',b.category) end category,
 case when d.mode='total' then d.book_count else (l->>'quantity')::bigint *
 coalesce(m.units_per_copy,case when b.name ilike '%supreme personality of godhead%vol.1%vol.2%' then 2 else 1 end) end quantity,
 d.centre_id,d.individual_id,d.team_id,d.campaign_id
from public.distributions d join public.temples t on t.id=d.temple_id
left join lateral jsonb_array_elements(d.lines) l on true
left join public.books b on b.id=l->>'bookId'
left join public.weekly_title_mappings m on m.book_id=b.id;
do $$ begin
 if exists(select from converted where category is null or category not in ('pending','magazines','small','medium','big','mahaBig','sbSets','ccSets','lifePatronSets') or quantity is null or quantity<0) then
 raise exception 'Unclassified historical title or invalid quantity. Resolve source mapping before conversion.'; end if;
end $$;
-- Source rows remain as immutable attribution history. Replays preserve subsequent edits.
insert into public.weekly_reports(temple_id,week_start,submitted_on,"magazines","small","medium","big","mahaBig","sbSets","ccSets","lifePatronSets",pending,tags)
select temple_id,week_start,max(submitted_on),
coalesce(sum(quantity) filter(where category='magazines'),0),
coalesce(sum(quantity) filter(where category='small'),0),
coalesce(sum(quantity) filter(where category='medium'),0),
coalesce(sum(quantity) filter(where category='big'),0),
coalesce(sum(quantity) filter(where category='mahaBig'),0),
coalesce(sum(quantity) filter(where category='sbSets'),0),
coalesce(sum(quantity) filter(where category='ccSets'),0),
coalesce(sum(quantity) filter(where category='lifePatronSets'),0),
coalesce(sum(quantity) filter(where category='pending'),0),
jsonb_build_object('centres',coalesce(jsonb_agg(distinct centre_id) filter(where centre_id is not null),'[]'),'teams',coalesce(jsonb_agg(distinct team_id) filter(where team_id is not null),'[]'),'individuals',coalesce(jsonb_agg(distinct individual_id) filter(where individual_id is not null),'[]'),'campaigns',coalesce(jsonb_agg(distinct campaign_id) filter(where campaign_id is not null),'[]'))
from converted group by temple_id,week_start on conflict(temple_id,week_start) do nothing;

create or replace function public.save_weekly_report(request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare tid uuid := (request->>'temple')::uuid; wk date := (request->>'week')::date;
 actor public.profiles; t public.temples; r public.weekly_reports; k text; v jsonb; q jsonb:=request->'quantities';
 invalid_tag boolean; labels jsonb:=coalesce(request->'tags','{}'); n bigint:=(request->>'pending')::bigint;
begin
 select * into actor from public.profiles where id=auth.uid();
 if actor.id is null or not(actor.role='admin' or (actor.role='temple_coordinator' and actor.temple_id=tid)) then raise exception 'Temple access denied'; end if;
 select * into strict t from public.temples where id=tid;
 if actor.role<>'admin' and not t.approved then raise exception 'Temple approval required'; end if;
 if wk is null or extract(isodow from wk)<>1 or wk>(now() at time zone t.timezone)::date then raise exception 'Invalid reporting week'; end if;
 foreach k in array array['magazines','small','medium','big','mahaBig','sbSets','ccSets','lifePatronSets'] loop
 if jsonb_typeof(q->k) is distinct from 'number' or q->>k !~ '^[0-9]+$' then raise exception 'Enter whole quantities'; end if; end loop;
 if jsonb_typeof(labels)<>'object' then raise exception 'Invalid participants'; end if;
 for k,v in select * from jsonb_each(labels) loop
 if k not in ('centres','teams','individuals','campaigns') or jsonb_typeof(v)<>'array' then raise exception 'Invalid participants'; end if;
 execute format('select exists(select from jsonb_array_elements_text($1) tag where not exists(select from public.%I x where x.id=tag::uuid and (x.temple_id=$2 %s)))',k,case when k='campaigns' then 'or x.temple_id is null' else '' end) into invalid_tag using v,tid;
 if invalid_tag then raise exception 'Participant unavailable'; end if; end loop;
 perform pg_advisory_xact_lock(hashtextextended(tid::text||wk::text,0));
 select * into r from public.weekly_reports where temple_id=tid and week_start=wk for update;
 if found then
 if request->>'id' is distinct from r.id::text or (request->>'version')::int is distinct from r.version then return jsonb_build_object('conflict',true,'id',r.id); end if;
 if actor.role<>'admin' and (now() at time zone t.timezone)::date>(r.submitted_on+interval '1 month')::date then raise exception 'Editing deadline has passed'; end if;
 if n is null or n<0 or n>r.pending then raise exception 'Invalid pending amount'; end if;
 if n<r.pending and n+(q->>'magazines')::bigint+(q->>'small')::bigint+(q->>'medium')::bigint+(q->>'big')::bigint+(q->>'mahaBig')::bigint<r.books
 then raise exception 'Assign pending books to categories before reducing the pending amount'; end if;
 update public.weekly_reports set "magazines"=(q->>'magazines')::bigint,"small"=(q->>'small')::bigint,"medium"=(q->>'medium')::bigint,"big"=(q->>'big')::bigint,"mahaBig"=(q->>'mahaBig')::bigint,"sbSets"=(q->>'sbSets')::bigint,"ccSets"=(q->>'ccSets')::bigint,"lifePatronSets"=(q->>'lifePatronSets')::bigint,pending=n,tags=labels,version=r.version+1 where id=r.id;
 else
 if request->>'id' is not null or n is distinct from 0::bigint then raise exception 'Invalid new report'; end if;
 insert into public.weekly_reports(temple_id,week_start,submitted_on,tags,"magazines","small","medium","big","mahaBig","sbSets","ccSets","lifePatronSets")
 values(tid,wk,(now() at time zone t.timezone)::date,labels,(q->>'magazines')::bigint,(q->>'small')::bigint,(q->>'medium')::bigint,(q->>'big')::bigint,(q->>'mahaBig')::bigint,(q->>'sbSets')::bigint,(q->>'ccSets')::bigint,(q->>'lifePatronSets')::bigint) returning * into r;
 end if;
 return jsonb_build_object('id',r.id);
end $$;
revoke all on function public.save_weekly_report(jsonb) from public,anon;
grant execute on function public.save_weekly_report(jsonb) to authenticated;
revoke execute on function public.public_scores(integer),public.public_scores_range(date,date,uuid,uuid),public.public_daily_scores(date,date,uuid,text,uuid,uuid) from public,anon,authenticated;
alter table public.centres add column if not exists logo_url text check(logo_url ~ '^https://' and length(logo_url)<=2000);
alter table public.individuals add column if not exists logo_url text check(logo_url ~ '^https://' and length(logo_url)<=2000);
alter table public.teams add column if not exists logo_url text check(logo_url ~ '^https://' and length(logo_url)<=2000);
alter table public.campaigns add column if not exists logo_url text check(logo_url ~ '^https://' and length(logo_url)<=2000);
create table if not exists public.weekly_source_quantities (
 source_id uuid references public.distributions, category text, quantity bigint not null, primary key(source_id,category)
);
alter table public.weekly_source_quantities enable row level security;
revoke all on public.weekly_source_quantities from public,anon,authenticated;
insert into public.weekly_source_quantities select id,category,sum(quantity) from converted group by id,category
on conflict do nothing;
commit;
