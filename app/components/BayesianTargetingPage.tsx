import Link from "next/link";
import type { CaseStudy } from "@/app/content";
import { MathBlock } from "@/app/components/MathBlock";
import { BayesianScenarioLabs } from "@/app/components/BayesianScenarioLabs";
import styles from "@/app/components/BayesianTargetingPage.module.css";

const equations = {
  identification: String.raw`\tau(x)=\mathbb E[Y(1)-Y(0)\mid X=x]=\mathbb E[Y\mid Z=1,X=x]-\mathbb E[Y\mid Z=0,X=x]`,
  split: String.raw`G(s)=\mathbb E_{p(\boldsymbol\theta\mid D)}\!\left[V(\pi_s,\boldsymbol\theta)-V(\pi_{\mathrm{parent}},\boldsymbol\theta)\right],\quad \text{split if }G(s)>0\text{ and }BF_s>\eta`,
  conjugacy: String.raw`Y_{\ell z}\sim\operatorname{Bernoulli}(\theta_{\ell z}),\quad \theta_{\ell z}\mid D\sim\operatorname{Beta}(\alpha_{\ell z}+r_{\ell z},\ \beta_{\ell z}+n_{\ell z}-r_{\ell z})`,
  pooling: String.raw`\alpha^{(0)}_{\ell z}=\kappa\mu_{p(\ell),z},\quad \beta^{(0)}_{\ell z}=\kappa(1-\mu_{p(\ell),z}),\quad S_t=\lambda S_{t-1}+S_{\mathrm{new}}`,
  decision: String.raw`\Pr(\Delta_\ell>c/v\mid D)\ge\tau,\quad \widetilde u_\ell=v(\widetilde\theta_{\ell1}-\widetilde\theta_{\ell0})-c,\quad \max_{\mathbf x}\sum_\ell x_\ell\widetilde u_\ell`,
  value: String.raw`\widehat V(\pi)=\frac1N\sum_{i=1}^N\!\left[\frac{\pi(X_i)Z_iY_i}{e(X_i)}+\frac{(1-\pi(X_i))(1-Z_i)Y_i}{1-e(X_i)}\right],\quad \widehat V_{\mathrm{net}}=v\widehat\Delta_\pi-c\widehat q_\pi`,
};

function Formula({ label, expression, note }: { label: string; expression: string; note: string }) {
  return <figure className={styles.formula}><figcaption>{label}</figcaption><MathBlock expression={expression} /><p>{note}</p></figure>;
}

export function BayesianTargetingPage({ study }: { study: CaseStudy }) {
  return (
    <main className={styles.page}>
      <header className={`site-header ${styles.nav}`}>
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label="Bayesian Ad Targeting page navigation"><a href="#system">System</a><a href="#method">Method</a><a href="#validation">Validation</a></nav>
        <Link className="header-link" href="/#projects">Close ×</Link>
      </header>

      <article>
        <header className={styles.hero}>
          <div className={styles.heroMeta}><span>Project / {study.number}</span><span>Mathematical specification · Offline policy study</span></div>
          <div className={styles.heroGrid}>
            <div><p>Incrementality under uncertainty</p><h1>Bayesian<br />Ad Targeting</h1></div>
            <div className={styles.heroAbstract}>
              <p>A treatment policy should buy incremental outcomes, not high response rates. This study joins randomized identification, hierarchical Beta–Bernoulli inference, posterior policy value, and constrained Thompson allocation in one auditable decision rule.</p>
              <div><span>Potential outcomes</span><span>Partial pooling</span><span>Holdout value</span></div>
            </div>
          </div>
          <dl className={styles.heroFacts}><div><dt>Decision object</dt><dd>Conditional uplift</dd></div><div><dt>Posterior</dt><dd>Beta × Beta</dd></div><div><dt>Policy</dt><dd>Constrained TS</dd></div><div><dt>Evidence</dt><dd>Randomized holdout</dd></div></dl>
        </header>

        <div className={styles.paper}>
          <section className={styles.chapter} id="system" aria-labelledby="system-title">
            <div className={styles.chapterLabel}>01 / System</div>
            <div className={styles.chapterBody}>
              <header className={styles.chapterHead}><div><p>Chapter one · identification and segmentation</p><h2 id="system-title">A response model is not a treatment policy.</h2></div><p>The estimand, the split rule, and the economic action must refer to the same pre-treatment population.</p></header>
              <div className={styles.proseGrid}>
                <div><h3>Potential outcomes</h3><p>For unit <em>i</em>, let Yᵢ(1) and Yᵢ(0) be conversion under assigned treatment and control. Only Yᵢ=ZᵢYᵢ(1)+(1−Zᵢ)Yᵢ(0) is observed. Random assignment gives conditional exchangeability; consistency connects assignment to the observed outcome, no interference fixes each unit’s outcome against other assignments, and positivity requires 0&lt;P(Z=1|X=x)&lt;1 wherever a policy may act. Under these conditions, the conditional average treatment effect is identified.</p></div>
                <div><h3>Assignment is not exposure</h3><p>Z is the randomized treatment assignment. A downstream impression or click is post-treatment exposure E(Z), so conditioning on E=1 selects a treatment-affected population and can open collider bias. The policy therefore learns intent-to-treat uplift from randomized assignment, while exposure enters only as an operational cost or separately randomized mechanism.</p></div>
              </div>
              <Formula label="Identified conditional uplift" expression={equations.identification} note="X contains only pre-treatment features; the randomized propensity remains positive in every retained leaf." />

              <div className={styles.splitNarrative}>
                <div><h3>Adaptive hierarchical uplift split</h3><p>A candidate split partitions a parent into children only when it changes the best feasible treatment policy in posterior expectation. For every candidate threshold, posterior draws compare the children’s optimized net value with the unsplit parent. This makes heterogeneity decision-relevant: a baseline conversion shift can fit two response distributions better without changing treatment uplift.</p></div>
                <div><h3>Complexity gate</h3><p>A Beta–Binomial marginal likelihood integrates each arm’s Bernoulli rate. The Bayes factor compares independent child rates against pooled parent rates and supplies a finite-sample complexity penalty. It is necessary but not sufficient: the tree accepts a split only when both the structural gate and posterior expected policy gain clear their thresholds.</p></div>
              </div>
              <Formula label="Two-gate split rule" expression={equations.split} note="BF detects outcome structure; G(s) asks whether that structure changes the economically optimal action." />
              <BayesianScenarioLabs />
            </div>
          </section>

          <section className={`${styles.chapter} ${styles.method}`} id="method" aria-labelledby="method-title">
            <div className={styles.chapterLabel}>02 / Method</div>
            <div className={styles.chapterBody}>
              <header className={styles.chapterHead}><div><p>Chapter two · inference and sequential evidence</p><h2 id="method-title">Posterior uncertainty is part of the policy.</h2></div><p>Each leaf keeps arm-specific sufficient statistics; uplift is a derived posterior, never a single fitted coefficient.</p></header>
              <div className={styles.methodGrid}>
                <article><span>01</span><h3>Conjugate update</h3><p>Bernoulli outcomes and Beta priors produce closed-form arm posteriors. Independent paired draws θ̃ℓ1−θ̃ℓ0 form the uplift posterior. Its mean summarizes effect, its central 90% interval reports uncertainty, and the share above c/v is the posterior profitability probability.</p></article>
                <article><span>02</span><h3>Parent-reference pooling</h3><p>A child prior is centered on its parent’s development estimate with strength κ. The data determine the shrinkage weight κ/(κ+n): sparse leaves borrow more; dense leaves dominate their prior. Parent counts used to construct the prior are not added again to child replay counts, preventing double counting.</p></article>
                <article><span>03</span><h3>Sequential replay</h3><p>Only new sufficient statistics enter each update. Exponential decay Sₜ=λSₜ₋₁+Snew can track drift by reducing effective memory. In the benchmark’s untimestamped, shuffled randomized data there is no defensible time ordering, so λ=1 preserves all evidence rather than inventing recency.</p></article>
              </div>
              <Formula label="Beta–Bernoulli posterior" expression={equations.conjugacy} note="r is the number of conversions and n−r the number of non-conversions for one leaf and assignment arm." />
              <Formula label="Empirical-Bayes reference and replay memory" expression={equations.pooling} note="The parent supplies a reference mean, while only disjoint replay evidence increments the child posterior." />
            </div>
          </section>

          <section className={styles.stack} aria-labelledby="stack-title">
            <div><span>03 / Technology stack</span><h2 id="stack-title">Compact computational path</h2></div>
            <ul><li>Python</li><li>NumPy</li><li>pandas</li><li>Beta–Bernoulli</li><li>Thompson Sampling</li></ul>
          </section>

          <section className={`${styles.chapter} ${styles.validation}`} id="validation" aria-labelledby="validation-title">
            <div className={styles.chapterLabel}>04 / Validation</div>
            <div className={styles.chapterBody}>
              <header className={styles.chapterHead}><div><p>Chapter three · decision and evidence</p><h2 id="validation-title">Allocate by sampled net value; judge on untouched outcomes.</h2></div><p>The posterior authorizes a candidate action. Independent randomized outcomes decide whether its estimated value survives outside development and replay.</p></header>
              <div className={styles.proseGrid}>
                <div><h3>Economic gate and Thompson draw</h3><p>With normalized conversion value v and treatment cost c, the break-even uplift is c/v. A leaf enters allocation only if P(Δℓ&gt;c/v|D)≥τ. Thompson Sampling draws one treatment and control rate per leaf, ranks sampled net values, and naturally explores uncertain leaves only when their sampled economics justify it.</p></div>
                <div><h3>Constrained allocation</h3><p>The linear objective fills higher sampled net value first. A global budget bounds total treatment; a segment-share cap prevents one leaf from absorbing all supply. Arm-specific precision targets imply a lower treatment count and a control-reserve upper bound in each leaf. Infeasible or posterior-gated leaves receive zero; unused budget remains explicit.</p></div>
              </div>
              <Formula label="Posterior gate and sampled objective" expression={equations.decision} note="The feasible set also enforces total budget, per-leaf share, and treatment/control precision bounds." />

              <div className={styles.holdoutGrid}>
                <div><h3>Independent holdout value</h3><p>A locked randomized test split estimates policy value after tree, prior, thresholds, and allocation are fixed. Inverse-propensity weighting recovers the outcome under the learned policy; normalized net value subtracts the treated share’s cost from incremental conversion value.</p></div>
                <div><h3>Ranking, calibration, uncertainty</h3><p>Qini and AUUC test whether cumulative incremental gains concentrate near the top of the score ranking. Calibration bins compare predicted with observed uplift. A stratified bootstrap resamples within treatment × outcome strata, reruns evaluation, and yields intervals for uplift, normalized net value, Qini, and AUUC without erasing rare conversions.</p></div>
              </div>
              <Formula label="Randomized policy value" expression={equations.value} note="e(X) is the known randomized propensity; q̂π is the policy’s treated share on the holdout." />

              <section className={styles.benchmark} aria-labelledby="benchmark-title">
                <header><span>Fixed evidence block</span><h3 id="benchmark-title">500k offline benchmark</h3><p>One reproducible split of the public Criteo uplift dataset; values below are observed benchmark outputs, not Lab defaults.</p></header>
                <dl>
                  <div><dt>Sampled rows</dt><dd>500,000</dd></div><div><dt>Test rows</dt><dd>125,002</dd></div><div><dt>Selected feature</dt><dd>f0</dd></div><div><dt>Exposure</dt><dd>16.37%</dd></div>
                  <div><dt>Incremental conversion</dt><dd>0.000371</dd></div><div><dt>Random 25% baseline</dt><dd>0.000201</dd></div><div><dt>Normalized net value</dt><dd>0.000289</dd></div><div><dt>Validated cases</dt><dd>1</dd></div>
                  <div className={styles.wideMetric}><dt>Retained segment</dt><dd>12.62 &lt; f0 ≤ 21.94</dd></div><div><dt>Posterior profitable</dt><dd>95.2%</dd></div><div><dt>Test uplift</dt><dd>0.00227</dd></div>
                </dl>
              </section>

              <p className={styles.evidenceBoundary} data-evidence-boundary="true"><strong>Evidence boundary.</strong> The current public MVP uses four quantile segments and a fixed prior strength; the validation-gated adaptive tree, predictive κ, treatment/control precision optimization, Qini/AUUC diagnostics, calibration analysis, and stratified bootstrap described above are the full research specification, not claims about the present implementation.</p>

              <div className={styles.links}>
                <a href="https://github.com/Moon-Young-Choi/bayesian-ad-targeting" target="_blank" rel="noreferrer">Python project ↗</a>
                <a href="https://github.com/Moon-Young-Choi/moon-young-choi.github.io" target="_blank" rel="noreferrer">Portfolio source ↗</a>
              </div>
            </div>
          </section>
        </div>
      </article>

      <footer className={styles.references} aria-labelledby="references-title"><span id="references-title">References</span><div>
        <a href="https://ailab.criteo.com/criteo-uplift-prediction-dataset/">Criteo dataset</a>
        <a href="https://dash.harvard.edu/entities/publication/73120378-82c0-6bd4-e053-0100007fdf3b">Rubin · potential outcomes</a>
        <a href="https://sites.stat.columbia.edu/gelman/book/">Bayesian Data Analysis</a>
        <a href="https://doi.org/10.2307/2332286">Thompson · 1933</a>
        <a href="https://doi.org/10.1073/pnas.1510489113">Athey–Imbens · causal trees</a>
      </div></footer>
    </main>
  );
}
