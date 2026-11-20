import { expect, test } from "@playwright/test";

test("recent testimonials render on phones and desktop", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const section = page.locator(".home-testimonials");
    await expect(
      section.getByRole("heading", { name: "Recent testimonials" }),
    ).toBeVisible();
    expect(
      await section.locator("a:visible").count(),
      `width ${width}`,
    ).toBeGreaterThan(0);
  }
});

test("homepage motion fits each viewport and reduced motion cancels it", async ({
  page,
}) => {
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("heading", { name: "Recent testimonials" })
      .scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page
          .locator(".reading-progress")
          .evaluate((el) =>
            Number(getComputedStyle(el).getPropertyValue("--reading-progress")),
          ),
      )
      .toBeGreaterThan(0);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      ),
    )
    .toBe(0);
});

test("hero slides rotate, pause on hover, and omit dashboard and submission actions", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const hero = page.getByRole("region", {
    name: "Book distribution marathon carousel",
  });
  await expect(
    hero.getByRole("heading", { name: "60 Days of Bliss" }),
  ).toBeVisible();
  await hero.getByRole("heading", { name: "60 Days of Bliss" }).hover();
  await page.clock.runFor(6000);
  await expect(
    hero.getByRole("heading", { name: "60 Days of Bliss" }),
  ).toBeVisible();
  await page.mouse.move(0, 0);
  await page.clock.runFor(5100);
  await expect(
    hero.getByRole("heading", { name: "Live Weekly Standings" }),
  ).toBeVisible();
  await hero.getByRole("button", { name: "Next slide" }).click();
  await expect(hero.locator("blockquote")).toContainText(
    "simply holds if and sees it",
  );
  await expect(hero.locator("figcaption")).toContainText(
    "Letter to German Disciples — Bombay, May 06, 1977",
  );
  await expect(hero.getByRole("link", { name: "View Dashboard" })).toHaveCount(
    0,
  );
  await expect(
    hero.getByRole("link", { name: "Submit Distribution" }),
  ).toHaveCount(0);
  await hero.getByRole("button", { name: "Marathon Announcement" }).click();
  await expect(
    hero.getByRole("heading", { name: "60 Days of Bliss" }),
  ).toBeVisible();
});
