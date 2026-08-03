import type { CaseStudy } from "@/app/content";
import { BayesianScenarioLabs } from "@/app/components/BayesianScenarioLabs";
import {
  EvidenceNote,
  PaperEquation,
  PaperFigure,
  PaperSection,
  ResearchPaperShell,
  type PaperSectionLink,
} from "@/app/components/ResearchPaperShell";
import styles from "@/app/components/BayesianTargetingPaper.module.css";

const sections: PaperSectionLink[] = [
  { id: "identification", number: "1", title: "Identification and uplift segmentation" },
  { id: "posterior", number: "2", title: "Posterior inference" },
  { id: "policy-labs", number: "3", title: "Interactive policy labs" },
  { id: "allocation-evidence", number: "4", title: "Allocation and independent evidence" },
];

export function BayesianTargetingPage({ study }: { study: CaseStudy }) {
  return (
    <ResearchPaperShell study={study} status="Offline policy study" abstract="This project estimates incremental treatment effect from randomized advertising logs and allocates a limited budget under posterior uncertainty. It separates response prediction from causal uplift, uses arm-specific Beta–Bernoulli posteriors with parent-reference pooling, admits segments through an economic probability gate, and ranks eligible actions by Thompson-sampled net value. Three compact labs expose the decision mechanics; an independent 500,000-row benchmark remains separate from their illustrative defaults." sections={sections}>
      <PaperSection {...sections[0]} deck="The decision target is the difference between treatment and control outcomes for the same pre-treatment population.">
        <p>For each unit, potential outcomes Y(1) and Y(0) denote conversion under treatment and control. Only the outcome under randomized assignment Z is observed. Consistency, no interference, conditional exchangeability from randomization, and positive assignment probability identify conditional average treatment effect. Features used by the policy must be measured before assignment.</p>
        <p>Assignment is not the same as exposure. Impression, click, and engagement occur after assignment and can be affected by treatment, so conditioning on them selects a treatment-dependent population and may open collider bias. The policy therefore estimates intent-to-treat uplift from randomized assignment. Exposure may enter an operational cost model, but it cannot redefine the population used for causal identification.</p>
        <PaperEquation number="1" label="Identified conditional uplift" expression={String.raw`\tau(x)=\mathbb E[Y(1)-Y(0)\mid X=x]=\mathbb E[Y\mid Z=1,X=x]-\mathbb E[Y\mid Z=0,X=x]`} note="X contains only pre-treatment information and both assignment arms have positive probability." />
        <h3>Decision-relevant segmentation</h3>
        <p>A candidate split is not accepted merely because child response rates differ. Posterior draws compare the optimized net policy for the children with the optimized policy for their parent. A Bayes-factor gate supplies a finite-sample structural penalty, while expected policy gain asks whether the extra structure changes the economically optimal action. A baseline conversion shift with identical uplift can pass a response-model test yet add no targeting value.</p>
      </PaperSection>

      <PaperSection {...sections[1]} deck="Each leaf stores sufficient statistics for treatment and control; uplift is a posterior difference, not a fitted point score.">
        <p>Bernoulli conversions with Beta priors yield closed-form arm posteriors. Paired independent draws from the treatment and control posteriors form the uplift distribution. Its mean summarizes effect, a central interval reports uncertainty, and the fraction of draws above the break-even uplift gives the posterior probability that treatment is profitable.</p>
        <PaperEquation number="2" label="Arm posterior and uplift draw" expression={String.raw`\theta_{\ell z}\mid D\sim\operatorname{Beta}(\alpha_{\ell z}+r_{\ell z},\beta_{\ell z}+n_{\ell z}-r_{\ell z}),\qquad \widetilde\Delta_\ell=\widetilde\theta_{\ell1}-\widetilde\theta_{\ell0}`} note="r is conversion count and n−r is non-conversion count for one leaf and assignment arm." />
        <p>Sparse leaves borrow a reference mean from their parent through a prior strength κ. The shrinkage share declines as the leaf accumulates disjoint replay evidence. Parent observations used to choose the reference are not added again as child likelihood counts. That bookkeeping prevents the apparent precision produced by double counting.</p>
        <p>Sequential replay updates only with newly observed sufficient statistics. A decay parameter can reduce effective memory when timestamps support a drift model. The public benchmark is shuffled and does not provide a defensible order, so λ=1 retains all evidence rather than inventing recency. Posterior uncertainty is preserved into the action rule instead of collapsed before allocation.</p>
      </PaperSection>

      <PaperSection {...sections[2]} deck="The three labs preserve the original controls while using smaller numbered figures inside the paper column.">
        <p>Split Value contrasts a baseline-shift counterexample with genuine uplift heterogeneity. Posterior & Pooling changes replay evidence, prior strength, and the selected child to expose shrinkage and profitability probability. Decision Lab varies economic value, treatment cost, budget, and segment cap before drawing and allocating a new Thompson sample. All values are seeded illustrative calculations and are never mixed with the independent benchmark.</p>
        <PaperFigure number="1" title="Interactive Split Value, Posterior & Pooling, and Decision labs. Each lab announces updated results to assistive technology." interactive>
          <BayesianScenarioLabs variant="paper" />
        </PaperFigure>
        <p>The counterexample matters operationally. A model can achieve a large marginal likelihood improvement by splitting two groups with different baseline response but equal treatment effect. Such a split increases complexity without changing whom the policy should treat. Requiring both structural evidence and posterior expected policy gain aligns segmentation with the later allocation objective.</p>
      </PaperSection>

      <PaperSection {...sections[3]} deck="Posterior eligibility precedes constrained Thompson allocation; the learned policy is judged on untouched randomized outcomes.">
        <p>With conversion value v and treatment cost c, a leaf is eligible only when its posterior probability of exceeding c/v reaches threshold τ. One Thompson draw then converts uncertain uplift into sampled net value. A linear allocator fills higher sampled values subject to the global budget, per-segment cap, and treatment/control precision bounds. Ineligible or infeasible leaves receive zero; unused budget remains visible.</p>
        <PaperEquation number="3" label="Economic gate and constrained sampled allocation" expression={String.raw`\Pr(\Delta_\ell>c/v\mid D)\ge\tau,\qquad \widetilde u_\ell=v\widetilde\Delta_\ell-c,\qquad \max_{\mathbf x\in\mathcal F}\sum_\ell x_\ell\widetilde u_\ell`} note="The feasible set F enforces budget, segment share, and arm-precision bounds." />
        <p>After segmentation, priors, thresholds, and allocation rules are frozen, a locked randomized holdout estimates incremental conversion and normalized net value. Inverse-propensity weighting targets the learned policy under the known assignment mechanism. Ranking metrics, calibration, and stratified bootstrap intervals belong to the full specification, but are not presented as completed results where the public MVP did not produce them.</p>
        <div className={styles.benchmark} role="region" aria-label="500k offline benchmark" tabIndex={0}>
          <table><caption><b>Table 1.</b> Observed 500k offline benchmark; values are not lab defaults.</caption><tbody>
            <tr><th>Sampled rows</th><td>500,000</td><th>Test rows</th><td>125,002</td><th>Selected feature</th><td>f0</td></tr>
            <tr><th>Exposure</th><td>16.37%</td><th>Incremental conversion</th><td>0.000371</td><th>Random 25% baseline</th><td>0.000201</td></tr>
            <tr><th>Normalized net value</th><td>0.000289</td><th>Posterior profitable</th><td>95.2%</td><th>Test uplift</th><td>0.00227</td></tr>
            <tr><th>Retained segment</th><td colSpan={3}>12.62 &lt; f0 ≤ 21.94</td><th>Validated cases</th><td>1</td></tr>
          </tbody></table>
        </div>
        <EvidenceNote title="Offline boundary"><p>The public MVP uses four quantile segments and fixed prior strength. Validation-gated adaptive trees, predictive κ, Qini/AUUC diagnostics, calibration, and stratified bootstrap are the research specification, not claims about the current implementation.</p></EvidenceNote>
      </PaperSection>
    </ResearchPaperShell>
  );
}
