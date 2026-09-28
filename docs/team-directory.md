# Temple team directory

Temple pages display eight teams per page with search across team, centre, lead and member names, plus a centre filter. Desktop uses aligned rows; mobile stacks each row's details. Native disclosure controls expose all listed members and support keyboard navigation. Search ignores accents, punctuation and case.

Within each temple and centre, duplicate team names are combined into one directory entry, ignoring accents, case, spacing and punctuation (so "Akinchana Vittaya - 3" and "Akinchana vittaya 3" are one team). The merged entry takes the name of the record with the most members. Within a team, a person is listed once when their names match after ignoring honorifics such as Prabhu, Pr, Ji, Mataji and Bh; the fuller spelling is shown. Names typed entirely in lower or upper case are shown in title case; mixed-case names and short acronyms are left as entered. Numbered teams (such as Baldeva and Baldeva 1) and teams in different centres remain separate. Counts, search and pagination use the combined entries.

Teams with zero listed members after placeholder cleanup are hidden on all temple pages. Directory totals, centre options, search and pagination use only the remaining teams. If none remain, a compact empty state appears. Stored team records are preserved.

## Why the team name appeared as the lead

`supabase/migrations/202609250001_firebase_history.sql.sql` explicitly initializes `coordinator_name` with the historical team name because the Firebase export had no separate coordinator field. `src/lib/data.ts` then adds a synthetic `coordinator-${team.id}` member when no matching member exists. The former team component displayed this synthetic person as the lead and counted them as a member.

`src/lib/team-directory.ts` excludes that synthetic member from the public directory when the coordinator name matches the team name (case and whitespace insensitive). Real membership records are retained, including an actual roster lead sharing the team name. A separately supplied coordinator is retained.

Only a recorded lead is shown: a member marked as coordinator, or a coordinator name that differs from the team name. Otherwise the lead reads "Not listed" and no member gets the lead badge. The earlier rule of showing the first alphabetical member as lead was removed because it named the wrong person. Dāsānudāsa therefore appears once with Abhay and Kunal and no lead until one is assigned.

This is a directory display change. Stored team IDs, memberships, coordinator fields and historical report attribution are not modified. The available public Supabase key cannot save coordinator assignments or merge stored records. The mapping CSV remains an unfilled worksheet for confirmed assignments; temporary display choices are not verified coordinator identities.

Checks: `npx tsx --test tests/team-directory.test.ts` and `npx playwright test tests/browser/temple-teams.spec.ts`. The browser checks use the imported Mumbai roster and require a configured local server via `TEST_BASE_URL` and an installed Playwright browser (or `CHROMIUM_PATH`).
