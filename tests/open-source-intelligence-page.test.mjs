import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const htmlUrl = new URL("../dist/client/projects/open-source-intelligence/index.html", import.meta.url);

test("renders the dedicated mathematical OSINT study in the required order", async () => {
  const html = await readFile(htmlUrl, "utf8");
  const system = html.indexOf("01 / System");
  const method = html.indexOf("02 / Method");
  const stack = html.indexOf("03 / Technology stack");
  const validation = html.indexOf("04 / Validation");

  assert.ok(system >= 0, "System is missing");
  assert.ok(method > system, "Method is out of order");
  assert.ok(stack > method, "Technology stack is out of order");
  assert.ok(validation > stack, "Validation is out of order");
  assert.match(html, /<math[\s>]/);
  assert.match(html, /rel="canonical"[^>]*href="\/projects\/open-source-intelligence\/"|href="\/projects\/open-source-intelligence\/"[^>]*rel="canonical"/);
  for (let gate = 1; gate <= 12; gate += 1) assert.match(html, new RegExp(`<b>G${gate}<\\/b>`));
});

test("locks the tensor, parameter, and sealed TEST evidence into static HTML", async () => {
  const html = await readFile(htmlUrl, "utf8");

  for (const marker of [
    "60 × 8",
    "8 × 6 × 128 → 48 × 128",
    "Bᵢ × 768 · Bᵢ=16…785",
    "217 total · max 26",
    "3,548,161",
    "82,624",
    "585",
    "3,631,370",
    "−3.2648975849",
    "−0.9690",
    "0.04285",
    "0.04839",
    "0.2917",
    "1.0000",
    "−2.4312",
    "−2.4233",
  ]) assert.ok(html.includes(marker), `OSINT evidence is missing ${marker}`);

  assert.match(html, /href="https:\/\/github\.com\/Moon-Young-Choi\/open-source-intelligence"/);
  assert.equal((html.match(/data-evidence-boundary="true"/g) ?? []).length, 1);
  assert.match(html, /too wide(?:<!-- -->)?—not perfect calibration/);
});

test("keeps specification and observed evidence semantically distinct", async () => {
  const html = await readFile(htmlUrl, "utf8");

  assert.ok((html.match(/Research specification/g) ?? []).length >= 3);
  assert.ok((html.match(/Observed IRVS evidence/g) ?? []).length >= 3);
  assert.match(html, /The completed public evidence is the smaller 36-observation IRVS/);
  assert.match(html, /not evidence of market-wide predictive superiority, profitability, or a production trading system/);
});
