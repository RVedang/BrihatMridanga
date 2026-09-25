import test from "node:test";
import assert from "node:assert/strict";
import {
  communityStoryTypeLabel,
  isCommunityStoryType,
  storySearchText,
  videoEmbedUrl,
} from "../src/lib/story-types";

test("community story types match the six public labels", () => {
  assert.equal(isCommunityStoryType("distributor"), true);
  assert.equal(isCommunityStoryType("festival"), false);
  assert.equal(
    communityStoryTypeLabel("miracle"),
    "Book distribution miracle stories",
  );
});

test("video links become embeddable YouTube or Vimeo addresses", () => {
  assert.equal(
    videoEmbedUrl("https://www.youtube.com/watch?v=abcdefghijk"),
    "https://www.youtube.com/embed/abcdefghijk",
  );
  assert.equal(
    videoEmbedUrl("https://youtu.be/abcdefghijk"),
    "https://www.youtube.com/embed/abcdefghijk",
  );
  assert.equal(
    videoEmbedUrl("https://vimeo.com/123456789"),
    "https://player.vimeo.com/video/123456789",
  );
  assert.equal(videoEmbedUrl("https://example.com/clip"), null);
});

test("events are searchable by location and date", () => {
  const text = storySearchText(
    {
      title: "Training morning",
      body: "Practice for new distributors.",
      language: "English",
      temple_id: null,
      location: "fsludafsdfdfear",
      starts_at: "2026-09-22T09:00:00Z",
    },
    { name: "Temple A", country: "India" },
  );
  assert.equal(text.includes("fsludafsdfdfear"), true);
  assert.equal(text.includes("2026-09-22"), true);
  assert.equal(text.includes("india"), false);
});

test("shared stories are not searchable by temple or country", () => {
  const temple = { name: "Mayapur Chandrodaya Mandir", country: "India" };
  const scoped = storySearchText(
    {
      title: "A set on the train",
      body: "A devotee offered a book.",
      language: "English",
      temple_id: "temple-1",
    },
    temple,
  );
  assert.equal(scoped.includes("india"), true);
  assert.equal(scoped.includes("mayapur"), true);
  const shared = storySearchText(
    {
      title: "A movement-wide story",
      body: "Shared with every temple.",
      language: "English",
      temple_id: null,
    },
    temple,
  );
  assert.equal(shared.includes("india"), false);
  assert.equal(shared.includes("mayapur"), false);
});
