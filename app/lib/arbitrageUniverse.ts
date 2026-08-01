import manifestJson from "@/app/data/arbitrage-universe-manifest.json";

export type UniverseFeeBps = 0 | 5 | 10;
export type UniverseStatusCode = 0 | 1 | 2 | 3 | 4;
export type UniverseStatusKey = "eligible" | "profitable" | "stale" | "shallow" | "blocked";
export type UniverseDirection = "forward" | "reverse";
export type UniverseEngineDirection = "canonical" | "reverse";
export type UniverseTriangleCategory =
  | "KRW-BTC-X"
  | "BTC-USDT-X"
  | "KRW-USDT-X"
  | "KRW-BTC-USDT";

export type UniverseStatusDefinition = {
  code: UniverseStatusCode;
  key: UniverseStatusKey;
  label: string;
  description: string;
};

export type UniverseAsset = {
  symbol: string;
  koreanName: string | null;
  englishName: string | null;
  marketCount: number;
  quoteMarketCount: number;
  triangleCount: number;
};

export type UniverseAssetName = Pick<UniverseAsset, "symbol" | "koreanName" | "englishName">;

export type UniverseTriangleSet = {
  id: string;
  category: UniverseTriangleCategory;
  startAsset: "KRW" | "BTC" | "USDT";
  assets: [string, string, string];
  assetNames: [UniverseAssetName, UniverseAssetName, UniverseAssetName];
  markets: [string, string, string];
  routeIds: [string, string];
};

export type UniverseBookLevel = [price: number, size: number];
export type UniverseBookSide = [
  UniverseBookLevel,
  UniverseBookLevel,
  UniverseBookLevel,
  UniverseBookLevel,
  UniverseBookLevel,
];

export type UniverseMarketBook = {
  id: string;
  market: string;
  timestampMs: number;
  ageMs: number;
  bids: UniverseBookSide;
  asks: UniverseBookSide;
};

export type UniverseRouteLeg = {
  index: number;
  market: string;
  side: "bid" | "ask";
  inputAsset: string;
  outputAsset: string;
  bookId: string;
};

export type UniverseLegAmount = {
  index: number;
  inputAsset: string;
  outputAsset: string;
  inputAmount: number;
  grossOutputAmount: number;
  feeAmount: number;
  outputAmount: number;
};

export type UniverseFeeRow = {
  startAmount: number;
  feeBps: UniverseFeeBps;
  feeMultiplier: number;
  outputAmount: number;
  netProfitRate: number;
  netProfitAmount: number;
  liquidityKrw: number;
  statusCode: UniverseStatusCode;
  legAmounts: [UniverseLegAmount, UniverseLegAmount, UniverseLegAmount];
};

export type UniverseRoute = {
  id: string;
  triangleSetId: string;
  direction: UniverseDirection;
  engineDirection: UniverseEngineDirection;
  startAsset: "KRW" | "BTC" | "USDT";
  startAmounts: [number, number, number];
  route: [string, string, string, string];
  markets: [string, string, string];
  bookIds: [string, string, string];
  legs: [UniverseRouteLeg, UniverseRouteLeg, UniverseRouteLeg];
  snapshot: {
    feeMultipliers: Record<`${UniverseFeeBps}`, number>;
    liquidityKrw: number;
    statusCode: UniverseStatusCode;
  };
  feeRows: UniverseFeeRow[];
};

export type UniverseRouteValue = [
  netMultiplier0Bps: number,
  netMultiplier5Bps: number,
  netMultiplier10Bps: number,
  liquidityKrw: number,
  statusCode: UniverseStatusCode,
];

export type UniverseFrame = {
  streamId: string;
  sequence: number;
  demoTime: string;
  marketDataTime: string;
  index: number;
  offsetMs: number;
  at: string;
  atEpochMs: number;
  summary: {
    statusCounts: Record<`${UniverseStatusCode}`, number>;
    positiveRouteCountsByFeeBps: Record<`${UniverseFeeBps}`, number>;
  };
  routeValues: UniverseRouteValue[];
};

export type ArbitrageUniverseV1 = {
  schemaVersion: 1;
  provenance: {
    repository: string;
    engineCommit: string;
    generatedAt: string;
    source: {
      provider: string;
      endpoint: string;
      capturedAt: string;
      fixturePath: string;
      fixtureSha256: string;
      marketCount: number;
    };
    generator: {
      id: "universe-demo";
      version: "1.1.0";
      seed: string;
    };
    fingerprintAlgorithm: "sha256(stable-json-authenticated-v1)";
    coreFingerprint: string;
  };
  summary: {
    marketCount: number;
    assetCount: number;
    triangleSetCount: number;
    routeCount: number;
    marketBookCount: number;
    frameCount: 60;
    frameIntervalMs: 1000;
    feeBps: [0, 5, 10];
    startAmountsByAsset: {
      KRW: [number, number, number];
      BTC: [number, number, number];
      USDT: [number, number, number];
    };
    hubBreakdown: Record<UniverseTriangleCategory, number>;
    routeValueColumns: [
      "netMultiplier0Bps",
      "netMultiplier5Bps",
      "netMultiplier10Bps",
      "liquidityKrw",
      "statusCode",
    ];
    statusBasisFeeBps: 5;
    statusCodes: UniverseStatusDefinition[];
    statusPrecedence: [4, 2, 3, 1, 0];
    shallowThresholdKrw: number;
    featuredTriangleSetId: string;
  };
  assets: UniverseAsset[];
  triangleSets: UniverseTriangleSet[];
  frames: UniverseFrame[];
  routeDetails: {
    snapshotFrameIndex: 0;
    bookLevelColumns: ["price", "size"];
    marketBooks: UniverseMarketBook[];
    routes: UniverseRoute[];
  };
  boundary: {
    syntheticData: true;
    topologyFromPinnedUpbitFixture: true;
    liveMarketData: false;
    externalApiCallsAtBuild: false;
    liveTrading: false;
    apiKeysIncluded: false;
    accountBalancesIncluded: false;
    realizedPnlIncluded: false;
    profitClaim: false;
    statement: string;
  };
};

export type ArbitrageUniverseManifestV1 = {
  schemaVersion: 1;
  coreFingerprint: string;
  capturedAt: string;
  generatedAt: string;
  engineCommit: string;
  marketCount: number;
  assetCount: number;
  triangleSetCount: number;
  routeCount: number;
  frameCount: 60;
  frameIntervalMs: 1000;
  marketBookCount: number;
  hubBreakdown: Record<UniverseTriangleCategory, number>;
  feeBps: [0, 5, 10];
  simulated: true;
  liveMarketData: false;
  liveTrading: false;
};

export type DecodedUniverseRouteValue = {
  netMultiplier0Bps: number;
  netMultiplier5Bps: number;
  netMultiplier10Bps: number;
  liquidityKrw: number;
  statusCode: UniverseStatusCode;
};

export const ARBITRAGE_UNIVERSE_URL = "/data/arbitrage-universe.v1.json";
export const arbitrageUniverseManifest = manifestJson as unknown as ArbitrageUniverseManifestV1;

export async function fetchArbitrageUniverse(signal?: AbortSignal): Promise<ArbitrageUniverseV1> {
  const response = await fetch(ARBITRAGE_UNIVERSE_URL, { cache: "force-cache", signal });
  if (!response.ok) throw new Error(`Universe artifact request failed with HTTP ${response.status}`);
  const universe = await response.json() as ArbitrageUniverseV1;
  if (universe.schemaVersion !== 1) throw new Error("Unsupported arbitrage universe schema");
  if (universe.provenance.coreFingerprint !== arbitrageUniverseManifest.coreFingerprint) {
    throw new Error("Universe artifact fingerprint does not match the verified local manifest");
  }
  if (universe.summary.routeCount !== arbitrageUniverseManifest.routeCount || universe.frames.length !== arbitrageUniverseManifest.frameCount) {
    throw new Error("Universe artifact does not match the verified local manifest counts");
  }
  return universe;
}

export function universeFrameAt(
  universe: ArbitrageUniverseV1,
  frameIndex: number,
): UniverseFrame {
  if (!Number.isInteger(frameIndex)) throw new TypeError("frameIndex must be an integer");
  if (universe.frames.length === 0) throw new Error("Arbitrage universe has no frames");
  const normalizedIndex = ((frameIndex % universe.frames.length) + universe.frames.length) % universe.frames.length;
  return universe.frames[normalizedIndex];
}

export function universeRouteIndex(
  universe: ArbitrageUniverseV1,
  routeId: string,
): number {
  const index = universe.routeDetails.routes.findIndex((route) => route.id === routeId);
  if (index < 0) throw new Error(`Unknown universe route: ${routeId}`);
  return index;
}

export function decodeUniverseRouteValue(value: UniverseRouteValue): DecodedUniverseRouteValue {
  return {
    netMultiplier0Bps: value[0],
    netMultiplier5Bps: value[1],
    netMultiplier10Bps: value[2],
    liquidityKrw: value[3],
    statusCode: value[4],
  };
}

export function universeRouteValue(
  universe: ArbitrageUniverseV1,
  frame: UniverseFrame,
  routeId: string,
): DecodedUniverseRouteValue {
  const value = frame.routeValues[universeRouteIndex(universe, routeId)];
  if (!value) throw new Error(`Frame ${frame.index} has no value for route ${routeId}`);
  return decodeUniverseRouteValue(value);
}

export function universeStatus(
  universe: ArbitrageUniverseV1,
  statusCode: UniverseStatusCode,
): UniverseStatusDefinition {
  const status = universe.summary.statusCodes.find((candidate) => candidate.code === statusCode);
  if (!status) throw new Error(`Unknown universe status code: ${statusCode}`);
  return status;
}

export function universeRouteBooks(
  universe: ArbitrageUniverseV1,
  route: UniverseRoute,
): [UniverseMarketBook, UniverseMarketBook, UniverseMarketBook] {
  const books = new Map(universe.routeDetails.marketBooks.map((book) => [book.id, book]));
  return route.bookIds.map((bookId) => {
    const book = books.get(bookId);
    if (!book) throw new Error(`Unknown universe market book: ${bookId}`);
    return book;
  }) as [UniverseMarketBook, UniverseMarketBook, UniverseMarketBook];
}

export function featuredUniverseTriangleSet(
  universe: ArbitrageUniverseV1,
): UniverseTriangleSet {
  const triangle = universe.triangleSets.find(
    (candidate) => candidate.id === universe.summary.featuredTriangleSetId,
  );
  if (!triangle) throw new Error("Featured universe triangle set is missing");
  return triangle;
}
