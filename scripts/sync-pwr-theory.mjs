import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultArtifact = new URL("../app/data/pwr-theory-evidence.v1.json", import.meta.url);
const statusValues = new Set(["complete", "verified", "partial", "pending", "not-applicable", "negative"]);
const proofKinds = new Set(["assumption", "definition", "lemma", "proposition", "theorem", "corollary", "remark"]);
const forbiddenKey = /^(api[-_ ]?key|secret|token|password|account|balance|credential|private[-_ ]?key)$/i;
const validationBaselineCommit = "d77e2a04a9237c23ef07f1b4a07e0a8149cf7b2d";
const engineCommit = "7847fc5561987bc11385eba5093a94cafdb5cc6b";

export const requiredProofLabels = [
  "Assumption 2.1", "Proposition 2.2", "Proposition 2.3",
  "Assumption 3.1", "Proposition 3.2", "Proposition 3.3",
  "Definition 4.1", "Proposition 4.2", "Remark 4.3", "Definition 4.4", "Definition 4.5",
  "Assumption 5.1", "Remark 5.2", "Definition 5.3", "Lemma 5.4", "Theorem 5.5", "Corollary 5.6",
  "Definition 5.7", "Theorem 5.8", "Remark 5.9", "Proposition 5.10",
  "Assumption 6.1", "Assumption 6.2", "Lemma 6.3", "Lemma 6.4", "Remark 6.5", "Theorem 6.6",
  "Remark 6.7", "Remark 6.8", "Corollary 6.9", "Corollary 6.10", "Theorem 6.11", "Theorem 6.12",
  "Remark 6.13", "Assumption 6.14", "Theorem 6.15",
  "Theorem 7.1", "Lemma 7.2", "Theorem 7.3", "Corollary 7.4",
  "Lemma B.1", "Lemma B.2", "Lemma B.3", "Lemma B.4", "Lemma B.5", "Lemma B.6",
  "Remark B.7", "Theorem B.8", "Proposition B.9",
];

export const requiredAppendixLabels = [
  "B.1", "B.2", "B.3", "B.4", "B.5", "B.6", "B.7", "B.8", "B.9", "B.10", "B.11", "B.11.1", "B.11.2", "B.12",
];

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function theoryFingerprint(artifact) {
  const payload = structuredClone(artifact);
  if (payload.provenance) delete payload.provenance.fingerprint;
  return createHash("sha256").update(JSON.stringify(canonicalize(payload))).digest("hex");
}

function assertExactKeys(value, expected, context) {
  const unknown = Object.keys(value).filter((key) => !expected.includes(key));
  if (unknown.length) throw new Error(`Unknown field in ${context}: ${unknown.join(", ")}`);
  const missing = expected.filter((key) => !(key in value));
  if (missing.length) throw new Error(`Missing field in ${context}: ${missing.join(", ")}`);
}

function scanForbidden(value, trail = []) {
  if (Array.isArray(value)) return value.forEach((item, index) => scanForbidden(item, [...trail, String(index)]));
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKey.test(key.replace(/[^a-z0-9]/gi, ""))) throw new Error(`Forbidden account or credential field: ${[...trail, key].join(".")}`);
    scanForbidden(child, [...trail, key]);
  }
}

function assertStrings(value, context, { nonEmpty = true } = {}) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || (nonEmpty && item.trim() === ""))) {
    throw new Error(`${context} must be an array of non-empty strings`);
  }
}

function assertUnique(values, context) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length) throw new Error(`Duplicate ${context}: ${[...new Set(duplicates)].join(", ")}`);
}

function validateProofGraph(entries) {
  const proofIds = new Set(entries.map((entry) => entry.id));
  const visiting = new Set();
  const visited = new Set();
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  function visit(id) {
    if (visiting.has(id)) throw new Error(`Cyclic proof dependency at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id).dependencies) if (proofIds.has(dependency)) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  entries.forEach((entry) => visit(entry.id));
}

function validateAuditedProofContracts(entries) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const dependencyContracts = {
    "proposition-2-3": [],
    "assumption-5-1": [],
    "definition-5-3": ["definition-4-5"],
    "proposition-5-10": ["definition-5-3", "definition-5-7"],
    "theorem-b-8": ["lemma-b-5", "lemma-b-6"],
  };

  for (const [id, expected] of Object.entries(dependencyContracts)) {
    const actual = byId.get(id)?.dependencies;
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Dependency contract mismatch for ${id}`);
    }
  }

  const pooledBound = byId.get("proposition-2-3");
  const pooledEquation = pooledBound?.equations.find((equation) => equation.id === "eq-2-31");
  if (!pooledEquation || !/\\vartheta\s*>\s*\\eta[\s\S]*>\s*0/.test(pooledEquation.tex)) {
    throw new Error("Proposition 2.3 pooled positive bound must require vartheta > eta");
  }
  const pooledText = [
    pooledBound.statement,
    ...pooledBound.assumptions,
    pooledBound.conclusion,
    pooledBound.boundary,
    ...pooledBound.equations.map((equation) => equation.alt),
  ].join(" ");
  if (/\btheta\b/i.test(pooledText)) throw new Error("Proposition 2.3 must use vartheta notation consistently");

  for (const entry of entries) {
    for (const path of entry.codeMapping) {
      if (path.includes("src/pwrscan/") && !path.startsWith("runtime/src/pwrscan/")) {
        throw new Error(`Integrated runtime path required for ${entry.id}: ${path}`);
      }
    }
  }
}

export function validatePwrTheory(artifact) {
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error("Artifact must be an object");
  assertExactKeys(artifact, ["schemaVersion", "provenance", "verification", "guarantees", "proofEntries", "appendixSections", "foundations", "claimsBoundary"], "artifact");
  if (artifact.schemaVersion !== "pwr-theory-evidence.v1") throw new Error("Unsupported schemaVersion");
  scanForbidden(artifact);

  assertExactKeys(artifact.provenance, ["repository", "validationBaselineCommit", "engineCommit", "engineRelease", "targetRelease", "releaseCommit", "integrationEvidenceFingerprint", "manuscript", "manuscriptPages", "manuscriptPublished", "fingerprint"], "provenance");
  if (artifact.provenance.repository !== "https://github.com/Moon-Young-Choi/pwr-scan") throw new Error("Unexpected provenance.repository");
  if (artifact.provenance.manuscriptPages !== 117 || artifact.provenance.manuscriptPublished !== false) throw new Error("Manuscript boundary mismatch");
  if (artifact.provenance.validationBaselineCommit !== validationBaselineCommit) throw new Error("Unexpected validationBaselineCommit");
  if (artifact.provenance.engineCommit !== engineCommit) throw new Error("Unexpected engineCommit");
  if (!/^[0-9a-f]{40}$/.test(artifact.provenance.releaseCommit)) throw new Error("Invalid releaseCommit");
  if (!/^[0-9a-f]{64}$/.test(artifact.provenance.integrationEvidenceFingerprint)) throw new Error("Invalid integrationEvidenceFingerprint");

  if (!Array.isArray(artifact.proofEntries) || artifact.proofEntries.length !== requiredProofLabels.length) {
    throw new Error(`Expected exactly ${requiredProofLabels.length} proof entries`);
  }
  if (!Array.isArray(artifact.appendixSections) || artifact.appendixSections.length !== requiredAppendixLabels.length) {
    throw new Error(`Expected exactly ${requiredAppendixLabels.length} Appendix B sections`);
  }
  assertUnique(artifact.proofEntries.map((entry) => entry.id), "proof id");
  assertUnique(artifact.proofEntries.map((entry) => entry.label), "proof label");
  assertUnique(artifact.appendixSections.map((entry) => entry.id), "appendix id");
  assertUnique(artifact.appendixSections.map((entry) => entry.label), "appendix label");

  const proofLabels = new Set(artifact.proofEntries.map((entry) => entry.label));
  const appendixLabels = new Set(artifact.appendixSections.map((entry) => entry.label));
  for (const label of requiredProofLabels) if (!proofLabels.has(label)) throw new Error(`Missing proof object: ${label}`);
  for (const label of requiredAppendixLabels) if (!appendixLabels.has(label)) throw new Error(`Missing Appendix B section: ${label}`);

  const allIds = new Set([
    ...artifact.proofEntries.map((entry) => entry.id),
    ...artifact.appendixSections.map((entry) => entry.id),
  ]);
  const equationIds = [];
  for (const entry of artifact.proofEntries) {
    assertExactKeys(entry, ["id", "label", "kind", "sectionId", "title", "statement", "assumptions", "dependencies", "proofSteps", "conclusion", "boundary", "codeMapping", "equations", "evidence"], `proofEntries.${entry.id}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) throw new Error(`Unstable proof anchor: ${entry.id}`);
    if (!proofKinds.has(entry.kind)) throw new Error(`Invalid proof kind: ${entry.kind}`);
    for (const key of ["label", "sectionId", "title", "statement", "conclusion", "boundary"]) if (typeof entry[key] !== "string" || !entry[key].trim()) throw new Error(`${entry.id}.${key} must be non-empty`);
    for (const key of ["assumptions", "dependencies", "proofSteps", "codeMapping"]) assertStrings(entry[key], `${entry.id}.${key}`, { nonEmpty: key !== "dependencies" });
    for (const dependency of entry.dependencies) if (!allIds.has(dependency)) throw new Error(`Unknown dependency ${dependency} in ${entry.id}`);
    if (!Array.isArray(entry.equations)) throw new Error(`${entry.id}.equations must be an array`);
    for (const equation of entry.equations) {
      assertExactKeys(equation, ["id", "label", "tex", "alt"], `${entry.id}.equations`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(equation.id) || !equation.tex || !equation.alt) throw new Error(`Invalid equation in ${entry.id}`);
      if (allIds.has(equation.id)) throw new Error(`Equation anchor collides with content anchor: ${equation.id}`);
      equationIds.push(equation.id);
    }
    assertExactKeys(entry.evidence, ["proof", "implementation", "audit", "lockedResult"], `${entry.id}.evidence`);
    for (const [key, value] of Object.entries(entry.evidence)) if (!statusValues.has(value)) throw new Error(`Invalid ${entry.id}.evidence.${key}`);
  }
  assertUnique(equationIds, "equation anchor");
  validateAuditedProofContracts(artifact.proofEntries);

  for (const section of artifact.appendixSections) {
    assertExactKeys(section, ["id", "label", "title", "dependencies", "coreSteps"], `appendixSections.${section.id}`);
    if (!/^appendix-b-[0-9]+(?:-[0-9]+)*$/.test(section.id)) throw new Error(`Unstable appendix anchor: ${section.id}`);
    assertStrings(section.dependencies, `${section.id}.dependencies`, { nonEmpty: false });
    assertStrings(section.coreSteps, `${section.id}.coreSteps`);
    for (const dependency of section.dependencies) if (!allIds.has(dependency)) throw new Error(`Unknown dependency ${dependency} in ${section.id}`);
  }
  if (!Array.isArray(artifact.foundations) || artifact.foundations.length !== 15) throw new Error("Expected exactly 15 Appendix A foundation sections");
  assertUnique(artifact.foundations.map((item) => item.id), "foundation id");
  artifact.foundations.forEach((item, index) => {
    assertExactKeys(item, ["id", "label", "title", "role"], `foundations.${item.id}`);
    if (item.id !== `foundation-a-${index + 1}` || item.label !== `A.${index + 1}` || !item.title || !item.role) throw new Error(`Invalid Appendix A foundation at index ${index}`);
  });
  validateProofGraph(artifact.proofEntries);

  assertStrings(artifact.claimsBoundary, "claimsBoundary");
  if (artifact.verification.engineeringRuns !== 56 || artifact.verification.computationalTests !== 246) throw new Error("Engineering evidence count mismatch");
  if (artifact.verification.publicationScaleValidation !== "pending" || artifact.verification.externalValidity !== "not-established") throw new Error("Evidence boundary must remain explicit");
  if (artifact.verification.dcase.status !== "negative" || artifact.verification.dcase.rocAuc !== 0.4843 || artifact.verification.dcase.sensitivity !== 0) throw new Error("Negative DCASE evidence mismatch");
  if (artifact.verification.campaigns.some((campaign) => campaign.status !== "pending")) throw new Error("V1-V5 campaigns must remain pending");

  const fingerprint = theoryFingerprint(artifact);
  if (artifact.provenance.fingerprint !== fingerprint) throw new Error(`Fingerprint mismatch: expected ${fingerprint}`);
  return { fingerprint, proofCount: artifact.proofEntries.length, appendixCount: artifact.appendixSections.length };
}

export function validateRemoteTheorySource(source, commit) {
  if (!/^[0-9a-f]{40}$/.test(commit ?? "")) throw new Error("Remote sync requires a full 40-character --artifact-commit");
  const expected = `https://raw.githubusercontent.com/Moon-Young-Choi/Moon-Young-Choi.github.io/${commit}/app/data/pwr-theory-evidence.v1.json`;
  if (source !== expected) throw new Error(`Remote source must be exactly ${expected}`);
  return source;
}

function parseArgs(args) {
  const options = {
    check: false,
    source: fileURLToPath(defaultArtifact),
    artifactCommit: undefined,
    repositoryCommit: undefined,
    repositoryFingerprint: undefined,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--check") options.check = true;
    else if (arg === "--source") options.source = args[++index];
    else if (arg === "--artifact-commit") options.artifactCommit = args[++index];
    else if (arg === "--repository-commit") options.repositoryCommit = args[++index];
    else if (arg === "--repository-fingerprint") options.repositoryFingerprint = args[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.source) throw new Error("--source requires a value");
  if (Boolean(options.repositoryCommit) !== Boolean(options.repositoryFingerprint)) {
    throw new Error("--repository-commit and --repository-fingerprint must be provided together");
  }
  if (options.repositoryCommit && !/^[0-9a-f]{40}$/.test(options.repositoryCommit)) throw new Error("Invalid --repository-commit");
  if (options.repositoryFingerprint && !/^[0-9a-f]{64}$/.test(options.repositoryFingerprint)) throw new Error("Invalid --repository-fingerprint");
  return options;
}

function integrationPath(path) {
  if (path.startsWith("src/pwrscan/")) return `runtime/${path}`;
  if (path.startsWith("tests/test_core_") || path === "tests/test_features.py") return `runtime/${path}`;
  if (path === "docs/theory-traceability.md") return `runtime/${path}`;
  return path;
}

function synchronizeIntegrationProvenance(artifact, options) {
  const synchronized = structuredClone(artifact);
  synchronized.provenance.validationBaselineCommit = validationBaselineCommit;
  synchronized.provenance.engineCommit = engineCommit;
  if (options.repositoryCommit) synchronized.provenance.releaseCommit = options.repositoryCommit;
  if (options.repositoryFingerprint) synchronized.provenance.integrationEvidenceFingerprint = options.repositoryFingerprint;
  for (const entry of synchronized.proofEntries) entry.codeMapping = entry.codeMapping.map(integrationPath);
  synchronized.provenance.fingerprint = theoryFingerprint(synchronized);
  return synchronized;
}

async function readSource(source, artifactCommit) {
  if (/^https?:\/\//.test(source)) {
    validateRemoteTheorySource(source, artifactCommit);
    const response = await fetch(source, { redirect: "error" });
    if (!response.ok) throw new Error(`Theory source returned HTTP ${response.status}`);
    return response.text();
  }
  return readFile(source, "utf8");
}

export async function syncPwrTheory(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  const artifact = JSON.parse(await readSource(options.source, options.artifactCommit));
  validatePwrTheory(artifact);
  const synchronized = synchronizeIntegrationProvenance(artifact, options);
  const result = validatePwrTheory(synchronized);
  const rendered = `${JSON.stringify(synchronized, null, 2)}\n`;
  if (options.check && rendered !== `${JSON.stringify(artifact, null, 2)}\n`) throw new Error("PWR theory artifact is not synchronized with the integration contract");
  if (!options.check) await writeFile(defaultArtifact, rendered, "utf8");
  return { ...result, checkedOnly: options.check, destination: fileURLToPath(defaultArtifact) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  syncPwrTheory()
    .then((result) => console.log(`${result.checkedOnly ? "Checked" : "Synced"} ${result.proofCount} proof objects, ${result.appendixCount} Appendix B sections; SHA-256 ${result.fingerprint}`))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
