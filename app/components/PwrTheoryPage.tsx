import type { CaseStudy } from "@/app/content";
import { PwrEmpiricalConsole } from "@/app/components/PwrEmpiricalConsole";
import {
  EvidenceNote,
  PaperEquation,
  PaperFigure,
  PaperFlow,
  PaperSection,
  ResearchPaperShell,
  type PaperSectionLink,
} from "@/app/components/ResearchPaperShell";
import { pwrTheoryEvidence } from "@/app/lib/pwrTheory";

const sections: PaperSectionLink[] = [
  { id: "problem-statistic", number: "1", title: "Problem and statistic" },
  { id: "finite-validity", number: "2", title: "Finite-sample validity" },
  { id: "minimax-rate", number: "3", title: "Minimax rate and adaptation" },
  { id: "implementation-evidence", number: "4", title: "Implementation and empirical evidence" },
];

export function PwrTheoryPage({ study }: { study: CaseStudy }) {
  const verification = pwrTheoryEvidence.verification;
  const evidence = {
    release: pwrTheoryEvidence.provenance.targetRelease,
    commit: pwrTheoryEvidence.provenance.releaseCommit,
    fingerprint: pwrTheoryEvidence.provenance.integrationEvidenceFingerprint,
    engineeringRuns: verification.engineeringRuns,
    computationalTests: verification.computationalTests,
    campaigns: verification.campaigns,
    dcase: verification.dcase,
  };

  return (
    <ResearchPaperShell
      study={study}
      status="Proof-led statistical system"
      abstract="PWR-Scan tests for a localized positive covariance change when both its frequency interval and leading direction are unknown. It combines pooled whitening with a block scan and an exact randomization calibration, then separates finite-sample validity, asymptotic detection theory, implementation checks, synthetic exploration, and external-data evidence so that one evidence class is never presented as another."
      sections={sections}
    >
      <PaperSection {...sections[0]} deck="The inferential unit is the complete recording; the target is a positive covariance contrast on at least one pre-registered block.">
        <p>Each observation is a recording-level vector rather than an isolated frame. Candidate frequency blocks are fixed before labels are inspected. For a block B, the two group covariance estimates are combined into a pooled metric, and their difference is symmetrically whitened in that metric. The largest positive eigenvalue measures the strongest covariance increase that can be expressed inside B without committing to a direction in advance. Dividing by a block-specific scale and maximizing over the registered family produces one global statistic.</p>
        <p>This construction distinguishes the scientific alternative from the calibration null. The alternative asks whether some block has positive pooled-whitened population contrast. Exact calibration requires the stronger statement that the complete data object is invariant under the allowed recording-level label transformations. Equality of two covariance matrices alone does not imply that exchangeability statement.</p>
        <PaperEquation number="1" label="Pooled-whitened block scan" expression={String.raw`T(D)=\max_{B\in\mathcal B}\frac{\lambda_{\max}\!\left(\widehat\Sigma_{P,B}^{-1/2}(\widehat\Sigma_{1,B}-\widehat\Sigma_{0,B})\widehat\Sigma_{P,B}^{-1/2}\right)}{a_B}`} note="The same pooled covariance is used for every transformed data set; a_B normalizes blocks of different dimensions." />
        <PaperFlow items={["Recording clusters", "Pre-fixed blocks", "Pooled whitening", "Global maximum"]} />
        <p>The maximizing block and eigenvector are useful diagnostics, but they are not a confidence set for signal support or a physical direction-of-arrival estimate. The confirmatory output is one global rejection decision. Localization remains descriptive unless a separate support-recovery argument is supplied.</p>
        <p>Numerical regularization is also part of the registered statistic. A pooled covariance that is singular or nearly singular cannot be repaired differently for the observed and permuted samples. The implementation applies one symmetric eigendecomposition rule, one eigenvalue floor, and one block normalization throughout the orbit. Candidate blocks with dimensions incompatible with the available recording count are excluded by design rather than removed after their observed score is known. These choices keep numerical convenience from becoming an unrecorded selection mechanism.</p>
      </PaperSection>

      <PaperSection {...sections[1]} deck="Randomization validity follows from orbit rank, including ties; it is not borrowed from a Gaussian approximation.">
        <p>Under the exchangeability null, the observed assignment and every allowed transformed assignment occupy symmetric positions in the same orbit. Recomputing the complete statistic after each transformation therefore makes its upper rank super-uniform. The add-one Monte Carlo p-value retains this property when transformations are sampled rather than enumerated. Counting values at least as large as the observed statistic is essential: arbitrary tie breaking would remove the finite-sample guarantee.</p>
        <PaperEquation number="2" label="Monte Carlo randomization p-value" expression={String.raw`\widehat p_R=\frac{1+\sum_{r=1}^{R}\mathbf 1\{T(g_rD)\ge T(D)\}}{R+1}`} note="The observed statistic contributes the leading one. The smallest attainable value is 1/(R+1)." />
        <h3>Proof sketch</h3>
        <p>Condition on the orbit of the observed data under the registered transformation group. Exchangeability makes the observed element uniform on that orbit. Its weak upper rank is therefore super-uniform, which proves level control for complete enumeration. For sampled transformations, augmenting the sampled statistics with the observed value makes their joint ordering exchangeable; the same rank argument gives a valid randomized test. The proof does not require a large-sample covariance approximation, but it does require that preprocessing, block selection, regularization, and the statistic itself be recomputed or fixed in a label-invariant manner.</p>
        <EvidenceNote title="Validity boundary"><p>Frame-level shuffling, data-dependent block registration, or a preprocessing step trained with the original labels can break the group action. The implementation treats those choices as part of the tested object rather than as harmless preparation.</p></EvidenceNote>
      </PaperSection>

      <PaperSection {...sections[2]} deck="The upper and lower bounds pay the same direction and location complexities, up to constants and the explicit adaptation surcharge.">
        <p>For a block of dimension b and a family containing M plausible locations, the detectable positive root must overcome two distinct costs: estimating an unknown direction costs approximately the square root of b/n, while scanning an unknown location costs approximately the square root of log M/n. The upper proof controls the whitened covariance deviation on every registered block and applies a union bound over locations. The lower proof mixes alternatives over directions and positions until their likelihood ratio remains contiguous to the null.</p>
        <PaperEquation number="3" label="Matched separation rate" expression={String.raw`\rho_n\asymp \max\!\left\{\sqrt{b/n},\sqrt{\log M/n}\right\}\asymp \sqrt{b/n}+\sqrt{\log M/n}`} note="The maximum and the sum differ by at most a factor of two, so the constructive scan and the mixture lower bound have the same minimax rate." />
        <h3>Unknown scale</h3>
        <p>A geometric family of shifted grids covers every admissible interval by a registered block whose width is within a constant factor of the unknown true width. Scale-specific significance weights keep the total randomization level bounded. This adaptation introduces an explicit logarithmic surcharge rather than hiding the cost inside an unspecified constant. Positive-semidefinite monotonicity transfers signal from the true interval to its covering block, while covariance concentration controls the additional noise.</p>
        <p>The result is deliberately conditional. Invertibility, bounded dimension growth, covariance regularity, the registered block family, and the exchangeability experiment appear in the theorem statements. The portfolio page gives only the theorem and proof spine; the numbered lemmas, constants, and full arguments remain in the public repository.</p>
        <p>The lower and upper arguments answer a detection question, not estimation. The mixture construction shows that no level-controlled procedure can reliably distinguish sufficiently weak, randomly located, randomly directed spikes from the null over the stated class. The scan proof shows that PWR crosses the same complexity scale when signal is strong enough. Neither argument guarantees exact interval recovery, interpretable eigenvectors, robustness to arbitrary heavy tails, or transfer to a different recording protocol. Those require separate assumptions and experiments.</p>
      </PaperSection>

      <PaperSection {...sections[3]} deck="A compact synthetic console is kept next to the immutable engineering and external-data record.">
        <p>The implementation uses an independent deterministic oracle for pooled moments, whitening, scan aggregation, and small exact orbits. The engineering closeout completed 56 of 56 registered execution rows and 246 computational tests. These counts establish agreement with the oracle and software invariants; they do not estimate statistical power. Locked global-level and publication-scale campaigns remain labeled by their actual completion status.</p>
        <PaperFigure number="1" title="Interactive synthetic study. Controls select a precomputed deterministic row; the display is not an observed benchmark or a performance claim." interactive>
          <PwrEmpiricalConsole evidence={evidence} variant="paper" />
        </PaperFigure>
        <h3>External negative result</h3>
        <p>The retained DCASE aggregate produced ROC AUC 0.4843 and sensitivity 0. That result does not establish external validity and is intentionally shown rather than filtered out. Synthetic operating characteristics, implementation correctness, and performance on an external collection answer different questions; none substitutes for the others.</p>
        <EvidenceNote title="Reproducibility"><p>The public release records the target release, commit, evidence fingerprint, study grid, and campaign status. Full proofs and the consolidated implementation are linked in References.</p></EvidenceNote>
      </PaperSection>
    </ResearchPaperShell>
  );
}
