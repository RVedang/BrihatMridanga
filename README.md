# Brihat Mridanga

Next.js + TypeScript application for the book distribution portal. First implementation status and the remaining launch work are in [docs/implementation-status.md](docs/implementation-status.md).

## Local preview

Use Node.js 24 or a compatible supported version.

```sh
npm ci
npm run dev
```

Visit `http://localhost:3000`. `/preview` provides the working catalog and score calculator without saving reports. Public pages have empty states until a backend contains actual records; demo records are not inserted.

## Connect a Supabase project

1. Create an organization-owned Supabase project in the agreed region. Use separate staging and production projects.
2. Copy `.env.example` to `.env.local`. Set the project URL, publishable key and site URL. No service-role key belongs in client code or these environment variables.
3. Apply the SQL files in `supabase/migrations` in filename order to a **new** project. The catalog migration preserves all supplied IDs and values. Regenerating it after it has been deployed is not an upgrade strategy: future catalog changes require a new audited migration.
4. Configure email/password and Google sign-in, allowed site URLs, the `/auth/callback` redirect, and production SMTP. Disable unrestricted email signup. OAuth identities without an assigned profile cannot use the portal.
5. Create/invite the user's verified admin identity through Supabase Auth. In the trusted SQL editor, insert its exact Auth user UUID into `public.profiles` with role `admin`, `temple_id = null`, and the user's chosen display name. Do not derive admin access from email text or client-provided metadata.
6. As admin, add temples. Create/invite coordinator Auth accounts and assign each exact UUID a `temple_coordinator` profile and the corresponding temple UUID using the trusted SQL editor. In-portal invitations and role administration remain on the launch checklist.
7. Restart the app and verify two separate coordinator accounts plus admin in staging before production.

The application uses authenticated Supabase sessions, explicit role checks and RLS. Raw distributions, individual/team records and audits are not public. Public results are aggregate RPC responses. Administrative database credentials are never used by the application.

## Reporting conventions

- Score = catalog item quantity × the book's listed score. Category is a grouping, not a fixed rate.
- One set quantity is one set. Book totals add every volume in the set. Set scores are not multiplied by the number of volumes.
- Total-only reports publish book counts with `points = null`; public results label incomplete scoring.
- Corrections use the existing report ID, expected version and a reason. The transaction replaces the original contribution. Request IDs prevent a network retry from inserting a second contribution.
- Each entry belongs to one campaign. Omitted special campaigns use the Whole-Year Marathon for the distribution's calendar year.
- Start/end filters include both selected dates and use the temple's recorded distribution date. Annual fallback results exclude special-campaign entries, while all-campaign results include them once.
- Retries are protected; two independently created forms claiming the same event are not automatically identifiable as duplicates. Users must correct existing entries instead of resubmitting the same activity. Aggregate reconciliation/import tooling remains to be built.

## Checks

```sh
npm run catalog
npm test
npm run typecheck
npm run lint
npm run build
```

The generator reads `docs/books-data.txt` and produces `src/data/books.json` plus the initial catalog SQL. It does not edit the source or connect to a database. PostgreSQL tests use PGlite with mock Auth identities and execute the actual migrations/RLS/functions locally.

For browser checks, start the production server and run Playwright in another terminal:

```sh
npm run start -- --port 3120
npx playwright install chromium
npx playwright test
```

Optional `TEST_BASE_URL` and `CHROMIUM_PATH` override the local test URL and browser executable. These browser tests cover unconfigured public pages and the reporting preview; real authenticated Supabase browser acceptance is a separate required check.

Implementation follows the [Next.js App Router documentation](https://nextjs.org/docs/app/getting-started/installation), [Supabase server-side authentication guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs) and [Supabase row-level security guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).
