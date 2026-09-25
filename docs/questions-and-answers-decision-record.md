# Brihat Mridanga Portal — Questions and Final Answers

Prepared: 19 September 2026

This is the consolidated record of the questions asked during planning and the user's latest answer to each. Where an answer was later changed, only the corrected answer is treated as final. “Pending” means the user explicitly said the answer would be supplied later or has not yet been decided.

## Final decisions from the latest planning round

### Launch and scope

**Question:** Which launch scope should the architecture prioritize?

**Answer:** The full website is in launch scope: all ten sections, including Home/newsletter, dashboard, temples, campaigns, reports, stories, resources, events/calendar, About and the secure Temple Portal. The launch target is 21 September 2026.

**Question:** When may implementation begin?

**Answer:** The user explicitly approved planning and said: “Planning approved, start coding.”

### Hosting and expected usage

**Question:** Which hosting provider and deployment platform should be used?

**Answer:** Recommended architecture: Next.js with TypeScript on Vercel, with the Mumbai deployment region (`bom1`). This recommendation has not yet been provisioned.

**Question:** Which country or region should store data?

**Answer:** Recommended Supabase PostgreSQL region: Mumbai (`ap-south-1`). This is a recommendation, not a completed account or deployment decision.

**Question:** What is the hosting budget?

**Answer:** Budget is not a constraint. The organization will select and own the paid accounts.

**Question:** What usage should the system support?

**Answer:** Approximately 70 temples and 500 concurrent viewers. The earlier figure of 7,000 is not a requirement for 7,000 authenticated accounts.

### Accounts and permissions

**Question:** Who can log in at launch?

**Answer:** Only the admin and temple coordinators. The user will be the admin. Individuals and team coordinators will have records but will not log in at launch; their login features may be added later.

**Question:** What can a temple coordinator do?

**Answer:** A temple coordinator can create and update reports, individual records, team records, centres and campaign details for that coordinator's own temple only.

**Question:** What can the admin do?

**Answer:** The admin can create, update and correct data for every temple, including individuals, teams, centres, reports, campaigns, content, scoring configuration and access.

**Question:** Who enters individual and team records?

**Answer:** The relevant temple coordinator or the admin. Recording an individual or team coordinator does not create an account or grant permissions.

**Question:** Should team coordinators log in at launch?

**Answer:** No. Team coordinators will log in later. At launch, the temple coordinator enters and updates their teams' data.

**Question:** Should individuals log in at launch?

**Answer:** No. Individual login and self-service features are deferred.

**Question:** Should submissions require admin approval before publication?

**Answer:** No. Valid coordinator submissions publish immediately. The admin can correct them afterward. The submitter sees the saved result immediately; other viewers should receive the updated aggregate within about five seconds when realtime infrastructure is available.

### Organization

**Question:** What organizational hierarchy should be used?

**Answer:** Country → Temple → optional Centre. Region and zone are not separate levels; the earlier statement that they were synonymous is superseded by the later decision to remove region entirely.

**Question:** How should multiple centres appear?

**Answer:** A temple's default view combines all its centres. A centre filter can show one centre. The same distribution is never counted once for the centre and again for the temple.

**Question:** What does congregation mean?

**Answer:** Congregation means a book-distribution team. Each team has one team coordinator. A team is separate from a centre, although one distribution entry may optionally identify both.

### Reporting and counting

**Question:** What reporting detail should launch capture?

**Answer:** Both book-type/book-title breakdowns and total book count. The preferred detailed entry selects Book IDs and quantities; the website calculates category totals, total items and points.

**Question:** Are total-count-only submissions allowed?

**Answer:** Yes. A total-only submission immediately contributes to book count but has incomplete points until book details are added to that same report. It must not be assigned zero points.

**Question:** How is a distribution counted?

**Answer:** One distribution event is entered once with its temple, distribution date, optional centre, optional individual/team attribution, campaign and quantity lines. All individual, team, centre, temple, country, campaign and global totals derive from that entry. Displaying it in several views never duplicates it.

**Question:** How do daily and monthly submissions relate?

**Answer:** They reconcile the same activity rather than accumulate it twice. A monthly reconciliation replaces or adjusts the relevant daily activity through an auditable correction. Final monthly-only semantics still need to be completed in the product.

**Question:** What happens when a total-only report later receives book details?

**Answer:** The original total-only contribution is replaced by the detailed contribution in the same report. The system does not append a second contribution.

### Books, categories and scores

**Question:** What categories are used?

**Answer:** Small, Medium, Big and m-big, displayed as Maha Big.

**Question:** Where do scores come from?

**Answer:** From the supplied `docs/books-data.txt` catalog for each Book ID. A category does not imply one universal score; the supplied per-book differences remain exactly as provided.

**Question:** How many books are in the supplied catalog?

**Answer:** 176 unique Book IDs across 12 languages. The source file is preserved unchanged.

**Question:** How are sets counted?

**Answer:** One catalog quantity of a set is one set. Book totals add every volume in that set. Example: one 18-volume Srimad Bhagavatam set is 1 set and 18 books. The listed set score still applies once; it is not multiplied by the number of volumes. Single titles remain 1 book and 0 sets. Total-only reports add to the book total with set count incomplete until details are added.

**Question:** What currency are the prices?

**Answer:** INR for every listed price.

**Question:** Should catalog score/category differences be corrected?

**Answer:** No. Keep them exactly as supplied, including differences such as English Srila Prabhupada Lilamrita at 10.5 points / Big and Hindi at 10 points / Maha Big.

### Campaigns and date ranges

**Question:** What is the default campaign when no special campaign applies?

**Answer:** Whole-Year Marathon for the distribution's calendar year. It covers 1 January through 31 December.

**Question:** What happens when a special campaign is active?

**Answer:** A distribution enters the special campaign only when it is explicitly selected and eligible. Ordinary distributions still go to Whole-Year Marathon. Each entry belongs to exactly one campaign.

**Question:** Can there be temporary campaigns?

**Answer:** Yes. Examples include December Book Marathon, Gita Jayanti and special regional campaigns. Campaign details can be created or updated by the temple coordinator for that temple or by the admin.

**Question:** Can viewers filter campaign results by dates?

**Answer:** Yes. Every campaign, including Whole-Year Marathon, has inclusive start-date and end-date filters. The filter uses the distribution date, not the date on which the report was entered.

**Question:** What does “regional campaign” mean after region was removed?

**Answer:** It is a campaign involving selected participating temples/countries. It does not create a region hierarchy, region filter or regional-admin role.

### Homepage and presentation

**Question:** What should the homepage be?

**Answer:** A light, sattvik newsletter-style homepage with editorial stories/updates, a clearly labelled score section, selected special-campaign highlights and upcoming events/actions.

**Question:** What visual style should be used?

**Answer:** Light, spacious and sattvik. Use the supplied logo, orange `#EB5B19`, grey `#494A55`, off-white surfaces and grey primary buttons with white text.

**Question:** Does “newsletter” require email subscriptions?

**Answer:** No. It describes the website layout. Email newsletter delivery is not currently required.

### Content and historical data

**Question:** Should historical data be imported at launch?

**Answer:** Start fresh. Historical backfill can be added later. Current-period operational imports are still planned.

**Question:** Who can add stories, resources and events?

**Answer:** Temple coordinators can manage material associated with their temple; the admin can manage all temple and shared content. Launch content will be supplied later.

**Question:** What content is still needed?

**Answer:** Approved launch stories, resources, events/calendar entries, temple/country information, contacts, targets and any final About-page material. Do not publish fabricated testimonials, reports or quotations.

### Live updates and performance

**Question:** What does immediate versus five-second updating mean?

**Answer:** The submitter receives confirmation immediately after the server saves. Other viewers should see published aggregate changes within approximately five seconds. It does not mean every page load waits five seconds. Live updates must send compact aggregate changes and never expose private raw reports.

**Question:** What scale should be tested?

**Answer:** 500 concurrent viewers, plus coordinator/admin submissions and reconnects. The target is p95 save/dashboard responses below two seconds and p95 published-to-visible updates within five seconds, subject to real provider testing.

## Earlier questionnaire responses

During the earlier planning session, the user answered a numbered questionnaire. The answer history was:

| Question | Final answer supplied by user                                                                        | Correction/history                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1        | A                                                                                                    | Replaced the earlier answer B.                                                                           |
| 2        | A                                                                                                    | —                                                                                                        |
| 3        | B                                                                                                    | —                                                                                                        |
| 4        | Temple coordinator for each temple; region and zone were initially said to be synonymous             | Later superseded by the decision to remove region/zone and use only country, temple and optional centre. |
| 5        | A                                                                                                    | —                                                                                                        |
| 6        | A                                                                                                    | —                                                                                                        |
| 7        | B                                                                                                    | —                                                                                                        |
| 8        | A (250)                                                                                              | —                                                                                                        |
| 9        | A                                                                                                    | —                                                                                                        |
| 10       | C, with categories described as Big, Medium, Small and later Maha Big/m-big                          | The detailed `books-data.txt` catalog is now authoritative.                                              |
| 11       | A                                                                                                    | —                                                                                                        |
| 12       | No separate answer was recorded in the conversation available for this document                      | Treat as unresolved unless the original questionnaire is supplied.                                       |
| 13       | A                                                                                                    | —                                                                                                        |
| 14       | B                                                                                                    | —                                                                                                        |
| 15       | A                                                                                                    | —                                                                                                        |
| 16       | A                                                                                                    | —                                                                                                        |
| 17       | A                                                                                                    | —                                                                                                        |
| 18       | A                                                                                                    | —                                                                                                        |
| 19       | A                                                                                                    | —                                                                                                        |
| 20       | Unknown                                                                                              | Remains unresolved unless the original question is supplied.                                             |
| 21       | 25 September was first given as an answer; the manager later changed the launch date to 21 September | Final answer: 21 September 2026.                                                                         |
| 22       | A                                                                                                    | —                                                                                                        |
| 23       | A                                                                                                    | —                                                                                                        |
| 24       | A                                                                                                    | —                                                                                                        |
| 25       | A; the website should be light and sattvik                                                           | Confirmed.                                                                                               |
| 26       | B                                                                                                    | —                                                                                                        |
| 27       | A                                                                                                    | —                                                                                                        |
| 28       | A                                                                                                    | —                                                                                                        |

The original numbered questionnaire text and option wording for several of Questions 1–28 is not present in the current repository. The answer letters above are preserved exactly from the conversation, but their option text should be copied into this record if the original questionnaire is supplied.

## Explicitly pending answers

These questions were asked or identified as pending, but the user has not supplied a final rule:

- Final rules for returns, gifts, sales, transfers, damaged/lost books and cross-temple distribution.
- Monthly-only report reconciliation and how such entries appear in a partial-month date filter.
- Complete temple list, centre list, time zones, contacts, targets and coordinator roster.
- Approved launch stories, resources, events and calendar content.
- Domain name and organization-owned Vercel/Supabase account access.
- Whether team attribution should be publicly ranked or remain portal-only.
- Final PDF, XLSX and chart export requirements beyond the current CSV/report foundation.

The implementation status and launch checklist are maintained separately in [implementation-status.md](implementation-status.md). This document is a decision record; it does not itself mean that external accounts, production data or deployment have been configured.
