import { expect, test } from "@playwright/test";

test("public presentation fits desktop, tablet and narrow mobile", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/dashboard", "/reports", "/about", "/preview"]) {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeAttached();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} at ${width}px`,
      ).toBe(true);
    }
  }
});

test("mobile navigation preserves destinations and current section", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .locator("#navigation")
    .getByRole("link", { name: "Campaigns", exact: true })
    .click();
  await expect(page).toHaveURL(/\/campaigns$/);
  await expect(page.locator('nav [aria-current="page"]')).toHaveText(
    "Campaigns",
  );
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("motion settles, respects reduced motion and retains accessible totals", async ({
  page,
}) => {
  await page.goto("/");
  const total = page.locator(".animated-number").first();
  if (await total.count()) {
    await total.scrollIntoViewIfNeeded();
    await expect(total.locator('[aria-hidden="true"]')).toHaveText(
      (await total.locator(".visually-hidden").textContent()) || "",
      { timeout: 3000 },
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === "running").length,
      ),
    )
    .toBe(0);
});

test("mission and navigation remain available without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.TEST_BASE_URL || "http://127.0.0.1:3120");
  await expect(page.locator("h1")).toContainText("Brihat Mridanga");
  await expect(
    page.getByRole("link", { name: "View Dashboard", exact: true }),
  ).toBeVisible();
  await context.close();
});
