export type EventEdgePerspectiveId = "market-maker" | "user";
export type EventEdgeCandidateId = "wa-long" | "hedge-package";
export type EventEdgeProfileId = "baseline" | "shallow" | "inventory-skewed";
export type EventEdgeStateId = "S1" | "S2" | "S3" | "S4";
export type EventEdgeContractId = "WA" | "WB" | "VOL";
export type EventEdgeNotional = 0.5 | 1;

export interface EventEdgeStateV1 {
  id: EventEdgeStateId;
  label: string;
  description: string;
  trueWeight: number;
  payoffs: Record<EventEdgeContractId, number>;
}

export interface EventEdgePerspectiveV1 {
  id: EventEdgePerspectiveId;
  label: string;
  weights: Record<EventEdgeStateId, number>;
  values: Record<EventEdgeContractId, number>;
}

export interface EventEdgeContractV1 {
  id: EventEdgeContractId;
  label: string;
  kind: string;
  payoffDescription: string;
}

export interface EventEdgeCandidateV1 {
  id: EventEdgeCandidateId;
  label: string;
  description: string;
}

export interface EventEdgeProfileV1 {
  id: EventEdgeProfileId;
  label: string;
  description: string;
}

export interface EventEdgeBookLevelV1 {
  level: number;
  bidPrice: number;
  bidQuantity: number;
  askPrice: number;
  askQuantity: number;
}

export interface EventEdgeBookV1 {
  profileId: EventEdgeProfileId;
  contractId: EventEdgeContractId;
  levels: EventEdgeBookLevelV1[];
}

export interface EventEdgeOutcomeV1 {
  stateId: EventEdgeStateId;
  pnl: number;
}

export interface EventEdgeMetricsV1 {
  expectedPnl: number;
  tailLoss: number;
  objective: number;
  worstStateId: EventEdgeStateId;
  outcomes: EventEdgeOutcomeV1[];
}

export interface EventEdgeLegV1 {
  contractId: EventEdgeContractId;
  side: "buy" | "sell";
  requestedQuantity: number;
  availableQuantity: number;
  price: number;
  fillRatio: number;
  filledQuantity: number;
  cashFlow: number;
}

export interface EventEdgeDecisionRowV1 {
  id: string;
  perspectiveId: EventEdgePerspectiveId;
  candidateId: EventEdgeCandidateId;
  notional: EventEdgeNotional;
  profileId: EventEdgeProfileId;
  valuation: Record<EventEdgeContractId, number>;
  standaloneEdge: number;
  fillRatio: number;
  filledNotional: number;
  oldMetrics: EventEdgeMetricsV1;
  requestedMetrics: EventEdgeMetricsV1;
  executedMetrics: EventEdgeMetricsV1;
  passesObjective: boolean;
  passesLossLimit: boolean;
  decision: "conditional-commit" | "reject";
  reason: string;
  legs: EventEdgeLegV1[];
  requestedPositionChange: Record<EventEdgeContractId, number>;
  executedPositionChange: Record<EventEdgeContractId, number>;
  requestedCash: number;
  executedCash: number;
}

export interface EventEdgeSettlementRowV1 {
  id: string;
  decisionRowId: string;
  stateId: EventEdgeStateId;
  userPositions: Record<EventEdgeContractId, number>;
  makerPositions: Record<EventEdgeContractId, number>;
  userCashAfterTrades: number;
  makerCashAfterTrades: number;
  userSettlementPayoff: number;
  makerSettlementPayoff: number;
  userRealizedPnl: number;
  makerRealizedPnl: number;
  positionConservation: boolean;
  cashConservation: boolean;
  pnlConservation: boolean;
}

export interface EventEdgeDemoV1 {
  schemaVersion: "eventedge-demo.v1";
  provenance: {
    dataClass: "reconstructed-demo";
    seed: string;
    generatorVersion: string;
    generatedAt: string;
    sourcePublished: false;
    fingerprintAlgorithm: string;
    fingerprint: string;
  };
  market: {
    underlying: {
      id: string;
      label: string;
      publicState: string[];
      hiddenState: string[];
      actionTiming: string;
    };
    states: EventEdgeStateV1[];
    perspectives: EventEdgePerspectiveV1[];
    contracts: EventEdgeContractV1[];
    candidates: EventEdgeCandidateV1[];
    profiles: EventEdgeProfileV1[];
    controls: {
      perspectiveIds: EventEdgePerspectiveId[];
      candidateIds: EventEdgeCandidateId[];
      notionals: EventEdgeNotional[];
      profileIds: EventEdgeProfileId[];
      stateIds: EventEdgeStateId[];
    };
    defaultSelection: {
      perspectiveId: EventEdgePerspectiveId;
      candidateId: EventEdgeCandidateId;
      notional: EventEdgeNotional;
      profileId: EventEdgeProfileId;
      stateId: EventEdgeStateId;
    };
    existingPortfolio: {
      positions: Record<EventEdgeContractId, number>;
      entryCash: number;
      lossLimit: number;
      riskAversion: number;
      objective: string;
    };
  };
  orderBooks: EventEdgeBookV1[];
  decisionRows: EventEdgeDecisionRowV1[];
  settlementRows: EventEdgeSettlementRowV1[];
  boundary: {
    originalSourcePublic: false;
    reconstructedDemo: true;
    realMoneyTrading: false;
    observedPerformance: false;
    browserCalculation: false;
    statement: string;
  };
}

export function assertEventEdgeDemo(value: unknown): asserts value is EventEdgeDemoV1 {
  if (!value || typeof value !== "object") throw new Error("EventEdge artifact must be an object");
  const artifact = value as Partial<EventEdgeDemoV1>;
  if (artifact.schemaVersion !== "eventedge-demo.v1") throw new Error("Unsupported EventEdge artifact");
  if (artifact.provenance?.dataClass !== "reconstructed-demo" || !/^[0-9a-f]{64}$/u.test(artifact.provenance.fingerprint ?? "")) throw new Error("Invalid EventEdge provenance");
  if (!artifact.boundary?.reconstructedDemo || artifact.boundary.realMoneyTrading || artifact.boundary.observedPerformance || artifact.boundary.browserCalculation) throw new Error("EventEdge boundary is not fail-closed");
  if (artifact.market?.states?.length !== 4 || artifact.market.perspectives?.length !== 2 || artifact.market.contracts?.length !== 3) throw new Error("Incomplete EventEdge market definition");
  if (artifact.orderBooks?.length !== 9 || artifact.orderBooks.some((book) => book.levels.length !== 20)) throw new Error("Incomplete EventEdge order books");
  if (artifact.decisionRows?.length !== 24 || artifact.settlementRows?.length !== 96) throw new Error("Incomplete EventEdge result grid");
}

export async function loadEventEdgeDemo(signal?: AbortSignal): Promise<EventEdgeDemoV1> {
  const response = await fetch("/data/eventedge-demo.v1.json", { signal, cache: "force-cache" });
  if (!response.ok) throw new Error(`EventEdge demo unavailable (${response.status})`);
  const value: unknown = await response.json();
  assertEventEdgeDemo(value);
  return value;
}

export function eventEdgeDecisionId(perspectiveId: EventEdgePerspectiveId, candidateId: EventEdgeCandidateId, notional: EventEdgeNotional, profileId: EventEdgeProfileId) {
  return `${perspectiveId}:${candidateId}:q${notional}:${profileId}`;
}
