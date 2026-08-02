import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildPwrEmpiricalDemo, empiricalFingerprint, syncPwrEmpirical, validatePwrEmpiricalDemo } from "../scripts/sync-pwr-empirical.mjs";

const artifactUrl = new URL("../public/data/pwr-empirical-demo.v1.json", import.meta.url);
async function artifact() { return JSON.parse(await readFile(artifactUrl, "utf8")); }
const result = (row, methodId) => row.results.find((item) => item.methodId === methodId);
const row = (data, patch) => data.rows.find((item) => Object.entries(patch).every(([key, value]) => item[key] === value));

test("generates and authenticates the complete deterministic synthetic grid", async () => {
  const first = buildPwrEmpiricalDemo();
  const second = buildPwrEmpiricalDemo();
  assert.deepEqual(first, second);
  assert.equal(first.rows.length, 4 * 3 * 7 * 4 * 3);
  assert.equal(first.rows.every((item) => item.results.length === 4), true);
  assert.equal(first.provenance.dataClass, "synthetic");
  assert.equal(first.boundary.performanceClaim, false);
  assert.equal(empiricalFingerprint(first), first.provenance.fingerprint);
  assert.deepEqual(validatePwrEmpiricalDemo(first), { fingerprint: first.provenance.fingerprint, rowCount: 1008, methodCount: 4 });
  assert.deepEqual(await syncPwrEmpirical(), { fingerprint: first.provenance.fingerprint, rowCount: 1008, methodCount: 4, written: false });
});

test("covers every control combination and obeys the synthetic study constraints", async () => {
  const data = await artifact();
  validatePwrEmpiricalDemo(data);
  const controls = data.design.controls;
  for (const scenario of data.design.scenarios) for (const nPerGroup of controls.sampleSizes) for (const effectSize of controls.effectSizes) for (const mismatch of controls.mismatchLevels) for (const permutations of controls.permutationBudgets) {
    assert.ok(row(data, { scenarioId: scenario.id, nPerGroup, effectSize, mismatch, permutations }));
  }
  for (const scenario of data.design.scenarios) for (const method of data.design.methods) for (const mismatch of controls.mismatchLevels) for (const permutations of controls.permutationBudgets) {
    for (const effectSize of controls.effectSizes) {
      const powers = controls.sampleSizes.map((nPerGroup) => result(row(data, { scenarioId: scenario.id, nPerGroup, effectSize, mismatch, permutations }), method.id).power);
      assert.deepEqual([...powers].sort((a, b) => a - b), powers, `${scenario.id}/${method.id} is not monotone in sample size`);
    }
  }
  for (const item of data.rows) for (const method of item.results) {
    assert.ok(method.level >= .035 && method.level <= .065);
    if (item.effectSize === 0) assert.equal(method.power, method.level);
  }
  const defaultRow = row(data, data.design.defaultSelection);
  const pwr = result(defaultRow, "pwr-scan").power;
  assert.ok(defaultRow.results.filter((item) => item.methodId !== "pwr-scan").every((item) => pwr > item.power));
  const diffuse = row(data, { ...data.design.defaultSelection, scenarioId: "diffuse-covariance" });
  assert.ok(result(diffuse, "global-roy").power > result(diffuse, "pwr-scan").power, "diffuse scenario should reduce the localized-scan advantage");
});

test("links permutation budget to resolution and runtime and rejects provenance tampering", async () => {
  const data = await artifact();
  const base = { scenarioId: "localized-spike", nPerGroup: 64, effectSize: .75, mismatch: .1 };
  const budgets = data.design.controls.permutationBudgets;
  const runtimes = budgets.map((permutations) => result(row(data, { ...base, permutations }), "pwr-scan").runtimeMs);
  assert.deepEqual([...runtimes].sort((a, b) => a - b), runtimes);
  const resolutions = budgets.map((value) => 1 / (value + 1));
  assert.deepEqual([...resolutions].sort((a, b) => b - a), resolutions);

  const changed = structuredClone(data);
  changed.rows[0].results[0].power += .01;
  assert.throws(() => validatePwrEmpiricalDemo(changed), /fingerprint mismatch/i);

  const observedWithoutSource = structuredClone(data);
  observedWithoutSource.provenance.dataClass = "observed";
  observedWithoutSource.provenance.seed = null;
  observedWithoutSource.provenance.fingerprint = empiricalFingerprint(observedWithoutSource);
  assert.throws(() => validatePwrEmpiricalDemo(observedWithoutSource), /sourceStudyId/);

  const secret = structuredClone(data);
  secret.api_key = "demo";
  secret.provenance.fingerprint = empiricalFingerprint(secret);
  assert.throws(() => validatePwrEmpiricalDemo(secret), /unknown or missing keys|credential-like/i);
});

test("ships accessible tabs and an HTML/CSS-only empirical renderer", async () => {
  const [tabs, consoleSource, theoryCss, consoleCss] = await Promise.all([
    readFile(new URL("../app/components/PwrStudyTabs.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PwrEmpiricalConsole.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PwrTheoryPage.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PwrEmpiricalConsole.module.css", import.meta.url), "utf8"),
  ]);
  for (const marker of ['role="tablist"', 'role="tab"', "aria-selected", "aria-controls", "ArrowRight", "Home", "End", "hidden={active"] ) assert.ok(tabs.includes(marker), marker);
  for (const marker of ["SIMULATED STUDY", 'aria-live="polite"', "Data table", "Detection power", "Null calibration", "Band localization", "Mismatch robustness", "Permutation budget", "loadPwrEmpiricalDemo"]) assert.ok(consoleSource.includes(marker), marker);
  assert.doesNotMatch(tabs, /localStorage|sessionStorage|history\.|location\.|URLSearchParams/);
  assert.doesNotMatch(consoleSource, /<svg|<canvas|<img|wss:\/\/|api\.upbit/i);
  for (const width of [900, 640, 420, 320]) assert.match(consoleCss, new RegExp(`@media \\(max-width:${width}px\\)`));
  assert.match(consoleCss, /prefers-reduced-motion:reduce/);
  assert.match(theoryCss, /\.studyTabs/);
});
