# Frontend presentation redesign — 23 September 2026

## Architecture reviewed before implementation

Next.js 16 App Router with React 19. Root layout owns fonts, shared header/footer and the main landmark. Home has a CSS module; global CSS owns the reusable design system and page-specific presentation. Public section routes cover temples, campaigns, stories, resources, events, reports and about; detail routes compose temple/campaign profiles and story articles. Dashboard composes filter controls, KPIs, charts and tables. Login, onboarding, account, portal and reporting preview reuse forms and panels.

Server pages obtain public content and aggregate figures from lib/data; authentication and portal actions remain server mediated. Client components own navigation, filters, calendar, story rails, selects and form interaction. These boundaries and all fetching, authorization, calculations and mutations remain unchanged. Existing dependencies include lucide-react but no animation package. Existing fonts and photographs remain.

## Direction

Adapt the mission-to-impact-to-community progression seen in skedit.io, yellow.ai and the WhatsApp example at saasframe.io. Retain Brihat Mridanga's orange #eb5b19, grey #494a55, cream and white. No invented statistics, testimonials or new marketing sections.

1. Floating shared header with pill navigation, current-route indication and accessible mobile navigation.
2. Editorial home hero: visible mission heading, original Prabhupada photograph, original quotation and attribution, both existing CTAs and world community illustration.
3. Separate offering cards, generous chapter spacing, testimonials alongside year-round service, and a featured-story composition. Preserve every existing section and empty state.
4. Shared rounded surfaces, restrained shadows, comfortable form fields, readable tables and stronger page introductions across all routes.
5. A reusable progressive-enhancement motion component observes presentation elements once. Transform/opacity reveals and staggered entrances need no animation dependency. Numeric components retain server-rendered final values and accessible labels; animate only visible values. Honor reduced motion, keyboard focus and printing.

## Verification

Run typecheck, lint, existing regression tests and production build. Browser-check desktop/tablet/mobile, navigation, reduced motion, no-JavaScript content, reporting preview and public page overflow. Authenticated screens require an available authenticated session; do not treat public-shell verification as live account acceptance. No deployment or backend changes are part of this work.

## Completed implementation and evidence

- `src/app/presentation.css` defines the shared presentation layer; `home.module.css` defines the editorial hero. Root layout loads these without changing route composition.
- `src/components/presentation-motion.tsx` supplies one viewport observer and reusable numbers. Reveals animate opacity/transform, disconnect after entry, cancel on focus/reduced motion/printing, and leave content visible by default. Counter frames update only their visual text nodes, not React state. Mutation observation ignores text-only counter updates.
- Existing hero photo, quotation, attribution, CTAs, map and all home chapters remain. Removed only duplicate decorative blurred copies of the same hero photo.
- Shared navigation indicates nested routes. Reporting, cards, forms, tables and About-page surfaces use the existing palette. Narrow report date controls now stack.
- Corrected an existing missing `Content`/`Temple` type import in `story-sections.tsx` uncovered by type checking.

Validation on 23 September 2026:

- Production build and TypeScript pass.
- All 28 existing unit/database regression tests pass.
- Four new Playwright presentation tests pass: responsive pages at 1440/768/390/320 pixels, mobile navigation, reduced motion/accessible totals, and no-JavaScript content.
- Additional browser sweep covered all nine public navigation destinations, login and reporting preview at all four widths. Its only overflow finding, report date controls, was fixed and retested. No browser runtime exceptions.
- Preview calculator: two copies of catalog ID 290 still produce 36 books, two sets and 72 points. Total-only entry of 250 retains incomplete sets/points and has no publish button. No report saved.
- Temple detail navigation still identifies Temples as current. Existing public content and data were read by the local production build; backend code and live data were not modified.
- Changed TypeScript files pass ESLint. Full-repository lint still reports 8 existing errors and 6 warnings in untouched files.
- Signed-in account/onboarding/portal workflows have shared visual improvements but were not authenticated in this run. No deployment performed.

## Hero revision — 24 September 2026

Replaced the hero composition following visual feedback: oversized “Every book. A new beginning.” typography, rectangular original photograph with a fine offset orange frame, an overlapping cream quotation panel, quieter mission copy, and two distinct CTA treatments. Kept the original quotation, attribution, map illustration and destinations. Only the homepage hero module/markup and its headline assertion changed. TypeScript and targeted ESLint pass; Chromium checks at 1440, 768, 390 and 320 pixels found no horizontal overflow or runtime errors. Visually reviewed desktop and mobile screenshots. Available on localhost:3000; not deployed.

## Hero art-direction revision — 24 September 2026

Replaced the centered headline and paired image/quote band with an asymmetric editorial cover: oversized left-aligned type, an angled photographic print with cream backing and a paper-tape detail, fine concentric reach lines, an understated world map and a separate quotation strip. Original photograph, copy, attribution and CTA destinations remain. Mobile composes the headline, photograph and quotation into a single column. Only the homepage CSS module changed for this revision; browser checks cover 1440, 768, 390 and 320 pixels.

## Hero revision — 24 September 2026

Replaced the side-by-side headline and tilted photograph with a centred typographic opening: “Every book. A new beginning.” The existing world-map illustration now sits behind the headline. Both original CTAs sit directly below the mission description. A wide cream quotation panel pairs with the original Prabhupada photograph beneath it; on mobile, the photograph and quotation stack. Preserved all following homepage sections and fetching logic. Uses restrained entrance animations with reduced-motion support.

Verified the local homepage at 1440, 768, 390 and 320 pixels: no horizontal overflow or browser runtime errors. Homepage ESLint passes. Dashboard CTA retains its destination. No backend changes or deployment.

## Homepage motion follow-up — 24 September 2026

Implemented the eight approved animation suggestions while preserving the current full-width hero composition and backend behavior:

- Hero kicker, three quotation lines, attribution, description and CTAs enter sequentially. The main Prabhupada photograph stays stationary; obsolete photo-drift animations were removed.
- The existing map has an explicitly decorative orange connecting line and brief pulses. It does not represent measured distribution routes. Pulses finish within the introduction instead of looping indefinitely.
- Viewport reveals vary between upward headings, alternating sideways card entrances and a featured-photo reveal. Delays make section headings precede their cards.
- Statistic counters wait for card entrances; numeric cards finish with one small icon emphasis. Accessible final values remain available throughout.
- All six existing homepage testimonials remain in a touch-scrollable row with previous/next buttons, native scrolling and keyboard arrow support. There is no autoplay.
- Featured story imagery reveals smoothly and responds to hover/focus. Related stories and campaign/event cards enter sequentially; link arrows respond to hover and keyboard focus.
- A thin orange page-progress line responds to scrolling. The navigation's active background moves between destinations; nested-route highlighting remains intact.
- Reduced motion, printing, effect cleanup and mobile overflow are handled. No new dependency was added; scrolling and counters avoid React updates on every animation frame.

Validation: production build, TypeScript and focused ESLint pass. Three new Playwright tests pass for testimonial controls/keyboard scrolling, 1440/768/390/320px layouts, reading progress, reduced-motion cancellation, sequential hero text and stationary photography. Additional desktop/mobile screenshots and route navigation show all six cards, no page overflow, correct active navigation and no browser exceptions. Changes are local, not deployed.

### Testimonial layout revision — 24 September 2026

Replaced the homepage's horizontal testimonial rail with a responsive editorial grid: one large cream featured quote, four supporting cards, and a wide closing quote when six entries are available. Existing testimonial selection, attribution and destinations are unchanged. Campaigns/events remain beneath the section. Cards continue to use the shared staggered viewport reveals and hover motion, with reduced-motion support. Styles are scoped in `src/app/testimonials.module.css`.

Verified six cards and no horizontal page overflow at 1440, 768, 390 and 320px, no browser runtime errors, and passing TypeScript. The original gradient hero is preserved.

### Campaigns and events layout revision — 24 September 2026

Replaced the shared cream panel and two card columns with separate campaign/event agenda chapters. Desktop headings sit beside dated rows; mobile headings precede the rows. `AgendaCard` preserves the category, temple/location, title, full date range and original destination, with a decorative UTC date tile. The shared animation observer recognizes `data-reveal` entries; existing reduced-motion behavior remains. Homepage data selection and all other sections are unchanged.

TypeScript and ESLint for changed components pass. Browser checks at 1440/768/390/320px confirm all four entry links and both directory links, no horizontal overflow, and no runtime errors.

### Sankirtan stories layout revision — 24 September 2026

Changed the homepage stories area to an open editorial layout: a horizontal lead story followed by three balanced cards. Photo-free stories use typography and a small book icon instead of large empty photograph placeholders. Existing story selection, images, categories and destinations are retained. Cards use the shared staggered reveals, image zoom and arrow hover motion, with reduced-motion support. Scoped styles live in `src/components/home-stories.module.css`.

TypeScript and component lint pass. Browser review at 1440/768/390/320px confirmed four stories, the All stories link, no blank photograph placeholders, no horizontal overflow and no runtime errors.

## Mobile-first update reverted — 25 September 2026

At the user’s request, restored the presentation from immediately before the mobile-first update. Removed its global stylesheet and restored the previous navigation, calendar, form controls, homepage module layouts and animation timing. Earlier testimonial, agenda and Sankirtan story redesigns remain. Backend and data are unchanged.
