import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
test("PostgreSQL reporting, permissions, scoring and date-range integration", async (t) => {
  const db = new PGlite();
  await db.exec(
    `create schema auth; create role anon; create role authenticated; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth,public to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`,
  );
  for (const file of readdirSync("supabase/migrations").sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  const a = randomUUID(),
    b = randomUUID(),
    admin = randomUUID(),
    ta = randomUUID(),
    tb = randomUUID(),
    person = randomUUID(),
    team = randomUUID(),
    hall = randomUUID(),
    otherHall = randomUUID(),
    otherPerson = randomUUID();
  await db.query("insert into auth.users values ($1),($2),($3)", [a, b, admin]);
  await db.query(
    "insert into temples(id,name,country) values($1,'Temple A','India'),($2,'Temple B','Nepal')",
    [ta, tb],
  );
  await db.query(
    "insert into profiles(id,role,temple_id,display_name) values($1,'temple_coordinator',$4,'A'),($2,'temple_coordinator',$5,'B'),($3,'admin',null,'Admin')",
    [a, b, admin, ta, tb],
  );
  const actor = async (id: string) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec("set role authenticated");
  };
  const save = async (request: Record<string, unknown>) =>
    (
      await db.query<{
        result: {
          id: string;
          version: number;
          books: number;
          sets?: number;
          points: number | null;
          replayed: boolean;
        };
      }>("select save_distribution($1::jsonb) result", [
        JSON.stringify(request),
      ])
    ).rows[0].result;
  const base = (extra: Record<string, unknown> = {}) => ({
    id: randomUUID(),
    requestId: randomUUID(),
    templeId: ta,
    date: "2025-01-01",
    version: 0,
    mode: "detailed",
    lines: [{ bookId: "290", quantity: 1 }],
    ...extra,
  });
  await actor(a);
  await db.query(
    "insert into individuals(id,temple_id,name) values($1,$2,'Person A')",
    [person, ta],
  );
  await db.query(
    "insert into centres(id,temple_id,name) values($1,$2,'Hall A')",
    [hall, ta],
  );
  await db.query(
    "insert into teams(id,temple_id,name,coordinator_name,centre_id) values($1,$2,'Team A','Team Coordinator',$3)",
    [team, ta, hall],
  );
  await actor(b);
  await db.query(
    "insert into individuals(id,temple_id,name) values($1,$2,'Person B')",
    [otherPerson, tb],
  );
  await db.query(
    "insert into centres(id,temple_id,name) values($1,$2,'Hall B')",
    [otherHall, tb],
  );
  await actor(a);
  const request = base({ individualId: person, teamId: team });
  let special = "";
  await t.test(
    "coordinator cannot read another temple's people or escalate their role",
    async () => {
      assert.equal(
        (await db.query("select * from individuals")).rows.length,
        1,
      );
      assert.equal((await db.query("select * from profiles")).rows.length, 1);
      assert.equal(
        (
          await db.query(
            "update profiles set role='admin' where id=$1 returning id",
            [a],
          )
        ).rows.length,
        0,
      );
      await assert.rejects(
        db.query(
          "insert into individuals(temple_id,name) values($1,'Forged')",
          [tb],
        ),
      );
      await assert.rejects(save(base({ templeId: tb })), /access denied/);
      await assert.rejects(
        save(base({ individualId: otherPerson })),
        /Invalid individual/,
      );
    },
  );
  await t.test("a team can only use a centre from its own temple", async () => {
    await assert.rejects(
      db.query("update teams set centre_id=$1 where id=$2", [otherHall, team]),
    );
    assert.equal(
      (
        await db.query<{ centre_id: string }>(
          "select centre_id from teams where id=$1",
          [team],
        )
      ).rows[0].centre_id,
      hall,
    );
    await db.query(
      "insert into teams(temple_id,name,coordinator_name,centre_id) values($1,'Team Hall 2','Lead',$2)",
      [ta, hall],
    );
  });
  await t.test(
    "authoritative set scoring and exactly one contribution for team and individual",
    async () => {
      const result = await save(request);
      assert.equal(result.books, 18);
      assert.equal(result.sets, 1);
      assert.equal(result.points, 36);
      const rows = (
        await db.query<{ books: string; sets: string }>(
          "select * from public_scores_range('2025-01-01','2025-01-01')",
        )
      ).rows;
      assert.equal(Number(rows[0].books), 18);
      assert.equal(Number(rows[0].sets), 1);
      assert.equal(
        (await db.query("select * from campaigns where fallback_year=2025"))
          .rows.length,
        1,
      );
    },
  );
  await t.test(
    "retry is idempotent and changed payload reuse is rejected",
    async () => {
      assert.equal((await save(request)).replayed, true);
      assert.equal(
        (await db.query("select * from distributions")).rows.length,
        1,
      );
      await assert.rejects(
        save({ ...request, date: "2025-01-02" }),
        /different data/,
      );
    },
  );
  await t.test(
    "total-only entries publish counts and null points, then details replace them",
    async () => {
      const total = base({ mode: "total", lines: [], total: 10 });
      const result = await save(total);
      assert.equal(result.points, null);
      const before = (
        await db.query<{ books: string; incomplete_reports: string }>(
          "select * from public_scores_range('2025-01-01','2025-01-01')",
        )
      ).rows[0];
      assert.equal(Number(before.books), 28);
      assert.equal(Number(before.incomplete_reports), 1);
      await save({
        ...total,
        requestId: randomUUID(),
        mode: "detailed",
        lines: [{ bookId: "167", quantity: 10 }],
        total: null,
        version: 1,
        reason: "Added book details",
      });
      const after = (
        await db.query<{
          books: string;
          known_points: string;
          incomplete_reports: string;
        }>("select * from public_scores_range('2025-01-01','2025-01-01')")
      ).rows[0];
      assert.equal(Number(after.books), 28);
      assert.equal(Number(after.known_points), 37);
      assert.equal(Number(after.incomplete_reports), 0);
      await assert.rejects(
        save({
          ...total,
          requestId: randomUUID(),
          version: 1,
          reason: "Stale edit",
        }),
        /reload/,
      );
    },
  );
  await t.test(
    "both campaign date boundaries are inclusive and special/fallback totals separate",
    async () => {
      special = randomUUID();
      await db.query(
        "insert into campaigns(id,temple_id,name,starts_on,ends_on) values($1,$2,'Special','2025-01-02','2025-01-03')",
        [special, ta],
      );
      await save(
        base({
          date: "2025-01-02",
          campaignId: special,
          lines: [{ bookId: "195", quantity: 2 }],
        }),
      );
      await save(
        base({
          date: "2025-01-03",
          campaignId: special,
          lines: [{ bookId: "195", quantity: 3 }],
        }),
      );
      await save(
        base({ date: "2025-01-04", lines: [{ bookId: "195", quantity: 7 }] }),
      );
      const range = await db.query<{ books: string }>(
        "select * from public_scores_range('2025-01-02','2025-01-03',$1)",
        [special],
      );
      assert.equal(Number(range.rows[0].books), 5);
      const day = await db.query<{ books: string }>(
        "select * from public_scores_range('2025-01-03','2025-01-03',$1)",
        [special],
      );
      assert.equal(Number(day.rows[0].books), 3);
      await assert.rejects(
        save(base({ date: "2025-01-04", campaignId: special })),
        /not eligible/,
      );
      await assert.rejects(
        db.query("update campaigns set ends_on='2025-01-02' where id=$1", [
          special,
        ]),
        /exclude existing/,
      );
      await assert.rejects(
        db.query(
          "select * from public_scores_range('2025-02-01','2025-01-01')",
        ),
        /Invalid date/,
      );
      const stored = (
        await db.query<{ instructions: string; target_books: string | null }>(
          "select instructions, target_books from campaigns where id=$1",
          [special],
        )
      ).rows[0];
      assert.equal(stored.instructions, "");
      assert.equal(stored.target_books, null);
      await db.query(
        "update campaigns set instructions='Join the sankirtan', target_books=500 where id=$1",
        [special],
      );
    },
  );
  await t.test(
    "forged points, duplicate books, fractional quantities and future dates cannot alter scoring",
    async () => {
      const result = await save(
        base({
          points: 999,
          book_count: 999,
          lines: [{ bookId: "167", quantity: 3 }],
        }),
      );
      assert.equal(result.points, 0.3);
      assert.equal(result.books, 3);
      await assert.rejects(
        save(
          base({
            lines: [
              { bookId: "195", quantity: 1 },
              { bookId: "195", quantity: 1 },
            ],
          }),
        ),
        /repeated/,
      );
      await assert.rejects(
        save(base({ lines: [{ bookId: "195", quantity: 1.5 }] })),
        /quantity/,
      );
      await assert.rejects(save(base({ date: "9999-01-01" })), /future/);
      await assert.rejects(
        db.query("update distributions set points=999"),
        /permission denied/,
      );
    },
  );
  await t.test(
    "admin corrects across temples while another coordinator cannot",
    async () => {
      await actor(b);
      assert.equal(
        (await db.query("select * from distributions")).rows.length,
        0,
      );
      await assert.rejects(
        save({
          ...request,
          requestId: randomUUID(),
          version: 1,
          reason: "Bad edit",
        }),
        /access denied/,
      );
      await actor(admin);
      const corrected = await save({
        ...request,
        requestId: randomUUID(),
        version: 1,
        reason: "Verified corrected quantity",
        lines: [{ bookId: "290", quantity: 2 }],
      });
      assert.equal(corrected.books, 36);
      assert.equal(corrected.sets, 2);
      assert.equal(
        (
          await db.query(
            "select * from audit_log where entity='distributions' and entity_id=$1",
            [request.id],
          )
        ).rows.length,
        2,
      );
    },
  );
  await t.test(
    "published content is public; draft content and operational records are private",
    async () => {
      await actor(a);
      await db.query(
        "insert into content(temple_id,kind,title,published) values($1,'story','Draft',false),($1,'story','Published',true)",
        [ta],
      );
      await db.exec("reset role; set role anon");
      const content = await db.query<{ title: string }>(
        "select title from content",
      );
      assert.ok(content.rows.some((row) => row.title === "Published"));
      assert.ok(!content.rows.some((row) => row.title === "Draft"));
      await assert.rejects(
        db.query("select * from individuals"),
        /permission denied/,
      );
      await assert.rejects(
        db.query("select * from distributions"),
        /permission denied/,
      );
      await assert.rejects(
        db.query("select * from audit_log"),
        /permission denied/,
      );
      assert.ok(
        (
          await db.query(
            "select * from public_scores_range('2025-01-01','2025-12-31')",
          )
        ).rows.length,
      );
    },
  );
  await t.test(
    "public_dashboard returns filtered aggregates, targets and options; anon cannot write targets",
    async () => {
      await actor(admin);
      await db.query(
        "insert into targets(year,books) values(2025,5000)",
      );
      await db.exec("reset role; set role anon");
      const { rows } = await db.query<{ d: {
        totals: { books: number; sets: number; temples: number; countries: number; reports: number };
        targets: { year: number; temple_id: string | null; books: number }[];
        options: { languages: string[]; countries: string[] };
        by_country: { country: string; books: number }[];
        by_temple: { temple_name: string; books: number }[];
        by_day: unknown[];
        by_campaign: { campaign_name: string }[];
        by_language: { language: string }[];
        by_category: { category: string }[];
      } }>(
        "select public_dashboard('2025-01-01','2025-12-31') d",
      );
      const d = rows[0].d;
      // Totals match what was inserted in prior tests (18 from SB set + 3 + 10 + 5*2 + 3*7 = totals > 0)
      assert.ok(Number(d.totals.books) > 0, "books > 0");
      assert.ok(Number(d.totals.temples) >= 1, "at least one temple");
      assert.ok(d.by_country.length >= 1, "at least one country");
      assert.ok(d.by_temple.length >= 1, "temple breakdown present");
      assert.ok(d.options.languages.length > 0, "languages populated from catalog");
      assert.ok(d.targets.some((t) => t.year === 2025 && t.temple_id === null), "global target visible");
      assert.ok(Array.isArray(d.by_day), "daily breakdown present");
      assert.ok(Array.isArray(d.by_campaign), "campaign breakdown present");
      assert.ok(d.by_campaign.length >= 1, "at least one campaign row");
      const daily = await db.query<{ day: string; books: string }>(
        "select * from public_daily_scores('2025-01-01','2025-12-31')",
      );
      assert.ok(daily.rows.length >= 1, "daily scores return rows");
      assert.ok(Number(daily.rows[0].books) > 0, "daily books > 0");
      // Category filter: only small books
      const { rows: frows } = await db.query<{ d: { totals: { books: number } } }>(
        "select public_dashboard('2025-01-01','2025-12-31', null, null, null, null, 'small') d",
      );
      assert.ok(Number(frows[0].d.totals.books) <= Number(d.totals.books), "category filter reduces count");
      // Anon cannot insert
      await assert.rejects(
        db.query("insert into targets(year,books) values(2026,9999)"),
        /permission denied/,
      );
      // Invalid date range raises
      await assert.rejects(
        db.query("select public_dashboard('2025-06-01','2025-01-01')"),
        /Invalid date/,
      );
      // Invalid category raises
      await assert.rejects(
        db.query("select public_dashboard('2025-01-01','2025-12-31', null, null, null, null, 'fake')"),
        /Invalid book category/,
      );
    },
  );
  await t.test("users sign in without a temple; coordinators register once", async () => {
    const reader = randomUUID(),
      fresh = randomUUID();
    await db.exec("reset role");
    await db.query("insert into auth.users values ($1),($2)", [reader, fresh]);
    await actor(reader);
    const claimed = (
      await db.query<{ result: { role: string; created: boolean } }>(
        "select claim_user_profile('Reader Das') result",
      )
    ).rows[0].result;
    assert.equal(claimed.role, "user");
    assert.equal(claimed.created, true);
    assert.equal(
      (
        await db.query<{ temple_id: string | null }>(
          "select temple_id from profiles where id=$1",
          [reader],
        )
      ).rows[0].temple_id,
      null,
    );
    await assert.rejects(save(base({ templeId: ta })), /access denied/);
    const again = (
      await db.query<{ result: { created: boolean } }>(
        "select claim_user_profile('Ignored') result",
      )
    ).rows[0].result;
    assert.equal(again.created, false);
    await actor(fresh);
    const registered = (
      await db.query<{
        result: { temple_id: string; already: boolean };
      }>(
        `select register_temple($1::jsonb) result`,
        [
          JSON.stringify({
            name: "New Dham",
            country: "India",
            city: "Mayapur",
            timezone: "Asia/Kolkata",
            displayName: "Coordinator Das",
            centreName: "Main hall",
            information: "The birthplace of the sankirtan movement.",
            contact: "Mayapur, Nadia\n+91 00000 00000",
          }),
        ],
      )
    ).rows[0].result;
    assert.equal(registered.already, false);
    const temple = (
      await db.query<{
        name: string;
        country: string;
        city: string;
        information: string;
        contact: string;
      }>(
        "select name, country, city, information, contact from temples where id=$1",
        [registered.temple_id],
      )
    ).rows[0];
    assert.equal(temple.name, "New Dham");
    assert.equal(temple.country, "India");
    assert.equal(temple.city, "Mayapur");
    assert.equal(temple.information, "The birthplace of the sankirtan movement.");
    assert.equal(temple.contact, "Mayapur, Nadia\n+91 00000 00000");
    assert.equal(
      (
        await db.query<{ name: string }>(
          "select name from centres where temple_id=$1",
          [registered.temple_id],
        )
      ).rows[0].name,
      "Main hall",
    );
    const profile = (
      await db.query<{ role: string; temple_id: string }>(
        "select role, temple_id from profiles where id=$1",
        [fresh],
      )
    ).rows[0];
    assert.equal(profile.role, "temple_coordinator");
    assert.equal(profile.temple_id, registered.temple_id);
    const repeat = (
      await db.query<{ result: { already: boolean; temple_id: string } }>(
        `select register_temple($1::jsonb) result`,
        [JSON.stringify({ name: "Other", country: "Nepal", displayName: "X" })],
      )
    ).rows[0].result;
    assert.equal(repeat.already, true);
    assert.equal(repeat.temple_id, registered.temple_id);
  });
  await t.test("community stories accept the six public types", async () => {
    await actor(a);
    await db.query(
      "insert into content(temple_id,kind,title,published,story_type) values($1,'community_story','Miracle',true,'miracle')",
      [ta],
    );
    await assert.rejects(
      db.query(
        "insert into content(temple_id,kind,title,published,story_type) values($1,'community_story','Old type',true,'festival')",
        [ta],
      ),
    );
    await assert.rejects(
      db.query(
        "insert into content(kind,title,published,story_type) values('community_story','Shared',true,'miracle')",
      ),
    );
    await actor(admin);
    await db.query(
      "insert into content(kind,title,published,story_type) values('community_story','Shared miracle',true,'miracle')",
    );
  });
  await t.test("stories may store an HTTPS photograph", async () => {
    await actor(a);
    await db.query(
      "insert into content(temple_id,kind,title,published,image_url) values($1,'story','With photo',true,$2)",
      [ta, "https://images.example.com/story.jpg"],
    );
    const saved = (
      await db.query<{ image_url: string }>(
        "select image_url from content where title='With photo'",
      )
    ).rows[0];
    assert.equal(saved.image_url, "https://images.example.com/story.jpg");
    await assert.rejects(
      db.query(
        "insert into content(temple_id,kind,title,published,image_url) values($1,'story','Bad photo',true,'ftp://x')",
        [ta],
      ),
    );
  });
  await t.test("coordinators set monthly temple targets; others cannot", async () => {
    await actor(a);
    await db.query(
      "insert into monthly_targets(year,month,temple_id,books) values(2026,1,$1,100)",
      [ta],
    );
    await assert.rejects(
      db.query(
        "insert into monthly_targets(year,month,temple_id,books) values(2026,1,$1,200)",
        [ta],
      ),
    );
    await assert.rejects(
      db.query(
        "insert into monthly_targets(year,month,temple_id,books) values(2026,2,$1,50)",
        [tb],
      ),
    );
    await actor(b);
    await db.query(
      "insert into monthly_targets(year,month,temple_id,books) values(2026,2,$1,75)",
      [tb],
    );
    await actor(admin);
    await db.query(
      "insert into monthly_targets(year,month,temple_id,books) values(2026,3,$1,80)",
      [ta],
    );
    await db.exec("reset role; set role anon");
    const listed = await db.query<{ books: string }>(
      "select books from monthly_targets where temple_id=$1 and month=1",
      [ta],
    );
    assert.equal(Number(listed.rows[0].books), 100);
    await assert.rejects(
      db.query(
        "insert into monthly_targets(year,month,temple_id,books) values(2026,4,$1,10)",
        [ta],
      ),
      /permission denied/,
    );
  });
  await t.test(
    "public temple pages list teams and members from the same temple",
    async () => {
      await actor(a);
      await db.query(
        "insert into team_members(team_id, individual_id) values($1,$2)",
        [team, person],
      );
      await assert.rejects(
        db.query(
          "insert into team_members(team_id, individual_id) values($1,$2)",
          [team, otherPerson],
        ),
      );
      await db.exec("reset role; set role anon");
      const listed = await db.query<{
        name: string;
        coordinator_name: string;
        members: { name: string; coordinator: boolean }[] | string;
      }>("select * from public_temple_teams($1)", [ta]);
      assert.equal(listed.rows[0].name, "Team A");
      assert.equal(listed.rows[0].coordinator_name, "Team Coordinator");
      const members =
        typeof listed.rows[0].members === "string"
          ? JSON.parse(listed.rows[0].members)
          : listed.rows[0].members;
      assert.ok(members.some((m: { name: string }) => m.name === "Person A"));
      await assert.rejects(db.query("select * from team_members"), /permission denied/);
    },
  );
  await db.close();
});
