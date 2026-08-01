import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist/client/", import.meta.url);
const showcase = JSON.parse(await readFile(new URL("../app/data/arbitrage-showcase.json", import.meta.url), "utf8"));
const universeManifest = JSON.parse(await readFile(new URL("../app/data/arbitrage-universe-manifest.json", import.meta.url), "utf8"));
const routes = [
  "experience/avikus-simulation-perception",
  "experience/finburh-document-automation",
  "projects/pwr-scan",
  "projects/pwr-scan-validation",
  "projects/open-source-intelligence",
  "projects/bayesian-ad-targeting",
  "projects/triangular-arbitrage-detector",
  "projects/eventedge-derivatives",
];
const arbitrageRoute = "projects/triangular-arbitrage-detector";
const standardRoutes = routes.filter((route) => route !== arbitrageRoute);
const expectedStack = {
  "experience/avikus-simulation-perception": ["C++", "CUDA", "OpenCV", "OpenMP", "Homography", "Synthetic signal generation"],
  "experience/finburh-document-automation": ["Python", "MCP", "Multi-agent orchestration", "DART", "KRX", "Embedding & retrieval", "Spreadsheet and presentation generation"],
  "projects/pwr-scan": ["Python", "NumPy", "SciPy", "FastAPI", "Pydantic", "SoundFile", "Next.js", "React", "TypeScript"],
  "projects/pwr-scan-validation": ["Python", "NumPy", "SciPy", "pandas", "Matplotlib", "Plotly", "pytest"],
  "projects/open-source-intelligence": ["Python", "PyTorch", "Transformers", "NumPy", "SafeTensors", "DART", "FSC/KRX", "pytest"],
  "projects/bayesian-ad-targeting": ["Python", "NumPy", "pandas", "Beta–Bernoulli inference", "Thompson Sampling"],
  "projects/triangular-arbitrage-detector": ["Node.js", "JavaScript", "Axios", "WebSocket", "Upbit REST/WebSocket", "Node test runner"],
  "projects/eventedge-derivatives": ["C++", "Linux CLI", "Monte Carlo simulation", "CVaR", "order-book simulation", "exact-enumeration/CFR validation"],
};

async function routeHtml(route = "") {
  return readFile(new URL(`${route}${route ? "/" : ""}index.html`, outputRoot), "utf8");
}

test("exports the home page and all eight case studies", async () => {
  await access(new URL("index.html", outputRoot));
  await Promise.all(routes.map((route) => access(new URL(`${route}/index.html`, outputRoot))));
});

test("renders the revised home information architecture", async () => {
  const html = await routeHtml();

  assert.match(html, />Work experience</);
  assert.match(html, />02 roles</i);
  assert.match(html, />Research and tech experience</);
  assert.match(html, />06 projects</i);
  assert.match(html, />Mar 2019 — Feb 2027 \(expected\)</);
  assert.match(html, />Mar 2014 — Feb 2016</);
  assert.match(html, />Seoul, South Korea</);
  assert.match(html, />mnyngch8@gmail\.com</);
  assert.match(html, /src="\/brand\/hd-hyundai\.png"/);
  assert.match(html, /src="\/brand\/avikus\.png"/);
  assert.match(html, />MainGate</);
  assert.match(html, />Partners Inc\.</);

  assert.doesNotMatch(html, /Methods &amp; tools|Methods & tools/i);
  assert.doesNotMatch(html, /Scholarship|MEXT|Jung-Gong|Japanese Government/i);
  assert.doesNotMatch(html, /date of birth|\bage\b/i);
});

test("keeps the standard case-study contract on the other seven pages", async () => {
  for (const route of standardRoutes) {
    const html = await routeHtml(route);
    const method = html.indexOf("02 / Method");
    const stack = html.indexOf("03 / Technology stack");
    const validation = html.indexOf("04 / Validation");

    assert.ok(method >= 0, `${route} is missing Method`);
    assert.ok(stack > method, `${route} has Technology stack out of order`);
    assert.ok(validation > stack, `${route} has Validation out of order`);

    for (const item of expectedStack[route]) {
      const renderedItem = item.replaceAll("&", "&amp;");
      assert.ok(html.includes(renderedItem), `${route} is missing ${item}`);
    }
  }
});

test("renders the dedicated arbitrage lab and its precomputed controls", async () => {
  const [html, home, css, consoleCss, triangleCss, clientSource] = await Promise.all([
    routeHtml(arbitrageRoute),
    routeHtml(),
    readFile(new URL("../app/components/ArbitrageLab.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ArbitrageMarketConsole.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/TriangleRouteGraphic.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ArbitrageMarketConsole.tsx", import.meta.url), "utf8"),
  ]);

  for (const marker of [
    "Live trading disabled",
    "All valid listed triangles, one plane.",
    "Loading the verified local simulation artifact",
    "Guards and evidence stay attached.",
    "Baseline guarded-mode requirements",
    "Execution modes",
    "Core SHA-256",
    "No live calls, orders or profit claims",
  ]) assert.ok(html.includes(marker), `arbitrage lab is missing ${marker}`);

  for (const marker of ["role=\"combobox\"", "Universe", "Liquidity", "Timeline", "Forward", "Reverse", "const feeOptions: UniverseFeeBps[] = [0, 5, 10]", "SimulatedUniverseSource"]) {
    assert.ok(clientSource.includes(marker), `arbitrage console source is missing ${marker}`);
  }

  for (const item of expectedStack[arbitrageRoute]) {
    assert.ok(html.includes(item), `arbitrage lab is missing ${item}`);
  }

  assert.match(html, /<table[^>]*>.*?<caption>/s);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /02 \/ Method|03 \/ Technology stack|04 \/ Validation/);
  assert.match(home, new RegExp(`>${universeManifest.triangleSetCount}<.*?> listed triangles.*?>${universeManifest.routeCount}<.*?> directional points.*?>${showcase.verification.passedTests}<.*?> engine tests`, "s"));
  assert.match(css, /@media \(max-width:\s*900px\)/);
  assert.match(css, /@media \(max-width:\s*640px\)/);
  assert.match(css, /@media \(max-width:\s*420px\)/);
  assert.match(css, /@media \(max-width:\s*320px\)/);
  assert.match(consoleCss, /@media \(max-width:\s*900px\)/);
  assert.match(consoleCss, /@media \(max-width:\s*640px\)/);
  assert.match(consoleCss, /@media \(max-width:\s*420px\)/);
  assert.match(consoleCss, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(triangleCss, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /overflow:\s*clip/);
  assert.match(clientSource, /No order submitted/);
  assert.match(clientSource, /display-only simulation/);
  assert.match(clientSource, /fetchArbitrageUniverse/);
  assert.doesNotMatch(clientSource, /wss:\/\/|api\.upbit\.com/);
});

test("copies the verified local universe artifact without embedding it in page HTML", async () => {
  const artifact = new URL("data/arbitrage-universe.v1.json", outputRoot);
  await access(artifact);
  const [html, artifactStat] = await Promise.all([
    routeHtml(arbitrageRoute),
    import("node:fs/promises").then(({ stat }) => stat(artifact)),
  ]);
  assert.ok(artifactStat.size > 1_000_000);
  assert.ok(html.length < 1_000_000, `arbitrage page HTML is unexpectedly large: ${html.length}`);
  assert.ok(html.includes(universeManifest.coreFingerprint.slice(0, 16)) || html.includes(String(universeManifest.routeCount)));
});

test("ships official employer assets locally", async () => {
  await access(new URL("brand/hd-hyundai.png", outputRoot));
  await access(new URL("brand/avikus.png", outputRoot));

  const html = await routeHtml();
  assert.doesNotMatch(html, /<img[^>]+src="https?:\/\//i);
});

test("locks the rendered site to light mode and keeps all responsive tiers", async () => {
  const [html, css] = await Promise.all([
    routeHtml(),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<meta name="color-scheme" content="only light"\/>/i);
  assert.match(html, /<meta name="supported-color-schemes" content="light"\/>/i);
  assert.match(html, /<meta name="theme-color" content="#f0eee6"\/>/i);
  assert.match(css, /color-scheme:\s*only light/);
  assert.match(css, /@media \(max-width:\s*900px\)/);
  assert.match(css, /@media \(max-width:\s*640px\)/);
  assert.match(css, /@media \(max-width:\s*420px\)/);
  assert.match(css, /@media \(hover:\s*hover\) and \(pointer:\s*fine\)/);
  assert.match(css, /@media \(prefers-color-scheme:\s*dark\)/);
  assert.match(css, /\.experience-grid[^}]+grid-template-columns:\s*minmax\(0,1fr\)/);
  assert.match(css, /\.work-card-visual[^}]+margin:\s*24px 0 76px/);
  assert.match(css, /\.identity-name h1 span\s*\{\s*white-space:\s*nowrap/);
});
