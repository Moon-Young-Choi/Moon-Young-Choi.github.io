import { expect, test } from "@playwright/test";

const widths = [1280, 900, 640, 420, 320];
const routes = ["/", "/projects/quant-platform/", "/projects/pwr-scan/", "/projects/eventedge-derivatives/"];

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
    await page.goto("/projects/pwr-scan/");
    await page.getByRole("tab", { name: /empirical/i }).click();
    await expect(page.getByText(/simulated study/i).first()).toBeVisible();
    const empiricalGeometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(empiricalGeometry.document, "PWR empirical document overflow").toBeLessThanOrEqual(empiricalGeometry.viewport + 1);
    expect(empiricalGeometry.body, "PWR empirical body overflow").toBeLessThanOrEqual(empiricalGeometry.viewport + 1);
  });
}

test("PWR defaults to Theory and keeps its proof chain, contents and MathML operable", async ({ page }) => {
  await page.goto("/projects/pwr-scan/");
  const theoryTab = page.getByRole("tab", { name: /theory/i });
  const empiricalTab = page.getByRole("tab", { name: /empirical/i });
  await expect(theoryTab).toHaveAttribute("aria-selected", "true");
  await expect(empiricalTab).toHaveAttribute("aria-selected", "false");
  await expect(page.getByRole("heading", { name: "Theory contents" })).toBeVisible();
  await expect(page.locator("#pwr-empirical-panel")).toBeHidden();
  await expect(page.locator("article[data-kind]")).toHaveCount(49);
  await expect(page.locator("math").first()).toBeAttached();

  const theorem = page.locator("#theorem-5-5");
  await theorem.scrollIntoViewIfNeeded();
  await expect(theorem.getByText("Proof.", { exact: true })).toBeVisible();
  await expect(theorem.locator("details")).toHaveCount(0);
  const dependency = theorem.getByRole("link", { name: /Lemma 5\.4/ });
  await dependency.focus();
  await dependency.press("Enter");
  await expect(page.locator("#lemma-5-4")).toBeInViewport();
});

test("PWR tabs use the ARIA keyboard pattern without changing the URL", async ({ page }) => {
  await page.goto("/projects/pwr-scan/");
  const original = page.url();
  const theoryTab = page.getByRole("tab", { name: /theory/i });
  const empiricalTab = page.getByRole("tab", { name: /empirical/i });
  await theoryTab.focus();
  await theoryTab.press("ArrowRight");
  await expect(empiricalTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#pwr-theory-panel")).toBeHidden();
  await expect(page.getByText(/simulated study/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Empirical contents" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Theory contents" })).toBeHidden();
  expect(page.url()).toBe(original);
  await empiricalTab.press("Home");
  await expect(theoryTab).toHaveAttribute("aria-selected", "true");
  expect(page.url()).toBe(original);
});

test("PWR empirical controls select precomputed rows and update charts and tables together", async ({ page }) => {
  await page.goto("/projects/pwr-scan/");
  await page.getByRole("tab", { name: /empirical/i }).click();
  await expect(page.getByText(/simulated study/i).first()).toBeVisible();
  const live = page.locator('[aria-live="polite"]');
  await expect(live).toContainText("Localized spike");
  const initial = await live.textContent();
  await page.getByRole("button", { name: "128", exact: true }).click();
  await page.getByRole("button", { name: "0.2", exact: true }).click();
  await page.locator('input[type="range"]').fill("1");
  await page.getByRole("button", { name: "499", exact: true }).click();
  await expect(live).toContainText("n 128 per group");
  await expect(live).toContainText("effect 1.00");
  await expect(live).toContainText("mismatch 0.20");
  await expect(live).toContainText("499 permutations");
  expect(await live.textContent()).not.toBe(initial);
  await expect(page.getByRole("figure")).toHaveCount(5);
  await expect(page.getByText("Data table", { exact: true })).toHaveCount(5);
  await expect(page.getByText("V1 pending", { exact: false })).toBeVisible();
  await expect(page.getByText("ROC AUC 0.4843", { exact: false })).toBeVisible();
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

test("EventEdge selects precomputed decisions and keeps terminal truth locked until reveal", async ({ page }) => {
  await page.goto("/projects/eventedge-derivatives/");
  await expect(page.getByRole("heading", { name: "One public snapshot. Two decisions. Four terminal states." })).toBeVisible();
  const live = page.locator('[aria-live="polite"]');
  await expect(live).toContainText("B · Sell WA + Buy WB");
  await expect(live).toContainText("50% filled");
  await expect(page.getByText("LOCKED", { exact: true })).toHaveCount(4);
  await expect(page.getByText("TRUE STATE LOCKED", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "A · Buy WA", exact: true }).click();
  await expect(live).toContainText("rejected");
  await expect(page.getByText("+13.00", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "B · Sell WA + Buy WB", exact: true }).click();
  await page.getByRole("button", { name: "Shallow liquidity", exact: true }).click();
  await page.getByRole("button", { name: "S4", exact: true }).click();
  await expect(live).toContainText("Shallow liquidity");
  await page.getByRole("button", { name: "REVEAL & SETTLE", exact: true }).click();
  await expect(page.getByText("ALL INVARIANTS PASS", { exact: true })).toBeVisible();
  await expect(page.getByText("TRUE STATE LOCKED", { exact: true })).toHaveCount(0);
  const benchmarkCells = page.getByRole("table", { name: /Scenario weights/i }).locator("tbody tr td:nth-child(3)");
  await expect(benchmarkCells).toHaveCount(4);
  expect(await benchmarkCells.allTextContents()).toEqual(["25%", "25%", "25%", "25%"]);
  await expect(page.getByRole("table")).toHaveCount(6);
});

test("EventEdge cover stacks sell asks above buy bids in a dot-free animated book", async ({ page }) => {
  await page.goto("/");
  const orderBook = page.locator('[class*="orderBook"]');
  await expect(orderBook).toHaveCount(1);
  const asks = orderBook.locator('[data-side="ask"] [class*="level"]');
  const bids = orderBook.locator('[data-side="bid"] [class*="level"]');
  await expect(asks).toHaveCount(4);
  await expect(bids).toHaveCount(4);
  expect(await asks.locator("b").allTextContents()).toEqual(["62.0", "61.5", "61.0", "60.5"]);
  expect(await bids.locator("b").allTextContents()).toEqual(["59.5", "59.0", "58.5", "58.0"]);
  await expect(page.locator('[class*="quoteStrip"], [data-quote]')).toHaveCount(0);
  expect(await asks.first().locator("i").evaluate((node) => getComputedStyle(node).animationName)).toContain("eventedge-depth");
  await expect(orderBook.locator('[data-eventedge-signal], [class*="ticker"]')).toHaveCount(0);
  await expect(page.locator('[class*="chart"], [class*="pricePath"], [data-eventedge-signal]')).toHaveCount(0);
});

test("Quant cover holds its planar grid fixed while height, wire geometry, and area color evolve", async ({ page }) => {
  await page.goto("/");
  const panel = page.locator("#quant-panel-caption").locator("..");

  const readFrame = () => panel.evaluate((node) => {
    const peak = node.querySelector('[class*="panelSignal"]');
    const cells = [...node.querySelectorAll('[class*="surfaceCell"]')];
    return {
      peakLeft: Number.parseFloat(peak.style.left),
      peakTop: Number.parseFloat(peak.style.top),
      cells: cells.map((cell) => ({
        left: Number.parseFloat(cell.style.left),
        width: Number.parseFloat(cell.style.width),
        top: Number.parseFloat(cell.style.top),
        color: cell.style.backgroundColor,
      })),
    };
  });

  const before = await readFrame();
  await page.waitForTimeout(720);
  const after = await readFrame();

  expect(Math.abs(after.peakLeft - before.peakLeft)).toBeLessThan(0.0001);
  expect(Math.abs(after.peakTop - before.peakTop)).toBeGreaterThan(0.05);
  expect(after.cells).toHaveLength(100);
  for (let index = 0; index < after.cells.length; index += 1) {
    expect(Math.abs(after.cells[index].left - before.cells[index].left)).toBeLessThan(0.0001);
    expect(Math.abs(after.cells[index].width - before.cells[index].width)).toBeLessThan(0.0001);
  }
  expect(after.cells.some((cell, index) => Math.abs(cell.top - before.cells[index].top) > 0.05)).toBe(true);
  expect(after.cells.some((cell, index) => cell.color !== before.cells[index].color)).toBe(true);
});

test("reduced-motion preference removes explanatory cover animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const movingNodes = page.locator('[class*="panelSignal"], [class*="coverSignal"], [data-eventedge-signal]');
  const count = await movingNodes.count();
  for (let index = 0; index < count; index += 1) {
    const style = await movingNodes.nth(index).evaluate((node) => getComputedStyle(node));
    expect(["0s", "none"]).toContain(style.animationDuration === "0s" ? "0s" : style.animationName);
  }
});
