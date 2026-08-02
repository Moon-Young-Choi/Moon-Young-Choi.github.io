import { expect, test } from "@playwright/test";

const widths = [1280, 900, 640, 420, 320];
const routes = ["/", "/projects/quant-platform/", "/projects/pwr-scan/"];

for (const width of widths) {
  test(`Quant and PWR layouts do not widen the document at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const geometry = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(geometry.document, `${route} document overflow`).toBeLessThanOrEqual(geometry.viewport + 1);
      expect(geometry.body, `${route} body overflow`).toBeLessThanOrEqual(geometry.viewport + 1);
    }
  });
}

test("PWR contents, proof details, dependency links and MathML remain keyboard operable", async ({ page }) => {
  await page.goto("/projects/pwr-scan/");
  await expect(page.getByRole("heading", { name: "Contents" })).toBeVisible();
  await expect(page.locator("article[data-kind]")).toHaveCount(49);
  await expect(page.locator("math").first()).toBeAttached();

  const theorem = page.locator("#theorem-5-5");
  await theorem.scrollIntoViewIfNeeded();
  const details = theorem.locator("details");
  const summary = details.locator("summary");
  await summary.focus();
  if (!(await details.evaluate((node) => node.open))) await summary.press("Enter");
  await expect(theorem.getByRole("heading", { name: "Core proof steps" })).toBeVisible();
  const dependency = theorem.getByRole("link", { name: /Lemma 5\.4/ });
  await dependency.focus();
  await dependency.press("Enter");
  await expect(page.locator("#lemma-5-4")).toBeInViewport();
});

test("legacy PWR path renders the consolidated page with one canonical target", async ({ page }) => {
  await page.goto("/projects/pwr-scan-validation/");
  await expect(page.getByText("Proof-led statistical system", { exact: true })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/projects\/pwr-scan\/$/);
});

test("Quant architecture exposes tables and truthful work-in-progress boundaries", async ({ page }) => {
  await page.goto("/projects/quant-platform/");
  await expect(page.getByText("Architecture model", { exact: true })).toBeVisible();
  await expect(page.getByText("No live portfolio output", { exact: true })).toBeVisible();
  const architecture = page.locator("#architecture");
  await expect(architecture.getByText("Market Price Service", { exact: true })).toBeVisible();
  await expect(architecture.getByText("Historical Return Evaluator", { exact: true })).toBeVisible();
  await expect(page.getByText("12 validated views · QP-001—012", { exact: true })).toBeVisible();
  await expect(page.getByRole("table", { name: /evidence lifecycle/i })).toBeVisible();
  await expect(page.getByText("Product selection pending")).toHaveCount(5);
  await expect(page.getByRole("link", { name: /GitHub/i })).toHaveCount(0);
});

test("reduced-motion preference removes explanatory cover animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const movingNodes = page.locator('[class*="panelSignal"], [class*="coverSignal"]');
  const count = await movingNodes.count();
  for (let index = 0; index < count; index += 1) {
    const style = await movingNodes.nth(index).evaluate((node) => getComputedStyle(node));
    expect(["0s", "none"]).toContain(style.animationDuration === "0s" ? "0s" : style.animationName);
  }
});
