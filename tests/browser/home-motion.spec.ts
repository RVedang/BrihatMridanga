import { expect, test } from "@playwright/test";

test("each slide resumes 2.5 seconds after hover even when a control retains focus", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-22T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-22T12:01:00Z"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Book distribution marathon carousel" });
  const dots = hero.getByRole("group", { name: "Slide navigation" }).getByRole("button");
  for (let i = 0; i < 3; i++) {
    const current = dots.nth(i);
    const next = dots.nth((i + 1) % 3);
    await current.click();
    await page.clock.runFor(10000);
    await expect(current).toHaveAttribute("aria-current", "true");
    await page.mouse.move(0, 0);
    await page.clock.runFor(2499);
    await expect(current).toHaveAttribute("aria-current", "true");
    await page.clock.runFor(1);
    await expect(next).toHaveAttribute("aria-current", "true");
    await page.clock.runFor(4999);
    await expect(next).toHaveAttribute("aria-current", "true");
    await page.clock.runFor(1);
    await expect(dots.nth((i + 2) % 3)).toHaveAttribute("aria-current", "true");
  }
});

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
    hero.getByRole("heading", { name: "Welcome to the Srila Prabhupada Book Marathon" }),
  ).toBeVisible();
  await hero.getByRole("heading", { name: "Welcome to the Srila Prabhupada Book Marathon" }).hover();
  await page.clock.runFor(6000);
  await expect(
    hero.getByRole("heading", { name: "Welcome to the Srila Prabhupada Book Marathon" }),
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
    hero.getByRole("heading", { name: "Welcome to the Srila Prabhupada Book Marathon" }),
  ).toBeVisible();
});
