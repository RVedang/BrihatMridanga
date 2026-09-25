import type { Content } from "@/lib/data";

const stamp = "2026-09-01T08:00:00.000Z";

function item(
  id: string,
  kind: "community_story" | "resource",
  title: string,
  language: string,
  body: string,
  link_url = "",
  image_url = "",
  story_type = "",
): Content {
  return {
    id,
    temple_id: null,
    kind,
    story_type,
    title,
    body,
    language,
    link_url,
    image_url,
    published: true,
    starts_at: null,
    ends_at: null,
    location: "",
    created_at: stamp,
  };
}

export const sampleStories: Content[] = [
  item(
    "11111111-1111-4111-8111-111111111101",
    "community_story",
    "A Bhagavad-gita on the last train home",
    "English",
    "One evening in Mumbai, a sankirtan devotee offered a Bhagavad-gita to a tired office worker boarding the last local. The gentleman first smiled and walked on, then turned back: “My father used to read this.” He took the book, sat by the window, and opened it before the train had left the platform. Weeks later he visited the temple with the same copy, now marked on every chapter. Small meetings like this are the heartbeat of book distribution — one person, one book, and a conversation that continues long after the street grows quiet.",
    "",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1400&q=80",
    "recipient",
  ),
  item(
    "11111111-1111-4111-8111-111111111102",
    "community_story",
    "Rain, umbrellas, and eighteen volumes",
    "English",
    "During a monsoon Saturday in Mayapur, the team almost packed up. Then a family of pilgrims stopped under a shared umbrella and asked about Srimad-Bhagavatam. They had come for darshan and left with a full set, wrapping each volume in the cloth they had brought for prasadam. The devotees later said the rain was the Lord’s arrangement: everyone who stayed did so with intention. By dusk the stall was soaked, the cart was empty, and the family had already begun reading Canto One together in the guest house.",
    "",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1400&q=80",
    "success",
  ),
  item(
    "11111111-1111-4111-8111-111111111103",
    "community_story",
    "The student who came back with friends",
    "English",
    "At a university courtyard in Bengaluru, a young woman accepted a small book more out of courtesy than curiosity. Two days later she returned with three classmates. “We argued about the first chapter all night,” she said. The team sat with them on the steps, answered questions, and showed them how to keep a simple reading notebook. That circle now meets every Thursday. Book distribution did not end at the hand-to-hand exchange; it became a weekly study, a few songs, and a growing group of readers.",
    "",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
    "interview",
  ),
  item(
    "11111111-1111-4111-8111-111111111104",
    "community_story",
    "एक चाय की दुकान पर गीता",
    "Hindi",
    "दिल्ली की एक व्यस्त गली में चायवाले ने पहले मना किया, फिर कहा — “बस एक पन्ना दिखा दो।” भक्त ने भगवद्-गीता का दूसरा अध्याय खोला। अगली सुबह वही दुकानदार मंदिर आया और बोला कि रात भर नींद नहीं आई। उसने छोटी पुस्तक रखी, पूरी गीता ली, और अब अपनी दुकान की अलमारी में वह प्रति सबसे ऊपर रहती है। संकीर्तन कभी-कभी यहीं पूरा होता है: एक गिलास चाय, एक श्लोक, और कोई ऐसा हृदय जो सुनने को तैयार हो।",
    "",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80",
    "miracle",
  ),
];

export const sampleResources: Content[] = [
  item(
    "22222222-2222-4222-8222-222222222201",
    "resource",
    "Street conversation guide",
    "English",
    "A short, practical outline for approaching someone with a book: how to greet, how to show a verse, how to listen, and how to close the exchange with respect. Use it for new distributors and for a five-minute briefing before going out. Keep the mood warm, never pressured, and always leave the person with a way to stay in touch.",
    "https://vedabase.io/en/library/bg/",
  ),
  item(
    "22222222-2222-4222-8222-222222222202",
    "resource",
    "How to present a Bhagavatam set",
    "English",
    "Walk through the set as a complete home library: eighteen cantos, why the volumes stay together, and how to invite someone to begin with Canto One. Includes a simple table of contents you can remember, and phrases that have worked at temples, colleges and family gatherings.",
    "https://vedabase.io/en/library/sb/",
  ),
  item(
    "22222222-2222-4222-8222-222222222203",
    "resource",
    "Morning briefing for a sankirtan team",
    "English",
    "A fifteen-minute programme before going out: one verse, one intention for the day, pairings, routes, and how the team will meet again. Finish with a reminder that every book counts once — enter the distribution the same evening so the temple’s offering stays accurate.",
  ),
  item(
    "22222222-2222-4222-8222-222222222204",
    "resource",
    "Reading Krishna book with new friends",
    "English",
    "Suggested chapters for a first week of reading, questions that open discussion, and a gentle way to invite someone from a street meeting into a small reading circle. Suitable for temples hosting guests after a weekend marathon.",
    "https://vedabase.io/en/library/kb/",
  ),
  item(
    "22222222-2222-4222-8222-222222222205",
    "resource",
    "Reporting checklist for temples",
    "English",
    "Before publishing a distribution: confirm the date at the temple, choose the campaign, add book lines where possible, and use a correction on the same report if you later add details. This keeps books, sets and points aligned on the public dashboard.",
  ),
];

export const sampleTestimonials: Content[] = [
  {
    id: "sample-testimonial-1",
    temple_id: null,
    kind: "community_story",
    story_type: "recipient",
    title: "Anita Sharma",
    body: "I received a Bhagavad-gita from the sankirtan team. I read a verse every morning now. This is a sample testimonial until temples publish their own.",
    language: "English",
    link_url: "",
    image_url: "",
    published: true,
    starts_at: null,
    ends_at: null,
    location: "",
    created_at: "2026-09-03T08:00:00.000Z",
  },
  {
    id: "sample-testimonial-2",
    temple_id: null,
    kind: "community_story",
    story_type: "recipient",
    title: "Ravi Menon",
    body: "Our family took a Bhagavatam set last year. The children ask for the stories at bedtime. Sample testimonial — replace it from the Temple Portal.",
    language: "English",
    link_url: "",
    image_url: "",
    published: true,
    starts_at: null,
    ends_at: null,
    location: "",
    created_at: "2026-09-02T08:00:00.000Z",
  },
];

export const sampleContent: Content[] = [
  ...sampleStories,
  ...sampleResources,
  ...sampleTestimonials,
];

export function withSampleContent(content: Content[]): Content[] {
  const samples = Object.fromEntries(sampleStories.map((s) => [s.id, s]));
  return content.map((c) => {
    const sample = samples[c.id];
    if (sample)
      return {
        ...c,
        kind: "community_story" as const,
        story_type: sample.story_type,
        image_url: c.image_url || sample.image_url,
      };
    if (c.kind === "story")
      return {
        ...c,
        kind: "community_story" as const,
        story_type: c.story_type || "interview",
      };
    return c;
  });
}
