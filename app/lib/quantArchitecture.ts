import rawSnapshot from "@/app/data/quant-architecture.snapshot.v1.json";

export type QuantArchitectureStatus = "work-in-progress";

export interface QuantArchitectureProvenanceV1 {
  sourceFormat: "LikeC4";
  sourceArtifact: "trading-engine.c4";
  capturedOn: string;
  sourceSha256: string;
  computedModelSha256: string;
  publicFingerprint: string;
}

export interface QuantFlowPhaseV1 {
  id: string;
  order: number;
  title: string;
  owner: string;
  description: string;
}

export interface QuantComponentV1 {
  id: string;
  title: string;
  kind: string;
  responsibility: string;
  children?: QuantComponentV1[];
}

export interface QuantDomainV1 {
  id: string;
  title: string;
  purpose: string;
  components: QuantComponentV1[];
}

export interface QuantContractV1 {
  id: string;
  title: string;
  rule: string;
}

export interface QuantLifecycleRowV1 {
  dataClass: string;
  createdBy: string;
  reuseBoundary: string;
  cleanup: string;
}

export interface QuantDeploymentBoundaryV1 {
  id: string;
  title: string;
  purpose: string;
}

export interface QuantModelContractV1 {
  domainSourceIds: string[];
  deploymentSourceIds: string[];
  viewIds: string[];
  invariantIds: string[];
}

export interface QuantArchitectureSnapshotV1 {
  schemaVersion: "quant-architecture.v1";
  provenance: QuantArchitectureProvenanceV1;
  summary: {
    domainCount: number;
    componentCount: number;
    deploymentUnitCount: number;
    logicalComponentCount: number;
    deploymentBoundaryCount: number;
    flowPhaseCount: number;
    viewCount: number;
    invariantCount: number;
  };
  flow: QuantFlowPhaseV1[];
  domains: QuantDomainV1[];
  modelContract: QuantModelContractV1;
  contracts: QuantContractV1[];
  lifecycle: QuantLifecycleRowV1[];
  deployments: QuantDeploymentBoundaryV1[];
  failureConditions: string[];
  boundary: {
    status: QuantArchitectureStatus;
    architectureModelOnly: boolean;
    livePortfolioOutput: boolean;
    implementedServiceClaim: boolean;
    publishedPerformanceClaim: boolean;
    publicRepository: boolean;
    cloudProductsSelected: boolean;
    sourceInputs: string[];
    outOfScope: string[];
  };
}

const EXPECTED_SOURCE_SHA256 = "8856f34ff6e178c64f0c516fd84c4b207c03a56c4f1dd0d61f3766b502561472";
const EXPECTED_COMPUTED_SHA256 = "d4446c680ef714ee71b110af375a514c086eeb0f89f16883c8d8233440af65cb";
const EXPECTED_VIEWS = [
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
const EXPECTED_INVARIANTS = Array.from({ length: 12 }, (_, index) => `QP-${String(index + 1).padStart(3, "0")}`);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`Invalid Quant architecture snapshot: ${label}`);
  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Invalid Quant architecture snapshot: ${label}`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid Quant architecture snapshot: ${label}`);
  }
  return value;
}

function assertUniqueIds(items: unknown[], label: string): void {
  const ids = items.map((item, index) => requireString(requireRecord(item, `${label}[${index}]`).id, `${label}[${index}].id`));
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Invalid Quant architecture snapshot: duplicate ${label} id`);
  }
}

function requireExactStrings(value: unknown, expected: string[], label: string): void {
  const actual = requireArray(value, label);
  if (actual.length !== expected.length || actual.some((item, index) => item !== expected[index])) {
    throw new Error(`Invalid Quant architecture snapshot: ${label}`);
  }
}

function assertQuantArchitectureSnapshot(value: unknown): asserts value is QuantArchitectureSnapshotV1 {
  const root = requireRecord(value, "root");
  if (root.schemaVersion !== "quant-architecture.v1") {
    throw new Error("Unsupported Quant architecture schema");
  }

  const provenance = requireRecord(root.provenance, "provenance");
  if (provenance.sourceFormat !== "LikeC4" || provenance.sourceArtifact !== "trading-engine.c4") {
    throw new Error("Unexpected Quant architecture provenance");
  }
  if (provenance.sourceSha256 !== EXPECTED_SOURCE_SHA256 || provenance.computedModelSha256 !== EXPECTED_COMPUTED_SHA256) {
    throw new Error("Quant architecture source is not allowlisted");
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(requireString(provenance.publicFingerprint, "provenance.publicFingerprint"))) {
    throw new Error("Invalid Quant architecture public fingerprint");
  }

  const summary = requireRecord(root.summary, "summary");
  const flow = requireArray(root.flow, "flow");
  const domains = requireArray(root.domains, "domains");
  const deployments = requireArray(root.deployments, "deployments");
  const contracts = requireArray(root.contracts, "contracts");
  const lifecycle = requireArray(root.lifecycle, "lifecycle");
  const failures = requireArray(root.failureConditions, "failureConditions");

  if (summary.domainCount !== domains.length || domains.length !== 5) {
    throw new Error("Quant architecture domain count mismatch");
  }
  if (summary.flowPhaseCount !== flow.length || flow.length !== 6) {
    throw new Error("Quant architecture flow count mismatch");
  }
  if (summary.deploymentBoundaryCount !== deployments.length || deployments.length !== 5) {
    throw new Error("Quant architecture deployment count mismatch");
  }
  if (summary.viewCount !== 12 || summary.invariantCount !== 12) {
    throw new Error("Quant architecture model-contract count mismatch");
  }
  if (contracts.length < 6 || lifecycle.length < 4 || failures.length < 1) {
    throw new Error("Quant architecture public contracts are incomplete");
  }

  assertUniqueIds(flow, "flow");
  assertUniqueIds(domains, "domains");
  assertUniqueIds(deployments, "deployments");
  assertUniqueIds(contracts, "contracts");

  const modelContract = requireRecord(root.modelContract, "modelContract");
  requireExactStrings(modelContract.viewIds, EXPECTED_VIEWS, "modelContract.viewIds");
  requireExactStrings(modelContract.invariantIds, EXPECTED_INVARIANTS, "modelContract.invariantIds");
  if (requireArray(modelContract.domainSourceIds, "modelContract.domainSourceIds").length !== 5) {
    throw new Error("Quant architecture domain source contract mismatch");
  }
  if (requireArray(modelContract.deploymentSourceIds, "modelContract.deploymentSourceIds").length !== 5) {
    throw new Error("Quant architecture deployment source contract mismatch");
  }

  const componentIds: string[] = [];
  let deploymentUnitCount = 0;
  let logicalComponentCount = 0;
  function visitComponent(componentValue: unknown, label: string, logical = false): void {
    const component = requireRecord(componentValue, label);
    componentIds.push(requireString(component.id, `${label}.id`));
    requireString(component.responsibility, `${label}.responsibility`);
    if (logical) logicalComponentCount += 1;
    const children = component.children === undefined ? [] : requireArray(component.children, `${label}.children`);
    children.forEach((child, index) => visitComponent(child, `${label}.children[${index}]`, true));
  }
  domains.forEach((domainValue, domainIndex) => {
    const domain = requireRecord(domainValue, `domains[${domainIndex}]`);
    requireString(domain.title, `domains[${domainIndex}].title`);
    const components = requireArray(domain.components, `domains[${domainIndex}].components`);
    deploymentUnitCount += components.length;
    components.forEach((componentValue, componentIndex) => {
      visitComponent(componentValue, `domains[${domainIndex}].components[${componentIndex}]`);
    });
  });
  if (
    new Set(componentIds).size !== componentIds.length ||
    summary.componentCount !== componentIds.length ||
    summary.deploymentUnitCount !== deploymentUnitCount ||
    summary.logicalComponentCount !== logicalComponentCount
  ) {
    throw new Error("Quant architecture component count or identity mismatch");
  }
  for (const title of ["Market Price Service", "Historical Return Evaluator", "Embedded Decoder A", "Forecast Function B"]) {
    if (!JSON.stringify(domains).includes(`\"title\":\"${title}\"`)) {
      throw new Error(`Quant architecture snapshot is missing ${title}`);
    }
  }

  flow.forEach((phaseValue, index) => {
    const phase = requireRecord(phaseValue, `flow[${index}]`);
    if (phase.order !== index + 1) throw new Error("Quant architecture flow order mismatch");
  });

  const boundary = requireRecord(root.boundary, "boundary");
  if (
    boundary.status !== "work-in-progress" ||
    boundary.architectureModelOnly !== true ||
    boundary.livePortfolioOutput !== false ||
    boundary.implementedServiceClaim !== false ||
    boundary.publishedPerformanceClaim !== false ||
    boundary.publicRepository !== false ||
    boundary.cloudProductsSelected !== false
  ) {
    throw new Error("Quant architecture evidence boundary was weakened");
  }

  const serialized = JSON.stringify(value);
  if (/(?:[A-Za-z]:\\|file:\/\/|\/Users\/|\\Users\\)/i.test(serialized)) {
    throw new Error("Quant architecture snapshot contains a local path");
  }
  if (/(?:api[_-]?key|password|private[_-]?key|access[_-]?token|client[_-]?secret)/i.test(serialized)) {
    throw new Error("Quant architecture snapshot contains a forbidden secret-like field");
  }
}

assertQuantArchitectureSnapshot(rawSnapshot);

export const quantArchitecture: QuantArchitectureSnapshotV1 = rawSnapshot;
