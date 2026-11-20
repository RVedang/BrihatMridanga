import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyQuantities,
  coordinatorDeadline,
  weeklyTotals,
  distributionPoints,
} from "../src/lib/weekly-distribution";
test("weekly cutover, replay, weekly reporting and database authorization", async () => {
  const db = new PGlite(),
    admin = "162092c8-9240-498c-9cd4-4644151ba118",
    coord = randomUUID(),
    user = randomUUID(),
    other = randomUUID();
  try {
    await db.exec(
      "create schema auth; create role anon; create role authenticated; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth,public to anon,authenticated;",
    );
    const files = readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort();
    const apply = async (f: string) => {
      await db.exec(readFileSync("supabase/migrations/" + f, "utf8"));
    };
    for (const f of files.filter((f) => f < "20261119")) {
      if (f.startsWith("202609250001")) {
        await db.query("insert into auth.users values ($1)", [admin]);
        await db.query(
          "insert into profiles(id,role,display_name) values($1,'admin','Admin')",
          [admin],
        );
      }
      await apply(f);
    }
    const {
      rows: [temple],
    } = await db.query<{ id: string }>(
      "select temple_id as id from distributions limit 1",
    );
    await db.query("insert into auth.users values ($1),($2)", [coord, user]);
    await db.query(
      "insert into profiles values ($1,'temple_coordinator',$2,'Coordinator'),($3,'user',null,'Reader')",
      [coord, temple.id, user],
    );
    await db.query(
      "insert into temples(id,name,country) values($1,'Other','India')",
      [other],
    );
    await db.query("update temples set approved=true where id=$1", [temple.id]);
    await db.exec(
      "insert into distributions(id,temple_id,campaign_id,distributed_on,mode,book_count,created_by,updated_by) select gen_random_uuid(),temple_id,campaign_id,distributed_on,'total',7,created_by,updated_by from distributions limit 1",
    );
    const expected = (
      await db.query<Record<string, number>>(
        "select count(distinct (temple_id,date_trunc('week',distributed_on)))::int weeks from distributions",
      )
    ).rows[0];
    const expectedSets = (
      await db.query<Record<string, number>>(
        "select sum((l->>'quantity')::int)::int sets from distributions d cross join lateral jsonb_array_elements(d.lines) l join books b on b.id=l->>'bookId' where b.volumes>1 and b.id not in ('298','legacy-lilamrita-mr')",
      )
    ).rows[0];
    // Production retained the older three-argument overload after the legacy migrations.
    await db.exec("drop function public.public_scores_range(date,date,uuid,uuid); create function public.public_scores_range(date,date,uuid) returns integer language sql as $$ select 1 $$; grant execute on function public.public_scores_range(date,date,uuid) to anon,authenticated;");
    const migrations = files.filter((f) => f.startsWith("20261119"));
    await apply(migrations[0]);
    await db.exec(
      "delete from weekly_title_mappings where book_id='legacy-lilamrita-mr'",
    );
    await assert.rejects(apply(migrations[1]), /Unclassified historical title/);
    await db.exec("rollback");
    for (const f of migrations) await apply(f);
    assert.equal(
      (await db.query<{ allowed: boolean }>("select has_function_privilege('anon','public.public_scores_range(date,date,uuid)','EXECUTE') as allowed")).rows[0].allowed,
      false,
    );
    const summary = async () =>
      (
        await db.query<Record<string, number>>(
          "select count(*)::int weeks,sum(books)::int books,sum(sets)::int sets,sum(pending)::int pending from weekly_reports",
        )
      ).rows[0];
    const before = await summary();
    assert.equal(before.weeks, expected.weeks);
    assert.equal(before.pending, 7);
    const differences = await db.query(
      "select w.id from weekly_reports w join lateral (select sum(s.quantity) filter(where s.category='small') small, sum(s.quantity) filter(where s.category='pending') pending from distributions d join weekly_source_quantities s on s.source_id=d.id where d.temple_id=w.temple_id and d.distributed_on between w.week_start and w.week_start+6) original on true where w.small<>coalesce(original.small,0) or w.pending<>coalesce(original.pending,0)",
    );
    assert.deepEqual(differences.rows, []);
    assert.equal(before.sets, expectedSets.sets);
    for (const f of migrations) await apply(f);
    assert.deepEqual(await summary(), before);
    const actor = async (id: string) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      await db.exec("set role authenticated");
    };
    const base = {
      temple: temple.id,
      week: "2001-01-01",
      pending: 0,
      quantities: emptyQuantities(),
    };
    const save = async (extra: Record<string, unknown> = {}) =>
      (
        await db.query<{ r: { id: string; conflict?: boolean } }>(
          "select save_weekly_report($1::jsonb) r",
          [JSON.stringify({ ...base, ...extra })],
        )
      ).rows[0].r;
    await actor(user);
    await assert.rejects(save(), /access denied/i);
    await actor(coord);
    await assert.rejects(save({ temple: other }), /access denied/i);
    await assert.rejects(
      save({ quantities: { ...base.quantities, small: -1 } }),
      /whole quantities/i,
    );
    const row = await save();
    assert.ok(row.id);
    const campaign = (
      await db.query<{ id: string }>(
        "select id from campaigns where temple_id is null limit 1",
      )
    ).rows[0];
    await assert.rejects(
      save({ id: row.id, version: 1, tags: { teams: [other] } }),
      /Participant unavailable/i,
    );
    assert.deepEqual(await save(), { id: row.id, conflict: true });
    await save({
      id: row.id,
      version: 1,
      tags: { campaigns: [campaign.id] },
      quantities: { ...base.quantities, small: 5, sbSets: 1 },
    });
    const totals = await db.query(
      "select books::int,sets::int from weekly_reports where id=$1",
      [row.id],
    );
    assert.deepEqual(
      totals.rows[0],
      weeklyTotals({ ...base.quantities, small: 5, sbSets: 1 }),
    );
    const scoped = (
      await db.query<{
        r: {
          totals: { books: number; sets: number; points: number };
          by_campaign: unknown[];
          by_day: unknown[];
        };
      }>("select public_weekly_dashboard('2001-01-07','2001-01-07',$1) r", [
        campaign.id,
      ])
    ).rows[0].r;
    assert.equal(scoped.totals.books, 5);
    assert.equal(scoped.totals.sets, 1);
    assert.equal(
      scoped.totals.points,
      distributionPoints({ ...base.quantities, small: 5, sbSets: 1 }),
    );
    assert.equal(scoped.by_campaign.length, 1);
    assert.equal(scoped.by_day.length, 0);
    await db.exec("reset role");
    await db.query(
      "update weekly_reports set submitted_on='2025-01-31' where id=$1",
      [row.id],
    );
    await actor(coord);
    await assert.rejects(save({ id: row.id, version: 2 }), /deadline/i);
    await actor(admin);
    await save({ id: row.id, version: 2 });
    await assert.rejects(
      db.query("select save_distribution('{}')"),
      /permission denied/i,
    );
    const dash = (
      await db.query<{ r: { weekly: unknown[] } }>(
        "select public_weekly_dashboard('2000-01-01','2099-01-01') r",
      )
    ).rows[0].r;
    assert.ok(dash.weekly.length);
    await db.exec("reset role");
    await db.exec("create publication supabase_realtime");
    await apply("202611200001_marathon.sql");
    const directory = await db.query<{
      temple_id: string;
      name: string;
      spoc: string;
      email: string;
      phone: string;
    }>("select temple_id,name,spoc,email,phone from marathon_temples");
    assert.equal(directory.rows.length, 39);
    const hyd = directory.rows.find((r) => r.name === "HKM Hyderabad")!;
    assert.deepEqual(
      [hyd.spoc, hyd.email, hyd.phone],
      ["Namamruta Dasa", "nmmd@hkmhyderabad.org", "919347239792"],
    );
    const m = directory.rows.find((r) => r.temple_id === temple.id)!;
    assert.ok(m);
    const shared = (
      await db.query<{ id: string }>(
        "insert into campaigns(name,starts_on,ends_on) values('Book Distribution Marathon 2026',current_date-30,current_date+30) returning id",
      )
    ).rows[0].id;
    const standings = async () =>
      (
        await db.query<{
          v: {
            rows: {
              name: string;
              rank: number;
              points: number;
              books: number;
              sets: number;
            }[];
          };
        }>("select marathon_standings() v")
      ).rows[0].v.rows;
    await actor(coord);
    await assert.rejects(
      db.query("select set_marathon_dates($1,current_date-1,current_date+1)", [
        hyd.temple_id,
      ]),
      /Temple access denied/,
    );
    await db.query(
      "select set_marathon_dates($1,current_date-1,current_date+1)",
      [temple.id],
    );
    assert.deepEqual(await standings(), []);
    await actor(admin);
    await db.query(
      "select set_marathon_dates($1,current_date-1,current_date+1)",
      [hyd.temple_id],
    );
    await db.exec("reset role");
    await db.query(
      "insert into weekly_reports(temple_id,week_start,submitted_on,small,\"sbSets\",tags) select $1,date_trunc('week',now() at time zone timezone)::date,current_date,5,1,jsonb_build_object('campaigns',jsonb_build_array($2::text)) from temples where id=$1",
      [m.temple_id, shared],
    );
    const rows = await standings();
    assert.deepEqual(rows, [
      { name: m.name, rank: 1, books: 5, sets: 1, points: 37.25 },
      { name: hyd.name, rank: 2, books: 0, sets: 0, points: 0 },
    ]);
    const revision = async () => (await db.query<{changed_at:string}>("select changed_at::text from marathon_change")).rows[0].changed_at;
    const beforeEdit=await revision();
    await db.query("update weekly_reports set small=6 where temple_id=$1 and tags->'campaigns' ? $2::text",[m.temple_id,shared]);
    assert.notEqual(await revision(),beforeEdit);
    assert.equal((await standings())[0].points,37.5);
    await db.query("insert into weekly_reports(temple_id,week_start,submitted_on,small,tags) select $1,date_trunc('week',now() at time zone timezone)::date,current_date,150,jsonb_build_object('campaigns',jsonb_build_array($2::text)) from temples where id=$1",[hyd.temple_id,shared]);
    assert.deepEqual((await standings()).map(row=>row.name),[m.name,hyd.name]);
    await db.query("delete from weekly_reports where temple_id=$1 and tags->'campaigns' ? $2::text",[m.temple_id,shared]);
    assert.equal((await standings())[0].name,hyd.name);
    await db.exec("update marathon_temples set starts_on=current_date-10,ends_on=current_date-5");
    assert.deepEqual(await standings(), []);
    assert.equal(coordinatorDeadline("2024-01-31"), "2024-02-29");
    assert.equal(coordinatorDeadline("2025-01-31"), "2025-02-28");
  } finally {
    await db.close();
  }
});
