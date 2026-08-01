import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  coreFingerprint,
  syncArbitrage,
  validateEngineCommitPin,
  validateRemoteSourceUrl,
  validateShowcase,
} from "../scripts/sync-arbitrage.mjs";

const fixtureUrl = new URL("../app/data/arbitrage-showcase.json", import.meta.url);

async function fixture() {
  return JSON.parse(await readFile(fixtureUrl, "utf8"));
}

test("validates the committed engine evidence and authenticated provenance", async () => {
  const showcase = await fixture();
  const result = validateShowcase(showcase);

  assert.equal(result.rowCount, 48);
  assert.equal(result.fingerprint, showcase.provenance.coreFingerprint);
  assert.equal(coreFingerprint(showcase), showcase.provenance.coreFingerprint);
  assert.ok(showcase.verification.totalTests >= 270);
  assert.equal(showcase.verification.passedTests, showcase.verification.totalTests);

  const alteredProvenance = structuredClone(showcase);
  alteredProvenance.provenance.repository = "https://github.com/example/other-repository";
  assert.throws(() => validateShowcase(alteredProvenance), /provenance\.repository|Fingerprint mismatch/);

  const changedTimestamp = structuredClone(showcase);
  changedTimestamp.provenance.generatedAt = "2026-08-01T00:00:00.000Z";
  assert.equal(coreFingerprint(changedTimestamp), showcase.provenance.coreFingerprint, "generatedAt is the only unauthenticated provenance field");
  assert.doesNotThrow(() => validateShowcase(changedTimestamp));
});

test("contains every selection and explicit nonexecution and residual evidence", async () => {
  const showcase = await fixture();
  const expectedRows = showcase.scenarios.length
    * showcase.routeLab.directions.length
    * showcase.routeLab.startAmounts.length
    * showcase.routeLab.feeBps.length;

  assert.equal(showcase.routeLab.rows.length, expectedRows);
  assert.ok(showcase.routeLab.rows.filter((row) => row.status === "rejected").every((row) => row.output.value === null));
  assert.ok(showcase.routeLab.rows.some((row) => row.scenarioId === "stale" && row.status === "rejected"));
  assert.ok(showcase.routeLab.rows.some((row) => row.scenarioId === "thin" && row.status === "rejected"));

  const partial = showcase.routeLab.rows.find((row) => row.scenarioId === "partial" && row.status === "aborted" && row.residuals.length === 2);
  assert.ok(partial, "missing partial-fill row with both residual classes");
  assert.deepEqual(new Set(partial.residuals.map((residual) => residual.kind)), new Set(["unsubmitted-input", "acquired-intermediate"]));

  const unknownFee = structuredClone(showcase);
  unknownFee.routeLab.rows.find((row) => row.scenarioId === "partial" && row.status === "aborted").legs[0].feeAmount = null;
  unknownFee.provenance.coreFingerprint = coreFingerprint(unknownFee);
  assert.doesNotThrow(() => validateShowcase(unknownFee), "nullable unknown fees must remain schema-valid");
});

test("strict schema rejects unknown and normalized secret fields", async () => {
  const showcase = await fixture();

  for (const mutate of [
    (copy) => { copy.unexpected = true; },
    (copy) => { copy.verification.unexpected = true; },
    (copy) => { copy.routeLab.rows[0].unexpected = true; },
  ]) {
    const copy = structuredClone(showcase);
    mutate(copy);
    assert.throws(() => validateShowcase(copy), /Unknown field/);
  }

  for (const key of ["apiKey", "api_key", "API-KEY", "accountBalances", "account_balances"]) {
    const copy = structuredClone(showcase);
    copy[key] = "not-real-account-material";
    assert.throws(() => validateShowcase(copy), /Forbidden account or credential field/, key);
  }
});

test("sync check is non-mutating and local engine pin must match", async () => {
  const showcase = await fixture();
  const checked = await syncArbitrage(["--check", "--source", fileURLToPath(fixtureUrl), "--engine-commit", showcase.provenance.engineCommit]);
  assert.equal(checked.checkedOnly, true);
  await assert.rejects(
    syncArbitrage(["--check", "--source", fileURLToPath(fixtureUrl), "--engine-commit", "0".repeat(40)]),
    /--engine-commit must match/,
  );

  const altered = structuredClone(showcase);
  const executable = altered.routeLab.rows.find((row) => typeof row.output.value === "number");
  executable.output.value += 1;
  assert.throws(() => validateShowcase(altered), /Fingerprint mismatch/);
});

test("remote sync accepts only the exact two-pin GitHub raw contract", async () => {
  const artifactCommit = "a".repeat(40);
  const engineCommit = "b".repeat(40);
  const source = `https://raw.githubusercontent.com/Moon-Young-Choi/triangular-arbitrage-detector/${artifactCommit}/artifacts/showcase.v1.json`;

  assert.equal(validateRemoteSourceUrl(source, artifactCommit), source);
  assert.equal(validateEngineCommitPin(engineCommit, engineCommit), engineCommit);
  assert.throws(() => validateRemoteSourceUrl(source.replace("raw.githubusercontent.com", "example.com"), artifactCommit), /Remote source must be exactly/);
  assert.throws(() => validateRemoteSourceUrl(`${source}?download=1`, artifactCommit), /Remote source must be exactly/);
  assert.throws(() => validateRemoteSourceUrl(source, "c".repeat(40)), /Remote source must be exactly/);
  assert.throws(() => validateEngineCommitPin(engineCommit, "c".repeat(40)), /--engine-commit must match/);
});
