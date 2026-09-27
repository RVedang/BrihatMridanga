-- Remove the catch-all Others temple and every record that belongs to it.
do $$
declare
  tid uuid;
begin
  select id into tid from public.temples where name = 'Others';
  if tid is null then
    return;
  end if;

  delete from public.report_requests
  where distribution_id in (
    select id from public.distributions where temple_id = tid
  );
  delete from public.distributions where temple_id = tid;
  delete from public.team_members
  where team_id in (select id from public.teams where temple_id = tid);
  delete from public.teams where temple_id = tid;
  delete from public.individuals where temple_id = tid;
  delete from public.centres where temple_id = tid;
  delete from public.content where temple_id = tid;
  delete from public.campaigns where temple_id = tid;
  delete from public.targets where temple_id = tid;
  delete from public.monthly_targets where temple_id = tid;
  delete from public.period_locks where temple_id = tid;
  delete from public.audit_log where temple_id = tid;
  delete from public.profiles where temple_id = tid;
  delete from public.temples where id = tid;
end $$;
