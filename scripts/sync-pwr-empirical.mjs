import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const destination = fileURLToPath(new URL("../public/data/pwr-empirical-demo.v1.json", import.meta.url));
const fingerprintAlgorithm = "sha256(stable-json-authenticated-v1)";
const seed = "pwr-empirical-preview-20260802";
const generatedAt = "2026-08-02T00:00:00.000Z";
const replicates = 1000;

const scenarios = [
  { id: "localized-spike", label: "Localized spike", detail: "Exact rank-one covariance increase on a narrow predeclared band.", trueBand: [48, 64] },
  { id: "approximate-spike", label: "Approximate spike", detail: "Localized leading component with controlled off-direction covariance drift.", trueBand: [42, 66] },
  { id: "diffuse-covariance", label: "Diffuse covariance", detail: "Broad covariance change where localization offers less advantage.", trueBand: [28, 92] },
  { id: "clustered-recordings", label: "Clustered recordings", detail: "Recording-level units with dependent frames inside each synthetic cluster.", trueBand: [52, 68] },
];

const methods = [
  { id: "pwr-scan", label: "PWR-Scan", tone: "blue", marker: "circle" },
  { id: "global-roy", label: "Global Roy", tone: "coral", marker: "diamond" },
  { id: "diagonal-covariance", label: "Diagonal covariance", tone: "violet", marker: "square" },
  { id: "unwhitened-block", label: "Unwhitened block scan", tone: "lime", marker: "triangle" },
];

const sampleSizes = [32, 64, 128];
const effectSizes = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5];
const mismatchLevels = [0, 0.1, 0.2, 0.3];
const permutationBudgets = [199, 499, 1999];

const efficiency = {
  "localized-spike": { "pwr-scan": 1, "global-roy": 0.64, "diagonal-covariance": 0.48, "unwhitened-block": 0.74 },
  "approximate-spike": { "pwr-scan": 0.88, "global-roy": 0.62, "diagonal-covariance": 0.45, "unwhitened-block": 0.61 },
  "diffuse-covariance": { "pwr-scan": 0.7, "global-roy": 0.88, "diagonal-covariance": 0.58, "unwhitened-block": 0.66 },
  "clustered-recordings": { "pwr-scan": 0.92, "global-roy": 0.57, "diagonal-covariance": 0.38, "unwhitened-block": 0.67 },
};

const mismatchSensitivity = { "pwr-scan": 0.85, "global-roy": 0.45, "diagonal-covariance": 0.3, "unwhitened-block": 1.05 };
const runtimeBaseMs = { "pwr-scan": 46, "global-roy": 18, "diagonal-covariance": 12, "unwhitened-block": 29 };
const methodLevel = { "pwr-scan": 0.049, "global-roy": 0.052, "diagonal-covariance": 0.047, "unwhitened-block": 0.054 };
const scenarioLevelOffset = { "localized-spike": -0.001, "approximate-spike": 0.001, "diffuse-covariance": 0, "clustered-recordings": 0.002 };
const budgetFactor = { 199: 0.94, 499: 0.975, 1999: 1 };

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function round(value, digits = 6) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function interval(successes, total) {
  const z = 1.959963984540054;
  const probability = successes / total;
  const denominator = 1 + (z * z) / total;
  const center = (probability + (z * z) / (2 * total)) / denominator;
  const half = (z / denominator) * Math.sqrt((probability * (1 - probability)) / total + (z * z) / (4 * total * total));
  return [round(Math.max(0, center - half)), round(Math.min(1, center + half))];
}

function intersectionOverUnion(first, second) {
  const overlap = Math.max(0, Math.min(first[1], second[1]) - Math.max(first[0], second[0]));
  const union = Math.max(first[1], second[1]) - Math.min(first[0], second[0]);
  return union === 0 ? 0 : overlap / union;
}

function selectedBand(methodId, trueBand, quality, mismatch) {
  const [start, stop] = trueBand;
  const width = stop - start;
  const center = (start + stop) / 2;
  if (methodId === "global-roy") return [0, 128];
  if (methodId === "diagonal-covariance") {
    const location = clamp(Math.round(center + (1 - quality) * 12 + mismatch * 10), 0, 127);
    return [location, location + 1];
  }
  const shiftScale = methodId === "pwr-scan" ? 5 : 9;
  const widthScale = methodId === "pwr-scan" ? 0.22 : 0.42;
  const shift = Math.round((1 - quality) * shiftScale + mismatch * shiftScale);
  const selectedWidth = Math.max(2, Math.round(width * (1 + (1 - quality) * widthScale)));
  const selectedStart = clamp(Math.round(center - selectedWidth / 2 + shift), 0, 128 - selectedWidth);
  return [selectedStart, selectedStart + selectedWidth];
}

function resultFor({ scenario, method, nPerGroup, effectSize, mismatch, permutations }) {
  const targetLevel = clamp(methodLevel[method.id] + scenarioLevelOffset[scenario.id], 0.035, 0.065);
  const levelRejections = Math.round(targetLevel * replicates);
  const level = levelRejections / replicates;
  const usableSignal = effectSize * Math.sqrt(nPerGroup / 64) * efficiency[scenario.id][method.id]
    * Math.max(0.2, 1 - mismatch * mismatchSensitivity[method.id]);
  const zero = sigmoid(-2.2);
  const response = clamp((sigmoid(5 * (usableSignal - 0.44)) - zero) / (1 - zero), 0, 1);
  const modeledPower = effectSize === 0
    ? level
    : level + (0.985 - level) * response * budgetFactor[permutations];
  const powerRejections = Math.max(levelRejections, Math.round(clamp(modeledPower, level, 0.985) * replicates));
  const power = powerRejections / replicates;
  const quality = effectSize === 0 ? 0 : clamp((power - level) / (1 - level), 0, 1);
  const band = selectedBand(method.id, scenario.trueBand, quality, mismatch);
  const trueCenter = (scenario.trueBand[0] + scenario.trueBand[1]) / 2;
  const selectedCenter = (band[0] + band[1]) / 2;
  const runtimeMs = runtimeBaseMs[method.id]
    * (nPerGroup / 64) ** 1.16
    * (permutations / 199) ** 0.91
    * (scenario.id === "clustered-recordings" ? 1.28 : scenario.id === "diffuse-covariance" ? 1.12 : 1);
  return {
    methodId: method.id,
    level: round(level),
    levelInterval: interval(levelRejections, replicates),
    power: round(power),
    powerInterval: interval(powerRejections, replicates),
    supportIou: round(intersectionOverUnion(band, scenario.trueBand)),
    locationErrorBins: round(Math.abs(selectedCenter - trueCenter), 3),
    runtimeMs: round(runtimeMs, 2),
    selectedBand: band,
  };
}

function fingerprintPayload(artifact) {
  const payload = structuredClone(artifact);
  delete payload.provenance.fingerprint;
  return payload;
}

export function empiricalFingerprint(artifact) {
  return createHash("sha256").update(stableJson(fingerprintPayload(artifact))).digest("hex");
}

export function buildPwrEmpiricalDemo() {
  const rows = [];
  for (const scenario of scenarios) {
    for (const nPerGroup of sampleSizes) {
      for (const effectSize of effectSizes) {
        for (const mismatch of mismatchLevels) {
          for (const permutations of permutationBudgets) {
            rows.push({
              id: `${scenario.id}:n${nPerGroup}:theta${effectSize}:eta${mismatch}:r${permutations}`,
              scenarioId: scenario.id,
              nPerGroup,
              effectSize,
              mismatch,
              permutations,
              results: methods.map((method) => resultFor({ scenario, method, nPerGroup, effectSize, mismatch, permutations })),
            });
          }
        }
      }
    }
  }
  const artifact = {
    schemaVersion: "pwr-empirical-demo.v1",
    provenance: {
      dataClass: "synthetic",
      seed,
      generatorVersion: "pwr-empirical-preview/1.0.0",
      generatedAt,
      sourceStudyId: null,
      sourceArtifactSha256: null,
      fingerprintAlgorithm,
      fingerprint: "",
    },
    design: {
      alpha: 0.05,
      replicatesPerPoint: replicates,
      frequencyBins: 128,
      scenarios,
      methods,
      controls: { sampleSizes, effectSizes, mismatchLevels, permutationBudgets },
      defaultSelection: { scenarioId: "localized-spike", nPerGroup: 64, effectSize: 0.75, mismatch: 0.1, permutations: 1999 },
    },
    rows,
    boundary: {
      syntheticStudy: true,
      realRecordings: false,
      externalValidation: false,
      performanceClaim: false,
      replacementReady: true,
      statement: "Deterministic synthetic preview data for interface evaluation; no real recordings, publication-scale validation, or deployed detector performance are represented.",
    },
  };
  artifact.provenance.fingerprint = empiricalFingerprint(artifact);
  return artifact;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exactKeys(value, keys, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert(JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort()), `${label} has unknown or missing keys`);
}

function rowKey(row) {
  return `${row.scenarioId}:${row.nPerGroup}:${row.effectSize}:${row.mismatch}:${row.permutations}`;
}

export function validatePwrEmpiricalDemo(artifact) {
  exactKeys(artifact, ["schemaVersion", "provenance", "design", "rows", "boundary"], "artifact");
  assert(artifact.schemaVersion === "pwr-empirical-demo.v1", "Unsupported empirical schemaVersion");
  exactKeys(artifact.provenance, ["dataClass", "seed", "generatorVersion", "generatedAt", "sourceStudyId", "sourceArtifactSha256", "fingerprintAlgorithm", "fingerprint"], "provenance");
  assert(["synthetic", "observed"].includes(artifact.provenance.dataClass), "Unknown empirical data class");
  if (artifact.provenance.dataClass === "synthetic") {
    assert(typeof artifact.provenance.seed === "string" && artifact.provenance.seed.length > 0, "Synthetic data require a seed");
    assert(artifact.provenance.sourceStudyId === null && artifact.provenance.sourceArtifactSha256 === null, "Synthetic data cannot claim observed-study provenance");
  } else {
    assert(artifact.provenance.seed === null, "Observed data cannot retain a synthetic seed");
    assert(typeof artifact.provenance.sourceStudyId === "string" && artifact.provenance.sourceStudyId.length > 0, "Observed data require sourceStudyId");
    assert(/^[0-9a-f]{64}$/u.test(artifact.provenance.sourceArtifactSha256), "Observed data require a source artifact SHA-256");
  }
  assert(artifact.provenance.fingerprintAlgorithm === fingerprintAlgorithm, "Unexpected fingerprint algorithm");
  assert(/^[0-9a-f]{64}$/u.test(artifact.provenance.fingerprint), "Invalid empirical fingerprint");
  assert(empiricalFingerprint(artifact) === artifact.provenance.fingerprint, "Empirical fingerprint mismatch");
  exactKeys(artifact.design, ["alpha", "replicatesPerPoint", "frequencyBins", "scenarios", "methods", "controls", "defaultSelection"], "design");
  exactKeys(artifact.design.controls, ["sampleSizes", "effectSizes", "mismatchLevels", "permutationBudgets"], "design.controls");
  assert(artifact.design.alpha === 0.05 && artifact.design.replicatesPerPoint >= 100, "Invalid synthetic study design");
  const scenarioIds = new Set(artifact.design.scenarios.map((value) => value.id));
  const methodIds = new Set(artifact.design.methods.map((value) => value.id));
  assert(scenarioIds.size === 4 && methodIds.size === 4, "Expected four scenarios and four methods");
  const expectedRows = artifact.design.scenarios.length
    * artifact.design.controls.sampleSizes.length
    * artifact.design.controls.effectSizes.length
    * artifact.design.controls.mismatchLevels.length
    * artifact.design.controls.permutationBudgets.length;
  assert(artifact.rows.length === expectedRows, `Expected ${expectedRows} empirical rows`);
  const rowsByKey = new Map();
  for (const row of artifact.rows) {
    exactKeys(row, ["id", "scenarioId", "nPerGroup", "effectSize", "mismatch", "permutations", "results"], `row ${row.id}`);
    assert(scenarioIds.has(row.scenarioId), `Unknown scenario in ${row.id}`);
    assert(row.results.length === methodIds.size, `Incomplete method results in ${row.id}`);
    assert(new Set(row.results.map((value) => value.methodId)).size === methodIds.size, `Duplicate method result in ${row.id}`);
    for (const result of row.results) {
      exactKeys(result, ["methodId", "level", "levelInterval", "power", "powerInterval", "supportIou", "locationErrorBins", "runtimeMs", "selectedBand"], `${row.id}.${result.methodId}`);
      assert(methodIds.has(result.methodId), `Unknown method ${result.methodId}`);
      assert(result.level >= 0.035 && result.level <= 0.065, `Implausible null level in ${row.id}`);
      assert(result.power >= result.level && result.power <= 1, `Invalid power in ${row.id}`);
      assert(result.supportIou >= 0 && result.supportIou <= 1, `Invalid support IoU in ${row.id}`);
      assert(result.runtimeMs > 0, `Invalid runtime in ${row.id}`);
      if (row.effectSize === 0) assert(result.power === result.level, `Zero-effect power must equal level in ${row.id}`);
    }
    const key = rowKey(row);
    assert(!rowsByKey.has(key), `Duplicate empirical combination ${key}`);
    rowsByKey.set(key, row);
  }
  for (const scenarioId of scenarioIds) {
    for (const mismatch of artifact.design.controls.mismatchLevels) {
      for (const permutations of artifact.design.controls.permutationBudgets) {
        for (const methodId of methodIds) {
          for (const nPerGroup of artifact.design.controls.sampleSizes) {
            let previous = -1;
            for (const effectSize of artifact.design.controls.effectSizes) {
              const row = rowsByKey.get(`${scenarioId}:${nPerGroup}:${effectSize}:${mismatch}:${permutations}`);
              const power = row.results.find((value) => value.methodId === methodId).power;
              assert(power >= previous, `Power must be nondecreasing in effect size for ${scenarioId}/${methodId}`);
              previous = power;
            }
          }
        }
      }
    }
  }
  for (const scenarioId of scenarioIds) {
    for (const nPerGroup of artifact.design.controls.sampleSizes) {
      for (const effectSize of artifact.design.controls.effectSizes) {
        for (const permutations of artifact.design.controls.permutationBudgets) {
          let previous = Infinity;
          for (const mismatch of artifact.design.controls.mismatchLevels) {
            const row = rowsByKey.get(`${scenarioId}:${nPerGroup}:${effectSize}:${mismatch}:${permutations}`);
            const power = row.results.find((value) => value.methodId === "pwr-scan").power;
            assert(power <= previous, `PWR power must be nonincreasing in mismatch for ${scenarioId}`);
            previous = power;
          }
        }
      }
    }
  }
  exactKeys(artifact.boundary, ["syntheticStudy", "realRecordings", "externalValidation", "performanceClaim", "replacementReady", "statement"], "boundary");
  if (artifact.provenance.dataClass === "synthetic") {
    assert(artifact.boundary.syntheticStudy === true && artifact.boundary.realRecordings === false && artifact.boundary.externalValidation === false && artifact.boundary.performanceClaim === false, "Synthetic boundary must fail closed");
  }
  const serialized = stableJson(artifact).toLowerCase();
  assert(!/(api[_-]?key|password|private[_-]?key|account[_-]?balance|credential)/u.test(serialized), "Forbidden credential-like field in empirical artifact");
  return { fingerprint: artifact.provenance.fingerprint, rowCount: artifact.rows.length, methodCount: methodIds.size };
}

function render(artifact) {
  return JSON.stringify(artifact, null, 2) + "\n";
}

export async function syncPwrEmpirical({ write = false } = {}) {
  if (write) {
    const artifact = buildPwrEmpiricalDemo();
    validatePwrEmpiricalDemo(artifact);
    await writeFile(destination, render(artifact), "utf8");
    return { ...validatePwrEmpiricalDemo(artifact), written: true };
  }
  const artifact = JSON.parse(await readFile(destination, "utf8"));
  const result = validatePwrEmpiricalDemo(artifact);
  if (artifact.provenance.dataClass === "synthetic") {
    assert(render(artifact) === render(buildPwrEmpiricalDemo()), "Committed synthetic empirical artifact is stale");
  }
  return { ...result, written: false };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const write = process.argv.includes("--write");
  syncPwrEmpirical({ write })
    .then((result) => console.log(`${result.written ? "Generated" : "Checked"} ${result.rowCount} synthetic empirical rows across ${result.methodCount} methods · ${result.fingerprint}`))
    .catch((error) => { console.error(error); process.exitCode = 1; });
}
