export type PwrEmpiricalDataClass = "synthetic" | "observed";

export interface PwrEmpiricalMethodV1 {
  id: string;
  label: string;
  tone: "blue" | "coral" | "violet" | "lime";
  marker: "circle" | "diamond" | "square" | "triangle";
}

export interface PwrEmpiricalScenarioV1 {
  id: string;
  label: string;
  detail: string;
  trueBand: [number, number];
}

export interface PwrEmpiricalResultV1 {
  methodId: string;
  level: number;
  levelInterval: [number, number];
  power: number;
  powerInterval: [number, number];
  supportIou: number;
  locationErrorBins: number;
  runtimeMs: number;
  selectedBand: [number, number];
}

export interface PwrEmpiricalRowV1 {
  id: string;
  scenarioId: string;
  nPerGroup: number;
  effectSize: number;
  mismatch: number;
  permutations: number;
  results: PwrEmpiricalResultV1[];
}

export interface PwrEmpiricalDemoV1 {
  schemaVersion: "pwr-empirical-demo.v1";
  provenance: {
    dataClass: PwrEmpiricalDataClass;
    seed: string | null;
    generatorVersion: string;
    generatedAt: string;
    sourceStudyId: string | null;
    sourceArtifactSha256: string | null;
    fingerprintAlgorithm: string;
    fingerprint: string;
  };
  design: {
    alpha: number;
    replicatesPerPoint: number;
    frequencyBins: number;
    scenarios: PwrEmpiricalScenarioV1[];
    methods: PwrEmpiricalMethodV1[];
    controls: {
      sampleSizes: number[];
      effectSizes: number[];
      mismatchLevels: number[];
      permutationBudgets: number[];
    };
    defaultSelection: {
      scenarioId: string;
      nPerGroup: number;
      effectSize: number;
      mismatch: number;
      permutations: number;
    };
  };
  rows: PwrEmpiricalRowV1[];
  boundary: {
    syntheticStudy: boolean;
    realRecordings: boolean;
    externalValidation: boolean;
    performanceClaim: boolean;
    replacementReady: boolean;
    statement: string;
  };
}

export function assertPwrEmpiricalDemo(value: unknown): asserts value is PwrEmpiricalDemoV1 {
  if (!value || typeof value !== "object") throw new Error("Empirical artifact must be an object");
  const artifact = value as Partial<PwrEmpiricalDemoV1>;
  if (artifact.schemaVersion !== "pwr-empirical-demo.v1") throw new Error("Unsupported empirical artifact");
  if (!artifact.provenance || !["synthetic", "observed"].includes(artifact.provenance.dataClass)) throw new Error("Missing empirical provenance");
  if (!/^[0-9a-f]{64}$/u.test(artifact.provenance.fingerprint ?? "")) throw new Error("Invalid empirical fingerprint");
  if (!artifact.design || artifact.design.methods?.length !== 4 || artifact.design.scenarios?.length !== 4) throw new Error("Incomplete empirical design");
  if (!Array.isArray(artifact.rows) || artifact.rows.length === 0) throw new Error("Missing empirical result rows");
  if (artifact.provenance.dataClass === "synthetic") {
    if (!artifact.boundary?.syntheticStudy || artifact.boundary.performanceClaim || artifact.boundary.realRecordings) throw new Error("Synthetic boundary is not fail-closed");
  } else if (!artifact.provenance.sourceStudyId || !/^[0-9a-f]{64}$/u.test(artifact.provenance.sourceArtifactSha256 ?? "")) {
    throw new Error("Observed data require study provenance and a source artifact hash");
  }
}

export async function loadPwrEmpiricalDemo(signal?: AbortSignal): Promise<PwrEmpiricalDemoV1> {
  const response = await fetch("/data/pwr-empirical-demo.v1.json", { signal, cache: "force-cache" });
  if (!response.ok) throw new Error(`Empirical artifact unavailable (${response.status})`);
  const value: unknown = await response.json();
  assertPwrEmpiricalDemo(value);
  return value;
}
