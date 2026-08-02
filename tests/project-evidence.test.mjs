import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  requiredAppendixLabels,
  requiredProofLabels,
  theoryFingerprint,
  validatePwrTheory,
} from "../scripts/sync-pwr-theory.mjs";

const pwrArtifact = JSON.parse(await readFile(new URL("../app/data/pwr-theory-evidence.v1.json", import.meta.url), "utf8"));
const quantArtifact = JSON.parse(await readFile(new URL("../app/data/quant-architecture.snapshot.v1.json", import.meta.url), "utf8"));

test("PWR evidence covers the manuscript declaration and appendix oracles", () => {
  const result = validatePwrTheory(pwrArtifact);
  assert.equal(result.proofCount, 49);
  assert.equal(result.appendixCount, 14);
  assert.equal(pwrArtifact.foundations.length, 15);
  assert.equal(pwrArtifact.provenance.fingerprint, theoryFingerprint(pwrArtifact));
  assert.deepEqual(pwrArtifact.proofEntries.map(({ label }) => label), requiredProofLabels);
  assert.deepEqual(pwrArtifact.appendixSections.map(({ label }) => label), requiredAppendixLabels);
  assert.equal(pwrArtifact.provenance.manuscriptPublished, false);
  assert.equal(pwrArtifact.verification.publicationScaleValidation, "pending");
  assert.equal(pwrArtifact.verification.externalValidity, "not-established");
});

test("PWR evidence fails closed on a missing dependency or altered fingerprint", () => {
  const missing = structuredClone(pwrArtifact);
  missing.proofEntries.find(({ id }) => id === "theorem-5-5").dependencies.push("theorem-does-not-exist");
  assert.throws(() => validatePwrTheory(missing), /Unknown dependency/);

  const altered = structuredClone(pwrArtifact);
  altered.verification.dcase.rocAuc = 0.9;
  assert.throws(() => validatePwrTheory(altered), /Negative DCASE evidence mismatch|Fingerprint mismatch/);
});

test("Quant architecture snapshot is sanitized and accepted by the offline sync validator", () => {
  const serialized = JSON.stringify(quantArtifact);
  assert.equal(quantArtifact.provenance.sourceSha256, "8856f34ff6e178c64f0c516fd84c4b207c03a56c4f1dd0d61f3766b502561472");
  assert.equal(quantArtifact.provenance.computedModelSha256, "d4446c680ef714ee71b110af375a514c086eeb0f89f16883c8d8233440af65cb");
  assert.equal(quantArtifact.summary.domainCount, 5);
  assert.equal(quantArtifact.summary.flowPhaseCount, 6);
  assert.equal(quantArtifact.summary.componentCount, 23);
  assert.equal(quantArtifact.summary.deploymentUnitCount, 19);
  assert.equal(quantArtifact.summary.logicalComponentCount, 4);
  assert.equal(quantArtifact.summary.deploymentBoundaryCount, 5);
  assert.equal(quantArtifact.summary.viewCount, 12);
  assert.equal(quantArtifact.summary.invariantCount, 12);
  assert.equal(quantArtifact.modelContract.viewIds.length, 12);
  assert.deepEqual(
    quantArtifact.modelContract.invariantIds,
    Array.from({ length: 12 }, (_, index) => `QP-${String(index + 1).padStart(3, "0")}`),
  );
  const publicComponents = quantArtifact.domains.flatMap((domain) =>
    domain.components.flatMap((component) => [component, ...(component.children ?? [])]),
  );
  assert.equal(publicComponents.length, 23);
  assert.ok(publicComponents.some(({ title }) => title === "Market Price Service"));
  assert.ok(publicComponents.some(({ title }) => title === "Historical Return Evaluator"));
  assert.equal(quantArtifact.foundationResources, undefined);
  assert.equal(quantArtifact.boundary.architectureModelOnly, true);
  assert.equal(quantArtifact.boundary.livePortfolioOutput, false);
  assert.doesNotMatch(serialized, /(?:[A-Za-z]:\\|file:\/\/|\\Users\\|\/Users\/)/i);
  assert.doesNotMatch(serialized, /(?:api[_-]?key|password|private[_-]?key|access[_-]?token|client[_-]?secret)/i);

  const result = spawnSync(process.execPath, [fileURLToPath(new URL("../scripts/sync-quant-platform.mjs", import.meta.url)), "--check"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test("Quant homepage cover renders a fitted joint-distribution mesh", async () => {
  const [panel, css] = await Promise.all([
    readFile(new URL("../app/components/QuantPlatformProjectPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/QuantPlatformProjectPanel.module.css", import.meta.url), "utf8"),
  ]);

  for (const marker of [
    "surfaceHeight",
    "animatedHeight",
    "projectSurface",
    "projectedPatchArea",
    "createSurfaceFrame",
    "surfaceCells",
    "meshLines",
    "requestAnimationFrame",
    "backgroundColor",
    "styles.surfaceMesh",
    "styles.panelSignal",
  ]) {
    assert.ok(panel.includes(marker), `Quant probability-surface cover is missing ${marker}`);
  }
  assert.doesNotMatch(panel, /styles\.(axes|floor)/);
  assert.doesNotMatch(panel, /<svg|<canvas|<img/i);
  assert.match(panel, /hsl\(\$\{hue\.toFixed\(2\)\}/);
  assert.match(panel, /x:\s*point\.x[\s\S]*y:\s*point\.baseY\s*-\s*z\s*\*\s*Z_PROJECTION/);
  assert.doesNotMatch(css, /quant-mesh-breathe|quant-color-drift|quant-wire-drift|quant-peak-pulse/);
  assert.doesNotMatch(css, /rotateX|rotateZ|scaleX|scaleY/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.panel/);
});
