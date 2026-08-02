import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  requiredAppendixLabels,
  requiredProofLabels,
  syncPwrTheory,
  theoryFingerprint,
  validatePwrTheory,
} from "../scripts/sync-pwr-theory.mjs";

const artifactUrl = new URL("../app/data/pwr-theory-evidence.v1.json", import.meta.url);
async function artifact() { return JSON.parse(await readFile(artifactUrl, "utf8")); }

test("authenticates the complete manuscript registry", async () => {
  const data = await artifact();
  const result = validatePwrTheory(data);
  assert.equal(result.proofCount, 49);
  assert.equal(result.appendixCount, 14);
  assert.equal(result.fingerprint, data.provenance.fingerprint);
  assert.equal(theoryFingerprint(data), data.provenance.fingerprint);
  assert.match(data.provenance.releaseCommit, /^[0-9a-f]{40}$/);
  assert.match(data.provenance.integrationEvidenceFingerprint, /^[0-9a-f]{64}$/);
  assert.equal(data.provenance.validationBaselineCommit, "d77e2a04a9237c23ef07f1b4a07e0a8149cf7b2d");
  assert.equal(data.provenance.engineCommit, "7847fc5561987bc11385eba5093a94cafdb5cc6b");
  assert.deepEqual(new Set(data.proofEntries.map((entry) => entry.label)), new Set(requiredProofLabels));
  assert.deepEqual(new Set(data.appendixSections.map((entry) => entry.label)), new Set(requiredAppendixLabels));
  assert.deepEqual(data.foundations.map((entry) => entry.label), Array.from({ length: 15 }, (_, index) => `A.${index + 1}`));
});

test("keeps every proof dependency resolvable and the formal graph acyclic", async () => {
  const data = await artifact();
  const proofIds = new Set(data.proofEntries.map((entry) => entry.id));
  const allIds = new Set([...proofIds, ...data.appendixSections.map((entry) => entry.id)]);
  for (const entry of data.proofEntries) {
    assert.match(entry.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(entry.statement.length > 40, `${entry.id} has an underspecified statement`);
    assert.ok(entry.proofSteps.length > 0, `${entry.id} has no proof or role step`);
    assert.ok(entry.boundary.length > 20, `${entry.id} has no honest boundary`);
    assert.ok(entry.codeMapping.every((path) => (!path.includes("src/pwrscan/") || path.startsWith("runtime/src/pwrscan/")) && !path.startsWith("tests/test_core_")), `${entry.id} has a pre-integration runtime path`);
    entry.dependencies.forEach((dependency) => assert.ok(allIds.has(dependency), `${entry.id} -> ${dependency}`));
  }
  assert.ok(proofIds.has("remark-b-7"));
  assert.ok(allIds.has("appendix-b-7"));
  assert.ok(proofIds.has("theorem-b-8"));
  assert.ok(allIds.has("appendix-b-8"));
  assert.ok(proofIds.has("proposition-b-9"));
  assert.ok(allIds.has("appendix-b-9"));
});

test("locks the audited pooled bound, dependency DAG and integrated runtime paths", async () => {
  const data = await artifact();
  const byId = new Map(data.proofEntries.map((entry) => [entry.id, entry]));
  const expectedDependencies = {
    "proposition-2-3": [],
    "assumption-5-1": [],
    "definition-5-3": ["definition-4-5"],
    "proposition-5-10": ["definition-5-3", "definition-5-7"],
    "theorem-b-8": ["lemma-b-5", "lemma-b-6"],
  };
  for (const [id, expected] of Object.entries(expectedDependencies)) {
    assert.deepEqual(byId.get(id).dependencies, expected, `${id} has an unaudited dependency edge`);
  }

  const pooledBound = byId.get("proposition-2-3");
  assert.match(pooledBound.statement, /vartheta > eta/);
  assert.match(pooledBound.equations[0].tex, /\\vartheta\s*>\s*\\eta[\s\S]*>\s*0/);
  assert.doesNotMatch([
    pooledBound.statement,
    ...pooledBound.assumptions,
    pooledBound.conclusion,
    pooledBound.boundary,
    ...pooledBound.equations.map((equation) => equation.alt),
  ].join(" "), /\btheta\b/i);
  for (const entry of data.proofEntries) {
    for (const path of entry.codeMapping) {
      if (path.includes("src/pwrscan/")) assert.match(path, /^runtime\/src\/pwrscan\//);
    }
  }

  const forbiddenEdge = structuredClone(data);
  forbiddenEdge.proofEntries.find((entry) => entry.id === "proposition-2-3").dependencies = ["proposition-2-2"];
  forbiddenEdge.provenance.fingerprint = theoryFingerprint(forbiddenEdge);
  assert.throws(() => validatePwrTheory(forbiddenEdge), /Dependency contract mismatch for proposition-2-3/);

  const unqualifiedBound = structuredClone(data);
  unqualifiedBound.proofEntries.find((entry) => entry.id === "proposition-2-3").equations[0].tex = "\\tau_B>0";
  unqualifiedBound.provenance.fingerprint = theoryFingerprint(unqualifiedBound);
  assert.throws(() => validatePwrTheory(unqualifiedBound), /pooled positive bound must require vartheta > eta/);

  const rawRuntimePath = structuredClone(data);
  rawRuntimePath.proofEntries.find((entry) => entry.codeMapping.some((path) => path.includes("src/pwrscan/"))).codeMapping[0] = "src/pwrscan/statistics.py";
  rawRuntimePath.provenance.fingerprint = theoryFingerprint(rawRuntimePath);
  assert.throws(() => validatePwrTheory(rawRuntimePath), /Integrated runtime path required/);
});

test("states square-root minimax rates and never the extraction-damaged linear rate", async () => {
  const data = await artifact();
  const lower = data.proofEntries.find((entry) => entry.id === "theorem-6-11");
  const match = data.proofEntries.find((entry) => entry.id === "theorem-6-12");
  const adaptive = data.proofEntries.find((entry) => entry.id === "corollary-7-4");
  assert.match(lower.statement, /sqrt\(b\/n_1\).*sqrt\(log M\/n_1\)/);
  assert.match(match.statement, /sqrt\(b\/n\).*sqrt\(log M\/n\)/);
  assert.match(adaptive.equations[0].tex, /\\sqrt/);
  assert.doesNotMatch(match.statement, /rate b\/n \+ log M\/n/i);
});

test("keeps engineering, statistical and negative external evidence separate", async () => {
  const data = await artifact();
  assert.equal(data.verification.engineeringRuns, 56);
  assert.equal(data.verification.computationalTests, 246);
  assert.equal(data.verification.publicationScaleValidation, "pending");
  assert.equal(data.verification.externalValidity, "not-established");
  assert.deepEqual(data.verification.dcase, {
    status: "negative",
    rocAuc: 0.4843,
    sensitivity: 0,
    interpretation: "The external DCASE check did not demonstrate discrimination. It is retained as negative evidence, not reframed as validation.",
  });
  assert.ok(data.verification.campaigns.every((campaign) => campaign.status === "pending"));
  assert.ok(data.proofEntries.every((entry) => entry.evidence.lockedResult === "pending" || entry.evidence.lockedResult === "not-applicable"));
});

test("sync check is local, deterministic and rejects secrets or unauthenticated edits", async () => {
  const data = await artifact();
  const checked = await syncPwrTheory(["--check", "--source", fileURLToPath(artifactUrl)]);
  assert.equal(checked.checkedOnly, true);

  const changed = structuredClone(data);
  changed.proofEntries.find((entry) => entry.id === "theorem-5-5").statement += " Altered.";
  assert.throws(() => validatePwrTheory(changed), /Fingerprint mismatch/);

  const secret = structuredClone(data);
  secret.api_key = "not-a-real-key";
  assert.throws(() => validatePwrTheory(secret), /Unknown field|Forbidden account or credential field/);
});

test("ships an accessible proof renderer and isolated responsive visual system", async () => {
  const [page, panel, css, panelCss] = await Promise.all([
    readFile(new URL("../app/components/PwrTheoryPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PwrTheoryProjectPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PwrTheoryPage.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PwrTheoryProjectPanel.module.css", import.meta.url), "utf8"),
  ]);
  for (const marker of ["htmlAndMathml", "aria-label", "<table>", "<caption", "PDF not published", "Negative evidence", "proofEntriesFor", "Selected proof-dependency spine", "Pooled-whitening transformation", "Proof–code-path–study status matrix", "Empirical appendix", "The mathematical argument ends above"]) {
    assert.ok(page.includes(marker), `page renderer is missing ${marker}`);
  }
  assert.doesNotMatch(page, /EvidencePips|Assumptions, proof chain and boundary|<details open=/);
  assert.doesNotMatch(page, /["']src\/pwrscan\//);
  assert.doesNotMatch(page, /\.pdf|<svg|<canvas|<img/i);
  assert.doesNotMatch(panel, /<svg|<canvas|<img/i);
  for (const width of [900, 640, 420, 320]) assert.match(css, new RegExp(`@media \\(max-width:\\s*${width}px\\)`));
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(panelCss, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /overflow:\s*clip/);
});
