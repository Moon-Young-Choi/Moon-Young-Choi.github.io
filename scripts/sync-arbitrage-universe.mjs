import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultDestination = fileURLToPath(new URL("../public/data/arbitrage-universe.v1.json", import.meta.url));
const defaultManifestDestination = fileURLToPath(new URL("../app/data/arbitrage-universe-manifest.json", import.meta.url));
const repositoryUrl = "https://github.com/Moon-Young-Choi/triangular-arbitrage-detector";
const artifactPath = "artifacts/universe-demo.v1.json";
const fixturePath = "fixtures/upbit/market-all.2026-08-01.json";
const fingerprintAlgorithm = "sha256(stable-json-authenticated-v1)";
const frameCount = 60;
const frameIntervalMs = 1000;
const feeBps = [0, 5, 10];
const routeValueColumns = [
  "netMultiplier0Bps",
  "netMultiplier5Bps",
  "netMultiplier10Bps",
  "liquidityKrw",
  "statusCode",
];
const categories = ["KRW-BTC-X", "BTC-USDT-X", "KRW-USDT-X", "KRW-BTC-USDT"];
const startAmountsByAsset = {
  KRW: [10000, 50000, 100000],
  BTC: [0.0001, 0.0005, 0.001],
  USDT: [10, 50, 100],
};
const statusDefinitions = [
  [0, "eligible"],
  [1, "profitable"],
  [2, "stale"],
  [3, "shallow"],
  [4, "blocked"],
];
const statusPrecedence = [4, 2, 3, 1, 0];
const maxSourceBytes = 64 * 1024 * 1024;
const forbiddenNormalizedKeys = new Set([
  "accesskey",
  "apikey",
  "secret",
  "secretkey",
  "authorization",
  "jwt",
  "privatekey",
  "accountbalance",
  "accountbalances",
  "realizedpnl",
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exactRecord(value, keys, path) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${path} must be an object`);
  const expected = [...keys].sort();
  const actual = Object.keys(value).sort();
  const unknown = actual.filter((key) => !expected.includes(key));
  const missing = expected.filter((key) => !actual.includes(key));
  assert(unknown.length === 0, `Unknown field${unknown.length === 1 ? "" : "s"} at ${path}: ${unknown.join(", ")}`);
  assert(missing.length === 0, `Missing field${missing.length === 1 ? "" : "s"} at ${path}: ${missing.join(", ")}`);
}

function stringValue(value, path, { nullable = false } = {}) {
  if (nullable && value === null) return;
  assert(typeof value === "string" && value.length > 0, `${path} must be a non-empty string${nullable ? " or null" : ""}`);
}

function finiteNumber(value, path, { minimum = null, integer = false } = {}) {
  assert(typeof value === "number" && Number.isFinite(value), `${path} must be a finite number`);
  if (integer) assert(Number.isInteger(value), `${path} must be an integer`);
  if (minimum !== null) assert(value >= minimum, `${path} must be >= ${minimum}`);
}

function booleanValue(value, path) {
  assert(typeof value === "boolean", `${path} must be boolean`);
}

function enumValue(value, choices, path) {
  assert(choices.includes(value), `${path} must be one of ${choices.join(", ")}`);
}

function arrayValue(value, path, { length = null, minimumLength = null } = {}) {
  assert(Array.isArray(value), `${path} must be an array`);
  if (length !== null) assert(value.length === length, `${path} must contain exactly ${length} items`);
  if (minimumLength !== null) assert(value.length >= minimumLength, `${path} must contain at least ${minimumLength} items`);
}

function uniqueStrings(value, path, options = {}) {
  arrayValue(value, path, options);
  value.forEach((item, index) => stringValue(item, `${path}[${index}]`));
  assert(new Set(value).size === value.length, `${path} must not contain duplicates`);
}

function exactArray(value, expected, path) {
  arrayValue(value, path, { length: expected.length });
  assert(value.every((item, index) => item === expected[index]), `${path} must equal ${JSON.stringify(expected)}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizedKey(key) {
  return key.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function scanForSecrets(value, path = "universe") {
  if (typeof value === "string") {
    assert(!/^bearer\s+/iu.test(value), `Bearer credential material is forbidden at ${path}`);
    assert(!/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(value), `JWT credential material is forbidden at ${path}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForSecrets(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(!forbiddenNormalizedKeys.has(normalizedKey(key)), `Forbidden account or credential field at ${path}.${key}`);
    scanForSecrets(child, `${path}.${key}`);
  }
}

function stableValue(value) {
  if (value instanceof Map) {
    return stableValue(Object.fromEntries(
      [...value.entries()].sort(([left], [right]) => String(left).localeCompare(String(right))),
    ));
  }
  if (value instanceof Set) return [...value].map(stableValue).sort();
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined && typeof item !== "function")
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  if (typeof value === "bigint") return value.toString();
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

export function universeCoreFingerprint(universe) {
  const authenticatedProvenance = { ...universe.provenance };
  delete authenticatedProvenance.generatedAt;
  delete authenticatedProvenance.coreFingerprint;
  return sha256(stableStringify({
    schemaVersion: universe.schemaVersion,
    provenance: authenticatedProvenance,
    summary: universe.summary,
    assets: universe.assets,
    triangleSets: universe.triangleSets,
    frames: universe.frames,
    routeDetails: universe.routeDetails,
    boundary: universe.boundary,
  }));
}

function approximatelyEqual(left, right, scale = 1e-10) {
  return Math.abs(left - right) <= scale * Math.max(1, Math.abs(left), Math.abs(right));
}

function validateMarket(market, path) {
  stringValue(market, path);
  assert(/^[A-Z0-9]+-[A-Z0-9]+$/u.test(market), `${path} must be an uppercase market code`);
}

function validateProvenance(provenance) {
  exactRecord(provenance, [
    "repository", "engineCommit", "generatedAt", "source", "generator", "fingerprintAlgorithm", "coreFingerprint",
  ], "universe.provenance");
  assert(provenance.repository === repositoryUrl, `provenance.repository must be ${repositoryUrl}`);
  assert(/^[0-9a-f]{40}$/u.test(provenance.engineCommit), "provenance.engineCommit must be a lowercase full SHA");
  assert(!Number.isNaN(Date.parse(provenance.generatedAt)), "provenance.generatedAt must be ISO-8601");
  assert(provenance.fingerprintAlgorithm === fingerprintAlgorithm, `provenance.fingerprintAlgorithm must be ${fingerprintAlgorithm}`);
  assert(/^[0-9a-f]{64}$/u.test(provenance.coreFingerprint), "provenance.coreFingerprint must be lowercase SHA-256 hex");

  exactRecord(provenance.source, ["provider", "endpoint", "capturedAt", "fixturePath", "fixtureSha256", "marketCount"], "universe.provenance.source");
  stringValue(provenance.source.provider, "universe.provenance.source.provider");
  stringValue(provenance.source.endpoint, "universe.provenance.source.endpoint");
  assert(/^https:\/\/api\.upbit\.com\//u.test(provenance.source.endpoint), "provenance.source.endpoint must be the public Upbit API");
  assert(!Number.isNaN(Date.parse(provenance.source.capturedAt)), "provenance.source.capturedAt must be ISO-8601");
  assert(provenance.source.fixturePath === fixturePath, `provenance.source.fixturePath must be ${fixturePath}`);
  assert(/^[0-9a-f]{64}$/u.test(provenance.source.fixtureSha256), "provenance.source.fixtureSha256 must be lowercase SHA-256 hex");
  finiteNumber(provenance.source.marketCount, "universe.provenance.source.marketCount", { integer: true, minimum: 1 });

  exactRecord(provenance.generator, ["id", "version", "seed"], "universe.provenance.generator");
  assert(provenance.generator.id === "universe-demo", "provenance.generator.id must be universe-demo");
  assert(provenance.generator.version === "1.1.0", "provenance.generator.version must be 1.1.0");
  stringValue(provenance.generator.seed, "universe.provenance.generator.seed");
}

function validateSummary(summary) {
  exactRecord(summary, [
    "marketCount", "assetCount", "triangleSetCount", "routeCount", "marketBookCount", "frameCount", "frameIntervalMs", "feeBps",
    "startAmountsByAsset", "hubBreakdown", "routeValueColumns", "statusBasisFeeBps", "statusCodes",
    "statusPrecedence", "shallowThresholdKrw", "featuredTriangleSetId",
  ], "universe.summary");
  for (const key of ["marketCount", "assetCount", "triangleSetCount", "routeCount", "marketBookCount"]) {
    finiteNumber(summary[key], `universe.summary.${key}`, { integer: true, minimum: 1 });
  }
  assert(summary.frameCount === frameCount, `universe.summary.frameCount must be ${frameCount}`);
  assert(summary.frameIntervalMs === frameIntervalMs, `universe.summary.frameIntervalMs must be ${frameIntervalMs}`);
  exactArray(summary.feeBps, feeBps, "universe.summary.feeBps");
  exactArray(summary.routeValueColumns, routeValueColumns, "universe.summary.routeValueColumns");
  assert(summary.statusBasisFeeBps === 5, "universe.summary.statusBasisFeeBps must be 5");
  exactArray(summary.statusPrecedence, statusPrecedence, "universe.summary.statusPrecedence");
  finiteNumber(summary.shallowThresholdKrw, "universe.summary.shallowThresholdKrw", { minimum: 0 });
  stringValue(summary.featuredTriangleSetId, "universe.summary.featuredTriangleSetId");

  exactRecord(summary.startAmountsByAsset, ["KRW", "BTC", "USDT"], "universe.summary.startAmountsByAsset");
  for (const [asset, expected] of Object.entries(startAmountsByAsset)) {
    exactArray(summary.startAmountsByAsset[asset], expected, `universe.summary.startAmountsByAsset.${asset}`);
  }

  exactRecord(summary.hubBreakdown, categories, "universe.summary.hubBreakdown");
  for (const category of categories) {
    finiteNumber(summary.hubBreakdown[category], `universe.summary.hubBreakdown.${category}`, { integer: true, minimum: 0 });
  }

  arrayValue(summary.statusCodes, "universe.summary.statusCodes", { length: statusDefinitions.length });
  summary.statusCodes.forEach((status, index) => {
    const statusPath = `universe.summary.statusCodes[${index}]`;
    exactRecord(status, ["code", "key", "label", "description"], statusPath);
    assert(status.code === statusDefinitions[index][0], `${statusPath}.code must be ${statusDefinitions[index][0]}`);
    assert(status.key === statusDefinitions[index][1], `${statusPath}.key must be ${statusDefinitions[index][1]}`);
    stringValue(status.label, `${statusPath}.label`);
    stringValue(status.description, `${statusPath}.description`);
  });
}

function validateAsset(asset, path) {
  exactRecord(asset, ["symbol", "koreanName", "englishName", "marketCount", "quoteMarketCount", "triangleCount"], path);
  stringValue(asset.symbol, `${path}.symbol`);
  assert(/^[A-Z0-9]+$/u.test(asset.symbol), `${path}.symbol must be uppercase`);
  stringValue(asset.koreanName, `${path}.koreanName`, { nullable: true });
  stringValue(asset.englishName, `${path}.englishName`, { nullable: true });
  for (const key of ["marketCount", "quoteMarketCount", "triangleCount"]) {
    finiteNumber(asset[key], `${path}.${key}`, { integer: true, minimum: 0 });
  }
  assert(asset.quoteMarketCount <= asset.marketCount, `${path}.quoteMarketCount cannot exceed marketCount`);
}

function validateAssetName(assetName, path, assetBySymbol) {
  exactRecord(assetName, ["symbol", "koreanName", "englishName"], path);
  stringValue(assetName.symbol, `${path}.symbol`);
  stringValue(assetName.koreanName, `${path}.koreanName`, { nullable: true });
  stringValue(assetName.englishName, `${path}.englishName`, { nullable: true });
  const asset = assetBySymbol.get(assetName.symbol);
  assert(asset, `${path}.symbol does not reference an asset`);
  assert(assetName.koreanName === asset.koreanName && assetName.englishName === asset.englishName, `${path} must match the asset dictionary`);
}

function validateTriangleSet(triangle, path, assetBySymbol) {
  exactRecord(triangle, ["id", "category", "startAsset", "assets", "assetNames", "markets", "routeIds"], path);
  stringValue(triangle.id, `${path}.id`);
  enumValue(triangle.category, categories, `${path}.category`);
  enumValue(triangle.startAsset, ["KRW", "BTC", "USDT"], `${path}.startAsset`);
  uniqueStrings(triangle.assets, `${path}.assets`, { length: 3 });
  assert(triangle.assets.includes(triangle.startAsset), `${path}.assets must include startAsset`);
  arrayValue(triangle.assetNames, `${path}.assetNames`, { length: 3 });
  triangle.assetNames.forEach((assetName, index) => {
    validateAssetName(assetName, `${path}.assetNames[${index}]`, assetBySymbol);
    assert(assetName.symbol === triangle.assets[index], `${path}.assetNames must align with assets`);
  });
  uniqueStrings(triangle.markets, `${path}.markets`, { length: 3 });
  triangle.markets.forEach((market, index) => validateMarket(market, `${path}.markets[${index}]`));
  uniqueStrings(triangle.routeIds, `${path}.routeIds`, { length: 2 });

  const requiredAssets = {
    "KRW-BTC-X": ["KRW", "BTC"],
    "BTC-USDT-X": ["BTC", "USDT"],
    "KRW-USDT-X": ["KRW", "USDT"],
    "KRW-BTC-USDT": ["KRW", "BTC", "USDT"],
  }[triangle.category];
  assert(requiredAssets.every((asset) => triangle.assets.includes(asset)), `${path}.assets do not match category ${triangle.category}`);
}

function validateBookSide(side, path, descending) {
  arrayValue(side, path, { length: 5 });
  side.forEach((level, index) => {
    const levelPath = `${path}[${index}]`;
    arrayValue(level, levelPath, { length: 2 });
    finiteNumber(level[0], `${levelPath}[0]`, { minimum: 0 });
    finiteNumber(level[1], `${levelPath}[1]`, { minimum: 0 });
    assert(level[0] > 0, `${levelPath}[0] must be positive`);
    if (index > 0) {
      const previousPrice = side[index - 1][0];
      assert(descending ? previousPrice >= level[0] : previousPrice <= level[0], `${path} prices must be ${descending ? "descending" : "ascending"}`);
    }
  });
}

function validateMarketBook(book, path) {
  exactRecord(book, ["id", "market", "timestampMs", "ageMs", "bids", "asks"], path);
  stringValue(book.id, `${path}.id`);
  validateMarket(book.market, `${path}.market`);
  finiteNumber(book.timestampMs, `${path}.timestampMs`, { integer: true, minimum: 0 });
  finiteNumber(book.ageMs, `${path}.ageMs`, { minimum: 0 });
  validateBookSide(book.bids, `${path}.bids`, true);
  validateBookSide(book.asks, `${path}.asks`, false);
  assert(book.bids[0][0] <= book.asks[0][0], `${path} best bid cannot exceed best ask`);
}

function validateStatusCode(value, path) {
  finiteNumber(value, path, { integer: true, minimum: 0 });
  assert(value <= 4, `${path} must be between 0 and 4`);
}

function validateLegAmount(leg, path, routeLeg) {
  exactRecord(leg, ["index", "inputAsset", "outputAsset", "inputAmount", "grossOutputAmount", "feeAmount", "outputAmount"], path);
  finiteNumber(leg.index, `${path}.index`, { integer: true, minimum: 1 });
  assert(leg.index === routeLeg.index, `${path}.index must align with the route leg`);
  stringValue(leg.inputAsset, `${path}.inputAsset`);
  stringValue(leg.outputAsset, `${path}.outputAsset`);
  assert(leg.inputAsset === routeLeg.inputAsset && leg.outputAsset === routeLeg.outputAsset, `${path} assets must align with the route leg`);
  for (const key of ["inputAmount", "grossOutputAmount", "feeAmount", "outputAmount"]) {
    finiteNumber(leg[key], `${path}.${key}`, { minimum: 0 });
  }
  assert(approximatelyEqual(leg.grossOutputAmount - leg.feeAmount, leg.outputAmount), `${path} fee arithmetic is inconsistent`);
}

function validateFeeRow(row, path, route, summary) {
  exactRecord(row, [
    "startAmount", "feeBps", "feeMultiplier", "outputAmount", "netProfitRate", "netProfitAmount",
    "liquidityKrw", "statusCode", "legAmounts",
  ], path);
  finiteNumber(row.startAmount, `${path}.startAmount`, { minimum: 0 });
  enumValue(row.feeBps, feeBps, `${path}.feeBps`);
  for (const key of ["feeMultiplier", "outputAmount", "liquidityKrw"]) finiteNumber(row[key], `${path}.${key}`, { minimum: 0 });
  for (const key of ["netProfitRate", "netProfitAmount"]) finiteNumber(row[key], `${path}.${key}`);
  validateStatusCode(row.statusCode, `${path}.statusCode`);
  assert(row.statusCode === route.snapshot.statusCode, `${path}.statusCode must use the 5 bp route status basis`);
  assert(approximatelyEqual(row.feeMultiplier, route.snapshot.feeMultipliers[String(row.feeBps)]), `${path}.feeMultiplier must match the route snapshot`);
  assert(approximatelyEqual(row.outputAmount, row.startAmount * row.feeMultiplier), `${path}.outputAmount is inconsistent`);
  assert(approximatelyEqual(row.netProfitRate, row.feeMultiplier - 1), `${path}.netProfitRate is inconsistent`);
  assert(approximatelyEqual(row.netProfitAmount, row.outputAmount - row.startAmount), `${path}.netProfitAmount is inconsistent`);
  assert(approximatelyEqual(row.liquidityKrw, route.snapshot.liquidityKrw), `${path}.liquidityKrw must match the route snapshot`);
  arrayValue(row.legAmounts, `${path}.legAmounts`, { length: 3 });
  row.legAmounts.forEach((leg, index) => validateLegAmount(leg, `${path}.legAmounts[${index}]`, route.legs[index]));
  assert(approximatelyEqual(row.legAmounts[0].inputAmount, row.startAmount), `${path} first leg must start with startAmount`);
  for (let index = 1; index < row.legAmounts.length; index += 1) {
    assert(approximatelyEqual(row.legAmounts[index].inputAmount, row.legAmounts[index - 1].outputAmount), `${path} leg amounts must be continuous`);
  }
  assert(approximatelyEqual(row.legAmounts[2].outputAmount, row.outputAmount), `${path} final leg must match outputAmount`);
  if (row.feeBps === 0) {
    assert(row.legAmounts.every((leg) => approximatelyEqual(leg.feeAmount, 0)), `${path} zero-fee row must have zero leg fees`);
  }
  assert(summary.feeBps.includes(row.feeBps), `${path}.feeBps must be declared by summary`);
}

function validateRoute(route, path, triangleById, bookById, summary, firstFrameValue) {
  exactRecord(route, [
    "id", "triangleSetId", "direction", "engineDirection", "startAsset", "startAmounts", "route", "markets",
    "bookIds", "legs", "snapshot", "feeRows",
  ], path);
  stringValue(route.id, `${path}.id`);
  stringValue(route.triangleSetId, `${path}.triangleSetId`);
  enumValue(route.direction, ["forward", "reverse"], `${path}.direction`);
  enumValue(route.engineDirection, ["canonical", "reverse"], `${path}.engineDirection`);
  assert(route.engineDirection === (route.direction === "forward" ? "canonical" : "reverse"), `${path}.engineDirection must align with direction`);
  enumValue(route.startAsset, ["KRW", "BTC", "USDT"], `${path}.startAsset`);
  exactArray(route.startAmounts, startAmountsByAsset[route.startAsset], `${path}.startAmounts`);
  uniqueStrings(route.markets, `${path}.markets`, { length: 3 });
  route.markets.forEach((market, index) => validateMarket(market, `${path}.markets[${index}]`));
  uniqueStrings(route.bookIds, `${path}.bookIds`, { length: 3 });
  uniqueStrings(route.route.slice(0, 3), `${path}.route[0..2]`, { length: 3 });
  arrayValue(route.route, `${path}.route`, { length: 4 });
  route.route.forEach((asset, index) => stringValue(asset, `${path}.route[${index}]`));
  assert(route.route[0] === route.startAsset && route.route[3] === route.startAsset, `${path}.route must be a closed route from startAsset`);

  const triangle = triangleById.get(route.triangleSetId);
  assert(triangle, `${path}.triangleSetId does not reference a triangle set`);
  assert(triangle.routeIds.includes(route.id), `${path}.id is not declared by its triangle set`);
  assert(route.startAsset === triangle.startAsset, `${path}.startAsset must match its triangle set`);
  assert(route.route.slice(0, 3).every((asset) => triangle.assets.includes(asset)), `${path}.route must use its triangle assets`);
  assert(route.markets.every((market) => triangle.markets.includes(market)), `${path}.markets must use its triangle markets`);

  arrayValue(route.legs, `${path}.legs`, { length: 3 });
  route.legs.forEach((leg, index) => {
    const legPath = `${path}.legs[${index}]`;
    exactRecord(leg, ["index", "market", "side", "inputAsset", "outputAsset", "bookId"], legPath);
    assert(leg.index === index + 1, `${legPath}.index must be ${index + 1}`);
    assert(leg.market === route.markets[index], `${legPath}.market must align with route.markets`);
    enumValue(leg.side, ["bid", "ask"], `${legPath}.side`);
    assert(leg.inputAsset === route.route[index] && leg.outputAsset === route.route[index + 1], `${legPath} assets must align with route`);
    assert(leg.bookId === route.bookIds[index], `${legPath}.bookId must align with route.bookIds`);
    const book = bookById.get(leg.bookId);
    assert(book, `${legPath}.bookId does not reference a market book`);
    assert(book.market === leg.market, `${legPath}.bookId must reference the leg market`);
    const [quoteAsset, baseAsset] = leg.market.split("-");
    const expectedSide = leg.inputAsset === baseAsset && leg.outputAsset === quoteAsset
      ? "bid"
      : leg.inputAsset === quoteAsset && leg.outputAsset === baseAsset
        ? "ask"
        : null;
    assert(expectedSide !== null && leg.side === expectedSide, `${legPath}.side does not convert its input and output assets`);
  });

  exactRecord(route.snapshot, ["feeMultipliers", "liquidityKrw", "statusCode"], `${path}.snapshot`);
  exactRecord(route.snapshot.feeMultipliers, ["0", "5", "10"], `${path}.snapshot.feeMultipliers`);
  feeBps.forEach((fee) => finiteNumber(route.snapshot.feeMultipliers[String(fee)], `${path}.snapshot.feeMultipliers.${fee}`, { minimum: 0 }));
  finiteNumber(route.snapshot.liquidityKrw, `${path}.snapshot.liquidityKrw`, { minimum: 0 });
  validateStatusCode(route.snapshot.statusCode, `${path}.snapshot.statusCode`);
  assert(firstFrameValue, `${path} is missing its snapshot frame value`);
  for (let index = 0; index < 3; index += 1) {
    assert(approximatelyEqual(firstFrameValue[index], route.snapshot.feeMultipliers[String(feeBps[index])]), `${path}.snapshot fee multiplier does not match frame zero`);
  }
  assert(approximatelyEqual(firstFrameValue[3], route.snapshot.liquidityKrw), `${path}.snapshot liquidity does not match frame zero`);
  assert(firstFrameValue[4] === route.snapshot.statusCode, `${path}.snapshot status does not match frame zero`);

  arrayValue(route.feeRows, `${path}.feeRows`, { length: route.startAmounts.length * summary.feeBps.length });
  const feeRowKeys = new Set();
  route.feeRows.forEach((row, index) => {
    validateFeeRow(row, `${path}.feeRows[${index}]`, route, summary);
    const key = `${row.startAmount}|${row.feeBps}`;
    assert(!feeRowKeys.has(key), `${path}.feeRows contains duplicate ${key}`);
    feeRowKeys.add(key);
  });
  for (const startAmount of route.startAmounts) for (const fee of summary.feeBps) {
    assert(feeRowKeys.has(`${startAmount}|${fee}`), `${path}.feeRows is missing ${startAmount} at ${fee} bp`);
  }
}

function validateRouteValue(value, path, summary) {
  arrayValue(value, path, { length: routeValueColumns.length });
  for (let index = 0; index < 4; index += 1) finiteNumber(value[index], `${path}[${index}]`, { minimum: 0 });
  validateStatusCode(value[4], `${path}[4]`);
  if (value[4] === 0) assert(value[1] <= 1, `${path} eligible status requires 5 bp multiplier <= 1`);
  if (value[4] === 1) assert(value[1] > 1, `${path} profitable status requires 5 bp multiplier > 1`);
  if (value[4] === 3) assert(value[3] < summary.shallowThresholdKrw, `${path} shallow status requires liquidity below its threshold`);
}

function validateFrame(frame, path, index, routeCount, summary) {
  exactRecord(frame, [
    "streamId", "sequence", "demoTime", "marketDataTime",
    "index", "offsetMs", "at", "atEpochMs", "summary", "routeValues",
  ], path);
  stringValue(frame.streamId, `${path}.streamId`);
  assert(/^universe-demo:[a-z0-9-]+:[0-9a-f]{16}$/u.test(frame.streamId), `${path}.streamId must be a stable demo-stream identifier`);
  finiteNumber(frame.sequence, `${path}.sequence`, { integer: true, minimum: 1 });
  assert(frame.sequence === index + 1, `${path}.sequence must be ${index + 1}`);
  stringValue(frame.demoTime, `${path}.demoTime`);
  stringValue(frame.marketDataTime, `${path}.marketDataTime`);
  assert(!Number.isNaN(Date.parse(frame.demoTime)), `${path}.demoTime must be ISO-8601`);
  assert(!Number.isNaN(Date.parse(frame.marketDataTime)), `${path}.marketDataTime must be ISO-8601`);
  assert(frame.index === index, `${path}.index must be ${index}`);
  assert(frame.offsetMs === index * frameIntervalMs, `${path}.offsetMs must preserve the 1 Hz sequence`);
  stringValue(frame.at, `${path}.at`);
  assert(!Number.isNaN(Date.parse(frame.at)), `${path}.at must be ISO-8601`);
  finiteNumber(frame.atEpochMs, `${path}.atEpochMs`, { integer: true, minimum: 0 });
  assert(Date.parse(frame.at) === frame.atEpochMs, `${path}.at and atEpochMs must identify the same instant`);
  assert(frame.demoTime === frame.at, `${path}.demoTime must match the deterministic frame time`);
  assert(frame.marketDataTime === frame.at, `${path}.marketDataTime must match the synthetic data watermark`);
  exactRecord(frame.summary, ["statusCounts", "positiveRouteCountsByFeeBps"], `${path}.summary`);
  exactRecord(frame.summary.statusCounts, ["0", "1", "2", "3", "4"], `${path}.summary.statusCounts`);
  exactRecord(frame.summary.positiveRouteCountsByFeeBps, ["0", "5", "10"], `${path}.summary.positiveRouteCountsByFeeBps`);
  for (const code of [0, 1, 2, 3, 4]) finiteNumber(frame.summary.statusCounts[String(code)], `${path}.summary.statusCounts.${code}`, { integer: true, minimum: 0 });
  for (const fee of feeBps) finiteNumber(frame.summary.positiveRouteCountsByFeeBps[String(fee)], `${path}.summary.positiveRouteCountsByFeeBps.${fee}`, { integer: true, minimum: 0 });
  arrayValue(frame.routeValues, `${path}.routeValues`, { length: routeCount });
  frame.routeValues.forEach((value, routeIndex) => validateRouteValue(value, `${path}.routeValues[${routeIndex}]`, summary));

  const actualStatusCounts = Object.fromEntries([0, 1, 2, 3, 4].map((code) => [String(code), 0]));
  const actualPositiveCounts = { "0": 0, "5": 0, "10": 0 };
  frame.routeValues.forEach((value) => {
    actualStatusCounts[String(value[4])] += 1;
    for (let feeIndex = 0; feeIndex < feeBps.length; feeIndex += 1) {
      if (value[feeIndex] > 1) actualPositiveCounts[String(feeBps[feeIndex])] += 1;
    }
  });
  for (const [code, count] of Object.entries(actualStatusCounts)) {
    assert(frame.summary.statusCounts[code] === count, `${path}.summary.statusCounts.${code} is inconsistent`);
  }
  for (const [fee, count] of Object.entries(actualPositiveCounts)) {
    assert(frame.summary.positiveRouteCountsByFeeBps[fee] === count, `${path}.summary.positiveRouteCountsByFeeBps.${fee} is inconsistent`);
  }
}

function validateBoundary(boundary) {
  exactRecord(boundary, [
    "syntheticData", "topologyFromPinnedUpbitFixture", "liveMarketData", "externalApiCallsAtBuild", "liveTrading",
    "apiKeysIncluded", "accountBalancesIncluded", "realizedPnlIncluded", "profitClaim", "statement",
  ], "universe.boundary");
  for (const key of [
    "syntheticData", "topologyFromPinnedUpbitFixture", "liveMarketData", "externalApiCallsAtBuild", "liveTrading",
    "apiKeysIncluded", "accountBalancesIncluded", "realizedPnlIncluded", "profitClaim",
  ]) booleanValue(boundary[key], `universe.boundary.${key}`);
  stringValue(boundary.statement, "universe.boundary.statement");
  assert(boundary.syntheticData === true && boundary.topologyFromPinnedUpbitFixture === true, "Universe data must be synthetic and use pinned public topology");
  assert(
    boundary.liveMarketData === false &&
    boundary.externalApiCallsAtBuild === false &&
    boundary.liveTrading === false &&
    boundary.apiKeysIncluded === false &&
    boundary.accountBalancesIncluded === false &&
    boundary.realizedPnlIncluded === false &&
    boundary.profitClaim === false,
    "Universe boundary must exclude live data, network calls, trading, account material, and profit claims",
  );
}

export function validateArbitrageUniverse(universe) {
  scanForSecrets(universe);
  exactRecord(universe, ["schemaVersion", "provenance", "summary", "assets", "triangleSets", "frames", "routeDetails", "boundary"], "universe");
  assert(universe.schemaVersion === 1, "universe.schemaVersion must be 1");
  validateProvenance(universe.provenance);
  validateSummary(universe.summary);
  validateBoundary(universe.boundary);

  arrayValue(universe.assets, "universe.assets", { length: universe.summary.assetCount });
  universe.assets.forEach((asset, index) => validateAsset(asset, `universe.assets[${index}]`));
  const assetBySymbol = new Map(universe.assets.map((asset) => [asset.symbol, asset]));
  assert(assetBySymbol.size === universe.assets.length, "universe.assets contains duplicate symbols");

  arrayValue(universe.triangleSets, "universe.triangleSets", { length: universe.summary.triangleSetCount });
  universe.triangleSets.forEach((triangle, index) => validateTriangleSet(triangle, `universe.triangleSets[${index}]`, assetBySymbol));
  const triangleById = new Map(universe.triangleSets.map((triangle) => [triangle.id, triangle]));
  assert(triangleById.size === universe.triangleSets.length, "universe.triangleSets contains duplicate ids");
  assert(triangleById.has(universe.summary.featuredTriangleSetId), "summary.featuredTriangleSetId does not reference a triangle set");
  const expectedFeaturedTriangleSetId = triangleById.has("BTC|ETH|KRW")
    ? "BTC|ETH|KRW"
    : [...triangleById.keys()].sort((left, right) => left.localeCompare(right))[0];
  assert(universe.summary.featuredTriangleSetId === expectedFeaturedTriangleSetId, "summary.featuredTriangleSetId must use the deterministic featured selection rule");

  exactRecord(universe.routeDetails, ["snapshotFrameIndex", "bookLevelColumns", "marketBooks", "routes"], "universe.routeDetails");
  assert(universe.routeDetails.snapshotFrameIndex === 0, "routeDetails.snapshotFrameIndex must be 0");
  exactArray(universe.routeDetails.bookLevelColumns, ["price", "size"], "universe.routeDetails.bookLevelColumns");
  arrayValue(universe.routeDetails.marketBooks, "universe.routeDetails.marketBooks", { minimumLength: 1 });
  universe.routeDetails.marketBooks.forEach((book, index) => validateMarketBook(book, `universe.routeDetails.marketBooks[${index}]`));
  const bookById = new Map(universe.routeDetails.marketBooks.map((book) => [book.id, book]));
  assert(bookById.size === universe.routeDetails.marketBooks.length, "routeDetails.marketBooks contains duplicate ids");
  assert(universe.summary.marketBookCount === universe.routeDetails.marketBooks.length, "summary.marketBookCount must match routeDetails.marketBooks.length");

  arrayValue(universe.frames, "universe.frames", { length: universe.summary.frameCount });
  universe.frames.forEach((frame, index) => validateFrame(frame, `universe.frames[${index}]`, index, universe.summary.routeCount, universe.summary));
  const streamId = universe.frames[0].streamId;
  assert(universe.frames.every((frame) => frame.streamId === streamId), "universe.frames must share one deterministic streamId");
  for (let index = 1; index < universe.frames.length; index += 1) {
    assert(universe.frames[index].sequence === universe.frames[index - 1].sequence + 1, `universe.frames[${index}].sequence must increase monotonically`);
    assert(universe.frames[index].atEpochMs - universe.frames[index - 1].atEpochMs === frameIntervalMs, `universe.frames[${index}] must be exactly 1 second after the prior frame`);
  }

  arrayValue(universe.routeDetails.routes, "universe.routeDetails.routes", { length: universe.summary.routeCount });
  universe.routeDetails.routes.forEach((route, index) => validateRoute(
    route,
    `universe.routeDetails.routes[${index}]`,
    triangleById,
    bookById,
    universe.summary,
    universe.frames[universe.routeDetails.snapshotFrameIndex].routeValues[index],
  ));
  const routeById = new Map(universe.routeDetails.routes.map((route) => [route.id, route]));
  assert(routeById.size === universe.routeDetails.routes.length, "routeDetails.routes contains duplicate ids");
  assert(universe.summary.routeCount === universe.summary.triangleSetCount * 2, "Every triangle set must have exactly two routes");

  for (const triangle of universe.triangleSets) {
    const forward = routeById.get(triangle.routeIds[0]);
    const reverse = routeById.get(triangle.routeIds[1]);
    assert(forward && reverse, `Triangle ${triangle.id} has a missing route`);
    assert(forward.triangleSetId === triangle.id && reverse.triangleSetId === triangle.id, `Triangle ${triangle.id} routes must point back to the set`);
    assert(forward.direction === "forward" && reverse.direction === "reverse", `Triangle ${triangle.id} routeIds must be [forward, reverse]`);
  }

  for (const asset of universe.assets) {
    const actualTriangleCount = universe.triangleSets.filter((triangle) => triangle.assets.includes(asset.symbol)).length;
    assert(asset.triangleCount === actualTriangleCount, `Asset ${asset.symbol} triangleCount is inconsistent`);
  }
  for (const category of categories) {
    const actual = universe.triangleSets.filter((triangle) => triangle.category === category).length;
    assert(universe.summary.hubBreakdown[category] === actual, `summary.hubBreakdown.${category} is inconsistent`);
  }
  assert(universe.provenance.source.marketCount === universe.summary.marketCount, "Source and summary market counts must match");

  const actualFingerprint = universeCoreFingerprint(universe);
  assert(actualFingerprint === universe.provenance.coreFingerprint, `Fingerprint mismatch: expected ${universe.provenance.coreFingerprint}, computed ${actualFingerprint}`);
  return {
    marketCount: universe.summary.marketCount,
    assetCount: universe.assets.length,
    triangleSetCount: universe.triangleSets.length,
    routeCount: universe.routeDetails.routes.length,
    frameCount: universe.frames.length,
    fingerprint: actualFingerprint,
  };
}

export function validateUniverseRemoteSourceUrl(source, commit) {
  assert(/^[0-9a-f]{40}$/u.test(commit ?? ""), "Remote sync requires --commit with a lowercase full artifact SHA");
  const expected = `https://raw.githubusercontent.com/Moon-Young-Choi/triangular-arbitrage-detector/${commit}/${artifactPath}`;
  assert(source === expected, `Remote source must be exactly ${expected}`);
  return expected;
}

export function validateUniverseEngineCommitPin(engineCommit, provenanceEngineCommit) {
  assert(/^[0-9a-f]{40}$/u.test(engineCommit ?? ""), "Sync requires --engine-commit with the fingerprint-protected engine SHA");
  assert(engineCommit === provenanceEngineCommit, "--engine-commit must match provenance.engineCommit");
  return engineCommit;
}

function parseArgs(argv) {
  const args = { check: false, destination: defaultDestination, manifestDestination: defaultManifestDestination };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--check") args.check = true;
    else if (token === "--source") args.source = argv[++index];
    else if (token === "--commit") args.commit = argv[++index];
    else if (token === "--engine-commit") args.engineCommit = argv[++index];
    else if (token === "--destination") args.destination = resolve(argv[++index]);
    else if (token === "--manifest-destination") args.manifestDestination = resolve(argv[++index]);
    else throw new Error(`Unknown argument: ${token}`);
  }
  args.source ??= args.check ? args.destination : process.env.ARBITRAGE_UNIVERSE_SOURCE;
  assert(args.source, "Pass --source <local-file-or-pinned-raw-url> (or ARBITRAGE_UNIVERSE_SOURCE)");
  return args;
}

function buildManifest(universe) {
  return {
    schemaVersion: 1,
    coreFingerprint: universe.provenance.coreFingerprint,
    capturedAt: universe.provenance.source.capturedAt,
    generatedAt: universe.provenance.generatedAt,
    engineCommit: universe.provenance.engineCommit,
    marketCount: universe.summary.marketCount,
    assetCount: universe.summary.assetCount,
    triangleSetCount: universe.summary.triangleSetCount,
    routeCount: universe.summary.routeCount,
    frameCount: universe.summary.frameCount,
    frameIntervalMs: universe.summary.frameIntervalMs,
    marketBookCount: universe.routeDetails.marketBooks.length,
    hubBreakdown: universe.summary.hubBreakdown,
    feeBps: universe.summary.feeBps,
    simulated: universe.boundary.syntheticData,
    liveMarketData: universe.boundary.liveMarketData,
    liveTrading: universe.boundary.liveTrading,
  };
}

async function readSource(source, commit) {
  if (/^https:\/\//iu.test(source)) {
    validateUniverseRemoteSourceUrl(source, commit);
    const response = await fetch(source, { redirect: "error" });
    assert(response.ok, `Remote source returned HTTP ${response.status}`);
    const raw = await response.text();
    assert(Buffer.byteLength(raw, "utf8") <= maxSourceBytes, `Remote source exceeds ${maxSourceBytes} bytes`);
    return { raw, remote: true };
  }
  assert(!/^[a-z]+:\/\//iu.test(source), "Local sources must be filesystem paths; remote sources must use the approved HTTPS raw URL");
  const sourcePath = resolve(source);
  const sourceStat = await stat(sourcePath);
  assert(sourceStat.isFile(), "Local universe source must be a file");
  assert(sourceStat.size <= maxSourceBytes, `Local source exceeds ${maxSourceBytes} bytes`);
  return { raw: await readFile(sourcePath, "utf8"), remote: false };
}

async function writeJsonAtomic(destination, value) {
  await mkdir(dirname(destination), { recursive: true });
  const temporaryPath = `${destination}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(value)}\n`, "utf8");
    await rename(temporaryPath, destination);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

export async function syncArbitrageUniverse(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const { raw, remote } = await readSource(args.source, args.commit);
  const universe = JSON.parse(raw);
  const result = validateArbitrageUniverse(universe);
  if (remote || args.engineCommit !== undefined) {
    validateUniverseEngineCommitPin(args.engineCommit, universe.provenance.engineCommit);
  }
  if (!args.check) {
    await writeJsonAtomic(args.destination, universe);
    await writeJsonAtomic(args.manifestDestination, buildManifest(universe));
  }
  return { ...result, destination: args.destination, manifestDestination: args.manifestDestination, checkedOnly: args.check };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  syncArbitrageUniverse().then((result) => {
    console.log(`${result.checkedOnly ? "Validated" : "Synced"} ${result.routeCount} routes × ${result.frameCount} frames · ${result.fingerprint}`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
