# Implementation status — 18 September 2026

Planning was explicitly approved and coding authorized by the user. This document tracks the first implementation; it is not a claim that the complete launch checklist is satisfied.

## Confirmed decisions used in the code

- Launch target: 21 September 2026; all ten website sections remain required.
- Only the admin and temple coordinators log in. Individual/team records do not grant login rights. The user will be the admin; their verified account identity is still needed for provisioning.
- Temple coordinators manage their own temple's individual/team records and campaigns. Admin can manage all temples and shared campaigns.
- Valid reports publish immediately without a separate approval queue.
- Allow detailed book quantities and total-count-only submissions. The latter count toward distributed books with points explicitly incomplete. Adding details corrects the same report.
- Preserve all 176 supplied book IDs, scores and categories, including the reviewed differences. All prices are INR. One set is recorded as one set; book totals include every volume in that set; the listed set score is earned once.
- One canonical distribution contributes once, even when viewed by individual, team, centre, temple, country or campaign. Detailed entries and aggregate reports must never duplicate the same activity.
- Whole-Year Marathon runs 1 January–31 December, based on the distribution date. It is the fallback only for entries outside a selected special campaign.
- Every campaign, including the annual fallback, has public start/end date filters with inclusive boundaries. Date filtering uses distribution dates, not submission timestamps. Global dashboards and CSV exports use the same date-range query.
- Light, spacious interface using the supplied orange and grey brand palette and logo.

## Implemented in the first local version

- Next.js/TypeScript foundation and responsive navigation across all ten public/portal sections.
- Newsletter homepage, public score summaries, temple directory/details, campaign pages with date filters, story/resource/event listings and details, current-month event calendar, and About page.
- Reporting-form preview at `/preview` using the exact catalog, per-book fractional scoring and incomplete-points handling.
- Supabase cookie-based sign-in integration, Google callback, server role checks, and PostgreSQL row-level security. Authentication does not grant access until a profile assignment exists.
- Portal code for detailed/total-only daily distributions; optional centre/individual/team attribution; automatic annual fallback; atomic versioned correction; idempotent retries; audit history in the database.
- Temple coordinator/admin forms for individual/team/centre records, special campaigns, and story/resource/event drafts/publication; admin temple creation.
- Public aggregate queries and CSV export without exposing private individual/team records.
- PostgreSQL migrations, deterministic catalog generation, automated catalog/date/database integration tests and browser checks.

These flows can use Supabase once a project is configured and migrations applied. Without configuration, the local app shows honest empty/setup states and provides the non-persisting form preview. No real temple data or invented distribution statistics are seeded.

## Remaining work for the complete launch

- Configure organization-owned Supabase/Vercel projects, domain, Google OAuth and email delivery. Provision the verified admin and coordinator accounts; exercise authenticated flows against the real Supabase project.
- Reporting: monthly reconciliation and monthly-only date-range semantics, operational imports, draft recovery, finalization/reopening UI, returns/exception rules, and admin scoring/role management screens.
- Reporting outputs: additional filters and category summaries, targets/trends, complete and incomplete ranking policy, PDF/XLSX/chart exports, pagination beyond the initial latest-100 history.
- Live score broadcasts and measured five-second propagation. Current rendered public pages update on navigation/reload; successful submissions revalidate server pages.
- Editorial: approved launch content, media upload/storage permissions, explicit global-homepage featuring, temple profile fields, calendar month navigation and visitor time-zone display.
- Recovery/password reset, onboarding/invitations and temple applications.
- Full authenticated browser acceptance, 500-viewer load testing, accessibility review, backup/restore drill and production deployment checks.

Date filters do not fabricate per-day values for monthly aggregates. This first reporting flow records daily entries; monthly-only submission is pending its agreed reconciliation semantics.

## Verification

Completed locally: 13 catalog/domain/PostgreSQL checks passed; all 3 browser scenarios passed (the navigation/date scenario was rerun after correcting a selector). TypeScript checks, ESLint and the optimized production build passed. Browser scenarios cover all ten sections, inclusive/reversed campaign date ranges, exact scoring and total-only states, and mobile navigation/layout. The latest build required execution outside the sandbox because its TypeScript child process returned empty captured output inside it; no type checking was disabled.

Local catalog/domain and embedded PostgreSQL tests cover exact scores, sets, malformed input, per-temple isolation, privilege escalation attempts, idempotent retries, correction conflicts, total-only-to-detailed replacement, private drafts and inclusive campaign date boundaries. Embedded PostgreSQL checks do not prove live Supabase/Auth/realtime behavior.

See `README.md` for setup and commands. No external account, database migration or deployment has been performed.
