import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const htmlUrl = new URL("../dist/client/projects/open-source-intelligence/index.html", import.meta.url);

test("renders the four-section OSINT research paper in order", async () => {
  const html = await readFile(htmlUrl, "utf8");
  const headings = ["Point-in-time data contract", "Document–market model", "Fixed chronological test", "Verification and evidence boundary"];
  let cursor = -1;
  for (const heading of headings) { const next = html.indexOf(heading); assert.ok(next > cursor, `${heading} is missing or out of order`); cursor = next; }
  assert.equal((html.match(/<section[^>]*data-paper-section/g) ?? []).length, 4);
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.match(html, /<math[\s>]/);
  assert.match(html, /data-paper-toc/);
  assert.match(html, /rel="canonical"[^>]*href="\/projects\/open-source-intelligence\/"|href="\/projects\/open-source-intelligence\/"[^>]*rel="canonical"/);
});

test("keeps the numeric sealed TEST result and negative interpretation", async () => {
  const html = await readFile(htmlUrl, "utf8");
  for (const marker of ["36 observations", "22 for training", "six for validation", "eight for the terminal test", "3,631,370", "−0.9690", "0.04285", "0.04839", "0.2917", "1.0000", "−2.4312", "−2.4233"]) assert.ok(html.includes(marker), `OSINT evidence is missing ${marker}`);
  assert.match(html, /<table[^>]*>.*?<caption/s);
  assert.match(html, /intervals that are too wide, not perfect calibration/);
  assert.match(html, /negative/);
  assert.match(html, /github\.com\/Moon-Young-Choi\/open-source-intelligence/);
});

test("uses no prose-only tables", async () => {
  const html = await readFile(htmlUrl, "utf8");
  assert.equal((html.match(/<table/g) ?? []).length, 1);
  assert.match(html, /DART\/FSC cutoff/);
  assert.match(html, /Correction-family snapshot/);
});
