import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist/client/", import.meta.url);
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
  assert.match(html, />Jung-Gong Scholarship · 2025</);
  assert.match(html, />MEXT · 2016</);
  assert.match(html, />mnyngch8@gmail\.com</);
  assert.match(html, /src="\/brand\/hd-hyundai\.png"/);
  assert.match(html, /src="\/brand\/avikus\.png"/);
  assert.match(html, />MainGate</);

  assert.doesNotMatch(html, /Methods &amp; tools|Methods & tools/i);
  assert.doesNotMatch(html, /Japanese Government|Undergraduate Scholarship/i);
  assert.doesNotMatch(html, /date of birth|\bage\b/i);
});

test("places the technology stack between method and validation on every case study", async () => {
  for (const route of routes) {
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

test("ships official employer assets locally", async () => {
  await access(new URL("brand/hd-hyundai.png", outputRoot));
  await access(new URL("brand/avikus.png", outputRoot));

  const html = await routeHtml();
  assert.doesNotMatch(html, /<img[^>]+src="https?:\/\//i);
});
