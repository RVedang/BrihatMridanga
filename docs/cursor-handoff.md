# Cursor handoff — Brihat Mridanga Portal

Prepared: 19 September 2026

This document is the handoff brief for completing the current Brihat Mridanga Portal application. Read it before changing code. The user has approved implementation and expects Cursor to continue from the existing codebase, preserving the confirmed product decisions below.

## 1. Product and launch context

Brihat Mridanga is a public website for ISKCON book distribution. The homepage is a light, sattvik newsletter. The site contains ten required areas:

1. Home/newsletter
2. Global Dashboard
3. Temples directory and profiles
4. Campaigns
5. Reports
6. Sankirtan Stories
7. Resources
8. Events and Calendar
9. About Brihat Mridanga
10. Secure Temple Portal

The target launch date is **21 September 2026**. Treat this as a target, not evidence that all launch gates have passed. Do not claim production readiness until the real backend, accounts, content and acceptance testing are complete.

The user is the administrator. Temple coordinators manage their own temples. Individuals and team coordinators do not log in at launch. They may receive login features in a later phase.

## 2. Confirmed business rules — do not change without the user

### Access

- Authenticated roles at launch are `admin` and `temple_coordinator`.
- An admin can view and change operational data for every temple.
- A temple coordinator can view and change only their assigned temple, including its centres, individual records, team records, reports, campaigns and permitted content.
- Individual records and team-coordinator names are operational records, not accounts.
- A centre does not have its own login role.
- A request body containing another temple ID must never grant access.

### Organization

- Hierarchy: **Country → Temple → optional Centre**.
- Region and zone are removed as organizational levels. A campaign can still be described as regional by listing participating temples/countries.
- A temple with multiple centres shows all centres combined by default.
- Centre and team are separate dimensions. A team does not automatically belong under a centre.

### Distribution counting

- Enter each distribution event once.
- The canonical entry may contain temple, distribution date, optional centre, optional individual, optional team, exactly one campaign, and book quantity lines.
- Individual, team, centre, temple, country, campaign and global views derive from the same entry.
- A contribution displayed in several views is still counted once.
- Adding detail to an aggregate or total-only report must replace/reconcile the original contribution, never append it.
- Network retries use an idempotency/request ID.

### Books and scores

- Source catalog: `docs/books-data.txt`.
- The catalog has 176 unique Book IDs across 12 languages.
- Each row has Book ID, multiword title, language, INR price and `{score, category}` metadata.
- Categories are Small, Medium, Big and `m-big` (display as Maha Big).
- **Use the score on the selected Book ID. Do not assign a universal score to a category.**
- Preserve every supplied score/category difference exactly. Do not normalize or “correct” the catalog.
- One catalog quantity of a set is one set. Book totals add every volume in that set (an 18-volume Srimad Bhagavatam set is 1 set and 18 books). The listed set score applies once; never multiply points by volume count.
- Single titles count as one book and not as a set.
- Score calculation uses exact decimal arithmetic. Price is metadata and does not affect points.
- Detailed reports calculate points from selected book quantities.
- Total-only reports contribute to book count with `points = null` and a visible incomplete-points status. They must not receive zero points.

### Campaigns and dates

- Every accepted entry belongs to exactly one campaign.
- A selected special campaign must be eligible for the temple and distribution date.
- If no eligible special campaign is selected, assign the entry to the **Whole-Year Marathon** for its calendar year.
- Whole-Year Marathon runs from 1 January through 31 December.
- Ordinary year-round work remains in Whole-Year Marathon even when a special campaign is active.
- Temporary campaigns include December Book Marathon, Gita Jayanti and special regional campaigns.
- All campaign results, including Whole-Year Marathon, have inclusive start-date and end-date filters.
- Filtering uses the distribution date, not submission time.
- Date range validation must reject invalid dates and end dates before start dates.
- Annual all-campaign totals and Whole-Year-only totals must be labelled separately.

### Publishing and presentation

- Valid coordinator reports publish immediately; there is no admin approval queue at launch.
- The submitter sees save confirmation immediately. Other connected viewers should see published aggregate changes within about five seconds after realtime work is implemented.
- Homepage is newsletter/editorial style, separate from detailed Dashboard analytics.
- Visual direction: light, spacious, sattvik; orange `#EB5B19`, grey `#494A55`, off-white surfaces, grey primary buttons with white text.
- Use the supplied assets in `docs/logo.png`, `docs/logo.jpeg`, `docs/grey logo.png` and `docs/grey logo.jpeg`.
- Do not invent testimonials, distribution figures or quotations.

## 3. Current repository structure

### Application

- `src/app/page.tsx` — newsletter homepage.
- `src/app/[section]/page.tsx` — shared public pages for dashboard, temples, campaigns, reports, stories, resources, events and About.
- `src/app/[section]/[id]/page.tsx` — temple, campaign and editorial detail pages.
- `src/app/preview/page.tsx` — non-persisting reporting-form preview.
- `src/app/portal/page.tsx` — authenticated portal shell and tabs.
- `src/app/login/page.tsx` — email/password and Google sign-in.
- `src/app/auth/callback/route.ts` — OAuth code exchange.
- `src/app/api/reports/route.ts` — CSV aggregate export with validated date range.
- `src/app/globals.css` — responsive visual system.

### Components and libraries

- `src/components/report-form.tsx` — detailed and total-only distribution form, scoring preview, correction/retry behavior.
- `src/components/record-forms.tsx` — temple, centre, individual, team, campaign and content forms.
- `src/components/date-filter.tsx` — inclusive date range form.
- `src/components/ui.tsx` — page intro, stats, score table, empty state and number formatting.
- `src/components/navigation.tsx` — responsive navigation.
- `src/lib/catalog.ts` — catalog parser and deterministic score calculator.
- `src/lib/dates.ts` — date validation/range helpers.
- `src/lib/data.ts` — public Supabase reads and aggregate score RPC calls.
- `src/lib/supabase.ts` — server Supabase client.
- `src/lib/auth.ts` — role/profile guard for the portal.
- `src/proxy.ts` — Supabase session refresh middleware for auth paths.

### Database and catalog

Apply migrations in order to a new Supabase project:

1. `supabase/migrations/202609180001_foundation.sql` — tables, RLS, role helpers, distribution save function, audit log and public score function.
2. `supabase/migrations/202609180002_catalog.sql` — generated 176-book catalog.
3. `supabase/migrations/202609180003_date_filters.sql` — inclusive public score range RPC.
4. `supabase/migrations/202609180004_content.sql` — stories, resources and events content table/policies.

`scripts/build-catalog.ts` reads `docs/books-data.txt` and regenerates `src/data/books.json` plus the catalog migration. The source file must remain unchanged. Future catalog changes require a new audited migration rather than silently rewriting an applied migration.

### Tests and tooling

- `tests/catalog.test.ts` — catalog integrity, exact scoring, sets, invalid quantities and date ranges.
- `tests/database.test.ts` — PGlite integration coverage for RLS, cross-temple isolation, admin correction, idempotency, total-only replacement, campaign boundaries and private content.
- `tests/browser/portal.spec.ts` — public routes, campaign filters, calculator, mobile navigation and layout.
- `playwright.config.ts` — browser configuration.
- `README.md` — local setup and Supabase setup.
- `docs/implementation-status.md` — status and known gaps.
- `docs/questions-and-answers-decision-record.md` — consolidated product decisions.
- `docs/implementation-and-launch-plan.md` — original implementation/launch plan.

## 4. How to run locally

```sh
npm ci
npm run catalog
npm run dev
```

Copy `.env.example` to `.env.local` only when connecting Supabase:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Without environment variables, public pages show honest empty states and `/preview` remains usable without saving. Do not seed fake production data.

Run checks:

```sh
npm run catalog
npm test
npm run typecheck
npm run lint
npm run build
npm run start -- --port 3120
npx playwright test
```

The browser tests may need an installed Chromium. The previous local verification passed 13 catalog/database/domain tests, all three browser scenarios, TypeScript, ESLint and the production build. These local checks do not prove live Supabase, OAuth, storage, realtime, hosting or recovery behavior.

## 5. Immediate next step: create and verify staging

Do this before further production work:

1. Create organization-owned Supabase and Vercel projects. Use Supabase Mumbai (`ap-south-1`) and Vercel Mumbai (`bom1`) unless the organization approves another region.
2. Apply the four migrations to a new staging Supabase project in filename order.
3. Configure `.env.local` with the staging URL and publishable key.
4. Configure email/password, Google OAuth, allowed URLs and `/auth/callback`. Disable unrestricted signup if the chosen Supabase configuration supports it; all authenticated users still require an explicit profile.
5. Create the user's verified Auth identity and insert its exact UUID into `public.profiles` as `admin`.
6. Add at least two staging temples, one coordinator per temple, and coordinator profiles.
7. Test three sessions: admin, coordinator A and coordinator B.
8. Verify coordinator A cannot read or change B's temple, centres, individuals, teams, reports, exports or files.
9. Submit a detailed report, submit a total-only report, correct the total-only report with details, and verify totals are not duplicated.
10. Test Whole-Year and special campaigns at both date boundaries and through date-filtered dashboard/CSV views.

Do not place a Supabase service-role key in `.env.local` used by the Next.js application or expose it to the browser.

## 6. Required remaining implementation before launch

### Backend and security

- Verify every migration on real Supabase, including security-definer functions and RLS under actual Auth JWTs.
- Add safe database migration/version tracking and rollback notes.
- Add admin-only screens for assigning roles, coordinators and temples rather than relying permanently on SQL editor setup.
- Add password reset, email verification/recovery and safe coordinator invitation/onboarding.
- Add storage buckets and RLS for story photos, videos, resource files and temple media. Draft/private attachments must not be publicly downloadable.
- Add rate limits, request size limits, CSRF/session checks appropriate to deployment, structured server logs and alerts.
- Confirm audit records cannot be edited by coordinators and that admin corrections always retain before/after data and reason.

### Reporting

- Complete monthly reconciliation. Define how daily entries, monthly summaries, corrections and reopened periods interact.
- Implement operational imports with preview, validation, duplicate protection, authorization and an audit trail.
- Implement draft recovery for interrupted mobile/limited-connectivity entry.
- Implement report finalization, period locks and the admin reopen/correction UI.
- Add explicit rules and UI for returns, gifts, sales, transfers, damaged/lost books and cross-temple distribution once the user supplies the rules.
- Add category/book filters, country/temple/centre/team filters, targets, trends and clearly labelled complete/incomplete score behavior.
- Add pagination/search for history; the current portal history is limited to the latest 100 rows.
- Implement PDF, XLSX and chart exports in addition to the current CSV. Every export must use the same filters and authorization rules as the screen.
- Decide and implement whether team breakdowns are public or portal-only; the current product decision does not authorize public team rankings.

### Campaigns and dashboards

- Add a clear campaign detail screen that includes campaign-specific date filters, progress, participating temples and separate campaign/all-campaign totals.
- Add campaign validation feedback for dates, temple eligibility, overlaps and ended campaigns.
- Add annual fallback setup and edge-case tests for timezone/year boundaries.
- Implement global score refresh/realtime broadcasts. Broadcast compact public summary/version messages and re-fetch scoped aggregates; never broadcast raw private entries.
- Measure the five-second target with connected clients, reconnects and 500-viewer load.

### Editorial and public site

- Add approved launch stories, resources, events, temple profiles, contacts, targets and About content.
- Add media upload, replace, withdrawal/archive and file access workflows.
- Add homepage feature selection for the admin and temple campaign highlights.
- Add calendar month navigation, timezone-aware display and event cancellation/update behavior.
- Add temple profile photos, testimonials and reports only after approved content exists.
- Review all source quotations against `docs/Our main business.pdf`; do not paraphrase a quote while presenting it as exact.
- Review accessibility: keyboard navigation, focus states, contrast, labels, chart table alternatives, touch targets and screen-reader announcements.

### Hosting, operations and launch

- Connect the Vercel project, environment variables, custom domain, DNS and HTTPS.
- Use separate staging and production environments and separate Supabase projects.
- Configure transactional email and Google OAuth production redirect URLs.
- Configure backups/PITR and complete a restore drill. The planning target is at most 15 minutes accepted-data loss and at most 4 hours to restore; prove this with a drill.
- Add uptime/error monitoring and a rollback procedure.
- Test representative Indian and overseas network conditions and mobile devices.
- Test 500 concurrent public viewers plus coordinator/admin writes. Record dataset size, cache state, request rate, geography, p95 response times and error rate.
- Verify robots/sitemap/metadata, secure headers, no secret leakage and no draft/private data in HTML, CSV or logs.

## 7. Acceptance scenarios Cursor must demonstrate

Before declaring complete, record evidence for these scenarios:

1. Visitor opens Home and sees newsletter content, score section, campaign highlights and clear empty states when no content exists.
2. Visitor filters Whole-Year Marathon by an inclusive start/end range and sees the correct books and points.
3. Visitor filters a special campaign by an inclusive range and sees only that campaign's entries.
4. A coordinator signs in and sees only their temple.
5. Coordinator A cannot read, write, export or subscribe to Coordinator B's data.
6. Admin can manage both temples, individuals, teams, centres, campaigns, reports and content.
7. Detailed report score equals the sum of each supplied Book ID score × quantity.
8. A complete set adds every volume to the book total, records one set, and uses its listed set score once.
9. Total-only report publishes book count with incomplete points.
10. Adding details to that total-only report replaces it without increasing the book total twice.
11. Retrying a request returns the original result and does not insert another report.
12. A stale correction is rejected; a valid correction records actor, reason, before and after values.
13. Special campaign assignment is rejected when the date or temple is ineligible; no silent reassignment occurs.
14. No-special-campaign entries use the correct calendar-year Whole-Year Marathon.
15. Daily/monthly reconciliation and reopening follow the final user-approved rules.
16. Public content is visible only after publication; draft media and text remain private.
17. PDF, CSV, XLSX and chart exports agree with the filtered screen.
18. Mobile, keyboard and screen-reader review passes.
19. Load, security, backup/restore and rollback evidence is recorded.
20. Production deployment is smoke-tested with the real domain and real admin/coordinator accounts.

## 8. Important implementation cautions

- Do not replace per-book scores with category defaults.
- Do not multiply set scores by physical volume counts. Do count those volumes in the book total, and record the number of sets separately.
- Do not count individual + team + centre + temple as separate contributions.
- Do not let a client-supplied temple ID override server authorization.
- Do not expose raw reports, individual names, team records or audit details through public APIs.
- Do not publish fabricated sample data in production.
- Do not treat the local PGlite tests as proof of live Supabase behavior.
- Do not deploy before staging authenticated acceptance and backup/recovery checks pass.
- Do not rewrite applied migrations casually; create audited forward migrations.

## 9. Definition of complete

The website is complete only when the ten sections work with real content, the staging acceptance scenarios pass with real Auth/RLS/storage/realtime behavior, production hosting and domain are configured, coordinator/admin boundaries are proven, reports and exports agree, recovery is tested, and the launch checklist has evidence for every item. A successful local build alone is not launch readiness.

Start with staging provisioning and the three-account isolation test. Keep this file updated as each remaining item is completed.
