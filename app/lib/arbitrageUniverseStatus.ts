import type {
  ArbitrageUniverseV1,
  UniverseStatusCode,
  UniverseStatusDefinition,
  UniverseStatusKey,
} from "./arbitrageUniverse";

export function universeStatusAtMultiplier(
  universe: ArbitrageUniverseV1,
  statusCode: UniverseStatusCode,
  multiplier: number,
): UniverseStatusDefinition {
  if (!Number.isFinite(multiplier)) throw new TypeError("Universe multiplier must be finite");

  const basisStatus = universe.summary.statusCodes.find((candidate) => candidate.code === statusCode);
  if (!basisStatus) throw new Error(`Unknown universe status code: ${statusCode}`);
  if (basisStatus.key !== "eligible" && basisStatus.key !== "profitable") return basisStatus;

  const selectedKey: UniverseStatusKey = multiplier > 1 ? "profitable" : "eligible";
  const selectedStatus = universe.summary.statusCodes.find((candidate) => candidate.key === selectedKey);
  if (!selectedStatus) throw new Error(`Universe status definition is missing: ${selectedKey}`);
  return selectedStatus;
}
