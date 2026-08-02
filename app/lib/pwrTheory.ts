import artifact from "@/app/data/pwr-theory-evidence.v1.json";

export type PwrProofKind = "assumption" | "definition" | "lemma" | "proposition" | "theorem" | "corollary" | "remark";
export type PwrEvidenceStatus = "complete" | "verified" | "partial" | "pending" | "not-applicable" | "negative";

export interface PwrEquationV1 {
  id: string;
  label: string;
  tex: string;
  alt: string;
}

export interface PwrProofEntryV1 {
  id: string;
  label: string;
  kind: PwrProofKind;
  sectionId: string;
  title: string;
  statement: string;
  assumptions: string[];
  dependencies: string[];
  proofSteps: string[];
  conclusion: string;
  boundary: string;
  codeMapping: string[];
  equations: PwrEquationV1[];
  evidence: {
    proof: PwrEvidenceStatus;
    implementation: PwrEvidenceStatus;
    audit: PwrEvidenceStatus;
    lockedResult: PwrEvidenceStatus;
  };
}

export interface PwrAppendixSectionV1 {
  id: string;
  label: string;
  title: string;
  dependencies: string[];
  coreSteps: string[];
}

export interface PwrFoundationSectionV1 {
  id: string;
  label: string;
  title: string;
  role: string;
}

export interface PwrTheoryEvidenceV1 {
  schemaVersion: "pwr-theory-evidence.v1";
  provenance: {
    repository: string;
    validationBaselineCommit: string;
    engineCommit: string;
    engineRelease: string;
    targetRelease: string;
    releaseCommit: string;
    integrationEvidenceFingerprint: string;
    manuscript: string;
    manuscriptPages: number;
    manuscriptPublished: false;
    fingerprint: string;
  };
  verification: {
    engineeringCloseout: "complete";
    engineeringRuns: number;
    computationalTests: number;
    publicationScaleValidation: "pending";
    externalValidity: "not-established";
    dcase: {
      status: "negative";
      rocAuc: number;
      sensitivity: number;
      interpretation: string;
    };
    campaigns: Array<{ id: string; label: string; status: "pending" }>;
  };
  guarantees: Array<{
    id: string;
    label: string;
    basis: string[];
    status: string;
  }>;
  proofEntries: PwrProofEntryV1[];
  appendixSections: PwrAppendixSectionV1[];
  foundations: PwrFoundationSectionV1[];
  claimsBoundary: string[];
}

export interface PwrTheorySection {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
}

export const pwrTheoryEvidence = artifact as unknown as PwrTheoryEvidenceV1;

export const pwrTheorySections: readonly PwrTheorySection[] = [
  { id: "experiment", number: "01", title: "Statistical experiment", shortTitle: "Experiment", description: "The sample space, inferential unit, nulls, alternatives and parameter boundary." },
  { id: "acoustic-bridge", number: "02", title: "Waveform to covariance spike", shortTitle: "Acoustic bridge", description: "A conditional log-power expansion isolates the directional covariance term and keeps every remainder visible." },
  { id: "exchangeability", number: "03", title: "Exchangeability is the null", shortTitle: "Exchangeability", description: "Exactness is attached to the full-law or randomized-design null at recording-cluster level, never covariance equality alone." },
  { id: "statistic", number: "04", title: "Pooled-whitened scan", shortTitle: "Statistic", description: "The statistic is a monotone Roy-root representation normalized by a concentration-derived block scale." },
  { id: "exact-validity", number: "05", title: "Finite-sample exactness", shortTitle: "Exactness", description: "A finite-group orbit rank controls the entire block maximum at once." },
  { id: "monte-carlo", number: "06", title: "Monte Carlo randomization", shortTitle: "Monte Carlo", description: "The plus-one correction preserves validity and an exact binomial expression prices finite permutation budgets." },
  { id: "concentration", number: "07", title: "Observed and permuted tails", shortTitle: "Concentration", description: "Gaussian covariance concentration and hypergeometric signal erasure connect the real permutation threshold to the analytic scale." },
  { id: "fixed-power", number: "08", title: "Finite-sample power", shortTitle: "Power", description: "A joint data-permutation tail becomes a high-probability conditional orbit bound through Fubini and Markov." },
  { id: "lower-bound", number: "09", title: "Minimax lower bound", shortTitle: "Lower bound", description: "Spherical direction and disjoint-location mixtures separately expose the two unavoidable search costs." },
  { id: "rate-optimality", number: "10", title: "Matched minimax rate", shortTitle: "Rate match", description: "The permutation-calibrated upper rate and Gaussian information lower rate agree to constants." },
  { id: "mismatch", number: "11", title: "Model mismatch", shortTitle: "Mismatch", description: "Operator-norm error subtracts explicitly from usable signal; it is not hidden in a robustness slogan." },
  { id: "multiscale", number: "12", title: "Adaptive multiscale scan", shortTitle: "Multiscale", description: "A shifted geometric cover adapts over unknown interval width with an explicit scale-search cost." },
  { id: "algorithm", number: "E1", title: "Executable specification", shortTitle: "Implementation", description: "The registered numerical analysis is mapped to code only after the mathematical chain is complete." },
  { id: "validation", number: "E2", title: "Empirical evidence and claim boundary", shortTitle: "Evidence", description: "Computational checks, locked studies and external validity remain distinct from theorem-level proof." },
  { id: "appendix", number: "A/B", title: "Foundations and proof appendix", shortTitle: "Appendices", description: "The supporting linear algebra, concentration, randomization-tail and minimax mixture chain is compressed into a continuous reference section." },
];

export function proofEntriesFor(sectionId: string): PwrProofEntryV1[] {
  return pwrTheoryEvidence.proofEntries.filter((entry) => entry.sectionId === sectionId);
}

export function proofEntry(id: string): PwrProofEntryV1 | undefined {
  return pwrTheoryEvidence.proofEntries.find((entry) => entry.id === id);
}

export const pwrTheorySummary = {
  proofObjectCount: pwrTheoryEvidence.proofEntries.length,
  appendixSectionCount: pwrTheoryEvidence.appendixSections.length,
  foundationCount: pwrTheoryEvidence.foundations.length,
  guaranteeCount: pwrTheoryEvidence.guarantees.length,
  fingerprintShort: pwrTheoryEvidence.provenance.fingerprint.slice(0, 16),
} as const;
