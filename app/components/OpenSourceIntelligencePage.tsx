import type { CaseStudy } from "@/app/content";
import {
  EvidenceNote,
  PaperEquation,
  PaperFigure,
  PaperFlow,
  PaperSection,
  ResearchPaperShell,
  type PaperSectionLink,
} from "@/app/components/ResearchPaperShell";
import styles from "@/app/components/OpenSourceIntelligencePaper.module.css";

const equations = {
  admissibility: String.raw`\mathcal I_i(E_i)=\{b:t_{\mathrm{trade}}(b)<D_i,\ t_{\mathrm{available}}(b)<t_{\mathrm{open}}(E_i)\},\quad E_i=\min\{s:s>D_i,\ s\text{ complete}\}`,
  target: String.raw`\mathbf y_i=(r_i^{(1)},r_i^{(3)},r_i^{(5)})^\top,\qquad r_i^{(h)}=P^{\mathrm{close}}_{i,E_i+h-1}/P^{\mathrm{open}}_{i,E_i}-1`,
  model: String.raw`\mathbf D_i\in\mathbb R^{B_i\times768},\quad \mathbf X_i^m\in\mathbb R^{60\times8},\quad \mathbf y_i\mid\mathbf z_i\sim\mathcal N(\boldsymbol\mu_i,\mathbf L_i\mathbf L_i^\top)`,
  loss: String.raw`\mathcal L=\frac1n\sum_i\frac12\left[(\mathbf y_i-\boldsymbol\mu_i)^\top\boldsymbol\Sigma_i^{-1}(\mathbf y_i-\boldsymbol\mu_i)+\log\det\boldsymbol\Sigma_i\right]`,
};

const sections: PaperSectionLink[] = [
  { id: "point-in-time", number: "1", title: "Point-in-time data contract" },
  { id: "document-market", number: "2", title: "Document–market model" },
  { id: "chronological-test", number: "3", title: "Fixed chronological test" },
  { id: "verification", number: "4", title: "Verification and evidence boundary" },
];

export function OpenSourceIntelligencePage({ study }: { study: CaseStudy }) {
  return (
    <ResearchPaperShell study={study} status="Completed bounded experiment" abstract="This study reconstructs the information that was legally and operationally available before a Korean disclosure became tradable, combines the eligible document family with a frozen market history, and predicts a three-horizon post-disclosure return distribution. The design emphasizes point-in-time correctness and a permanently locked chronological test. Its completed public experiment is reproducible but negative: the learned model does not beat simple baselines." sections={sections}>
      <PaperSection {...sections[0]} deck="Every observation is defined by availability time, tradability time, and correction-family identity before modeling begins.">
        <p>The unit of analysis is a disclosure event associated with a listed company. DART supplies filing time, receipt identifiers, correction links, and document bodies; the Financial Services Commission market API supplies daily open, close, volume, and adjustment fields. A filing is admissible only when both its public availability timestamp and every transformation needed to construct it precede the first complete session in which the event can be traded.</p>
        <p>After-close, weekend, and holiday filings move to the next complete market session. Same-day filings before the opening cutoff may enter that session only when their public availability is independently established. The target starts at the eligible session open, so the model cannot use that session’s close while pretending to forecast from its open. Source timestamps and the local trading calendar are stored with the observation rather than reconstructed after training.</p>
        <PaperEquation number="1" label="Admissible information and entry session" expression={equations.admissibility} note="D_i is the disclosure cutoff. E_i is the first complete tradable session after that cutoff." />
        <h3>Correction families</h3>
        <p>Original, corrected, and amended filings that describe the same corporate event form one correction family. A family is assigned wholly to one chronological partition. The usable version for an observation is the latest member available before its cutoff; later corrections cannot rewrite an earlier training snapshot. This prevents near-duplicate text and retrospective information from crossing train, validation, and test boundaries.</p>
        <PaperFlow items={["DART/FSC cutoff", "Correction-family snapshot", "Eligible session open", "Mature return label"]} />
      </PaperSection>

      <PaperSection {...sections[1]} deck="Frozen document and market encoders are fused into a small probabilistic head; the published experiment does not claim end-to-end representation learning.">
        <p>Documents are chunked without splitting their recorded evidence identity. A frozen Korean long-document encoder maps token sequences to chunk states, which are averaged into filing-block vectors. The market branch consumes the preceding 60 sessions of eight normalized fields through a frozen time-series encoder. Both transformations are cached with model revision, preprocessing configuration, source hashes, and cutoff metadata, making the processed build credential-free and repeatable.</p>
        <PaperEquation number="2" label="Three-horizon return target" expression={equations.target} note="The vector measures close-to-entry-open returns after one, three, and five complete sessions." />
        <p>A small set of learned query slots compresses variable-length document blocks. Cross-attention then lets those document slots retrieve relevant market patches. A gated fusion vector enters a nine-parameter Gaussian decoder: three means and the six free entries of a lower-triangular factor. The covariance is therefore positive semidefinite by construction and exposes dependence among the three return horizons.</p>
        <PaperEquation number="3" label="Frozen representations and probabilistic decoder" expression={equations.model} note="B_i varies by disclosure. Only the fusion and Gaussian head were trained in the bounded experiment." />
        <PaperEquation number="4" label="Multivariate Gaussian objective" expression={equations.loss} note="The loss evaluates the joint path rather than three unrelated point forecasts." />
        <PaperFigure number="1" title="Source-to-forecast contract. Arrows represent immutable transformations whose configuration and input hashes are stored with each build.">
          <PaperFlow items={["Eligible filings", "Partitioned document embeddings", "Frozen market patches", "Joint return distribution"]} />
        </PaperFigure>
      </PaperSection>

      <PaperSection {...sections[2]} deck="Selection uses TRAIN and VALIDATION once; the terminal TEST is opened once after the checkpoint and decision rules are frozen.">
        <p>The completed integrated reproducibility vertical slice contains 36 observations: 22 for training, six for validation, and eight for the terminal test. Encoders are frozen, the probabilistic head is selected at epoch 15 by validation negative log likelihood, and the resulting checkpoint is evaluated on TEST exactly once. No fold, threshold, feature, or covariance adjustment is revised in response to the terminal metrics.</p>
        <p>Baselines use only information available in TRAIN. The zero-return forecast supplies a deliberately hard reference for a small and noisy return target. The historical-mean baseline estimates its mean and covariance from training labels. All methods are scored on the same eight test observations with multivariate NLL, CRPS, MAE, direction accuracy, and 80% interval coverage.</p>
        <div className={styles.resultTable} role="region" aria-label="Fixed chronological test results" tabIndex={0}>
          <table><caption><b>Table 1.</b> Fixed IRVS TEST averages; lower is better for NLL, CRPS, and MAE.</caption><thead><tr><th>Method</th><th>NLL</th><th>CRPS</th><th>MAE</th><th>Direction</th><th>80% coverage</th></tr></thead><tbody>
            <tr><th>Model</th><td>−0.9690</td><td>0.04285</td><td>0.04839</td><td>0.2917</td><td>1.0000</td></tr>
            <tr><th>Zero return</th><td>−2.4312</td><td>0.01038</td><td>0.01143</td><td>0.2917</td><td>0.9583</td></tr>
            <tr><th>TRAIN historical mean</th><td>−2.4233</td><td>0.01060</td><td>0.01187</td><td>0.4583</td><td>0.9583</td></tr>
          </tbody></table>
        </div>
        <p>The learned model loses to both simple baselines on NLL, CRPS, and MAE. Coverage of 1.0000 against an 80% target indicates intervals that are too wide, not perfect calibration. With only 22 training observations and 3,631,370 trainable parameters, over-parameterization is the first documented failure hypothesis. The result is retained as evidence about the pipeline and hypothesis, not converted into a success claim.</p>
      </PaperSection>

      <PaperSection {...sections[3]} deck="Governance checks and predictive evidence are reported separately because a leakage-safe pipeline can still produce an unhelpful model.">
        <p>The processed artifact verifies source hashes, declared availability, chronological partition membership, correction-family isolation, maturity of every target, feature fit boundaries, and the single-use TEST gate. Rebuilding from the same immutable cache reproduces observation identity and tensors without API credentials. Unit and integration tests deliberately mutate timestamps, family links, calendar completeness, and feature state to ensure that inadmissible records fail closed.</p>
        <p>The larger research specification includes expanding chronological selection, full governance gates, an ablation matrix, calibrated sealed evaluation, and a capacity-constrained long-only replay. Those components define how a future, adequately sized study should be conducted; they are not completed evidence for this release. In particular, the portfolio makes no statement about market-wide predictive superiority, statistical significance, or tradable profitability.</p>
        <EvidenceNote title="Observed scope"><p>The completed evidence is the 36-observation integrated slice, one 22/6/8 fit, one locked eight-observation TEST, frozen encoders, and a negative comparison with two baselines. No result outside that boundary is implied.</p></EvidenceNote>
        <p>Keeping this negative result visible is part of the architecture. Point-in-time controls prevent a false positive caused by leakage, but they cannot create signal. The useful output is an auditable research object whose data lineage, model choice, terminal decision, and failure hypothesis can all be inspected and reproduced.</p>
      </PaperSection>
    </ResearchPaperShell>
  );
}
