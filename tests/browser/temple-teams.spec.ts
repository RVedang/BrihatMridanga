import { expect, test } from "@playwright/test";

// Read-only checks against the imported Mumbai roster; no portal writes.
const mumbai = "/temples/f0d11e67-cdef-5462-9a93-36a410360717";

test("Mumbai teams are paginated and searchable without losing repeated names", async ({
  page,
}) => {
  await page.goto(mumbai);
  const directory = page.getByRole("region", { name: "Team directory" });
  const rows = directory.locator("details");
  await expect(rows).toHaveCount(8);
  const first = await rows.first().locator("summary").innerText();
  await directory.getByRole("button", { name: "Next teams" }).click();
  await expect(rows.first().locator("summary")).not.toHaveText(first);
  await expect(directory.getByText(/Page 2 of/)).toBeVisible();
  await directory.getByRole("searchbox").fill("  BALDEVA  ");
  await expect(rows).toHaveCount(2);
  await expect(directory.getByRole("status")).toContainText("2 teams found");
  await expect(
    rows.filter({
      has: page.locator("summary > span:first-child", { hasText: /^Baldeva$/ }),
    }),
  ).toHaveCount(1);
  const baldeva = rows.filter({
    has: page.locator("summary > span:first-child", { hasText: /^Baldeva 1$/ }),
  });
  await expect(baldeva.locator("summary")).toContainText("Not listed");
  await baldeva.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(baldeva).toHaveAttribute("open", "");
  await expect(baldeva.locator("li")).toHaveCount(4);
  await expect(baldeva.getByText(/^shriraj$/i)).toBeVisible();
  await expect(baldeva.getByText("Team lead", { exact: true })).toHaveCount(0);
  await directory.getByRole("searchbox").fill("shriraj");
  await expect(rows).toHaveCount(2);
  await directory
    .getByRole("button", { name: "Filter teams by centre" })
    .click();
  await directory
    .getByRole("option", { name: "Folk Powai", exact: true })
    .click();
  await expect(
    directory.getByText("No teams match your search."),
  ).toBeVisible();
  await directory.getByRole("button", { name: "Show all teams" }).click();
  await expect(rows).toHaveCount(8);
  await expect(directory.getByText(/Page 1 of/)).toBeVisible();
  await expect(directory.getByRole("searchbox")).toHaveValue("");
  await expect(
    directory.getByRole("button", { name: "Filter teams by centre" }),
  ).toHaveText("All centres");
  await directory.getByRole("searchbox").fill("Baldeva 2");
  await expect(rows).toHaveCount(0);
  await expect(
    directory.getByText("No teams match your search."),
  ).toBeVisible();
});

test("centre dropdown supports search, keyboard selection and dismissal", async ({
  page,
}) => {
  await page.goto(mumbai);
  const directory = page.getByRole("region", { name: "Team directory" });
  const trigger = directory.getByRole("button", {
    name: "Filter teams by centre",
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const search = directory.getByRole("textbox", { name: "Search options" });
  await expect(search).toBeFocused();
  await search.fill("Airoli");
  await expect(directory.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveText("Folk Airoli");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(
    directory.getByRole("option", { name: "Folk Airoli" }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(directory.getByRole("listbox")).toHaveCount(0);
  await trigger.click();
  await directory.getByRole("searchbox").click();
  await expect(directory.getByRole("listbox")).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 900 });
  await trigger.click();
  const menu = directory.getByRole("listbox");
  await expect(menu).toBeVisible();
  expect(
    await menu.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth;
    }),
  ).toBe(true);
});

test("directory fits desktop, tablet and mobile and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(mumbai);
  const directory = page.getByRole("region", { name: "Team directory" });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await directory.scrollIntoViewIfNeeded();
    expect(
      await directory.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return (
          box.left >= 0 &&
          box.right <= innerWidth &&
          element.scrollWidth <= element.clientWidth
        );
      }),
      `directory at ${width}px`,
    ).toBe(true);
  }
  await directory.locator("summary").first().click();
  await expect(directory.locator("details").first()).toHaveAttribute(
    "open",
    "",
  );
  expect(
    await directory.evaluate(
      (element) => element.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0);
});
