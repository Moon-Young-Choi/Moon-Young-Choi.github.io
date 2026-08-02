import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const destination = fileURLToPath(new URL("../public/data/eventedge-demo.v1.json", import.meta.url));
const fingerprintAlgorithm = "sha256(stable-json-authenticated-v1)";
const seed = "eventedge-reconstructed-market-20260802";
const generatedAt = "2026-08-02T00:00:00.000Z";

const states = [
  { id: "S1", label: "A showdown win", description: "A wins at showdown after a large probability-path move.", trueWeight: 0.25, payoffs: { WA: 100, WB: 0, VOL: 100 } },
  { id: "S2", label: "B folds to A", description: "A wins by fold after a smaller public-state move.", trueWeight: 0.25, payoffs: { WA: 100, WB: 0, VOL: 0 } },
  { id: "S3", label: "B showdown win", description: "B wins at showdown after a smaller public-state move.", trueWeight: 0.25, payoffs: { WA: 0, WB: 100, VOL: 0 } },
  { id: "S4", label: "A folds to B", description: "B wins by fold after a large probability-path move.", trueWeight: 0.25, payoffs: { WA: 0, WB: 100, VOL: 100 } },
];

const perspectives = [
  { id: "market-maker", label: "Market Maker", weights: { S1: 0.2, S2: 0.25, S3: 0.35, S4: 0.2 } },
  { id: "user", label: "User Agent", weights: { S1: 0.3, S2: 0.3, S3: 0.25, S4: 0.15 } },
];

const contracts = [
  { id: "WA", label: "A winner", kind: "binary future", payoffDescription: "100 when player A wins; otherwise 0." },
  { id: "WB", label: "B winner", kind: "binary future", payoffDescription: "100 when player B wins; otherwise 0." },
  { id: "VOL", label: "Path event", kind: "variance-swap proxy", payoffDescription: "100 when the public probability path makes a large move; otherwise 0." },
];

const candidates = [
  { id: "wa-long", label: "A · Buy WA", description: "Positive standalone edge that adds to the existing A-win exposure." },
  { id: "hedge-package", label: "B · Sell WA + Buy WB", description: "Negative standalone edge that can reduce the combined portfolio tail." },
];

const profiles = [
  {
    id: "baseline",
    label: "Baseline",
    description: "Reference two-sided book from the interview mini-market, extended deterministically to 20 levels.",
    books: {
      WA: { bid: 43, ask: 47, step: 3, bidQuantities: [0.8, 1.2], askQuantities: [1.2, 1.5] },
      WB: { bid: 52, ask: 58, step: 3, bidQuantities: [1, 1.5], askQuantities: [0.5, 1.5] },
      VOL: { bid: 45, ask: 55, step: 2, bidQuantities: [0.7, 1], askQuantities: [0.7, 1] },
    },
  },
  {
    id: "shallow",
    label: "Shallow liquidity",
    description: "Reconstructed stress profile with less best-level capacity and wider spreads.",
    books: {
      WA: { bid: 42, ask: 48, step: 3, bidQuantities: [0.35, 0.55], askQuantities: [0.45, 0.65] },
      WB: { bid: 51, ask: 60, step: 3, bidQuantities: [0.3, 0.5], askQuantities: [0.25, 0.45] },
      VOL: { bid: 43, ask: 57, step: 2, bidQuantities: [0.2, 0.35], askQuantities: [0.2, 0.35] },
    },
  },
  {
    id: "inventory-skewed",
    label: "Inventory-skewed",
    description: "Reconstructed quote profile for a market maker carrying long WA inventory.",
    books: {
      WA: { bid: 39, ask: 44, step: 3, bidQuantities: [0.4, 0.7], askQuantities: [1.5, 1.8] },
      WB: { bid: 54, ask: 60, step: 3, bidQuantities: [1.2, 1.5], askQuantities: [0.6, 0.9] },
      VOL: { bid: 46, ask: 56, step: 2, bidQuantities: [0.55, 0.8], askQuantities: [0.45, 0.7] },
    },
  },
];

const notionals = [0.5, 1];
const lossLimit = 100;
const riskAversion = 0.5;
const existingPositions = { WA: 2, WB: 0, VOL: 0 };
const existingEntryCash = -90;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function round(value, digits = 4) {
  const scale = 10 ** digits;
  const rounded = Math.round((value + Number.EPSILON) * scale) / scale;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function fingerprintPayload(artifact) {
  const payload = structuredClone(artifact);
  delete payload.provenance.fingerprint;
  return payload;
}

export function eventEdgeFingerprint(artifact) {
  return createHash("sha256").update(stableJson(fingerprintPayload(artifact))).digest("hex");
}

function valuesFor(perspective) {
  return Object.fromEntries(contracts.map((contract) => [
    contract.id,
    round(states.reduce((sum, state) => sum + perspective.weights[state.id] * state.payoffs[contract.id], 0)),
  ]));
}

function buildLevels(profile, contractId) {
  const book = profile.books[contractId];
  return Array.from({ length: 20 }, (_, level) => {
    const bidBase = book.bidQuantities[Math.min(level, 1)];
    const askBase = book.askQuantities[Math.min(level, 1)];
    const extension = level <= 1 ? 1 : 1 + (level - 1) * 0.14;
    return {
      level,
      bidPrice: round(book.bid - level * book.step, 2),
      bidQuantity: round(bidBase * extension, 3),
      askPrice: round(book.ask + level * book.step, 2),
      askQuantity: round(askBase * extension, 3),
    };
  });
}

function statePnl(positions, cash, state) {
  return round(cash + Object.entries(positions).reduce((sum, [contractId, quantity]) => sum + quantity * state.payoffs[contractId], 0));
}

function metrics(perspective, positions, cash) {
  const outcomes = states.map((state) => ({ stateId: state.id, pnl: statePnl(positions, cash, state) }));
  const expectedPnl = round(outcomes.reduce((sum, outcome) => sum + perspective.weights[outcome.stateId] * outcome.pnl, 0));
  const worst = outcomes.reduce((current, candidate) => candidate.pnl < current.pnl ? candidate : current, outcomes[0]);
  const tailLoss = round(Math.max(0, -worst.pnl));
  return { expectedPnl, tailLoss, objective: round(expectedPnl - riskAversion * tailLoss), worstStateId: worst.stateId, outcomes };
}

function addPositions(first, second) {
  return Object.fromEntries(contracts.map((contract) => [contract.id, round((first[contract.id] ?? 0) + (second[contract.id] ?? 0))]));
}

function executionFor(candidateId, notional, profile) {
  const wa = profile.books.WA;
  const wb = profile.books.WB;
  if (candidateId === "wa-long") {
    const fillRatio = round(Math.min(1, wa.askQuantities[0] / notional));
    const filledNotional = round(notional * fillRatio);
    return {
      fillRatio,
      filledNotional,
      requestedLegs: [{ contractId: "WA", side: "buy", requestedQuantity: notional, availableQuantity: wa.askQuantities[0], price: wa.ask }],
      requestedPositionChange: { WA: notional, WB: 0, VOL: 0 },
      executedPositionChange: { WA: filledNotional, WB: 0, VOL: 0 },
      requestedCash: round(-wa.ask * notional),
      executedCash: round(-wa.ask * filledNotional),
    };
  }
  const fillRatio = round(Math.min(1, wa.bidQuantities[0] / notional, wb.askQuantities[0] / notional));
  const filledNotional = round(notional * fillRatio);
  return {
    fillRatio,
    filledNotional,
    requestedLegs: [
      { contractId: "WA", side: "sell", requestedQuantity: notional, availableQuantity: wa.bidQuantities[0], price: wa.bid },
      { contractId: "WB", side: "buy", requestedQuantity: notional, availableQuantity: wb.askQuantities[0], price: wb.ask },
    ],
    requestedPositionChange: { WA: -notional, WB: notional, VOL: 0 },
    executedPositionChange: { WA: -filledNotional, WB: filledNotional, VOL: 0 },
    requestedCash: round((wa.bid - wb.ask) * notional),
    executedCash: round((wa.bid - wb.ask) * filledNotional),
  };
}

function decisionRow(perspective, candidate, notional, profile) {
  const valuation = valuesFor(perspective);
  const execution = executionFor(candidate.id, notional, profile);
  const oldMetrics = metrics(perspective, existingPositions, existingEntryCash);
  const requestedPositions = addPositions(existingPositions, execution.requestedPositionChange);
  const executedPositions = addPositions(existingPositions, execution.executedPositionChange);
  const requestedMetrics = metrics(perspective, requestedPositions, existingEntryCash + execution.requestedCash);
  const executedMetrics = metrics(perspective, executedPositions, existingEntryCash + execution.executedCash);
  const standaloneEdge = candidate.id === "wa-long"
    ? round((valuation.WA - profile.books.WA.ask) * notional)
    : round(((profile.books.WA.bid - valuation.WA) + (valuation.WB - profile.books.WB.ask)) * notional);
  const passesObjective = executedMetrics.objective > oldMetrics.objective;
  const passesLossLimit = executedMetrics.tailLoss <= lossLimit;
  const decision = passesObjective && passesLossLimit ? "conditional-commit" : "reject";
  return {
    id: `${perspective.id}:${candidate.id}:q${notional}:${profile.id}`,
    perspectiveId: perspective.id,
    candidateId: candidate.id,
    notional,
    profileId: profile.id,
    valuation,
    standaloneEdge,
    fillRatio: execution.fillRatio,
    filledNotional: execution.filledNotional,
    oldMetrics,
    requestedMetrics,
    executedMetrics,
    passesObjective,
    passesLossLimit,
    decision,
    reason: decision === "conditional-commit"
      ? "The filled package improves the combined-book objective without crossing the reconstructed loss limit; fees and final VWAP remain a commit condition."
      : !passesLossLimit
        ? "The filled position breaches the reconstructed worst-case loss limit."
        : "The filled position does not improve the combined-book risk-adjusted objective.",
    legs: execution.requestedLegs.map((leg) => ({
      ...leg,
      fillRatio: execution.fillRatio,
      filledQuantity: execution.filledNotional,
      cashFlow: round((leg.side === "buy" ? -1 : 1) * leg.price * execution.filledNotional),
    })),
    requestedPositionChange: execution.requestedPositionChange,
    executedPositionChange: execution.executedPositionChange,
    requestedCash: execution.requestedCash,
    executedCash: execution.executedCash,
  };
}

function settlementRow(decision, state) {
  const userPositions = addPositions(existingPositions, decision.executedPositionChange);
  const makerPositions = Object.fromEntries(Object.entries(userPositions).map(([key, value]) => [key, round(-value)]));
  const userCashAfterTrades = round(existingEntryCash + decision.executedCash);
  const makerCashAfterTrades = round(-userCashAfterTrades);
  const userSettlementPayoff = round(Object.entries(userPositions).reduce((sum, [contractId, quantity]) => sum + quantity * state.payoffs[contractId], 0));
  const makerSettlementPayoff = round(-userSettlementPayoff);
  const userRealizedPnl = round(userCashAfterTrades + userSettlementPayoff);
  const makerRealizedPnl = round(makerCashAfterTrades + makerSettlementPayoff);
  return {
    id: `${decision.id}:${state.id}`,
    decisionRowId: decision.id,
    stateId: state.id,
    userPositions,
    makerPositions,
    userCashAfterTrades,
    makerCashAfterTrades,
    userSettlementPayoff,
    makerSettlementPayoff,
    userRealizedPnl,
    makerRealizedPnl,
    positionConservation: Object.keys(userPositions).every((key) => round(userPositions[key] + makerPositions[key]) === 0),
    cashConservation: round(userCashAfterTrades + makerCashAfterTrades) === 0,
    pnlConservation: round(userRealizedPnl + makerRealizedPnl) === 0,
  };
}

export function buildEventEdgeDemo() {
  const hydratedPerspectives = perspectives.map((perspective) => ({ ...perspective, values: valuesFor(perspective) }));
  const orderBooks = profiles.flatMap((profile) => contracts.map((contract) => ({
    profileId: profile.id,
    contractId: contract.id,
    levels: buildLevels(profile, contract.id),
  })));
  const decisionRows = hydratedPerspectives.flatMap((perspective) => candidates.flatMap((candidate) => notionals.flatMap((notional) => profiles.map((profile) => decisionRow(perspective, candidate, notional, profile)))));
  const settlementRows = decisionRows.flatMap((decision) => states.map((state) => settlementRow(decision, state)));
  const artifact = {
    schemaVersion: "eventedge-demo.v1",
    provenance: {
      dataClass: "reconstructed-demo",
      seed,
      generatorVersion: "eventedge-market-reconstruction/1.0.0",
      generatedAt,
      sourcePublished: false,
      fingerprintAlgorithm,
      fingerprint: "",
    },
    market: {
      underlying: {
        id: "kuhn-one-game-four-state",
        label: "Kuhn poker public-state snapshot",
        publicState: ["Pot and ante", "Public action history", "Legal next actions", "Registered contract set"],
        hiddenState: ["Private cards", "Random seed", "Future actions", "Realized terminal state"],
        actionTiming: "Trade after the latest public game action and before the next underlying action.",
      },
      states,
      perspectives: hydratedPerspectives,
      contracts,
      candidates,
      profiles: profiles.map(({ id, label, description }) => ({ id, label, description })),
      controls: { perspectiveIds: hydratedPerspectives.map(({ id }) => id), candidateIds: candidates.map(({ id }) => id), notionals, profileIds: profiles.map(({ id }) => id), stateIds: states.map(({ id }) => id) },
      defaultSelection: { perspectiveId: "user", candidateId: "hedge-package", notional: 1, profileId: "baseline", stateId: "S1" },
      existingPortfolio: { positions: existingPositions, entryCash: existingEntryCash, lossLimit, riskAversion, objective: "Expected PnL - 0.5 × tail-loss proxy" },
    },
    orderBooks,
    decisionRows,
    settlementRows,
    boundary: {
      originalSourcePublic: false,
      reconstructedDemo: true,
      realMoneyTrading: false,
      observedPerformance: false,
      browserCalculation: false,
      statement: "A deterministic interface reconstruction for explaining EventEdge decisions. It is not the private C++ source, an observed backtest, a live market, or evidence of realized performance.",
    },
  };
  artifact.provenance.fingerprint = eventEdgeFingerprint(artifact);
  return artifact;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(first, second, tolerance = 1e-9) {
  return Math.abs(first - second) <= tolerance;
}

export function validateEventEdgeDemo(artifact) {
  assert(artifact.schemaVersion === "eventedge-demo.v1", "Unsupported EventEdge schemaVersion");
  assert(artifact.provenance.dataClass === "reconstructed-demo", "EventEdge data must remain reconstructed");
  assert(artifact.provenance.fingerprint === eventEdgeFingerprint(artifact), "EventEdge fingerprint mismatch");
  assert(artifact.boundary.reconstructedDemo && !artifact.boundary.realMoneyTrading && !artifact.boundary.observedPerformance && !artifact.boundary.browserCalculation, "EventEdge boundary must fail closed");
  for (const perspective of artifact.market.perspectives) {
    assert(close(Object.values(perspective.weights).reduce((sum, value) => sum + value, 0), 1), `${perspective.id} weights must sum to one`);
  }
  assert(close(artifact.market.states.reduce((sum, state) => sum + state.trueWeight, 0), 1), "True weights must sum to one");
  for (const state of artifact.market.states) assert(state.payoffs.WA + state.payoffs.WB === 100, `${state.id} violates WA + WB = 100`);
  assert(artifact.orderBooks.length === 9, "Expected three contracts across three profiles");
  for (const book of artifact.orderBooks) {
    assert(book.levels.length === 20, `${book.profileId}/${book.contractId} must have 20 levels`);
    for (let index = 0; index < book.levels.length; index += 1) {
      const level = book.levels[index];
      assert(level.bidQuantity > 0 && level.askQuantity > 0 && level.bidPrice < level.askPrice, `${book.profileId}/${book.contractId}/${index} is invalid`);
      if (index > 0) {
        assert(level.bidPrice < book.levels[index - 1].bidPrice, `${book.profileId}/${book.contractId} bids are not descending`);
        assert(level.askPrice > book.levels[index - 1].askPrice, `${book.profileId}/${book.contractId} asks are not ascending`);
      }
    }
  }
  const expectedDecisions = artifact.market.controls.perspectiveIds.length * artifact.market.controls.candidateIds.length * artifact.market.controls.notionals.length * artifact.market.controls.profileIds.length;
  assert(artifact.decisionRows.length === expectedDecisions, "Incomplete EventEdge decision grid");
  assert(new Set(artifact.decisionRows.map(({ id }) => id)).size === expectedDecisions, "Duplicate EventEdge decision row");
  assert(artifact.settlementRows.length === expectedDecisions * artifact.market.controls.stateIds.length, "Incomplete EventEdge settlement grid");
  assert(new Set(artifact.settlementRows.map(({ id }) => id)).size === artifact.settlementRows.length, "Duplicate EventEdge settlement row");
  assert(artifact.settlementRows.every((row) => row.positionConservation && row.cashConservation && row.pnlConservation), "Settlement conservation failed");
  const defaultA = artifact.decisionRows.find((row) => row.id === "user:wa-long:q1:baseline");
  const defaultB = artifact.decisionRows.find((row) => row.id === "user:hedge-package:q1:baseline");
  assert(defaultA && defaultB, "Default decision rows are missing");
  assert(defaultA.standaloneEdge === 13 && defaultA.requestedMetrics.tailLoss === 137 && defaultA.requestedMetrics.objective === -25.5 && defaultA.decision === "reject", "Candidate A reference values changed");
  assert(defaultB.standaloneEdge === -35 && defaultB.requestedMetrics.objective === -7.5 && defaultB.fillRatio === 0.5 && defaultB.executedMetrics.objective === -11.25 && defaultB.decision === "conditional-commit", "Candidate B reference values changed");
  const serialized = JSON.stringify(artifact).toLowerCase();
  for (const secret of ["api_key", "apikey", "client_secret", "private_key", "access_token", "refresh_token", "password"]) assert(!serialized.includes(secret), `Forbidden secret-like field: ${secret}`);
  return true;
}

async function main() {
  const expected = buildEventEdgeDemo();
  validateEventEdgeDemo(expected);
  if (process.argv.includes("--write")) {
    await writeFile(destination, `${JSON.stringify(expected, null, 2)}\n`, "utf8");
    process.stdout.write(`Wrote ${destination}\n${expected.provenance.fingerprint}\n`);
    return;
  }
  const actual = JSON.parse(await readFile(destination, "utf8"));
  validateEventEdgeDemo(actual);
  assert(stableJson(actual) === stableJson(expected), "EventEdge demo artifact is not deterministic or is out of date");
  process.stdout.write(`EventEdge demo verified: ${actual.decisionRows.length} decisions, ${actual.settlementRows.length} settlements\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
