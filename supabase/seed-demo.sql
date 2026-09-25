-- Demo catalog for a manager walkthrough.
-- Keeps auth.users and public.profiles (emails, passwords, roles).
-- Replaces temples, centres, teams, people, campaigns (except Whole-Year),
-- reports, targets, and public content.
-- Run once in the Supabase SQL editor as the database owner.

create or replace function public.demo_seed_uuid(label text) returns uuid
language sql
immutable
as $$
  select (
    substr(md5(label), 1, 8) || '-' ||
    substr(md5(label), 9, 4) || '-4' ||
    substr(md5(label), 14, 3) || '-8' ||
    substr(md5(label), 18, 3) || '-' ||
    substr(md5(label), 21, 12)
  )::uuid;
$$;

begin;

alter table public.content disable trigger audit_content;
alter table public.individuals disable trigger audit_individual;
alter table public.teams disable trigger audit_team;
alter table public.centres disable trigger audit_centre;
alter table public.campaigns disable trigger audit_special;

delete from public.report_requests;
delete from public.audit_log;
delete from public.distributions;
delete from public.period_locks;
delete from public.team_members;
delete from public.monthly_targets;
delete from public.targets;
delete from public.content;
delete from public.teams;
delete from public.individuals;
delete from public.centres;
delete from public.campaigns where fallback_year is null;

do $seed$
declare
  actor uuid;
  t_chowpatty uuid := 'a750f757-1c10-4cfc-a630-7205a634a9af';
  t_kathmandu uuid := '22943315-c3b6-4b0d-b5d5-1600814fbeb2';
  t_bengaluru uuid := '82c45c45-575d-4428-acd6-fdb295da114f';
  t_mayapur uuid := '4a0e0000-0000-4000-8000-000000000004';
  t_juhu uuid := '4a0e0000-0000-4000-8000-000000000005';
  t_delhi uuid := '4a0e0000-0000-4000-8000-000000000006';
  t_london uuid := '4a0e0000-0000-4000-8000-000000000007';
  t_newyork uuid := '4a0e0000-0000-4000-8000-000000000008';
  t_durban uuid := '4a0e0000-0000-4000-8000-000000000009';
  t_kolkata uuid := '4a0e0000-0000-4000-8000-00000000000a';
  c_year uuid;
  c_janmashtami uuid := 'c0a10000-0000-4000-8000-000000000001';
  c_diwali uuid := 'c0a10000-0000-4000-8000-000000000002';
  c_gita uuid := 'c0a10000-0000-4000-8000-000000000003';
  c_december uuid := 'c0a10000-0000-4000-8000-000000000004';
  c_bengaluru_fair uuid := 'c0a10000-0000-4000-8000-000000000005';
  c_kathmandu_hill uuid := 'c0a10000-0000-4000-8000-000000000006';
  temple uuid;
  centre uuid;
  person uuid;
  team uuid;
  campaign uuid;
  day date;
  n int;
  qty1 int;
  qty2 int;
  qty3 int;
  books int;
  sets int;
  pts numeric;
  names text[] := array[
    'Gauranga das','Bhakti lata dasi','Nityananda das','Radhika dasi',
    'Madhava das','Tulasi dasi','Govinda das','Malati dasi',
    'Acyuta das','Vrinda dasi','Sacinandana das','Lalita dasi'
  ];
  centres text[] := array['Temple courtyard','College preaching','Market book table'];
  teams text[] := array['Morning sankirtan','College team','Weekend book table'];
  temples uuid[];
begin
  select id into actor from public.profiles where role = 'admin' limit 1;
  if actor is null then
    select id into actor from public.profiles where role = 'temple_coordinator' limit 1;
  end if;
  if actor is null then
    raise exception 'Keep at least one admin or coordinator account before seeding.';
  end if;

  insert into public.temples (id, name, country, city, timezone, information, contact) values
    (t_chowpatty, 'ISKCON Chowpatty', 'India', 'Mumbai', 'Asia/Kolkata',
     'Sri Sri Radha Gopinath Temple. Book distribution goes out from the courtyard each morning and returns to the same stalls after the evening programme.',
     'Book distribution desk, Hare Krishna Land, Chowpatty'),
    (t_kathmandu, 'ISKCON Kathmandu', 'Nepal', 'Kathmandu', 'Asia/Kathmandu',
     'Budhanilkantha congregation. Distributors walk the ring road, the university gates, and the Saturday market with Gitas and small books.',
     'Sankirtan office, Kathmandu'),
    (t_bengaluru, 'ISKCON Bengaluru', 'India', 'Bengaluru', 'Asia/Kolkata',
     'Sri Sri Radha Krishna Chandra Temple. College preaching and tech-park book tables run through the week, with a large weekend stall at the temple gate.',
     'Book distribution, Rajajinagar'),
    (t_mayapur, 'ISKCON Mayapur', 'India', 'Mayapur', 'Asia/Kolkata',
     'The campus book table meets pilgrims throughout the day. Festival weeks send extra parties to Navadvipa and the surrounding towns.',
     'Book distribution, Sri Mayapur'),
    (t_juhu, 'ISKCON Juhu', 'India', 'Mumbai', 'Asia/Kolkata',
     'Hare Krishna Land on Juhu Beach. Morning parties offer books on the sand; evenings cover the market behind the temple.',
     'Sankirtan desk, Juhu'),
    (t_delhi, 'ISKCON Delhi', 'India', 'New Delhi', 'Asia/Kolkata',
     'East of Kailash. Metro stations, university campuses, and the Sunday feast all carry a book table.',
     'Book distribution, East of Kailash'),
    (t_london, 'Bhaktivedanta Manor', 'United Kingdom', 'Watford', 'Europe/London',
     'Weekend parties cover Central London, campus tables, and the Manor drive during festivals.',
     'Sankirtan office, Watford'),
    (t_newyork, 'ISKCON New York', 'United States', 'New York', 'America/New_York',
     'Street sankirtan in Manhattan and Brooklyn, with a standing table near the temple on evenings and weekends.',
     'Book table, New York'),
    (t_durban, 'ISKCON Durban', 'South Africa', 'Durban', 'Africa/Johannesburg',
     'Beachfront and campus distribution through the week, with a large festival presence in the cooler months.',
     'Book distribution, Durban'),
    (t_kolkata, 'ISKCON Kolkata', 'India', 'Kolkata', 'Asia/Kolkata',
     'Albert Road temple. Tram-side tables, college yards, and Howrah station see regular parties.',
     'Sankirtan, Albert Road')
  on conflict (id) do update set
    name = excluded.name, country = excluded.country, city = excluded.city,
    timezone = excluded.timezone, information = excluded.information, contact = excluded.contact;

  -- Keep coordinator-linked temples; drop leftover test temples.
  delete from public.temples t
  where t.id not in (t_chowpatty, t_kathmandu, t_bengaluru, t_mayapur, t_juhu, t_delhi, t_london, t_newyork, t_durban, t_kolkata)
    and not exists (select 1 from public.profiles p where p.temple_id = t.id);

  temples := array[t_chowpatty, t_kathmandu, t_bengaluru, t_mayapur, t_juhu, t_delhi, t_london, t_newyork, t_durban, t_kolkata];

  select id into c_year from public.campaigns where fallback_year = 2026;
  if c_year is null then
    insert into public.campaigns (name, starts_on, ends_on, fallback_year, description, target_books)
    values ('Whole-Year Marathon 2026', '2026-01-01', '2026-12-31', 2026,
      'Year-round distribution outside a special campaign.', 250000)
    returning id into c_year;
  else
    update public.campaigns
      set target_books = 250000,
          description = 'Year-round distribution outside a special campaign.'
      where id = c_year;
  end if;

  insert into public.campaigns (id, temple_id, name, description, starts_on, ends_on, instructions, target_books) values
    (c_janmashtami, null, 'Janmashtami 2026',
     'A worldwide offering of books through the days around Sri Krishna Janmashtami.',
     '2026-08-10', '2026-08-16',
     'Choose Janmashtami 2026 when the distribution date falls in this week.', 80000),
    (c_diwali, null, 'Diwali Marathon 2026',
     'A movement-wide marathon through the Diwali season. Temples keep extra tables at markets, homes, and evening programmes.',
     '2026-10-17', '2026-11-08',
     'Choose Diwali Marathon 2026 for distributions between 17 October and 8 November.', 150000),
    (c_gita, null, 'Gita Jayanti 2026',
     'Bhagavad-gita distribution for Gita Jayanti, overlapping the early days of the December marathon.',
     '2026-11-28', '2026-12-06',
     'Choose Gita Jayanti 2026 when the date falls in this window and the temple is offering Gitas for the occasion.', 100000),
    (c_december, null, 'Prabhupada Marathon 2026',
     'The December book marathon. Every temple reports through the month.',
     '2026-12-01', '2026-12-31',
     'Choose Prabhupada Marathon 2026 for December distributions that belong to the marathon.', 300000),
    (c_bengaluru_fair, t_bengaluru, 'Bengaluru Book Fair',
     'A regional campaign for the Bengaluru congregation during the city book fair.',
     '2026-09-25', '2026-10-12',
     'Only ISKCON Bengaluru files reports against this campaign. The distribution date must fall in the fair dates.', 12000),
    (c_kathmandu_hill, t_kathmandu, 'Kathmandu Hill Sankirtan',
     'A regional fortnight of extra street work around the Kathmandu valley.',
     '2026-10-01', '2026-10-20',
     'Only ISKCON Kathmandu files reports against this campaign.', 4000);

  insert into public.targets (year, temple_id, books) values
    (2026, null, 500000),
    (2026, t_chowpatty, 42000),
    (2026, t_kathmandu, 9000),
    (2026, t_bengaluru, 28000),
    (2026, t_mayapur, 55000),
    (2026, t_juhu, 36000),
    (2026, t_delhi, 24000),
    (2026, t_london, 18000),
    (2026, t_newyork, 15000),
    (2026, t_durban, 12000),
    (2026, t_kolkata, 20000);

  foreach temple in array temples loop
    for n in 1..3 loop
      insert into public.centres (id, temple_id, name) values
        (public.demo_seed_uuid(temple::text || ':c:' || n),
         temple, centres[n]);
    end loop;
    for n in 1..12 loop
      insert into public.individuals (id, temple_id, name) values
        (public.demo_seed_uuid(temple::text || ':i:' || n),
         temple, names[n]);
    end loop;
    for n in 1..3 loop
      insert into public.teams (id, temple_id, name, coordinator_name, centre_id) values
        (public.demo_seed_uuid(temple::text || ':tm:' || n),
         temple, teams[n], names[n],
         public.demo_seed_uuid(temple::text || ':c:' || n));
      insert into public.team_members (team_id, individual_id)
      select
        public.demo_seed_uuid(temple::text || ':tm:' || n),
        public.demo_seed_uuid(temple::text || ':i:' || m)
      from generate_series(n, n + 3) m;
    end loop;
    for n in 1..9 loop
      insert into public.monthly_targets (year, month, temple_id, books)
      values (2026, n, temple, 600 + (n * 80) + (ascii(substr(temple::text, 1, 1)) % 40));
    end loop;
  end loop;

  -- Distributions: several days a month, Jan–Sep 2026, mixed campaigns.
  foreach temple in array temples loop
    for n in 0..26 loop
      day := date '2026-01-08' + (n * 10);
      if day > date '2026-09-22' then
        continue;
      end if;
      centre := public.demo_seed_uuid(temple::text || ':c:' || (1 + (n % 3)));
      person := public.demo_seed_uuid(temple::text || ':i:' || (1 + (n % 12)));
      team := public.demo_seed_uuid(temple::text || ':tm:' || (1 + (n % 3)));
      campaign := c_year;
      if day between '2026-08-10' and '2026-08-16' then
        campaign := c_janmashtami;
      elsif temple = t_bengaluru and day between '2026-09-12' and '2026-09-22' then
        campaign := c_year;
      end if;
      qty1 := 8 + (n % 11);
      qty2 := 14 + (n % 17);
      qty3 := case when n % 7 = 0 then 1 else 0 end;
      books := qty1 + qty2 + (qty3 * 18);
      sets := qty3;
      pts := (qty1 * 2) + (qty2 * 0.25) + (qty3 * 36);
      insert into public.distributions (
        id, temple_id, centre_id, individual_id, team_id, campaign_id,
        distributed_on, mode, lines, book_count, set_count, points, version,
        created_by, updated_by
      ) values (
        public.demo_seed_uuid(temple::text || ':d:' || n),
        temple, centre, person, team, campaign, day, 'detailed',
        jsonb_build_array(
          jsonb_build_object('bookId','268','quantity',qty1,'score',2,'category','m-big','volumes',1),
          jsonb_build_object('bookId','195','quantity',qty2,'score',0.25,'category','small','volumes',1)
        ) || case when qty3 > 0 then jsonb_build_array(
          jsonb_build_object('bookId','290','quantity',qty3,'score',36,'category','m-big','volumes',18)
        ) else '[]'::jsonb end,
        books, sets, pts, 1, actor, actor
      );
    end loop;
  end loop;
end
$seed$;

-- Content is inserted with fixed ids so the seed can be re-run safely.
alter table public.content disable trigger audit_content;

insert into public.content (
  id, temple_id, kind, story_type, title, body, language, published,
  link_url, image_url, location, starts_at, ends_at, created_at
) values
-- Distributor testimonials
('d1000000-0000-4000-8000-000000000001', 'a750f757-1c10-4cfc-a630-7205a634a9af', 'community_story', 'distributor',
 'Gauranga das, Chowpatty',
 'I used to count only the big books. Then a student took a small copy, read it on the train, and brought three friends the next evening. Now I treat every volume as a conversation that might continue.',
 'English', true, '', '', 'Girgaon Chowpatty', null, null, '2026-08-12T10:00:00Z'),
('d1000000-0000-4000-8000-000000000002', '82c45c45-575d-4428-acd6-fdb295da114f', 'community_story', 'distributor',
 'Radhika dasi, Bengaluru',
 'College yards in this city move quickly. If I listen first, the Gita finds its own way into the bag. The report at night feels honest because the day was honest.',
 'English', true, '', '', 'Rajajinagar', null, null, '2026-07-21T10:00:00Z'),
('d1000000-0000-4000-8000-000000000003', '4a0e0000-0000-4000-8000-000000000007', 'community_story', 'distributor',
 'Madhava das, Watford',
 'London rain taught me to keep a dry cloth for the books and a warm greeting for the person. One commuter said he had been waiting for someone to offer this without an argument. We stood under the same awning until the next train.',
 'English', true, '', '', 'Oxford Street', null, null, '2026-06-18T10:00:00Z'),
('d1000000-0000-4000-8000-000000000004', '22943315-c3b6-4b0d-b5d5-1600814fbeb2', 'community_story', 'distributor',
 'Tulasi dasi, Kathmandu',
 'On the ring road a taxi driver waved us over. He had received a Gita years ago and wanted a Bhagavatam for his father in Pokhara. We packed the first canto as if it were going home.',
 'English', true, '', '', 'Kathmandu Ring Road', null, null, '2026-05-09T10:00:00Z'),

-- Recipient experiences
('d1000000-0000-4000-8000-000000000011', 'a750f757-1c10-4cfc-a630-7205a634a9af', 'community_story', 'recipient',
 'Anita Desai',
 'I took a Bhagavad-gita at Chowpatty after the evening arati. I read a verse before work now. The devotee who offered it did not hurry me; that is why I stayed.',
 'English', true, '', '', 'Mumbai', null, null, '2026-08-20T10:00:00Z'),
('d1000000-0000-4000-8000-000000000012', '4a0e0000-0000-4000-8000-000000000006', 'community_story', 'recipient',
 'Imran Qureshi',
 'At the metro a young man showed me the second chapter. I bought the book for the ride home. My children asked what I was reading, and we finished the chapter together.',
 'English', true, '', '', 'New Delhi', null, null, '2026-07-02T10:00:00Z'),
('d1000000-0000-4000-8000-000000000013', '4a0e0000-0000-4000-8000-000000000008', 'community_story', 'recipient',
 'Sarah Klein',
 'I stopped for kirtan near the temple and left with Krishna book. I did not expect to finish it in a week. I came back on Sunday with questions, not with an argument.',
 'English', true, '', '', 'New York', null, null, '2026-06-14T10:00:00Z'),
('d1000000-0000-4000-8000-000000000014', '4a0e0000-0000-4000-8000-00000000000a', 'community_story', 'recipient',
 'শুভম মুখার্জি',
 'হাওড়া স্টেশনে একটি ছোট বই হাতে এল। রাতে ঘুম হলো না। পরের রবিবার মন্দিরে গিয়ে পুরো গীতা নিয়ে এলাম।',
 'Bengali', true, '', '', 'Kolkata', null, null, '2026-04-28T10:00:00Z'),

-- Temple success
('d1000000-0000-4000-8000-000000000021', '4a0e0000-0000-4000-8000-000000000004', 'community_story', 'success',
 'Eighteen cantos under one umbrella',
 'A Mayapur monsoon Saturday almost ended early. A family of pilgrims asked for Srimad-Bhagavatam, wrapped each volume in cloth meant for prasadam, and began Canto One in the guest house that night.',
 'English', true, '', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1400&q=80', 'Mayapur', null, null, '2026-08-03T10:00:00Z'),
('d1000000-0000-4000-8000-000000000022', '4a0e0000-0000-4000-8000-000000000005', 'community_story', 'success',
 'Juhu beach at first light',
 'The Juhu party set a simple aim: finish the cart before the heat. By nine o’clock the last Gita had gone to a walker who said he had seen the temple for twenty years and never taken a book.',
 'English', true, '', '', 'Juhu Beach', null, null, '2026-03-11T10:00:00Z'),
('d1000000-0000-4000-8000-000000000023', '4a0e0000-0000-4000-8000-000000000009', 'community_story', 'success',
 'Campus week in Durban',
 'Five days at the university gate, a reading circle on Friday, and a full set placed with a lecturer who asked to begin with the first canto in class.',
 'English', true, '', '', 'Durban', null, null, '2026-05-22T10:00:00Z'),

-- Interviews
('d1000000-0000-4000-8000-000000000031', '82c45c45-575d-4428-acd6-fdb295da114f', 'community_story', 'interview',
 'The student who came back with friends',
 'At a Bengaluru courtyard a young woman accepted a small book more from courtesy than curiosity. Two days later she returned with classmates. They now keep a Thursday reading notebook.',
 'English', true, '', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80', 'Bengaluru', null, null, '2026-02-17T10:00:00Z'),
('d1000000-0000-4000-8000-000000000032', '4a0e0000-0000-4000-8000-000000000007', 'community_story', 'interview',
 'A conductor on the Northern line',
 'He had seen the party for months. One evening he asked for the Gita in a size that fit his jacket. We spoke between stations. He visits the Manor when his roster allows.',
 'English', true, '', '', 'London', null, null, '2026-01-29T10:00:00Z'),
('d1000000-0000-4000-8000-000000000033', 'a750f757-1c10-4cfc-a630-7205a634a9af', 'community_story', 'interview',
 'Last local to Virar',
 'A tired office worker walked on, then turned back: his father used to read this. He opened the book before the train left the platform and visited the temple weeks later with the same copy marked on every chapter.',
 'English', true, '', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1400&q=80', 'Mumbai', null, null, '2026-09-01T10:00:00Z'),

-- Media
('d1000000-0000-4000-8000-000000000041', 'a750f757-1c10-4cfc-a630-7205a634a9af', 'community_story', 'media',
 'Books ready at Chowpatty',
 'Morning stacking before the party leaves the courtyard.',
 'English', true, '', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1400&q=80', 'Mumbai', null, null, '2026-09-04T10:00:00Z'),
('d1000000-0000-4000-8000-000000000042', '4a0e0000-0000-4000-8000-000000000004', 'community_story', 'media',
 'Mayapur book table',
 'Pilgrims stopping between programmes.',
 'English', true, '', 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&w=1400&q=80', 'Mayapur', null, null, '2026-09-02T10:00:00Z'),
('d1000000-0000-4000-8000-000000000043', '82c45c45-575d-4428-acd6-fdb295da114f', 'community_story', 'media',
 'College yard, Bengaluru',
 'A Saturday table between two lecture halls.',
 'English', true, '', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1400&q=80', 'Bengaluru', null, null, '2026-08-29T10:00:00Z'),
('d1000000-0000-4000-8000-000000000044', '4a0e0000-0000-4000-8000-000000000007', 'community_story', 'media',
 'Manor drive on Sunday',
 'Families leaving the feast with sets packed for the week.',
 'English', true, '', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1400&q=80', 'Watford', null, null, '2026-08-16T10:00:00Z'),
('d1000000-0000-4000-8000-000000000045', '4a0e0000-0000-4000-8000-000000000008', 'community_story', 'media',
 'Evening kirtan table',
 'Manhattan, books at the edge of the circle.',
 'English', true, '', 'https://images.unsplash.com/photo-1463320898484-cdee8141c787?auto=format&fit=crop&w=1400&q=80', 'New York', null, null, '2026-07-30T10:00:00Z'),
('d1000000-0000-4000-8000-000000000046', '4a0e0000-0000-4000-8000-000000000006', 'community_story', 'media',
 'Metro-gate stacking',
 'East of Kailash distributors before the evening rush.',
 'English', true, '', 'https://images.unsplash.com/photo-1457694587812-e8bf29a43845?auto=format&fit=crop&w=1400&q=80', 'New Delhi', null, null, '2026-07-11T10:00:00Z'),

-- Miracles
('d1000000-0000-4000-8000-000000000051', '4a0e0000-0000-4000-8000-00000000000a', 'community_story', 'miracle',
 'এক চায়ের দোকানে গীতা',
 'দোকানদার প্রথমে মানা করলেন, তারপর বললেন এক পাতা দেখাও। পরের সকালে তিনি মন্দিরে এলেন এবং বললেন রাতভর ঘুম হয়নি।',
 'Bengali', true, '', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80', 'Kolkata', null, null, '2026-06-07T10:00:00Z'),
('d1000000-0000-4000-8000-000000000052', '4a0e0000-0000-4000-8000-000000000005', 'community_story', 'miracle',
 'The walker who already knew the verse',
 'On Juhu beach a man recited the same verse the devotee had opened. He said his grandmother had sung it. He took the full Gita and asked when he could hear kirtan.',
 'English', true, '', '', 'Mumbai', null, null, '2026-04-02T10:00:00Z'),
('d1000000-0000-4000-8000-000000000053', '22943315-c3b6-4b0d-b5d5-1600814fbeb2', 'community_story', 'miracle',
 'A set for Pokhara',
 'The taxi that stopped on the ring road returned three weeks later. The father had begun Canto One. They wanted the rest of the set packed for the hills.',
 'English', true, '', '', 'Kathmandu', null, null, '2026-03-19T10:00:00Z'),

-- Resources
('d1000000-0000-4000-8000-000000000061', null, 'resource', '',
 'Street conversation guide',
 'A short outline for approaching someone with a book: greet, show a verse, listen, and close with respect. Use it for a five-minute briefing before going out.',
 'English', true, 'https://vedabase.io/en/library/bg/', '', '', null, null, '2026-01-12T10:00:00Z'),
('d1000000-0000-4000-8000-000000000062', null, 'resource', '',
 'How to present a Bhagavatam set',
 'Walk through the set as a complete home library. Invite someone to begin with Canto One and keep the volumes together.',
 'English', true, 'https://vedabase.io/en/library/sb/', '', '', null, null, '2026-01-12T10:00:00Z'),
('d1000000-0000-4000-8000-000000000063', 'a750f757-1c10-4cfc-a630-7205a634a9af', 'resource', '',
 'Morning briefing for a sankirtan team',
 'Fifteen minutes before going out: one verse, one intention, pairings, routes, and when the team will meet again. Enter the day’s books the same evening.',
 'English', true, '', '', '', null, null, '2026-02-01T10:00:00Z'),
('d1000000-0000-4000-8000-000000000064', null, 'resource', '',
 'Reading Krishna book with new friends',
 'Suggested chapters for a first week, questions that open discussion, and a gentle invitation from a street meeting into a small reading circle.',
 'English', true, 'https://vedabase.io/en/library/kb/', '', '', null, null, '2026-02-01T10:00:00Z'),
('d1000000-0000-4000-8000-000000000065', null, 'resource', '',
 'Reporting the same evening',
 'Confirm the temple, the date, the campaign, and the book lines. If details arrive later, correct the same report so books, sets and points stay aligned.',
 'English', true, '', '', '', null, null, '2026-03-01T10:00:00Z'),
('d1000000-0000-4000-8000-000000000066', '82c45c45-575d-4428-acd6-fdb295da114f', 'resource', '',
 'College-yard kit list',
 'Table, cloth, a modest stack, receipt book, water, and two people who can stay until the last class breaks.',
 'English', true, '', '', '', null, null, '2026-03-15T10:00:00Z'),

-- Events
('d1000000-0000-4000-8000-000000000071', 'a750f757-1c10-4cfc-a630-7205a634a9af', 'event', '',
 'Sankirtan training morning',
 'Practice approaches, a short kirtan, and a walk to the nearby stalls. For new distributors and anyone returning after a break.',
 'English', true, '', '', 'ISKCON Chowpatty', '2026-10-04T04:30:00Z', '2026-10-04T07:30:00Z', '2026-09-10T10:00:00Z'),
('d1000000-0000-4000-8000-000000000072', '82c45c45-575d-4428-acd6-fdb295da114f', 'event', '',
 'Bengaluru Book Fair briefing',
 'Shift planning for the regional book-fair campaign, packing lists, and how reports will be entered each night.',
 'English', true, '', '', 'Rajajinagar', '2026-09-24T11:00:00Z', '2026-09-24T13:00:00Z', '2026-09-12T10:00:00Z'),
('d1000000-0000-4000-8000-000000000073', '4a0e0000-0000-4000-8000-000000000004', 'event', '',
 'Mayapur festival book table',
 'Extra seating and a full-set presentation for pilgrims through the week.',
 'English', true, '', '', 'Sri Mayapur', '2026-11-02T03:30:00Z', '2026-11-08T12:00:00Z', '2026-09-15T10:00:00Z'),
('d1000000-0000-4000-8000-000000000074', '4a0e0000-0000-4000-8000-000000000007', 'event', '',
 'December marathon launch',
 'Manor programme to open the Prabhupada Marathon: kirtan, a short class, and team pairings for December.',
 'English', true, '', '', 'Bhaktivedanta Manor', '2026-11-29T10:00:00Z', '2026-11-29T13:00:00Z', '2026-09-18T10:00:00Z'),
('d1000000-0000-4000-8000-000000000075', '4a0e0000-0000-4000-8000-000000000006', 'event', '',
 'Gita Jayanti reading',
 'Open reading of the Gita at East of Kailash, with a book table through the afternoon.',
 'English', true, '', '', 'East of Kailash', '2026-12-01T04:00:00Z', '2026-12-01T10:00:00Z', '2026-09-18T10:00:00Z'),

-- Local initiatives
('d1000000-0000-4000-8000-000000000081', 'a750f757-1c10-4cfc-a630-7205a634a9af', 'initiative', '',
 'College reading circles',
 'Weekly Krishna book reading with students who first met the party on the street.',
 'English', true, '', '', 'Mumbai', null, null, '2026-04-01T10:00:00Z'),
('d1000000-0000-4000-8000-000000000082', '82c45c45-575d-4428-acd6-fdb295da114f', 'initiative', '',
 'Tech-park book tables',
 'Standing tables outside two software parks on Tuesdays and Thursdays.',
 'English', true, '', '', 'Bengaluru', null, null, '2026-04-01T10:00:00Z'),
('d1000000-0000-4000-8000-000000000083', '4a0e0000-0000-4000-8000-000000000007', 'initiative', '',
 'Campus chaplaincy visits',
 'Monthly visits to student societies with a small stack and a standing invitation to the Manor.',
 'English', true, '', '', 'London', null, null, '2026-05-01T10:00:00Z'),
('d1000000-0000-4000-8000-000000000084', '22943315-c3b6-4b0d-b5d5-1600814fbeb2', 'initiative', '',
 'Saturday market stall',
 'A cloth stall at the weekly market, staffed by the congregation.',
 'English', true, '', '', 'Kathmandu', null, null, '2026-05-01T10:00:00Z'),
('d1000000-0000-4000-8000-000000000085', '4a0e0000-0000-4000-8000-000000000008', 'initiative', '',
 'Subway-stop evenings',
 'Two-hour evening tables near a busy subway entrance, twice a week.',
 'English', true, '', '', 'New York', null, null, '2026-06-01T10:00:00Z'),
('d1000000-0000-4000-8000-000000000086', '4a0e0000-0000-4000-8000-000000000004', 'initiative', '',
 'Pilgrim set presentations',
 'A quiet room off the main hall where full sets can be shown without the courtyard noise.',
 'English', true, '', '', 'Mayapur', null, null, '2026-06-01T10:00:00Z')
on conflict (id) do nothing;

alter table public.content enable trigger audit_content;
alter table public.individuals enable trigger audit_individual;
alter table public.teams enable trigger audit_team;
alter table public.centres enable trigger audit_centre;
alter table public.campaigns enable trigger audit_special;

drop function public.demo_seed_uuid(text);

commit;
