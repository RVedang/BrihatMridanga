import { expect, test } from "@playwright/test";

test("testimonial controls preserve cards and support keyboard scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const rail = page.getByRole("region", { name: "Recent testimonials" });
  await expect(rail).toBeVisible();
  const count = await rail.locator(".testimonial-card").count();
  expect(count).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Next testimonials" }).click();
  await expect
    .poll(() => rail.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(100);
  await rail.focus();
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => rail.evaluate((el) => el.scrollLeft)).toBeLessThan(2);
  expect(await rail.locator(".testimonial-card").count()).toBe(count);
  await expect(
    page.getByRole("button", { name: "Previous testimonials" }),
  ).toBeDisabled();
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
      .getByRole("region", { name: "Recent testimonials" })
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

test("hero has sequential text entrances and stationary photograph", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator('section[aria-label="Our inspiration"]');
  const quote = hero.locator("blockquote p span");
  const delays = await quote.evaluateAll((elements) =>
    elements.map((el) => getComputedStyle(el).animationDelay),
  );
  expect(new Set(delays).size).toBe(3);
  const photo = hero.locator(
    'img[alt="Śrīla Prabhupāda receiving a stack of books"]',
  );
  expect(await photo.evaluate((el) => getComputedStyle(el).animationName)).toBe(
    "none",
  );
});
