import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../dist/client/projects/bayesian-ad-targeting/index.html", import.meta.url);

test("Bayesian page keeps section order, MathML and the fixed evidence block", async () => {
  const html = await readFile(pagePath, "utf8");
  const system = html.indexOf("01 / System");
  const method = html.indexOf("02 / Method");
  const stack = html.indexOf("03 / Technology stack");
  const validation = html.indexOf("04 / Validation");
  assert.ok(system >= 0 && system < method && method < stack && stack < validation);
  assert.match(html, /<math[\s>]/);
  for (const value of ["125,002", "f0", "16.37%", "0.000371", "0.000201", "0.000289", "95.2%", "12.62 &lt; f0 ≤ 21.94"]) {
    assert.ok(html.includes(value), `missing benchmark value ${value}`);
  }
  assert.match(html, /github\.com\/Moon-Young-Choi\/bayesian-ad-targeting/);
  assert.match(html, /github\.com\/Moon-Young-Choi\/moon-young-choi\.github\.io/);
  assert.equal((html.match(/data-evidence-boundary="true"/g) ?? []).length, 1);
});

test("Bayesian page preserves its public route and canonical target", async () => {
  const html = await readFile(pagePath, "utf8");
  assert.match(html, /rel="canonical" href="\/projects\/bayesian-ad-targeting\/"/);
});
