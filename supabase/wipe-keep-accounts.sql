-- Remove stored records. Keep only admin sign-in accounts
-- (auth.users email and password, and their public.profiles rows).
-- Temple coordinators, their email addresses, and every temple are deleted.
-- Centres, people, teams, reports, campaigns, stories, events, and targets
-- go with them.
-- Story image files stay in the story-photos bucket; Supabase blocks
-- deleting those rows from SQL. Empty that bucket in Storage if you want
-- the files gone too.
-- The book catalog stays, so new reports can still be scored.
-- Run once in the Supabase SQL editor as the database owner.

begin;

delete from public.report_requests;
delete from public.distributions;
delete from public.period_locks;
delete from public.team_members;
delete from public.monthly_targets;
delete from public.targets;
delete from public.content;
delete from public.audit_log;
delete from public.teams;
delete from public.individuals;
delete from public.centres;
delete from public.campaigns;

-- Profiles point at auth.users and, for coordinators, at a temple.
-- Removing the sign-in deletes the profile, which then frees the temple.
delete from auth.users u
where not exists (
  select 1 from public.profiles p
  where p.id = u.id and p.role = 'admin'
);

delete from public.temples;

commit;
