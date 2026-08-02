import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const destination = resolve(repositoryRoot, "app/data/quant-architecture.snapshot.v1.json");

const ALLOWLIST = new Set([
  "8856f34ff6e178c64f0c516fd84c4b207c03a56c4f1dd0d61f3766b502561472:d4446c680ef714ee71b110af375a514c086eeb0f89f16883c8d8233440af65cb",
]);

const EXPECTED_DOMAIN_SOURCE_IDS = [
  "quantPlatform.portfolioExperience",
  "quantPlatform.dataEvidence",
  "quantPlatform.algorithmServices",
  "quantPlatform.decisionPortfolio",
  "quantPlatform.algorithmWeightCalibration",
];

const EXPECTED_DEPLOYMENT_SOURCE_IDS = [
  "portfolioExperienceProject",
  "dataEvidenceProject",
  "algorithmRuntime",
  "portfolioDecisionProject",
  "algorithmWeightCalibrationProject",
];

const EXPECTED_VIEW_IDS = [
  "index",
  "portfolioExperience",
  "dataEvidence",
  "algorithmServices",
  "decisionPortfolio",
  "algorithmWeightCalibration",
  "evidenceAssemblyFlow",
  "algorithmConclusionFlow",
  "historicalCalibrationSampleFlow",
  "calibrationFlow",
  "portfolioOptimizationFlow",
  "gcpProjectTopology",
];

const EXPECTED_INVARIANT_IDS = Array.from({ length: 12 }, (_, index) => `QP-${String(index + 1).padStart(3, "0")}`);

const EXPECTED_COMPONENT_SOURCE_IDS = [
  "quantPlatform.portfolioExperience.portfolioConsole",
  "quantPlatform.portfolioExperience.portfolioRequestApi",
  "quantPlatform.dataEvidence.evidenceAssembly",
  "quantPlatform.dataEvidence.marketPriceService",
  "quantPlatform.dataEvidence.dartConnector",
  "quantPlatform.dataEvidence.fscStockPriceConnector",
  "quantPlatform.dataEvidence.exactDataPlane",
  "quantPlatform.dataEvidence.sharedEvidenceEncoder",
  "quantPlatform.dataEvidence.requestDataWorkspace",
  "quantPlatform.algorithmServices.conclusionGateway",
  "quantPlatform.algorithmServices.algorithmEvidenceCoordinator",
  "quantPlatform.algorithmServices.algorithmA",
  "quantPlatform.algorithmServices.algorithmA.decoder",
  "quantPlatform.algorithmServices.algorithmA.forecastFunction",
  "quantPlatform.algorithmServices.algorithmB",
  "quantPlatform.algorithmServices.algorithmB.decoder",
  "quantPlatform.algorithmServices.algorithmB.forecastFunction",
  "quantPlatform.decisionPortfolio.decisionCoordinator",
  "quantPlatform.decisionPortfolio.cosmos",
  "quantPlatform.decisionPortfolio.portfolioOptimizer",
  "quantPlatform.algorithmWeightCalibration.calibrationRunner",
  "quantPlatform.algorithmWeightCalibration.historicalReturnEvaluator",
  "quantPlatform.algorithmWeightCalibration.weightOptimizer",
];

const REQUIRED_SOURCE_MARKERS = [
  "quantPlatform = platform 'Quant Platform'",
  "portfolioExperience = domain 'Portfolio Experience'",
  "dataEvidence = domain 'Data & Evidence'",
  "algorithmServices = domain 'Algorithm Services'",
  "algorithmWeightCalibration = domain 'Algorithm Weight Calibration'",
  "decisionPortfolio = domain 'Decision & Portfolio'",
  "marketPriceService = service 'Market Price Service'",
  "historicalReturnEvaluator = job 'Historical Return Evaluator'",
  "data_access 'Historical Price Series through Market Price Service only'",
  "invoked_by 'Market Price Service only'",
  "result_contract 'complete A/B pair or failure for every As-of'",
  "never reuse a later-cutoff response for an earlier As-of",
  "dynamic view historicalCalibrationSampleFlow",
  "deployment view gcpProjectTopology",
];

function parseArguments(argv) {
  const options = {
    check: false,
    source: process.env.QUANT_LIKEC4_SOURCE,
    computed: process.env.QUANT_LIKEC4_COMPUTED,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--source" || argument === "--computed") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a file path`);
      options[argument.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (Boolean(options.source) !== Boolean(options.computed)) {
    throw new Error("Provide both --source and --computed, or neither");
  }
  return options;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(snapshot) {
  const payload = structuredClone(snapshot);
  delete payload.provenance.publicFingerprint;
  return `sha256:${sha256(Buffer.from(stableStringify(payload), "utf8"))}`;
}

function assertRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid public snapshot: ${label}`);
  }
  return value;
}

function assertUnique(items, label) {
  const ids = items.map((item) => assertRecord(item, label).id);
  if (ids.some((id) => typeof id !== "string" || id.length === 0) || new Set(ids).size !== ids.length) {
    throw new Error(`Invalid public snapshot: duplicate or missing ${label} id`);
  }
}

function assertExactList(actual, expected, label) {
  if (!Array.isArray(actual) || actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`Invalid public snapshot: ${label} must match the validated LikeC4 contract`);
  }
}

function validatePublicSnapshot(snapshot) {
  const root = assertRecord(snapshot, "root");
  if (root.schemaVersion !== "quant-architecture.v1") throw new Error("Unsupported public snapshot schema");

  const provenance = assertRecord(root.provenance, "provenance");
  if (provenance.sourceFormat !== "LikeC4" || provenance.sourceArtifact !== "trading-engine.c4") {
    throw new Error("Invalid public snapshot source descriptor");
  }
  if (!ALLOWLIST.has(`${provenance.sourceSha256}:${provenance.computedModelSha256}`)) {
    throw new Error("Public snapshot source hashes are not allowlisted");
  }

  const summary = assertRecord(root.summary, "summary");
  const arrayFields = ["flow", "domains", "contracts", "lifecycle", "deployments", "failureConditions"];
  for (const field of arrayFields) {
    if (!Array.isArray(root[field])) throw new Error(`Invalid public snapshot: ${field}`);
  }
  if (root.flow.length !== 6 || root.domains.length !== 5 || root.deployments.length !== 5) {
    throw new Error("Public snapshot topology is incomplete");
  }
  const modelContract = assertRecord(root.modelContract, "modelContract");
  assertExactList(modelContract.domainSourceIds, EXPECTED_DOMAIN_SOURCE_IDS, "domain source IDs");
  assertExactList(modelContract.deploymentSourceIds, EXPECTED_DEPLOYMENT_SOURCE_IDS, "deployment source IDs");
  assertExactList(modelContract.viewIds, EXPECTED_VIEW_IDS, "view IDs");
  assertExactList(modelContract.invariantIds, EXPECTED_INVARIANT_IDS, "invariant IDs");
  if (
    summary.flowPhaseCount !== root.flow.length ||
    summary.domainCount !== root.domains.length ||
    summary.deploymentBoundaryCount !== root.deployments.length ||
    summary.viewCount !== EXPECTED_VIEW_IDS.length ||
    summary.invariantCount !== EXPECTED_INVARIANT_IDS.length
  ) {
    throw new Error("Public snapshot summary does not match its topology");
  }

  assertUnique(root.flow, "flow");
  assertUnique(root.domains, "domain");
  assertUnique(root.contracts, "contract");
  assertUnique(root.deployments, "deployment");

  const componentIds = [];
  let deploymentUnitCount = 0;
  let logicalComponentCount = 0;
  function visitComponent(componentValue, label, logical = false) {
    const component = assertRecord(componentValue, label);
    componentIds.push(component.id);
    if (logical) logicalComponentCount += 1;
    const children = component.children ?? [];
    if (!Array.isArray(children)) throw new Error(`Invalid child component list: ${component.id}`);
    for (const [index, child] of children.entries()) {
      visitComponent(child, `${label}.children[${index}]`, true);
    }
  }
  for (const domainValue of root.domains) {
    const domain = assertRecord(domainValue, "domain");
    if (!Array.isArray(domain.components)) throw new Error(`Invalid component list: ${domain.id}`);
    deploymentUnitCount += domain.components.length;
    for (const [index, componentValue] of domain.components.entries()) {
      visitComponent(componentValue, `component in ${domain.id}[${index}]`);
    }
  }
  if (
    new Set(componentIds).size !== componentIds.length ||
    componentIds.length !== summary.componentCount ||
    deploymentUnitCount !== summary.deploymentUnitCount ||
    logicalComponentCount !== summary.logicalComponentCount
  ) {
    throw new Error("Public snapshot component count or identity mismatch");
  }
  for (const requiredTitle of ["Market Price Service", "Historical Return Evaluator", "Embedded Decoder A", "Forecast Function B"]) {
    if (!JSON.stringify(root.domains).includes(`\"title\":\"${requiredTitle}\"`)) {
      throw new Error(`Public snapshot is missing current component: ${requiredTitle}`);
    }
  }
  root.flow.forEach((phase, index) => {
    if (phase.order !== index + 1) throw new Error("Public snapshot flow order mismatch");
  });

  const boundary = assertRecord(root.boundary, "boundary");
  if (
    boundary.status !== "work-in-progress" ||
    boundary.architectureModelOnly !== true ||
    boundary.livePortfolioOutput !== false ||
    boundary.implementedServiceClaim !== false ||
    boundary.publishedPerformanceClaim !== false ||
    boundary.publicRepository !== false ||
    boundary.cloudProductsSelected !== false
  ) {
    throw new Error("Public snapshot evidence boundary was weakened");
  }

  const serialized = JSON.stringify(snapshot);
  if (/(?:[A-Za-z]:\\|file:\/\/|\/Users\/|\\Users\\)/i.test(serialized)) {
    throw new Error("Public snapshot contains a local file path");
  }
  if (/(?:api[_-]?key|password|private[_-]?key|access[_-]?token|client[_-]?secret)/i.test(serialized)) {
    throw new Error("Public snapshot contains a secret-like field");
  }

  const expectedFingerprint = fingerprint(snapshot);
  if (provenance.publicFingerprint !== expectedFingerprint) {
    throw new Error(`Public fingerprint mismatch; expected ${expectedFingerprint}`);
  }
}

async function validateSourcePair(sourcePath, computedPath, snapshot) {
  const [sourceBuffer, computedBuffer] = await Promise.all([
    readFile(resolve(sourcePath)),
    readFile(resolve(computedPath)),
  ]);
  const sourceHash = sha256(sourceBuffer);
  const computedHash = sha256(computedBuffer);
  if (!ALLOWLIST.has(`${sourceHash}:${computedHash}`)) {
    throw new Error(`LikeC4 input pair is not allowlisted (${sourceHash}:${computedHash})`);
  }

  const sourceText = sourceBuffer.toString("utf8");
  for (const marker of REQUIRED_SOURCE_MARKERS) {
    if (!sourceText.includes(marker)) throw new Error(`LikeC4 source is missing required public contract: ${marker}`);
  }
  for (const invariantId of EXPECTED_INVARIANT_IDS) {
    if (!sourceText.includes(invariantId)) throw new Error(`LikeC4 source is missing invariant reference: ${invariantId}`);
  }

  const computed = JSON.parse(computedBuffer.toString("utf8"));
  const elements = assertRecord(computed.elements, "computed elements");
  for (const elementId of ["quantPlatform", ...EXPECTED_DOMAIN_SOURCE_IDS, ...EXPECTED_COMPONENT_SOURCE_IDS]) {
    if (!elements[elementId]) throw new Error(`Computed LikeC4 model is missing ${elementId}`);
  }

  const actualDomainIds = Object.entries(elements)
    .filter(([id, element]) => id.startsWith("quantPlatform.") && id.split(".").length === 2 && element.kind === "domain")
    .map(([id]) => id);
  assertExactList(actualDomainIds, EXPECTED_DOMAIN_SOURCE_IDS, "computed domain IDs");

  const computedViews = assertRecord(computed.views, "computed views");
  assertExactList(Object.keys(computedViews), EXPECTED_VIEW_IDS, "computed view IDs");

  const computedDeployments = assertRecord(computed.deployments, "computed deployments");
  const deploymentElements = assertRecord(computedDeployments.elements, "computed deployment elements");
  assertExactList(
    Object.keys(deploymentElements).filter((id) => !id.includes(".")),
    EXPECTED_DEPLOYMENT_SOURCE_IDS,
    "computed deployment IDs",
  );
  if (Object.keys(assertRecord(computedDeployments.relations, "computed deployment relations")).length !== 0) {
    throw new Error("Computed GCP project topology must not contain cross-project relations");
  }

  snapshot.provenance.sourceSha256 = sourceHash;
  snapshot.provenance.computedModelSha256 = computedHash;
  snapshot.provenance.publicFingerprint = fingerprint(snapshot);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const snapshot = JSON.parse(await readFile(destination, "utf8"));

  if (options.source && options.computed) {
    await validateSourcePair(options.source, options.computed, snapshot);
  }

  validatePublicSnapshot(snapshot);

  if (!options.check && options.source && options.computed) {
    await writeFile(destination, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  }

  console.log(
    `${options.check ? "checked" : options.source ? "synchronized" : "verified"} ${snapshot.schemaVersion} ` +
      `(${snapshot.summary.domainCount} domains, ${snapshot.summary.componentCount} components, ` +
      `${snapshot.summary.deploymentBoundaryCount} projects, ${snapshot.summary.viewCount} views, ${snapshot.provenance.publicFingerprint})`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
