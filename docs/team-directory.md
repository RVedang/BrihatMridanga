# Temple team directory

Temple pages display eight teams per page with search across team, centre, lead and member names, plus a centre filter. Desktop uses aligned rows; mobile stacks each row's details. Native disclosure controls expose all listed members and support keyboard navigation. Search ignores accents, punctuation and case.

Within each temple and centre, duplicate team names are combined into one directory entry, ignoring accents, case and extra whitespace. All members from those records are included, with shared member IDs listed once. Different member IDs are preserved even when their names match. Numbered teams (such as Baldeva and Baldeva 1) and teams in different centres remain separate. Counts, search and pagination use the combined entries.

Teams with zero listed members after placeholder cleanup are hidden on all temple pages. Directory totals, centre options, search and pagination use only the remaining teams. If none remain, a compact empty state appears. Stored team records are preserved.

## Why the team name appeared as the lead

`supabase/migrations/202609250001_firebase_history.sql.sql` explicitly initializes `coordinator_name` with the historical team name because the Firebase export had no separate coordinator field. `src/lib/data.ts` then adds a synthetic `coordinator-${team.id}` member when no matching member exists. The former team component displayed this synthetic person as the lead and counted them as a member.

`src/lib/team-directory.ts` excludes that synthetic member from the public directory when the coordinator name matches the team name (case and whitespace insensitive). Real membership records are retained, including an actual roster lead sharing the team name. A separately supplied coordinator is retained.

Per the temporary coordinator rule, when no coordinator is supplied, the first member in the combined alphabetical list is shown as team lead. Exactly one member receives the lead badge. Dāsānudāsa therefore appears once with Abhay as lead and Kunal as its other member. A coordinator subsequently assigned through the portal takes precedence over this fallback.

This is a directory display change. Stored team IDs, memberships, coordinator fields and historical report attribution are not modified. The available public Supabase key cannot save coordinator assignments or merge stored records. The mapping CSV remains an unfilled worksheet for confirmed assignments; temporary display choices are not verified coordinator identities.

Checks: `npx tsx --test tests/team-directory.test.ts` and `npx playwright test tests/browser/temple-teams.spec.ts`. The browser checks use the imported Mumbai roster and require a configured local server via `TEST_BASE_URL` and an installed Playwright browser (or `CHROMIUM_PATH`).
