export type BetaShape = { alpha: number; beta: number };
export type BinomialEvidence = { successes: number; trials: number };

export type LeafPosterior = {
  id: string;
  label: string;
  mass: number;
  treatment: BetaShape;
  control: BetaShape;
};

export type AllocationLeaf = {
  id: string;
  label: string;
  mass: number;
  sampledNetValue: number;
  posteriorProbability: number;
  lower: number;
  upper: number;
};

export type Allocation = AllocationLeaf & { allocated: number; eligible: boolean };

const LANCZOS = [
  0.9999999999998099,
  676.5203681218851,
  -1259.1392167224028,
  771.3234287776531,
  -176.6150291621406,
  12.50734327868691,
  -0.13857109526572012,
  9.984369578019572e-6,
  1.5056327351493116e-7,
];

export function logGamma(value: number): number {
  if (value <= 0) throw new RangeError("logGamma requires a positive value");
  if (value < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  const z = value - 1;
  let x = LANCZOS[0];
  for (let index = 1; index < LANCZOS.length; index += 1) x += LANCZOS[index] / (z + index);
  const t = z + LANCZOS.length - 1.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

export function logBeta(alpha: number, beta: number): number {
  return logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta);
}

export function betaUpdate(prior: BetaShape, evidence: BinomialEvidence): BetaShape {
  if (evidence.successes < 0 || evidence.trials < evidence.successes) {
    throw new RangeError("Binomial evidence must satisfy 0 <= successes <= trials");
  }
  return {
    alpha: prior.alpha + evidence.successes,
    beta: prior.beta + evidence.trials - evidence.successes,
  };
}

export function betaMean(shape: BetaShape): number {
  return shape.alpha / (shape.alpha + shape.beta);
}

function logBetaBinomialMarginal(evidence: BinomialEvidence, prior: BetaShape): number {
  return logBeta(prior.alpha + evidence.successes, prior.beta + evidence.trials - evidence.successes) -
    logBeta(prior.alpha, prior.beta);
}

export function splitLogBayesFactor(
  children: Array<{ treatment: BinomialEvidence; control: BinomialEvidence }>,
  prior: BetaShape = { alpha: 1, beta: 1 },
): number {
  const pooled = children.reduce(
    (total, child) => ({
      treatment: {
        successes: total.treatment.successes + child.treatment.successes,
        trials: total.treatment.trials + child.treatment.trials,
      },
      control: {
        successes: total.control.successes + child.control.successes,
        trials: total.control.trials + child.control.trials,
      },
    }),
    { treatment: { successes: 0, trials: 0 }, control: { successes: 0, trials: 0 } },
  );
  const split = children.reduce(
    (sum, child) => sum + logBetaBinomialMarginal(child.treatment, prior) + logBetaBinomialMarginal(child.control, prior),
    0,
  );
  const parent = logBetaBinomialMarginal(pooled.treatment, prior) + logBetaBinomialMarginal(pooled.control, prior);
  return split - parent;
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function normalSample(random: () => number): number {
  const u = Math.max(Number.EPSILON, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

function gammaSample(shape: number, random: () => number): number {
  if (shape <= 0) throw new RangeError("Gamma shape must be positive");
  if (shape < 1) return gammaSample(shape + 1, random) * Math.pow(Math.max(Number.EPSILON, random()), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    const x = normalSample(random);
    const vBase = 1 + c * x;
    if (vBase <= 0) continue;
    const v = vBase ** 3;
    const u = random();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x ** 2 + d * (1 - v + Math.log(v))) return d * v;
  }
}

export function betaSample(shape: BetaShape, random: () => number): number {
  const x = gammaSample(shape.alpha, random);
  const y = gammaSample(shape.beta, random);
  return x / (x + y);
}

export function upliftDraws(leaf: LeafPosterior, count: number, seed: number): number[] {
  const random = createSeededRandom(seed);
  return Array.from({ length: count }, () => betaSample(leaf.treatment, random) - betaSample(leaf.control, random));
}

export function quantile(values: number[], probability: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction;
}

export function summarizeUplift(draws: number[], hurdle: number) {
  return {
    mean: draws.reduce((sum, value) => sum + value, 0) / draws.length,
    lower90: quantile(draws, 0.05),
    upper90: quantile(draws, 0.95),
    probabilityAbove: draws.filter((value) => value > hurdle).length / draws.length,
  };
}

export function posteriorExpectedSplitGain(
  children: LeafPosterior[],
  hurdle: number,
  value: number,
  drawCount: number,
  seed: number,
): number {
  const childDraws = children.map((child, index) => upliftDraws(child, drawCount, seed + index * 104729));
  let splitValue = 0;
  let parentValue = 0;
  for (let draw = 0; draw < drawCount; draw += 1) {
    const parentUplift = children.reduce((sum, child, index) => sum + child.mass * childDraws[index][draw], 0);
    splitValue += children.reduce(
      (sum, child, index) => sum + child.mass * Math.max(0, value * (childDraws[index][draw] - hurdle)),
      0,
    );
    parentValue += Math.max(0, value * (parentUplift - hurdle));
  }
  return (splitValue - parentValue) / drawCount;
}

export function precisionBounds(
  mass: number,
  population: number,
  treatmentRate: number,
  controlRate: number,
  halfWidth: number,
  segmentCap: number,
) {
  const z90 = 1.6448536269514722;
  const safeWidth = Math.max(0.0025, halfWidth);
  const treatmentRequired = Math.ceil((2 * z90 ** 2 * treatmentRate * (1 - treatmentRate)) / safeWidth ** 2);
  const controlRequired = Math.ceil((2 * z90 ** 2 * controlRate * (1 - controlRate)) / safeWidth ** 2);
  const leafPopulation = mass * population;
  const lower = mass * Math.min(1, treatmentRequired / leafPopulation);
  const upperFromControl = mass * Math.max(0, 1 - controlRequired / leafPopulation);
  return {
    treatmentRequired,
    controlRequired,
    lower,
    upper: Math.min(mass * segmentCap, upperFromControl),
    feasible: lower <= Math.min(mass * segmentCap, upperFromControl),
  };
}

export function constrainedAllocation(leaves: AllocationLeaf[], budget: number, posteriorGate: number) {
  const ranked = [...leaves].sort((a, b) => b.sampledNetValue - a.sampledNetValue);
  const allocations = new Map<string, number>();
  let remaining = budget;

  for (const leaf of ranked) {
    const eligible = leaf.sampledNetValue > 0 && leaf.posteriorProbability >= posteriorGate && leaf.lower <= leaf.upper;
    if (eligible && leaf.lower <= remaining) {
      allocations.set(leaf.id, leaf.lower);
      remaining -= leaf.lower;
    } else {
      allocations.set(leaf.id, 0);
    }
  }
  for (const leaf of ranked) {
    const allocated = allocations.get(leaf.id) ?? 0;
    if (allocated === 0 || remaining <= 0) continue;
    const addition = Math.min(remaining, leaf.upper - allocated);
    allocations.set(leaf.id, allocated + addition);
    remaining -= addition;
  }

  const result: Allocation[] = leaves.map((leaf) => ({
    ...leaf,
    allocated: allocations.get(leaf.id) ?? 0,
    eligible: leaf.sampledNetValue > 0 && leaf.posteriorProbability >= posteriorGate && leaf.lower <= leaf.upper,
  }));
  return { allocations: result, used: budget - remaining, unspent: remaining };
}
