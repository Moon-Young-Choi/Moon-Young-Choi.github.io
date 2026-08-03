import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routes = ["pwr-scan", "open-source-intelligence", "eventedge-derivatives", "triangular-arbitrage-detector", "bayesian-ad-targeting"];

test("five selected projects share the paper contract while Quant remains unchanged", async () => {
  for (const route of routes) {
    const html = await readFile(new URL(`../dist/client/projects/${route}/index.html`, import.meta.url), "utf8");
    assert.equal((html.match(/<h1/g) ?? []).length, 1, `${route} h1 count`);
    assert.equal((html.match(/<section[^>]*data-paper-section/g) ?? []).length, 4, `${route} section count`);
    assert.equal((html.match(/<header[^>]*data-paper-header/g) ?? []).length, 1, `${route} paper header count`);
    assert.equal((html.match(/<details[^>]*data-paper-toc/g) ?? []).length, 1, `${route} contents count`);
    assert.doesNotMatch(html, /<details[^>]*data-paper-toc[^>]*open|<details[^>]*open[^>]*data-paper-toc/, `${route} contents must default closed`);
    assert.match(html, /<b>Abstract\.<\/b>/);
    assert.match(html, /<b>Keywords\.<\/b>/);
    assert.match(html, /Evidence boundary/);
  }
  const quant = await readFile(new URL("../dist/client/projects/quant-platform/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(quant, /data-paper-header/);
});

test("paper pages retain only numeric or observed-result tables", async () => {
  const counts = { "pwr-scan": 0, "open-source-intelligence": 1, "eventedge-derivatives": 0, "triangular-arbitrage-detector": 0, "bayesian-ad-targeting": 3 };
  for (const [route, count] of Object.entries(counts)) {
    const html = await readFile(new URL(`../dist/client/projects/${route}/index.html`, import.meta.url), "utf8");
    assert.equal((html.match(/<table/g) ?? []).length, count, `${route} static table count`);
  }
});
