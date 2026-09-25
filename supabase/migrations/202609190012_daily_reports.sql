-- Daily totals for the reports page. Also restores daily rows for a full-year
-- date range on public_dashboard. Safe to re-run.

drop function if exists public.public_daily_scores(date, date, uuid, text, uuid, uuid);

create function public.public_daily_scores(
  start_date date,
  end_date date,
  selected_campaign uuid default null,
  selected_country text default null,
  selected_temple uuid default null,
  selected_centre uuid default null
) returns table(
  day text, books bigint, sets bigint, points numeric, reports bigint
) language plpgsql stable security definer set search_path='' as $$
begin
  if start_date is null or end_date is null or end_date < start_date then
    raise exception 'Invalid date range';
  end if;
  return query
    select d.distributed_on::text, sum(d.book_count)::bigint, sum(d.set_count)::bigint,
      coalesce(sum(d.points), 0), count(*)::bigint
    from public.distributions d
    join public.temples t on t.id = d.temple_id
    where d.distributed_on between start_date and end_date
      and (selected_campaign is null or d.campaign_id = selected_campaign)
      and (selected_country is null or t.country = selected_country)
      and (selected_temple is null or d.temple_id = selected_temple)
      and (selected_centre is null or d.centre_id = selected_centre)
    group by d.distributed_on
    order by d.distributed_on;
end $$;

revoke all on function public.public_daily_scores(date, date, uuid, text, uuid, uuid) from public;
grant execute on function public.public_daily_scores(date, date, uuid, text, uuid, uuid) to anon, authenticated;
