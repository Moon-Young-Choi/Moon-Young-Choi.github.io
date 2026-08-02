import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildEventEdgeDemo, eventEdgeFingerprint, validateEventEdgeDemo } from "../scripts/generate-eventedge-demo.mjs";

const artifact = JSON.parse(await readFile(new URL("../public/data/eventedge-demo.v1.json", import.meta.url), "utf8"));

test("EventEdge reconstructed artifact is deterministic and fail-closed", () => {
  assert.equal(validateEventEdgeDemo(artifact), true);
  assert.deepEqual(artifact, buildEventEdgeDemo());
  assert.equal(artifact.provenance.fingerprint, eventEdgeFingerprint(artifact));
  assert.equal(artifact.provenance.dataClass, "reconstructed-demo");
  assert.equal(artifact.boundary.realMoneyTrading, false);
  assert.equal(artifact.boundary.observedPerformance, false);
  assert.equal(artifact.boundary.browserCalculation, false);
});

test("EventEdge contains one result for every supported control combination", () => {
  const { controls } = artifact.market;
  const expected = controls.perspectiveIds.length * controls.candidateIds.length * controls.notionals.length * controls.profileIds.length;
  assert.equal(expected, 24);
  assert.equal(artifact.decisionRows.length, expected);
  assert.equal(artifact.settlementRows.length, expected * controls.stateIds.length);
  assert.equal(new Set(artifact.decisionRows.map(({ id }) => id)).size, expected);
  assert.equal(new Set(artifact.settlementRows.map(({ id }) => id)).size, expected * controls.stateIds.length);
});

test("EventEdge reference candidates preserve the study-guide values", () => {
  const candidateA = artifact.decisionRows.find(({ id }) => id === "user:wa-long:q1:baseline");
  const candidateB = artifact.decisionRows.find(({ id }) => id === "user:hedge-package:q1:baseline");
  assert.equal(candidateA.standaloneEdge, 13);
  assert.equal(candidateA.requestedMetrics.tailLoss, 137);
  assert.equal(candidateA.requestedMetrics.objective, -25.5);
  assert.equal(candidateA.decision, "reject");
  assert.equal(candidateB.standaloneEdge, -35);
  assert.equal(candidateB.requestedMetrics.objective, -7.5);
  assert.equal(candidateB.fillRatio, 0.5);
  assert.equal(candidateB.executedMetrics.objective, -11.25);
  assert.equal(candidateB.decision, "conditional-commit");
});

test("EventEdge market and settlement invariants hold for every row", () => {
  for (const state of artifact.market.states) assert.equal(state.payoffs.WA + state.payoffs.WB, 100);
  for (const perspective of artifact.market.perspectives) {
    const probability = Object.values(perspective.weights).reduce((sum, value) => sum + value, 0);
    assert.ok(Math.abs(probability - 1) < 1e-12);
  }
  assert.ok(Math.abs(artifact.market.states.reduce((sum, state) => sum + state.trueWeight, 0) - 1) < 1e-12);
  assert.ok(artifact.settlementRows.every(({ positionConservation, cashConservation, pnlConservation }) => positionConservation && cashConservation && pnlConservation));
  for (const book of artifact.orderBooks) {
    assert.equal(book.levels.length, 20);
    for (let index = 1; index < book.levels.length; index += 1) {
      assert.ok(book.levels[index].bidPrice < book.levels[index - 1].bidPrice);
      assert.ok(book.levels[index].askPrice > book.levels[index - 1].askPrice);
    }
  }
});
