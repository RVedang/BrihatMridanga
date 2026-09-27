import { expect, test } from "@playwright/test";

test("date presets update submitted fields and Apply preserves the selected range", async ({ page }) => {
  const year = new Date().getUTCFullYear();
  await page.goto(`/dashboard?start=${year}-01-01&end=${year}-12-31`);
  const form = page.getByRole("form", { name: "Dashboard filters" });
  await page.getByRole("link", { name: "Last year", exact: true }).click();
  await expect(form.locator('input[name="start"]')).toHaveValue(`${year - 1}-01-01`);
  await expect(form.locator('input[name="end"]')).toHaveValue(`${year - 1}-12-31`);
  await form.getByRole("button", { name: /Apply/ }).click();
  await expect(page).toHaveURL(new RegExp(`start=${year - 1}-01-01&end=${year - 1}-12-31`));
  await page.getByRole("link", { name: "This year", exact: true }).click();
  await expect(form.locator('input[name="start"]')).toHaveValue(`${year}-01-01`);
  await expect(form.locator('input[name="end"]')).toHaveValue(`${year}-12-31`);
  await page.goBack();
  await expect(form.locator('input[name="start"]')).toHaveValue(`${year - 1}-01-01`);
});
