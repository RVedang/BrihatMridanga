import { expect, test, type Page } from "@playwright/test";

// Runs against the live project, so nothing here saves a record.
// Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to enable.
const email = process.env.E2E_ADMIN_EMAIL,
  password = process.env.E2E_ADMIN_PASSWORD;

test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByRole("tab", { name: "Temple portal" }).click();
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/portal/);
}

test("admin portal tabs load and fit a phone screen", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await signIn(page);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const tab of ["", "history", "records", "campaigns", "targets", "content", "temples"]) {
    const response = await page.goto(`/portal${tab ? `?tab=${tab}` : ""}`);
    expect(response?.status(), tab || "enter").toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      tab || "enter",
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("report form calculates totals without publishing", async ({ page }) => {
  await signIn(page);
  await page.goto("/portal");
  await page.getByRole("button", { name: "Total count only", exact: true }).click();
  await page.getByLabel("Total items distributed").fill("12");
  await expect(page.locator(".summary-box strong").first()).toHaveText("12");
  await expect(page.locator(".summary-box")).toContainText("Incomplete");
  await expect(page.getByRole("button", { name: "Publish distribution" })).toBeEnabled();
});

test("temple editor shows approval to admins", async ({ page }) => {
  await signIn(page);
  await page.goto("/portal?tab=temples");
  await page.locator(".record-item-title").first().click();
  await expect(page.getByRole("checkbox", { name: /Approved/ })).toBeVisible();
});

test("team without members is rejected before anything is saved", async ({ page }) => {
  await signIn(page);
  await page.goto("/portal?tab=records");
  await page.locator(".segmented").getByRole("button", { name: "Teams" }).click();
  await expect(page.getByRole("heading", { name: "Add team" })).toBeVisible();
  await page.getByRole("textbox", { name: "Name" }).fill("E2E never saved");
  await page.evaluate(() => {
    const form = document.querySelector<HTMLFormElement>("form.workspace-form");
    form?.querySelectorAll("[required]").forEach((el) => el.removeAttribute("required"));
    form?.requestSubmit();
  });
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Select the team members first",
  );
});
