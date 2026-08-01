import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultDestination = fileURLToPath(new URL("../app/data/arbitrage-showcase.json", import.meta.url));
const repositoryUrl = "https://github.com/Moon-Young-Choi/triangular-arbitrage-detector";
const fingerprintAlgorithm = "sha256(stable-json-authenticated-v1)";
const forbiddenNormalizedKeys = new Set([
  "accesskey", "apikey", "secret", "secretkey", "authorization", "jwt",
  "accountbalance", "accountbalances", "balance", "balances", "privatekey", "realizedpnl",
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
  assert(unknown.length === 0, `Unknown field${unknown.length > 1 ? "s" : ""} at ${path}: ${unknown.join(", ")}`);
  assert(missing.length === 0, `Missing field${missing.length > 1 ? "s" : ""} at ${path}: ${missing.join(", ")}`);
}

function stringValue(value, path) {
  assert(typeof value === "string" && value.length > 0, `${path} must be a non-empty string`);
}

function finiteNumber(value, path, { nullable = false } = {}) {
  if (nullable && value === null) return;
  assert(typeof value === "number" && Number.isFinite(value), `${path} must be a finite number${nullable ? " or null" : ""}`);
}

function integerValue(value, path, minimum = 0) {
  assert(Number.isInteger(value) && value >= minimum, `${path} must be an integer >= ${minimum}`);
}

function booleanValue(value, path) {
  assert(typeof value === "boolean", `${path} must be boolean`);
}

function enumValue(value, choices, path) {
  assert(choices.includes(value), `${path} must be one of ${choices.join(", ")}`);
}

function stringArray(value, path) {
  assert(Array.isArray(value) && value.length > 0, `${path} must be a non-empty array`);
  value.forEach((item, index) => stringValue(item, `${path}[${index}]`));
}

function normalizedKey(key) {
  return key.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function scanForSecrets(value, path = "showcase") {
  if (Array.isArray(value)) return value.forEach((item, index) => scanForSecrets(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(!forbiddenNormalizedKeys.has(normalizedKey(key)), `Forbidden account or credential field at ${path}.${key}`);
    scanForSecrets(child, `${path}.${key}`);
  }
}

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function coreFingerprint(showcase) {
  const authenticatedProvenance = { ...showcase.provenance };
  delete authenticatedProvenance.generatedAt;
  delete authenticatedProvenance.coreFingerprint;
  const authenticated = {
    schemaVersion: showcase.schemaVersion,
    provenance: authenticatedProvenance,
    verification: showcase.verification,
    routeLab: showcase.routeLab,
    scenarios: showcase.scenarios,
    guards: showcase.guards,
    boundary: showcase.boundary,
  };
  return createHash("sha256").update(stableStringify(authenticated), "utf8").digest("hex");
}

function validateMoney(value, path, { nullable = false } = {}) {
  exactRecord(value, ["asset", "value"], path);
  stringValue(value.asset, `${path}.asset`);
  finiteNumber(value.value, `${path}.value`, { nullable });
}

function validateStartAmount(value, path) {
  exactRecord(value, ["asset", "value", "label"], path);
  stringValue(value.asset, `${path}.asset`);
  finiteNumber(value.value, `${path}.value`);
  stringValue(value.label, `${path}.label`);
}

function validateLeg(leg, path) {
  exactRecord(leg, ["index", "market", "side", "inputAsset", "inputAmount", "limitPrice", "feeAmount", "feeAsset", "outputAsset", "outputAmount", "fillRatio"], path);
  integerValue(leg.index, `${path}.index`, 1);
  stringValue(leg.market, `${path}.market`);
  enumValue(leg.side, ["bid", "ask"], `${path}.side`);
  for (const key of ["inputAsset", "feeAsset", "outputAsset"]) stringValue(leg[key], `${path}.${key}`);
  for (const key of ["inputAmount", "fillRatio"]) finiteNumber(leg[key], `${path}.${key}`);
  for (const key of ["limitPrice", "outputAmount"]) finiteNumber(leg[key], `${path}.${key}`, { nullable: true });
  finiteNumber(leg.feeAmount, `${path}.feeAmount`, { nullable: true });
  assert(leg.fillRatio >= 0 && leg.fillRatio <= 1, `${path}.fillRatio must be between 0 and 1`);
}

function validateOrderbook(book, path) {
  exactRecord(book, ["market", "depthLevels", "bids", "asks"], path);
  stringValue(book.market, `${path}.market`);
  integerValue(book.depthLevels, `${path}.depthLevels`, 1);
  for (const side of ["bids", "asks"]) {
    assert(Array.isArray(book[side]) && book[side].length > 0, `${path}.${side} must be a non-empty array`);
    book[side].forEach((level, index) => {
      const levelPath = `${path}.${side}[${index}]`;
      exactRecord(level, ["price", "size"], levelPath);
      finiteNumber(level.price, `${levelPath}.price`);
      finiteNumber(level.size, `${levelPath}.size`);
    });
  }
}

function validateRow(row, path) {
  exactRecord(row, [
    "id", "scenarioId", "direction", "engineDirection", "startAmount", "feeBps", "route", "markets", "status", "reason",
    "input", "output", "grossProfitRate", "netProfitRate", "requiredNetProfitRate", "profitBufferRate", "bufferedProfitRate",
    "passesProfitThreshold", "legs", "orderbooks", "residuals", "timeline", "replayFingerprint",
  ], path);
  for (const key of ["id", "scenarioId", "engineDirection"]) stringValue(row[key], `${path}.${key}`);
  enumValue(row.direction, ["forward", "reverse"], `${path}.direction`);
  enumValue(row.status, ["eligible", "rejected", "aborted"], `${path}.status`);
  assert(row.reason === null || typeof row.reason === "string", `${path}.reason must be string or null`);
  validateStartAmount(row.startAmount, `${path}.startAmount`);
  finiteNumber(row.feeBps, `${path}.feeBps`);
  stringArray(row.route, `${path}.route`);
  assert(row.route.length === 4 && row.route[0] === row.route[3], `${path}.route must be a closed three-leg cycle`);
  stringArray(row.markets, `${path}.markets`);
  assert(row.markets.length === 3, `${path}.markets must contain three markets`);
  validateMoney(row.input, `${path}.input`);
  validateMoney(row.output, `${path}.output`, { nullable: true });
  if (row.status === "rejected") assert(row.output.value === null, `${path}.output.value must be null when execution is rejected`);
  for (const key of ["grossProfitRate", "netProfitRate", "requiredNetProfitRate", "profitBufferRate", "bufferedProfitRate"]) finiteNumber(row[key], `${path}.${key}`);
  booleanValue(row.passesProfitThreshold, `${path}.passesProfitThreshold`);

  assert(Array.isArray(row.legs) && row.legs.length <= 3, `${path}.legs must contain at most three submitted legs`);
  row.legs.forEach((leg, index) => validateLeg(leg, `${path}.legs[${index}]`));
  assert(Array.isArray(row.orderbooks) && row.orderbooks.length === 3, `${path}.orderbooks must contain three books`);
  row.orderbooks.forEach((book, index) => validateOrderbook(book, `${path}.orderbooks[${index}]`));

  assert(Array.isArray(row.residuals), `${path}.residuals must be an array`);
  const residualKeys = new Set();
  row.residuals.forEach((residual, index) => {
    const residualPath = `${path}.residuals[${index}]`;
    exactRecord(residual, ["kind", "asset", "amount", "legIndex"], residualPath);
    enumValue(residual.kind, ["unsubmitted-input", "acquired-intermediate"], `${residualPath}.kind`);
    stringValue(residual.asset, `${residualPath}.asset`);
    finiteNumber(residual.amount, `${residualPath}.amount`);
    integerValue(residual.legIndex, `${residualPath}.legIndex`, 1);
    const residualKey = `${residual.kind}|${residual.asset}`;
    assert(!residualKeys.has(residualKey), `${path}.residuals contains duplicate ${residualKey}`);
    residualKeys.add(residualKey);
  });

  assert(Array.isArray(row.timeline) && row.timeline.length > 0, `${path}.timeline must be a non-empty array`);
  row.timeline.forEach((event, index) => {
    const eventPath = `${path}.timeline[${index}]`;
    exactRecord(event, ["kind", "label", "detail", "status"], eventPath);
    for (const key of ["kind", "label", "detail"]) stringValue(event[key], `${eventPath}.${key}`);
    enumValue(event.status, ["passed", "rejected", "blocked", "warning"], `${eventPath}.status`);
  });
  assert(/^[0-9a-f]{64}$/.test(row.replayFingerprint), `${path}.replayFingerprint must be lowercase SHA-256 hex`);
}

export function validateShowcase(showcase) {
  scanForSecrets(showcase);
  exactRecord(showcase, ["schemaVersion", "provenance", "verification", "routeLab", "scenarios", "guards", "boundary"], "showcase");
  assert(showcase.schemaVersion === 1, "schemaVersion must be 1");

  const { provenance, verification, routeLab, scenarios, guards, boundary } = showcase;
  exactRecord(provenance, ["repository", "engineCommit", "generatedAt", "source", "strategy", "fingerprintAlgorithm", "coreFingerprint"], "showcase.provenance");
  assert(provenance.repository === repositoryUrl, `provenance.repository must be ${repositoryUrl}`);
  assert(/^[0-9a-f]{40}$/.test(provenance.engineCommit), "provenance.engineCommit must be lowercase full SHA");
  assert(!Number.isNaN(Date.parse(provenance.generatedAt)), "provenance.generatedAt must be ISO-8601");
  stringValue(provenance.source, "showcase.provenance.source");
  exactRecord(provenance.strategy, ["id", "version", "hash"], "showcase.provenance.strategy");
  for (const key of ["id", "version", "hash"]) stringValue(provenance.strategy[key], `showcase.provenance.strategy.${key}`);
  assert(provenance.fingerprintAlgorithm === fingerprintAlgorithm, `provenance.fingerprintAlgorithm must be ${fingerprintAlgorithm}`);
  assert(/^[0-9a-f]{64}$/.test(provenance.coreFingerprint), "provenance.coreFingerprint must be lowercase SHA-256 hex");

  exactRecord(verification, ["status", "testCommand", "syntaxCheck", "totalTests", "passedTests", "failedTests", "runtime", "localRun", "declaredCiMatrix"], "showcase.verification");
  assert(verification.status === "passed", "showcase.verification.status must be passed");
  for (const key of ["testCommand", "syntaxCheck", "runtime"]) stringValue(verification[key], `showcase.verification.${key}`);
  for (const key of ["totalTests", "passedTests", "failedTests"]) integerValue(verification[key], `showcase.verification.${key}`);
  assert(verification.totalTests > 0 && verification.passedTests === verification.totalTests && verification.failedTests === 0, "Top-level verification counts must describe a passing run");

  exactRecord(verification.localRun, ["status", "nodeVersion", "platform", "architecture", "totalTests", "passedTests", "failedTests"], "showcase.verification.localRun");
  assert(verification.localRun.status === "passed", "showcase.verification.localRun.status must be passed");
  for (const key of ["nodeVersion", "platform", "architecture"]) stringValue(verification.localRun[key], `showcase.verification.localRun.${key}`);
  for (const key of ["totalTests", "passedTests", "failedTests"]) integerValue(verification.localRun[key], `showcase.verification.localRun.${key}`);
  assert(verification.localRun.totalTests === verification.totalTests && verification.localRun.passedTests === verification.passedTests && verification.localRun.failedTests === verification.failedTests, "localRun counts must match top-level verification aliases");

  exactRecord(verification.declaredCiMatrix, ["workflow", "operatingSystems", "nodeVersions", "verificationStatus", "verifiedByThisArtifact"], "showcase.verification.declaredCiMatrix");
  stringValue(verification.declaredCiMatrix.workflow, "showcase.verification.declaredCiMatrix.workflow");
  stringArray(verification.declaredCiMatrix.operatingSystems, "showcase.verification.declaredCiMatrix.operatingSystems");
  stringArray(verification.declaredCiMatrix.nodeVersions, "showcase.verification.declaredCiMatrix.nodeVersions");
  assert(["ubuntu-latest", "windows-latest"].every((value) => verification.declaredCiMatrix.operatingSystems.includes(value)), "Declared CI must include Ubuntu and Windows");
  assert(["22", "24"].every((value) => verification.declaredCiMatrix.nodeVersions.includes(value)), "Declared CI must include Node 22 and 24");
  assert(verification.declaredCiMatrix.verificationStatus === "declared-only" && verification.declaredCiMatrix.verifiedByThisArtifact === false, "CI matrix must be labeled declared-only and unverified by this artifact");

  exactRecord(routeLab, ["assets", "directions", "startAmounts", "feeBps", "scenarioIds", "rowCount", "rows"], "showcase.routeLab");
  stringArray(routeLab.assets, "showcase.routeLab.assets");
  stringArray(routeLab.directions, "showcase.routeLab.directions");
  assert(["forward", "reverse"].every((direction) => routeLab.directions.includes(direction)), "Both route directions are required");
  assert(Array.isArray(routeLab.startAmounts) && routeLab.startAmounts.length >= 2, "At least two start amounts are required");
  routeLab.startAmounts.forEach((amount, index) => validateStartAmount(amount, `showcase.routeLab.startAmounts[${index}]`));
  assert(Array.isArray(routeLab.feeBps), "showcase.routeLab.feeBps must be an array");
  routeLab.feeBps.forEach((fee, index) => finiteNumber(fee, `showcase.routeLab.feeBps[${index}]`));
  assert([0, 5, 10].every((fee) => routeLab.feeBps.includes(fee)), "Fee options 0, 5 and 10 bp are required");
  stringArray(routeLab.scenarioIds, "showcase.routeLab.scenarioIds");
  integerValue(routeLab.rowCount, "showcase.routeLab.rowCount", 1);
  assert(Array.isArray(routeLab.rows) && routeLab.rows.length === routeLab.rowCount, "routeLab.rowCount must equal rows.length");

  assert(Array.isArray(scenarios), "showcase.scenarios must be an array");
  scenarios.forEach((scenario, index) => {
    const scenarioPath = `showcase.scenarios[${index}]`;
    exactRecord(scenario, ["id", "label", "description", "expectedStatus"], scenarioPath);
    for (const key of ["id", "label", "description"]) stringValue(scenario[key], `${scenarioPath}.${key}`);
    enumValue(scenario.expectedStatus, ["eligible", "rejected", "aborted"], `${scenarioPath}.expectedStatus`);
  });
  assert(["normal", "stale", "thin", "partial"].every((id) => scenarios.some((scenario) => scenario.id === id)), "All four fixed scenarios are required");
  assert(new Set(routeLab.scenarioIds).size === routeLab.scenarioIds.length && scenarios.length === routeLab.scenarioIds.length, "Scenario ids must be unique and aligned");

  routeLab.rows.forEach((row, index) => validateRow(row, `showcase.routeLab.rows[${index}]`));
  const rowKeys = new Set(routeLab.rows.map((row) => `${row.scenarioId}|${row.direction}|${row.startAmount.asset}:${row.startAmount.value}|${row.feeBps}`));
  assert(rowKeys.size === routeLab.rows.length, "routeLab.rows contains duplicate selection combinations");
  for (const scenario of scenarios) for (const direction of routeLab.directions) for (const amount of routeLab.startAmounts) for (const fee of routeLab.feeBps) {
    const key = `${scenario.id}|${direction}|${amount.asset}:${amount.value}|${fee}`;
    assert(rowKeys.has(key), `Missing precomputed route row ${key}`);
  }

  exactRecord(guards, ["configuration", "rows", "rejectionReasons"], "showcase.guards");
  exactRecord(guards.configuration, ["maxOrderbookAgeMs", "maxLegTimestampSkewMs", "maxObservationValidationGapMs", "validationDepth", "orderbookLevel", "maxOrderAckMs", "maxReconciliationMs", "realGuardedProfitBufferBps"], "showcase.guards.configuration");
  for (const [key, value] of Object.entries(guards.configuration)) finiteNumber(value, `showcase.guards.configuration.${key}`);
  assert(Array.isArray(guards.rows) && guards.rows.length > 0, "Guard evidence is missing");
  guards.rows.forEach((guard, index) => {
    const guardPath = `showcase.guards.rows[${index}]`;
    exactRecord(guard, ["id", "label", "value", "required", "passed", "reason"], guardPath);
    for (const key of ["id", "label"]) stringValue(guard[key], `${guardPath}.${key}`);
    assert(typeof guard.value === "string" || typeof guard.value === "number", `${guardPath}.value must be string or number`);
    assert(typeof guard.required === "string" || typeof guard.required === "number", `${guardPath}.required must be string or number`);
    booleanValue(guard.passed, `${guardPath}.passed`);
    assert(guard.reason === null || typeof guard.reason === "string", `${guardPath}.reason must be string or null`);
  });
  exactRecord(guards.rejectionReasons, ["stale", "thin", "partial"], "showcase.guards.rejectionReasons");
  for (const [key, value] of Object.entries(guards.rejectionReasons)) stringValue(value, `showcase.guards.rejectionReasons.${key}`);

  exactRecord(boundary, ["syntheticData", "liveMarketData", "liveTrading", "liveTradingStatus", "externalApiCalls", "apiKeysIncluded", "accountBalancesIncluded", "realizedPnlIncluded", "profitClaim", "statement"], "showcase.boundary");
  for (const key of ["syntheticData", "liveMarketData", "liveTrading", "externalApiCalls", "apiKeysIncluded", "accountBalancesIncluded", "realizedPnlIncluded", "profitClaim"]) booleanValue(boundary[key], `showcase.boundary.${key}`);
  stringValue(boundary.liveTradingStatus, "showcase.boundary.liveTradingStatus");
  stringValue(boundary.statement, "showcase.boundary.statement");
  assert(boundary.syntheticData === true, "Portfolio evidence must use synthetic data");
  assert(boundary.liveMarketData === false && boundary.liveTrading === false && boundary.externalApiCalls === false && boundary.apiKeysIncluded === false && boundary.accountBalancesIncluded === false && boundary.realizedPnlIncluded === false && boundary.profitClaim === false, "Portfolio boundary must exclude live data, trading, account material, and profit claims");

  const actualFingerprint = coreFingerprint(showcase);
  assert(actualFingerprint === provenance.coreFingerprint, `Fingerprint mismatch: expected ${provenance.coreFingerprint}, computed ${actualFingerprint}`);
  return { rowCount: routeLab.rows.length, fingerprint: actualFingerprint };
}

export function validateRemoteSourceUrl(source, commit) {
  assert(/^[0-9a-f]{40}$/.test(commit ?? ""), "Remote sync requires --commit with a lowercase full artifact SHA");
  const expected = `https://raw.githubusercontent.com/Moon-Young-Choi/triangular-arbitrage-detector/${commit}/artifacts/showcase.v1.json`;
  assert(source === expected, `Remote source must be exactly ${expected}`);
  return expected;
}

export function validateEngineCommitPin(engineCommit, provenanceEngineCommit) {
  assert(/^[0-9a-f]{40}$/.test(engineCommit ?? ""), "Remote sync requires --engine-commit with the fingerprint-protected engine SHA");
  assert(engineCommit === provenanceEngineCommit, "--engine-commit must match provenance.engineCommit");
  return engineCommit;
}

function parseArgs(argv) {
  const args = { check: false, destination: defaultDestination };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--check") args.check = true;
    else if (token === "--source") args.source = argv[++index];
    else if (token === "--commit") args.commit = argv[++index];
    else if (token === "--engine-commit") args.engineCommit = argv[++index];
    else if (token === "--destination") args.destination = resolve(argv[++index]);
    else throw new Error(`Unknown argument: ${token}`);
  }
  args.source ??= args.check ? args.destination : process.env.ARBITRAGE_SHOWCASE_SOURCE;
  assert(args.source, "Pass --source <local-file-or-pinned-raw-url> (or ARBITRAGE_SHOWCASE_SOURCE)");
  return args;
}

async function readSource(source, commit) {
  if (/^https:\/\//i.test(source)) {
    validateRemoteSourceUrl(source, commit);
    const response = await fetch(source, { redirect: "error" });
    assert(response.ok, `Remote source returned HTTP ${response.status}`);
    return { raw: await response.text(), remote: true };
  }
  assert(!/^[a-z]+:\/\//i.test(source), "Local sources must be filesystem paths; remote sources must use the approved HTTPS raw URL");
  return { raw: await readFile(resolve(source), "utf8"), remote: false };
}

export async function syncArbitrage(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (/^https:\/\//i.test(args.source)) validateEngineCommitPin(args.engineCommit, args.engineCommit);
  const { raw, remote } = await readSource(args.source, args.commit);
  const showcase = JSON.parse(raw);
  const result = validateShowcase(showcase);
  if (remote) {
    validateEngineCommitPin(args.engineCommit, showcase.provenance.engineCommit);
  } else if (args.engineCommit !== undefined) {
    assert(args.engineCommit === showcase.provenance.engineCommit, "--engine-commit must match provenance.engineCommit");
  }
  if (!args.check) await writeFile(args.destination, `${JSON.stringify(showcase, null, 2)}\n`, "utf8");
  return { ...result, destination: args.destination, checkedOnly: args.check };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  syncArbitrage().then((result) => {
    console.log(`${result.checkedOnly ? "Validated" : "Synced"} ${result.rowCount} rows · ${result.fingerprint}`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
