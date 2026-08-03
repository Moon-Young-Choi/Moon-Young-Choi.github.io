import { expect, test } from "@playwright/test";

const route = "/projects/open-source-intelligence/";

test("OSINT exposes MathML, its numeric result table, paper boundary, and canonical metadata", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "Open Source Intelligence" })).toBeVisible();
  await expect(page.locator("math").first()).toBeAttached();
  await expect(page.getByRole("table", { name: /Fixed IRVS TEST averages/ })).toBeVisible();
  await expect(page.getByText("Evidence boundary", { exact: true })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", route);

  const repository = page.getByRole("link", { name: /Source repository/ }).first();
  await repository.focus();
  await expect(repository).toBeFocused();
});

for (const width of [1280, 900, 640, 420, 320]) {
  test(`OSINT confines overflow to mathematical or table fields at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    const geometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      formulaFields: [...document.querySelectorAll(".math-render")].map((node) => ({
        client: node.clientWidth,
        scroll: node.scrollWidth,
        overflowX: getComputedStyle(node).overflowX,
      })),
      tables: [...document.querySelectorAll("table")].map((node) => ({
        client: node.clientWidth,
        scroll: node.scrollWidth,
        overflowX: getComputedStyle(node).overflowX,
      })),
    }));

    expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(geometry.body).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(geometry.formulaFields.length).toBeGreaterThan(0);
    for (const field of geometry.formulaFields) {
      if (field.scroll > field.client + 1) expect(field.overflowX).toBe("auto");
    }
    for (const table of geometry.tables) {
      if (table.scroll > table.client + 1) expect(table.overflowX).toBe("auto");
    }
  });
}

test("OSINT remains static under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  const motion = await page.locator("main").evaluate((node) => [...node.querySelectorAll("*")].map((item) => {
    const style = getComputedStyle(item);
    return { animation: style.animationName, transition: style.transitionDuration };
  }));
  expect(motion.every(({ animation, transition }) => animation === "none" && transition === "0s")).toBe(true);
});
