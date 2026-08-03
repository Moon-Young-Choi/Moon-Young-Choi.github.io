import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../dist/client/projects/bayesian-ad-targeting/index.html", import.meta.url);

test("Bayesian paper keeps four numbered sections, equations, labs, and observed evidence", async () => {
  const html = await readFile(pagePath, "utf8");
  for (const heading of ["Identification and uplift segmentation", "Posterior inference", "Interactive policy labs", "Allocation and independent evidence"]) assert.ok(html.includes(heading));
  assert.equal((html.match(/<section[^>]*data-paper-section/g) ?? []).length, 4);
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.match(html, /<math[\s>]/);
  for (const value of ["125,002", "f0", "16.37%", "0.000371", "0.000201", "0.000289", "95.2%", "12.62 &lt; f0"]) assert.ok(html.includes(value), `missing benchmark value ${value}`);
  for (const control of ["Split Value Lab", "Posterior &amp; Pooling Lab", "Decision Lab"]) assert.ok(html.includes(control));
  assert.match(html, /github\.com\/Moon-Young-Choi\/bayesian-ad-targeting/);
  assert.match(html, /data-paper-toc/);
  assert.doesNotMatch(html, /03 \/ Technology stack/);
});

test("Bayesian page preserves its public route and canonical target", async () => {
  const html = await readFile(pagePath, "utf8");
  assert.match(html, /rel="canonical" href="\/projects\/bayesian-ad-targeting\/"/);
});
