import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("../app/components/TriangleRouteGraphic.tsx", import.meta.url);
const cssUrl = new URL("../app/components/TriangleRouteGraphic.module.css", import.meta.url);
const legacyCssUrl = new URL("../app/components/ArbitrageLab.module.css", import.meta.url);
const consumerUrls = [
  new URL("../app/components/ArbitrageRouteLab.tsx", import.meta.url),
  new URL("../app/components/ArbitrageProjectPanel.tsx", import.meta.url),
];

test("uses one CSS and HTML triangle implementation in the remaining interactive surfaces", async () => {
  const [component, ...consumers] = await Promise.all([componentUrl, ...consumerUrls].map((url) => readFile(url, "utf8")));

  assert.match(component, /variant:\s*"hero"\s*\|\s*"lab"\s*\|\s*"card"/);
  assert.match(component, /direction:\s*"forward"\s*\|\s*"reverse"/);
  assert.match(component, /data-triangle-route="true"/);
  assert.equal((component.match(/data-edge=/g) ?? []).length, 3);
  assert.doesNotMatch(component, /<svg|<canvas/i);

  for (const consumer of consumers) {
    assert.match(consumer, /import \{ TriangleRouteGraphic \}/);
    assert.match(consumer, /<TriangleRouteGraphic/);
  }
});

test("anchors three equal edges to a single non-crossing coordinate system", async () => {
  const [css, legacyCss] = await Promise.all([readFile(cssUrl, "utf8"), readFile(legacyCssUrl, "utf8")]);

  assert.match(css, /\.geometry\s*\{[^}]*aspect-ratio:\s*1\.154700538\s*\/\s*1/s);
  assert.match(css, /\.node1\s*\{\s*left:\s*50%;\s*top:\s*0;/);
  assert.match(css, /\.node2\s*\{\s*left:\s*0;\s*top:\s*100%;/);
  assert.match(css, /\.node3\s*\{\s*left:\s*100%;\s*top:\s*100%;/);
  assert.match(css, /\.edge12[^}]*left:\s*50%[^}]*top:\s*0[^}]*rotate\(120deg\)/);
  assert.match(css, /\.edge23[^}]*left:\s*0[^}]*top:\s*100%[^}]*rotate\(0deg\)/);
  assert.match(css, /\.edge31[^}]*left:\s*100%[^}]*top:\s*100%[^}]*rotate\(-120deg\)/);
  assert.match(css, /\[data-direction="reverse"\]\s+\.signal\s*\{\s*animation-direction:\s*reverse/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.signal\s*\{\s*animation:\s*none !important/);
  assert.match(css, /@media \(max-width:\s*900px\)/);
  assert.match(css, /@media \(max-width:\s*640px\)/);
  assert.match(css, /@media \(max-width:\s*420px\)/);
  assert.match(css, /\.card\s+\.node\s*\{[^}]*place-content:\s*center/s);
  assert.match(css, /\.card\s+\.edge12\s+\.signal\s*\{[^}]*var\(--blue\)/s);
  assert.match(css, /\.card\s+\.edge23\s+\.signal\s*\{[^}]*var\(--lime\)/s);
  assert.match(css, /\.card\s+\.edge31\s+\.signal\s*\{[^}]*var\(--coral\)/s);
  assert.doesNotMatch(css, /\.card\s+\.edge(?:12|23|31)[^{]*\{[^}]*display:\s*none/s);

  assert.doesNotMatch(legacyCss, /heroLineA|routeLineA|homeEdgeA|routeReverse|homeSignal|homeBook|homeStats/);
});

test("exports the card variant and hydrates the lab variant inside the paper", async () => {
  const [home, detail, consoleSource] = await Promise.all([
    readFile(new URL("../dist/client/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/client/projects/triangular-arbitrage-detector/index.html", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ArbitrageMarketConsole.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(home, /data-triangle-route="true"[^>]*data-variant="card"/);
  assert.match(detail, /data-paper-header/);
  assert.match(detail, /Loading the verified local simulation artifact/);
  assert.match(consoleSource, /<TriangleRouteGraphic[^>]+variant="lab"/s);
});
