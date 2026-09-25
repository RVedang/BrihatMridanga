-- Public names of centres so temple pages can filter. Safe to re-run.
grant select on public.centres to anon, authenticated;
drop policy if exists public_centres on public.centres;
create policy public_centres on public.centres for select using (true);

drop function if exists public.public_scores_range(date, date, uuid);
drop function if exists public.public_scores_range(date, date, uuid, uuid);

create function public.public_scores_range(
  start_date date,
  end_date date,
  selected_campaign uuid default null,
  selected_centre uuid default null
) returns table(
  temple_id uuid, temple_name text, country text,
  books bigint, sets bigint, known_points numeric, incomplete_reports bigint
) language plpgsql stable security definer set search_path='' as $$
begin
  if start_date is null or end_date is null or end_date < start_date then
    raise exception 'Invalid date range';
  end if;
  return query
    select t.id, t.name, t.country,
      sum(d.book_count)::bigint, sum(d.set_count)::bigint,
      coalesce(sum(d.points), 0),
      count(*) filter (where d.points is null)
    from public.distributions d
    join public.temples t on t.id = d.temple_id
    where d.distributed_on between start_date and end_date
      and (selected_campaign is null or d.campaign_id = selected_campaign)
      and (selected_centre is null or d.centre_id = selected_centre)
    group by t.id, t.name, t.country
    order by coalesce(sum(d.points), 0) desc, t.name;
end $$;

revoke all on function public.public_scores_range(date, date, uuid, uuid) from public;
grant execute on function public.public_scores_range(date, date, uuid, uuid) to anon, authenticated;
