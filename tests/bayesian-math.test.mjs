import assert from "node:assert/strict";
import test from "node:test";
import {
  betaMean,
  betaUpdate,
  constrainedAllocation,
  createSeededRandom,
  logBeta,
  posteriorExpectedSplitGain,
  splitLogBayesFactor,
  upliftDraws,
} from "../app/lib/bayesianMath.ts";

test("Beta conjugacy adds successes and failures", () => {
  const posterior = betaUpdate({ alpha: 2, beta: 3 }, { successes: 7, trials: 20 });
  assert.deepEqual(posterior, { alpha: 9, beta: 16 });
  assert.equal(betaMean(posterior), 0.36);
  assert.ok(Math.abs(logBeta(2, 3) - Math.log(1 / 12)) < 1e-10);
});

test("Beta-Binomial Bayes factor detects child baseline structure", () => {
  const logBf = splitLogBayesFactor([
    { treatment: { successes: 25, trials: 1000 }, control: { successes: 20, trials: 1000 } },
    { treatment: { successes: 85, trials: 1000 }, control: { successes: 80, trials: 1000 } },
  ]);
  assert.ok(logBf > 10);
});

test("seeded posterior draws are reproducible", () => {
  const leaf = { id: "a", label: "A", mass: 1, treatment: { alpha: 30, beta: 970 }, control: { alpha: 20, beta: 980 } };
  assert.deepEqual(upliftDraws(leaf, 8, 20260721), upliftDraws(leaf, 8, 20260721));
  const randomA = createSeededRandom(9);
  const randomB = createSeededRandom(9);
  assert.equal(randomA(), randomB());
});

test("heterogeneous uplift has higher posterior policy value than a baseline-only split", () => {
  const baseline = [
    { id: "l", label: "L", mass: 0.5, treatment: { alpha: 1251, beta: 48751 }, control: { alpha: 1001, beta: 49001 } },
    { id: "r", label: "R", mass: 0.5, treatment: { alpha: 4251, beta: 45751 }, control: { alpha: 4001, beta: 46001 } },
  ];
  const heterogeneous = [
    { id: "l", label: "L", mass: 0.5, treatment: { alpha: 41, beta: 961 }, control: { alpha: 39, beta: 963 } },
    { id: "r", label: "R", mass: 0.5, treatment: { alpha: 29, beta: 973 }, control: { alpha: 11, beta: 991 } },
  ];
  const baselineGain = posteriorExpectedSplitGain(baseline, 0.01, 100, 4096, 71);
  const heterogeneousGain = posteriorExpectedSplitGain(heterogeneous, 0.01, 100, 4096, 71);
  assert.ok(baselineGain < 0.001);
  assert.ok(heterogeneousGain > baselineGain + 0.1);
});

test("allocation respects budget, posterior gate and per-leaf bounds", () => {
  const result = constrainedAllocation([
    { id: "a", label: "A", mass: 0.6, sampledNetValue: 1.2, posteriorProbability: 0.95, lower: 0.04, upper: 0.2 },
    { id: "b", label: "B", mass: 0.4, sampledNetValue: 0.6, posteriorProbability: 0.9, lower: 0.03, upper: 0.15 },
    { id: "c", label: "C", mass: 0.2, sampledNetValue: 2, posteriorProbability: 0.2, lower: 0.01, upper: 0.1 },
  ], 0.25, 0.8);
  assert.ok(result.used <= 0.25 + 1e-12);
  assert.equal(result.allocations.find(({ id }) => id === "c")?.allocated, 0);
  for (const leaf of result.allocations.filter(({ allocated }) => allocated > 0)) {
    assert.ok(leaf.allocated >= leaf.lower && leaf.allocated <= leaf.upper);
  }
});
