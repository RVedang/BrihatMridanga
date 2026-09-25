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
  await page.getByLabel("Start date").fill("2025-03-02");
  await page.getByLabel("End date").fill("2025-03-10");
  await page.getByRole("button", { name: "Apply dates" }).click();
  await expect(page).toHaveURL(/start=2025-03-02&end=2025-03-10/);
  await expect(
    page.getByText("2 Mar 2025 – 10 Mar 2025 · Both dates included"),
  ).toBeVisible();
  await page.getByLabel("End date").fill("2025-03-01");
  await page.getByRole("button", { name: "Apply dates" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("end date");
  expect(errors).toEqual([]);
});
test("catalog calculator handles sets, exact points and total-only incomplete state", async ({
  page,
}) => {
  await page.goto("/preview");
  await page
    .getByRole("combobox", { name: "Book 1", exact: true })
    .selectOption("290");
  await page
    .getByRole("spinbutton", { name: "Quantity 1", exact: true })
    .fill("2");
  await expect(page.locator(".summary-box")).toContainText("72");
  await expect(page.locator(".summary-box strong").first()).toHaveText("36");
  await page.getByRole("button", { name: "Add another book" }).click();
  await page
    .getByRole("combobox", { name: "Book 2", exact: true })
    .selectOption("167");
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
