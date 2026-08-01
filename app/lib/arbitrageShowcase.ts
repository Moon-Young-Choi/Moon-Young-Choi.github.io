import showcaseJson from "@/app/data/arbitrage-showcase.json";

export type ArbitrageDirection = "forward" | "reverse";
export type ArbitrageStatus = "eligible" | "rejected" | "aborted";

export type MoneyValue = {
  asset: string;
  value: number;
};

export type OrderbookLevel = {
  price: number;
  size: number;
};

export type OrderbookSnapshot = {
  market: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
};

export type ShowcaseLeg = {
  index: number;
  market: string;
  side: "bid" | "ask";
  inputAsset: string;
  inputAmount: number;
  limitPrice: number | null;
  feeAmount: number | null;
  feeAsset: string;
  outputAsset: string;
  outputAmount: number | null;
  fillRatio: number;
};

export type ShowcaseTimelineEvent = {
  kind: string;
  label: string;
  detail: string;
  status: "passed" | "rejected" | "blocked" | "warning";
};

export type ShowcaseRow = {
  id: string;
  scenarioId: string;
  direction: ArbitrageDirection;
  startAmount: MoneyValue & { label: string };
  feeBps: number;
  route: string[];
  markets: string[];
  status: ArbitrageStatus;
  reason: string | null;
  input: MoneyValue;
  output: { asset: string; value: number | null };
  grossProfitRate: number;
  netProfitRate: number;
  requiredNetProfitRate: number;
  profitBufferRate: number;
  bufferedProfitRate: number;
  passesProfitThreshold: boolean;
  legs: ShowcaseLeg[];
  orderbooks: OrderbookSnapshot[];
  residuals: Array<{
    kind: "unsubmitted-input" | "acquired-intermediate";
    asset: string;
    amount: number;
    legIndex: number;
  }>;
  timeline: ShowcaseTimelineEvent[];
};

export type ArbitrageShowcaseV1 = {
  schemaVersion: 1;
  provenance: {
    repository: string;
    engineCommit: string;
    generatedAt: string;
    coreFingerprint: string;
    fingerprintAlgorithm: "sha256(stable-json-authenticated-v1)";
    source: string;
    strategy: { id: string; version: string; hash: string };
  };
  verification: {
    status: "passed";
    testCommand: string;
    syntaxCheck: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    runtime: string;
    localRun: {
      status: "passed";
      nodeVersion: string;
      platform: string;
      architecture: string;
      totalTests: number;
      passedTests: number;
      failedTests: number;
    };
    declaredCiMatrix: {
      workflow: string;
      operatingSystems: string[];
      nodeVersions: string[];
      verificationStatus: "declared-only";
      verifiedByThisArtifact: false;
    };
  };
  routeLab: {
    assets: string[];
    directions: ArbitrageDirection[];
    startAmounts: Array<MoneyValue & { label: string }>;
    feeBps: number[];
    scenarioIds: string[];
    rowCount: number;
    rows: ShowcaseRow[];
  };
  scenarios: Array<{
    id: string;
    label: string;
    description: string;
    expectedStatus: ArbitrageStatus;
  }>;
  guards: {
    configuration: Record<string, string | number | boolean>;
    rows: Array<{
      id: string;
      label: string;
      value: string | number;
      required: string | number;
      passed: boolean;
      reason: string | null;
    }>;
    rejectionReasons?: Record<string, string>;
  };
  boundary: {
    syntheticData: boolean;
    liveMarketData: boolean;
    liveTrading: boolean;
    realizedPnlIncluded: boolean;
    profitClaim: boolean;
    liveTradingStatus?: string;
    externalApiCalls?: boolean;
    apiKeysIncluded?: boolean;
    accountBalancesIncluded?: boolean;
    statement: string;
  };
};

export const arbitrageShowcase = showcaseJson as unknown as ArbitrageShowcaseV1;

export function defaultShowcaseRow(showcase = arbitrageShowcase) {
  return showcase.routeLab.rows.find(
    (row) => row.scenarioId === "normal" && row.direction === "forward" && row.feeBps === 5,
  ) ?? showcase.routeLab.rows[0];
}

export function formatAsset(value: number | null, asset: string) {
  if (value === null) return "Unknown";
  if (asset === "KRW") {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value);
}

export function formatRate(rate: number) {
  return `${rate >= 0 ? "+" : ""}${(rate * 100).toFixed(3)}%`;
}
