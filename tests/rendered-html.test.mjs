import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist/client/", import.meta.url);
const universeManifest = JSON.parse(await readFile(new URL("../app/data/arbitrage-universe-manifest.json", import.meta.url), "utf8"));
const pwrEvidence = JSON.parse(await readFile(new URL("../app/data/pwr-theory-evidence.v1.json", import.meta.url), "utf8"));
const quantSnapshot = JSON.parse(await readFile(new URL("../app/data/quant-architecture.snapshot.v1.json", import.meta.url), "utf8"));
const routes = [
  "experience/avikus-simulation-perception",
  "experience/finburh-document-automation",
  "projects/quant-platform",
  "projects/pwr-scan",
  "projects/pwr-scan-validation",
  "projects/open-source-intelligence",
  "projects/bayesian-ad-targeting",
  "projects/triangular-arbitrage-detector",
  "projects/eventedge-derivatives",
];
const arbitrageRoute = "projects/triangular-arbitrage-detector";
const quantRoute = "projects/quant-platform";
const pwrRoute = "projects/pwr-scan";
const pwrLegacyRoute = "projects/pwr-scan-validation";
const eventEdgeRoute = "projects/eventedge-derivatives";
const standardRoutes = [];
const expectedStack = {
  "projects/triangular-arbitrage-detector": ["Node.js", "JavaScript", "Axios", "WebSocket", "Upbit REST/WebSocket", "Node test runner"],
  "projects/eventedge-derivatives": ["C++", "Linux CLI", "Monte Carlo simulation", "CVaR", "order-book simulation", "exact-enumeration/CFR validation"],
};

async function routeHtml(route = "") {
  return readFile(new URL(`${route}${route ? "/" : ""}index.html`, outputRoot), "utf8");
}

test("exports the home page and all nine canonical or compatibility case-study paths", async () => {
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

test("renders the six projects in the revised order while keeping position colors", async () => {
  const html = await routeHtml();
  const eventEdgePanel = await readFile(new URL("../app/components/EventEdgeProjectPanel.tsx", import.meta.url), "utf8");
  const quant = html.indexOf(">Quant Platform<");
  const pwr = html.indexOf(">PWR-Scan<");
  const osint = html.indexOf(">Open Source Intelligence<");
  const eventEdge = html.indexOf(">EventEdge Derivatives<");
  const arbitrage = html.indexOf(">Triangular Arbitrage Detector<");
  const bayesian = html.indexOf(">Bayesian Ad Targeting<");

  assert.ok(quant >= 0, "Quant Platform card is missing");
  assert.ok(pwr > quant, "PWR-Scan must follow Quant Platform");
  assert.ok(osint > pwr, "Open Source Intelligence must follow PWR-Scan");
  assert.ok(eventEdge > osint, "EventEdge must occupy project position 04");
  assert.ok(arbitrage > eventEdge, "Triangular Arbitrage must follow EventEdge");
  assert.ok(bayesian > arbitrage, "Bayesian Ad Targeting must occupy project position 06");
  assert.match(html, /href="\/projects\/eventedge-derivatives\/" class="project-card coral"/);
  assert.match(html, /href="\/projects\/bayesian-ad-targeting\/" class="project-card paper"/);
  for (const marker of ["styles.orderBook", "styles.bookSide", "styles.level", "styles.spreadBand", "data-side=\"ask\"", "data-side=\"bid\""]) {
    assert.ok(eventEdgePanel.includes(marker), `EventEdge market cover is missing ${marker}`);
  }
  assert.doesNotMatch(eventEdgePanel, /styles\.quoteStrip|data-quote=|Best bid|Best ask/);
  assert.doesNotMatch(eventEdgePanel, /styles\.(chart|pricePath|ticker)|data-eventedge-signal|<span\s*\/>/);
  assert.doesNotMatch(html, /href="\/projects\/pwr-scan-validation\/?"/);
  assert.doesNotMatch(html, /https:\/\/github\.com\/Moon-Young-Choi\/pwr-scan/);
});

test("renders the architecture-only Quant Platform page from the sanitized snapshot", async () => {
  const html = await routeHtml(quantRoute);

  for (const marker of [
    "Architecture model",
    "Work in progress",
    "No live portfolio output",
    "One request · one frozen context",
    "Five operational domains",
    "Complete pair or fail",
    "Market Price Service",
    "Historical Return Evaluator",
    "Reuse without lookahead",
    "Product selection pending",
    "deployment units · ",
    "logical children",
    "validated views · QP-001—012",
    quantSnapshot.provenance.sourceSha256.slice(0, 12),
  ]) assert.ok(html.includes(marker), `Quant Platform is missing ${marker}`);

  assert.match(html, /<table[^>]*>.*?<caption(?:\s[^>]*)?>/s);
  assert.doesNotMatch(html, /02 \/ Method|03 \/ Technology stack|04 \/ Validation/);
  assert.doesNotMatch(html, /github\.com\/Moon-Young-Choi\/.*quant/i);
  assert.doesNotMatch(html, /live returns?|deployed service|realized profit/i);
});

test("renders the default PWR theory panel, client empirical shell, and the static legacy alias", async () => {
  const [html, legacy, home] = await Promise.all([routeHtml(pwrRoute), routeHtml(pwrLegacyRoute), routeHtml()]);

  assert.equal(pwrEvidence.proofEntries.length, 49);
  assert.equal(pwrEvidence.appendixSections.length, 14);
  assert.equal(pwrEvidence.foundations.length, 15);
  for (const entry of pwrEvidence.proofEntries) {
    assert.equal((html.match(new RegExp(`id="${entry.id}"`, "g")) ?? []).length, 1, `${entry.id} must render once`);
  }
  for (const foundation of pwrEvidence.foundations) {
    assert.equal((html.match(new RegExp(`id="${foundation.id}"`, "g")) ?? []).length, 1, `${foundation.id} must render once`);
  }
  for (const marker of [
    "Proof-led statistical system",
    "Finite-sample randomization",
    "PWR-Scan · proof and study console",
    "PWR-Scan theory contents",
    "pwr-theory-tab",
    "pwr-empirical-tab",
    "Loading verified synthetic study",
    "PDF not published",
  ]) assert.ok(html.includes(marker), `PWR theory page is missing ${marker}`);

  assert.match(html, /id="pwr-theory-panel"[^>]*role="tabpanel"/);
  assert.match(html, /id="pwr-empirical-panel"[^>]*role="tabpanel"[^>]*hidden/);
  assert.doesNotMatch(html, /Assumptions, proof chain and boundary|Code-path \/ trace mapping/);

  assert.match(html, /<math[\s>]/);
  assert.match(html, /<table[^>]*>.*?<caption(?:\s[^>]*)?>/s);
  assert.match(html, /href="https:\/\/github\.com\/Moon-Young-Choi\/pwr-scan"/);
  assert.doesNotMatch(home, /https:\/\/github\.com\/Moon-Young-Choi\/pwr-scan/);
  assert.ok(legacy.includes("Proof-led statistical system"));
  assert.match(legacy, /rel="canonical"[^>]*href="\/projects\/pwr-scan\/"|href="\/projects\/pwr-scan\/"[^>]*rel="canonical"/);
  assert.doesNotMatch(html, /02 \/ Method|03 \/ Technology stack|04 \/ Validation/);
});

test("copies the authenticated local PWR synthetic study artifact", async () => {
  const artifact = new URL("data/pwr-empirical-demo.v1.json", outputRoot);
  await access(artifact);
  const data = JSON.parse(await readFile(artifact, "utf8"));
  assert.equal(data.schemaVersion, "pwr-empirical-demo.v1");
  assert.equal(data.provenance.dataClass, "synthetic");
  assert.equal(data.rows.length, 1008);
  assert.equal(data.boundary.performanceClaim, false);
});

test("keeps the standard case-study contract on the remaining standard pages", async () => {
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

test("renders dedicated public-safe work pages and abstract geometric home graphics", async () => {
  const [avikus, finburh, home, graphicSource, waterGridSource, graphicCss, pageCss] = await Promise.all([
    routeHtml("experience/avikus-simulation-perception"),
    routeHtml("experience/finburh-document-automation"),
    routeHtml(),
    readFile(new URL("../app/components/WorkExperienceGraphic.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/AvikusWaterGrid.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/WorkExperienceGraphic.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/WorkExperiencePage.module.css", import.meta.url), "utf8"),
  ]);

  for (const marker of [
    "Public-safe reconstruction",
    "No employer code or data",
    "NMEA 0183",
    "Event-driven scenario engine",
    "Relative speed",
    "if · else · while",
    "Visible and infrared panorama alignment",
    "OpenCV homography",
    "CUDA warp + blend",
    "OpenMP",
    "Accelerated simulation",
    "350×",
  ]) assert.ok(avikus.toUpperCase().includes(marker.toUpperCase()), `Avikus is missing ${marker}`);

  for (const marker of [
    "Private product architecture",
    "Conversation",
    "Task",
    "Work",
    "Research",
    "Assumption was not an agent",
    "Separate LLM orchestrator",
    "DART MCP",
    "KRX MCP",
    "Web MCP",
    "~30%",
    "Word",
    "PowerPoint",
    "Excel",
    "30+",
    "~200",
    "~5 min",
    "Seconds",
  ]) assert.ok(finburh.includes(marker), `FINBURH is missing ${marker}`);

  for (const html of [avikus, finburh]) {
    assert.doesNotMatch(html, /02 \/ Method|03 \/ Technology stack|04 \/ Validation/);
    assert.doesNotMatch(html, /<svg|<canvas|<pre|<code/i);
    assert.doesNotMatch(html, /<table|<math/i);
  }
  assert.doesNotMatch(avikus, /150×|\breplay\b|355×|10,000×|\b(?:GGA|RMC|HDT|VTG)\b/i);
  assert.match(home, /src="\/brand\/hd-hyundai\.png"/);
  assert.match(home, /src="\/brand\/avikus\.png"/);
  assert.match(home, />MainGate</);
  assert.match(home, />Partners Inc\.</);

  for (const marker of ["AvikusProjectiveField", "AvikusWaterGrid", "FinburhDependencyLattice", "signalField", "signalGrid", "gridCell", "gridSegment", "gridPoint", "signalTarget", "targetPoint", "signalWave", "primaryWave", "secondaryWave", "ownShip", "signalTargets", "commandRoutes", "conversationAgent", "taskAgent", "workAgent", "researchAgent"]) {
    assert.ok(graphicSource.includes(marker) || waterGridSource.includes(marker) || graphicCss.includes(marker), `work graphic is missing ${marker}`);
  }
  for (const coordinate of ["41.6, y: 40.0", "30.1, y: 40.7", "36.9, y: 21.9", "82.6, y: 34.8", "87.6, y: 63.7", "6.5, y: 61.6", "98.0, y: 51.7"]) {
    assert.ok(graphicSource.includes(coordinate), `Avikus signal field is missing coordinate ${coordinate}`);
  }
  assert.doesNotMatch(`${graphicSource}\n${waterGridSource}`, /<svg|<canvas/i);
  assert.doesNotMatch(graphicSource, /opticalField|wavefrontField|apertureOne|apertureTwo|refractiveLens|refractedBands|caustic|mosaicField|mosaicSpiral|spiralTile|spiralPoints|spiralTiles|homographyField|referencePlane|inputFrames|inputFrameOne|inputFrameTwo|inputFrameThree|correspondenceLinks|linkSetOne|linkSetTwo|linkSetThree|overlapRegion|projectionGrid|packetOrbit|panoramaFrame|thermalWindow|shipCuboid|outputCluster|wordCluster|slideCluster|sheetCluster/);
  assert.match(graphicCss, /@keyframes target-transmit/);
  assert.match(graphicCss, /@keyframes signal-wave/);
  assert.match(waterGridSource, /const CELL_COUNT = 8;/);
  assert.match(waterGridSource, /const POINT_COUNT = CELL_COUNT \+ 1;/);
  assert.match(waterGridSource, /requestAnimationFrame/);
  assert.match(waterGridSource, /prefers-reduced-motion: reduce/);
  assert.match(waterGridSource, /const gridCells = Array\.from\(\{ length: CELL_COUNT \* CELL_COUNT \}/);
  assert.match(waterGridSource, /scale \* \(0\.018 \+ unitHash\(index \+ 401\) \* 0\.028\)/);
  assert.match(waterGridSource, /querySelectorAll<HTMLElement>\(`\.\$\{styles\.signalWave\}`\)/);
  assert.match(waterGridSource, /const trail = wavefront\.radius - cellDistance;/);
  assert.match(waterGridSource, /if \(trail < 0 \|\| trail > bandWidth\) return;/);
  assert.doesNotMatch(waterGridSource, /cycleTime|rippleOffsets|rippleTravelSeconds/);
  assert.match(waterGridSource, /brightness \* 0\.28/);
  assert.match(graphicCss, /\.gridSegment,[\s\S]*?\.gridPoint\s*\{[^}]*background:\s*#fff;/s);
  assert.match(graphicCss, /\.gridCell\s*\{[^}]*background:\s*#fff;[^}]*opacity:\s*0;/s);
  assert.doesNotMatch(graphicCss, /@keyframes ownship-receive|\.ownShip::after/);
  assert.match(graphicCss, /\.targetPoint\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;[^}]*background:\s*#fff;/s);
  assert.match(graphicCss, /\.ownShip\s*\{[^}]*width:\s*15px;[^}]*height:\s*15px;[^}]*border:\s*2px solid var\(--ink\);[^}]*background:\s*var\(--lime\);/s);
  assert.match(graphicCss, /\.secondaryWave\s*\{[^}]*animation-delay:\s*calc\(var\(--signal-delay\) \+ \.17s\);/s);
  assert.match(graphicCss, /@keyframes command-flow/);
  assert.match(graphicCss, /\.conversationRoute\s*\{[^}]*left:\s*11%;[^}]*width:\s*35%;/s);
  assert.match(graphicCss, /\.researchAgent\s*\{[^}]*top:\s*calc\(69% - 33px\);/s);
  assert.match(graphicCss, /\.hero \.taskResearchRoute\s*\{[^}]*width:\s*20%;[^}]*rotate\(41deg\);/s);
  assert.match(graphicCss, /\.hero \.workResearchRoute\s*\{[^}]*width:\s*21%;[^}]*rotate\(141deg\);/s);
  for (const fill of ["background: var(--paper)", "background: var(--coral)", "background: var(--blue)", "background: var(--ink)"]) {
    assert.ok(graphicCss.includes(fill), `FINBURH agent palette is missing ${fill}`);
  }
  assert.match(graphicCss, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(pageCss, /@media \(max-width:\s*900px\)/);
  assert.match(pageCss, /@media \(max-width:\s*640px\)/);
  assert.match(pageCss, /@media \(max-width:\s*420px\)/);
  assert.match(pageCss, /\.signalPlot i\[data-received="true"\]/);
  assert.match(pageCss, /\.panoramaFrame/);
  assert.match(pageCss, /\.infraredWindow/);
  assert.match(pageCss, /@media \(prefers-reduced-motion:\s*reduce\)/);
});

test("renders the dedicated EventEdge market and its private-source boundary", async () => {
  const [html, home, css, clientSource] = await Promise.all([
    routeHtml(eventEdgeRoute),
    routeHtml(),
    readFile(new URL("../app/components/EventEdgeMarket.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/EventEdgeMarketConsole.tsx", import.meta.url), "utf8"),
  ]);

  for (const marker of [
    "Private research artifact",
    "Reconstructed demo",
    "No real-money trading",
    "Loading verified reconstructed market",
    "Trade after public action. Reveal after settlement.",
    "The decision object is the combined portfolio.",
    "EventEdge public claim ledger",
    "Not implemented in this portfolio revision",
    "PDF not published",
  ]) assert.ok(html.includes(marker), `EventEdge is missing ${marker}`);

  for (const marker of ["Perspective", "Candidate", "Requested notional", "Book profile", "Terminal state", "REVEAL & SETTLE", "aria-live=\"polite\"", "loadEventEdgeDemo"]) {
    assert.ok(clientSource.includes(marker), `EventEdge console source is missing ${marker}`);
  }
  for (const item of expectedStack[eventEdgeRoute]) assert.ok(html.includes(item) || studyMarker(item), `EventEdge is missing ${item}`);
  assert.match(html, /<math[\s>]/);
  assert.match(html, /<table[^>]*>.*?<caption(?:\s[^>]*)?>/s);
  assert.doesNotMatch(html, /02 \/ Method|03 \/ Technology stack|04 \/ Validation/);
  assert.doesNotMatch(html, /href="https:\/\/github\.com\/Moon-Young-Choi\/.*eventedge/i);
  assert.doesNotMatch(html, /observed return|realized performance|live order submission/i);
  assert.match(home, /href="\/projects\/eventedge-derivatives\/" class="project-card coral"/);
  assert.match(css, /@media \(max-width:\s*900px\)/);
  assert.match(css, /@media \(max-width:\s*640px\)/);
  assert.match(css, /@media \(max-width:\s*420px\)/);
  assert.match(css, /@media \(max-width:\s*320px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /overflow:\s*clip/);

  function studyMarker(item) {
    const aliases = {
      "C++": "Linux CLI simulator",
      "Linux CLI": "Linux CLI simulator",
      "Monte Carlo simulation": "Exact / Monte Carlo split",
      "CVaR": "Portfolio CVaR",
      "order-book simulation": "20 × 2 order books",
      "exact-enumeration/CFR validation": "CFR diagnostics",
    };
    return html.includes(aliases[item] ?? item);
  }
});

test("copies the verified local EventEdge artifact", async () => {
  const artifactUrl = new URL("data/eventedge-demo.v1.json", outputRoot);
  await access(artifactUrl);
  const data = JSON.parse(await readFile(artifactUrl, "utf8"));
  assert.equal(data.schemaVersion, "eventedge-demo.v1");
  assert.equal(data.provenance.dataClass, "reconstructed-demo");
  assert.equal(data.decisionRows.length, 24);
  assert.equal(data.settlementRows.length, 96);
  assert.equal(data.boundary.browserCalculation, false);
  assert.equal(data.boundary.observedPerformance, false);
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
  assert.match(home, /data-triangle-route="true"[^>]*data-variant="card"/);
  assert.match(home, />KRW<.*?>BTC<.*?>ETH</s);
  assert.doesNotMatch(home, /listed triangles.*directional points.*engine tests/s);
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
  assert.match(css, /\.experience-card-body[^}]+grid-template-columns:\s*minmax\(0,\.92fr\) minmax\(0,1\.08fr\)/);
  assert.match(css, /\.work-card-visual[^}]+grid-template-columns:\s*minmax\(0,1fr\) auto minmax\(0,1fr\)/);
  assert.match(css, /\.work-card-visual[^}]+margin:\s*0/);
  assert.match(css, /\.identity-name h1 span\s*\{\s*white-space:\s*nowrap/);
});
