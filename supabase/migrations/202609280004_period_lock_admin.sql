-- Admins close and reopen reporting months. save_distribution already refuses
-- new reports and corrections in a closed month for everyone.

grant insert, delete on public.period_locks to authenticated;

drop policy if exists admin_manage_locks on public.period_locks;
create policy admin_manage_locks on public.period_locks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
