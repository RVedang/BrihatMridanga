# Brihat Mridanga

Next.js + TypeScript application for the book distribution portal. First implementation status and the remaining launch work are in [docs/implementation-status.md](docs/implementation-status.md).

## Local preview

Use Node.js 24 or a compatible supported version.

```sh
npm ci
npm run dev
```

Visit `http://localhost:3000`. `/preview` provides the weekly category form and running book and set totals without saving reports. Public pages have empty states until a backend contains actual records; demo records are not inserted.

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

- Each temple submits one report per Monday–Sunday week. Sunday determines its month and year. New weekly-only quantities have no daily distribution date.
- Books include magazines, the four individual book sizes and any unclassified historical book count. SB, CC and Life Patron membership sets count separately.
- Coordinators may edit through the same date next month in their temple time zone, clamped to month end. Admins may edit after that date. Concurrent edits must use the latest version.
- The weekly migrations merge by temple and week and retain historical source attribution. Reapplying them preserves subsequent edits. When an unknown multi-volume edition is encountered, the conversion transaction stops. Record its confirmed category and units per copy in the restricted `weekly_title_mappings` table before rerunning.

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
