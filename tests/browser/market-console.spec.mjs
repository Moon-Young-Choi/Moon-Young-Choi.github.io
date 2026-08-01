import { expect, test } from "@playwright/test";

const DETAIL_PATH = "/projects/triangular-arbitrage-detector";

async function openConsole(page) {
  await page.goto(DETAIL_PATH);
  const combobox = page.getByRole("combobox", { name: "Asset set" });
  await expect(combobox).toBeVisible({ timeout: 15_000 });
  return combobox;
}

function demoSecond(text) {
  return Number.parseInt(text.match(/T\+(\d+)s/)?.[1] ?? "-1", 10);
}

test("search, filters, plot roving focus, tabs and timeline table stay operable", async ({ page }) => {
  const combobox = await openConsole(page);
  await page.locator("[data-feed-toggle]").click();

  await combobox.fill("Altlayer");
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await combobox.press("ArrowDown");
  const activeOption = listbox.getByRole("option", { selected: true });
  await expect(activeOption).toContainText("ALT / BTC / KRW");
  await expect(activeOption.getByRole("button")).toHaveCount(0);
  await combobox.press("Enter");
  await expect(combobox).toHaveValue(/ALT \/ BTC \/ KRW/);

  await page.getByRole("group", { name: "Hub group" }).getByRole("button", { exact: true, name: "KRW-BTC-X" }).click();
  await page.getByRole("group", { name: "Direction" }).first().getByRole("button", { exact: true, name: "reverse" }).click();
  await page.getByRole("group", { name: "Fee / leg" }).first().getByRole("button", { exact: true, name: "10 bp" }).click();
  await page.getByRole("group", { name: "Route state" }).getByRole("button", { exact: true, name: "shallow" }).click();
  await page.getByRole("group", { name: "Plot scale" }).getByRole("button", { exact: true, name: "2×" }).click();
  await expect(page.locator('[data-zoom="2"]')).toBeVisible();

  const universePlot = page.getByRole("group", { name: /Asset-set index by net cycle multiplier/ });
  const plotTabStop = universePlot.locator('[data-plot-point][tabindex="0"]');
  await expect(plotTabStop).toHaveCount(1);
  const firstRouteIndex = await plotTabStop.getAttribute("data-plot-route-index");
  await plotTabStop.focus();
  await plotTabStop.press("ArrowRight");
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("data-plot-route-index"))).not.toBe(firstRouteIndex);

  const liquidityTab = page.getByRole("tab", { name: /Liquidity/ });
  await liquidityTab.click();
  await expect(liquidityTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("group", { name: /Executable liquidity by net cycle multiplier/ })).toBeVisible();
  await liquidityTab.focus();
  await liquidityTab.press("ArrowRight");

  const timelineTab = page.getByRole("tab", { name: /Timeline/ });
  await expect(timelineTab).toHaveAttribute("aria-selected", "true");
  const timeline = page.getByRole("group", { name: /sixty-second simulated multiplier timeline/ });
  await expect(timeline.getByRole("button")).toHaveCount(120);
  const timelineTabStop = timeline.locator('[data-timeline-point-index][tabindex="0"]');
  await expect(timelineTabStop).toHaveCount(1);
  const firstTimelineIndex = Number(await timelineTabStop.getAttribute("data-timeline-point-index"));
  await timelineTabStop.focus();
  await timelineTabStop.press("ArrowRight");
  await expect.poll(() => page.evaluate(() => Number(document.activeElement?.getAttribute("data-timeline-point-index")))).toBe(firstTimelineIndex + 2);

  const tableDisclosure = page.locator("details").filter({ hasText: "Open text-equivalent timeline table" });
  await tableDisclosure.locator("summary").click();
  await expect(tableDisclosure.locator("tbody tr")).toHaveCount(60);
});

test("the deterministic 1 Hz source pauses and resumes without ticking while paused", async ({ page }) => {
  await openConsole(page);
  const clock = page.locator("[data-demo-clock]");
  const toggle = page.locator("[data-feed-toggle]");
  const initial = demoSecond(await clock.innerText());

  await expect.poll(async () => demoSecond(await clock.innerText()), { timeout: 2_500 }).not.toBe(initial);
  await toggle.click();
  await expect(toggle).toHaveAccessibleName("Play simulated feed");
  const paused = await clock.innerText();
  await page.waitForTimeout(1_200);
  await expect(clock).toHaveText(paused);

  await toggle.click();
  await expect(toggle).toHaveAccessibleName("Pause simulated feed");
  await expect.poll(async () => await clock.innerText(), { timeout: 2_500 }).not.toBe(paused);
});

test("reduced motion starts and keeps the simulated feed paused", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openConsole(page);
  const clock = page.locator("[data-demo-clock]");
  const toggle = page.locator("[data-feed-toggle]");

  await expect(toggle).toBeDisabled();
  await expect(toggle).toHaveAccessibleName("Simulated feed paused by reduced-motion preference");
  const paused = await clock.innerText();
  await page.waitForTimeout(1_200);
  await expect(clock).toHaveText(paused);
});
