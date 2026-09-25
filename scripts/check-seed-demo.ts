import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";

const db = new PGlite();
await db.exec(`
  create schema auth;
  create role anon;
  create role authenticated;
  create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth, public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);
for (const file of readdirSync("supabase/migrations").sort()) {
  await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
}
const admin = randomUUID();
const coordA = randomUUID();
const coordB = randomUUID();
const ta = "a750f757-1c10-4cfc-a630-7205a634a9af";
const tb = "22943315-c3b6-4b0d-b5d5-1600814fbeb2";
const tc = "82c45c45-575d-4428-acd6-fdb295da114f";
await db.query("insert into auth.users values ($1), ($2), ($3)", [
  admin,
  coordA,
  coordB,
]);
await db.query(
  "insert into temples(id, name, country, city) values ($1, 'Temple A', 'India', 'Mumbai'), ($2, 'Temple B', 'Nepal', 'Kathmandu'), ($3, 'Radha Krishna Temple', 'India', 'Bangalore')",
  [ta, tb, tc],
);
await db.query(
  "insert into profiles(id, role, temple_id, display_name) values ($1, 'admin', null, 'Admin'), ($2, 'temple_coordinator', $4, 'Coord A'), ($3, 'temple_coordinator', $5, 'Coord B')",
  [admin, coordA, coordB, ta, tb],
);
await db.exec(readFileSync("supabase/seed-demo.sql", "utf8"));
const temples = await db.query(
  "select name, city, country from temples order by name",
);
const content = await db.query(
  "select kind, story_type, count(*)::int as n from content group by 1, 2 order by 1, 2",
);
const dist = await db.query(
  "select count(*)::int as n, coalesce(sum(book_count),0)::int as books from distributions",
);
const camps = await db.query(
  "select name, (temple_id is not null) as regional from campaigns order by starts_on",
);
const teams = await db.query("select count(*)::int as n from teams");
console.log({
  temples: temples.rows,
  content: content.rows,
  dist: dist.rows[0],
  camps: camps.rows,
  teams: teams.rows[0],
});
