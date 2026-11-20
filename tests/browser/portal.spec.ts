import { test, expect } from "@playwright/test";
test("public navigation and campaign date range preserve scope", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of [
    "/",
    "/dashboard",
    "/temples",
    "/campaigns",
    "/reports",
    "/stories",
    "/resources",
    "/events",
    "/about",
    "/portal",
    "/login",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.goto("/campaigns/annual-2025");
  await expect(page.getByRole("heading", { name: "Participation Instructions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live progress" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
  await page.goto("/campaigns/annual-2025?start=2025-03-02&end=2025-03-10");
  await expect(page.getByRole("main")).toContainText("2 Mar 2025");
  await expect(page.getByRole("main")).toContainText("10 Mar 2025");
  expect(errors).toEqual([]);
});
test("weekly preview counts books and sets separately",async({page})=>{
 await page.goto("/preview");await page.getByLabel(/Small Books/).fill("5");await page.getByLabel("Full SB Sets").fill("1");
 await expect(page.locator("[aria-live=polite]")).toContainText("Total books distributed 5 · Total sets distributed 1");
 await expect(page.locator("[aria-live=polite]")).toContainText("Points 37.25");
 await expect(page.getByText(/total count only/i)).toHaveCount(0);
});
test("mobile navigation, forms and date filters fit the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/preview", "/campaigns/annual-2025", "/events"]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      path,
    ).toBe(true);
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .locator("#navigation")
    .getByRole("link", { name: "Campaigns", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Campaigns");
  await page.goto("/");
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
});
