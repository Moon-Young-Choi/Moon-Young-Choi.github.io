import { expect, test } from "@playwright/test";

const route = "/projects/bayesian-ad-targeting/";

test("Bayesian labs share a reproducible scenario and update live results", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator('[data-hydrated="true"]')).toBeAttached();
  await expect(page.getByRole("heading", { name: "Bayesian Ad Targeting" })).toBeVisible();
  await expect(page.locator("math").first()).toBeAttached();

  const splitLive = page.getByTestId("split-live");
  await page.getByRole("button", { name: "Baseline shift" }).click();
  await expect(splitLive).toContainText("does not improve");
  const baseline = await splitLive.textContent();
  await page.getByRole("button", { name: "Uplift heterogeneity" }).click();
  await expect(splitLive).toContainText("add policy value");
  expect(await splitLive.textContent()).not.toBe(baseline);

  const decisionLive = page.getByTestId("decision-live");
  const initialDecision = await decisionLive.textContent();
  const posteriorLive = page.getByTestId("posterior-live");
  const beforeKappa = await posteriorLive.textContent();
  await page.locator("#prior-strength").fill("260");
  expect(await posteriorLive.textContent()).not.toBe(beforeKappa);

  await page.locator("#exposure-cost").fill("2.5");
  await expect(decisionLive).toContainText("2.50%");
  await page.getByRole("button", { name: "New Thompson draw" }).click();
  await expect(decisionLive).toContainText("draw 1");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(decisionLive).toContainText("draw 0");
  await expect(decisionLive).toContainText("1.00%");
  expect(await decisionLive.textContent()).toBe(initialDecision);
});

test("Bayesian allocation respects budget, cap and displayed precision bounds", async ({ page }) => {
  await page.goto(route);
  await page.locator("#budget-share").fill("0.15");
  await page.locator("#segment-cap").fill("0.4");
  const rows = page.getByRole("table", { name: "Constrained Thompson allocation" }).locator("tbody tr");
  let allocated = 0;
  for (let index = 0; index < await rows.count(); index += 1) {
    const cells = await rows.nth(index).locator("td").allTextContents();
    const [lower, upper] = cells[1].match(/[\d.]+/g).map(Number);
    const actual = Number(cells[2].match(/[\d.]+/)[0]);
    allocated += actual;
    if (actual > 0) expect(actual).toBeGreaterThanOrEqual(lower - 0.1);
    if (actual > 0) expect(actual).toBeLessThanOrEqual(upper + 0.1);
  }
  expect(allocated).toBeLessThanOrEqual(15.1);
});

for (const width of [1280, 900, 640, 420, 320]) {
  test(`Bayesian page has no document overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(geometry.body).toBeLessThanOrEqual(geometry.viewport + 1);
  });
}

test("Bayesian controls remain keyboard operable and reduced motion removes transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  const control = page.locator("#prior-strength");
  await control.focus();
  await control.press("ArrowRight");
  await expect(control).toHaveValue("110");
  const bar = page.locator('[class*="density"] i').first();
  await expect(bar).toHaveCSS("transition-duration", "0s");
});
