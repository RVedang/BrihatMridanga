import { test, expect, type Page } from "@playwright/test";
async function chooseBook(page: Page, row: number, id: string) {
  await page.locator(".book-line").nth(row - 1).locator(".nice-select-trigger").click();
  await page.getByRole("option", { name: new RegExp(`^#${id} ·`) }).click();
}
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
test("catalog calculator handles sets, exact points and total-only incomplete state", async ({
  page,
}) => {
  await page.goto("/preview");
  await chooseBook(page, 1, "290");
  await page
    .getByRole("spinbutton", { name: "Quantity 1", exact: true })
    .fill("2");
  await expect(page.locator(".summary-box")).toContainText("72");
  await expect(page.locator(".summary-box strong").first()).toHaveText("36");
  await page.getByRole("button", { name: "Add another book" }).click();
  await chooseBook(page, 2, "167");
  await page
    .getByRole("spinbutton", { name: "Quantity 2", exact: true })
    .fill("3");
  await expect(page.locator(".summary-box")).toContainText("72.3");
  await expect(page.locator(".summary-box strong").first()).toHaveText("39");
  await page
    .getByRole("button", { name: "Total count only", exact: true })
    .click();
  await page.getByLabel("Total items distributed").fill("250");
  await expect(page.locator(".summary-box strong").first()).toHaveText("250");
  await expect(page.locator(".summary-box")).toContainText("Incomplete");
  await expect(
    page.getByRole("button", { name: "Publish distribution" }),
  ).toHaveCount(0);
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
