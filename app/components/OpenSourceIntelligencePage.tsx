import Link from "next/link";
import type { CaseStudy } from "@/app/content";
import { MathBlock } from "@/app/components/MathBlock";
import styles from "@/app/components/OpenSourceIntelligencePage.module.css";

const equations = {
  admissibility: String.raw`\mathcal I_i(E_i)=\{b:\ t_{\mathrm{trade}}(b)<D_i,\ t_{\mathrm{available}}(b)<t_{\mathrm{open}}(E_i)\},\qquad E_i=\min\{s:\ s>D_i,\ s\text{ is complete}\}`,
  target: String.raw`\mathbf y_i=\bigl(r_i^{(1)},r_i^{(3)},r_i^{(5)}\bigr)^\top,\qquad r_i^{(h)}=\frac{P^{\mathrm{close}}_{i,E_i+h-1}}{P^{\mathrm{open}}_{i,E_i}}-1`,
  document: String.raw`\mathbf d_{i,b}=\frac{1}{|T_{i,b}|}\sum_{(c,p)\in T_{i,b}}\mathbf H^{\mathrm{tok}}_{i,c,p},\qquad \mathbf D_i=[\mathbf d_{i,1},\ldots,\mathbf d_{i,B_i}]^\top\in\mathbb R^{B_i\times768}`,
  market: String.raw`\mathbf X_i^m\in\mathbb R^{60\times8}\longrightarrow\mathbf H_i^m\in\mathbb R^{8\times6\times128}\longrightarrow\mathbf P_i\in\mathbb R^{48\times128}`,
  slots: String.raw`\mathbf S=\operatorname{LN}\!\left(\mathbf Q_0+\operatorname{MHA}(\mathbf Q_0,\mathbf D,\mathbf D)\right),\quad g_{ik}=\sigma\!\left(\mathbf W_2\operatorname{GELU}(\mathbf W_1[\mathbf S_{ik};\bar{\mathbf d}_i]+\mathbf b_1)+b_2\right)`,
  fusion: String.raw`\widetilde{\mathbf F}=\operatorname{MHA}(\mathbf S_f,\mathbf P_f,\mathbf P_f),\quad \alpha_{ik}=\frac{g_{ik}}{\sum_jg_{ij}},\quad \mathbf z_i=\operatorname{LN}\!\left(\operatorname{GELU}(\mathbf W_o[\sum_k\alpha_{ik}\widetilde{\mathbf F}_{ik};\bar{\mathbf P}_{f,i}]+\mathbf b_o)\right)\in\mathbb R^{64}`,
  gaussian: String.raw`\boldsymbol\theta_i=\mathbf W_{dec}\mathbf z_i+\mathbf b_{dec}\in\mathbb R^9,\quad \boldsymbol\Sigma_i=\mathbf L_i\mathbf L_i^\top,\quad \mathbf y_i\mid\mathbf z_i\sim\mathcal N(\boldsymbol\mu_i,\boldsymbol\Sigma_i)`,
  loss: String.raw`\mathcal L=\frac1n\sum_i\frac12\!\left[(\mathbf y_i-\boldsymbol\mu_i)^\top\boldsymbol\Sigma_i^{-1}(\mathbf y_i-\boldsymbol\mu_i)+\log\det\boldsymbol\Sigma_i+3\log(2\pi)\right]+10^{-3}\mathcal R_{sparse}+10^{-3}\mathcal R_{diverse}`,
  selection: String.raw`m^*=\arg\min_{m\in\mathcal M}\left[\operatorname{NLL}_{val}(m)+\gamma\,\operatorname{CalErr}_{val}(m)+\rho\log C(m)\right],\qquad s_h=Q_{1-\alpha}\!\left(\frac{|y_h-\mu_h|}{\sigma_h}\right)_{val}`,
  replay: String.raw`\max_{\mathbf w\ge0}\ \mathbf w^\top\widehat{\boldsymbol\mu}-\operatorname{fee}(\mathbf w)-\operatorname{slip}(\mathbf w)-\operatorname{impact}(\mathbf w),\quad \sum_jw_j\le1,\quad w_j\le\min(c_j,q_jV_j)` ,
};

function Formula({ label, expression, note }: { label: string; expression: string; note: string }) {
  return <figure className={styles.formula}><figcaption>{label}</figcaption><MathBlock expression={expression} /><p>{note}</p></figure>;
}

function ScopeTag({ observed = false }: { observed?: boolean }) {
  return <span className={observed ? styles.observedTag : styles.specTag}>{observed ? "Observed IRVS evidence" : "Research specification"}</span>;
}

export function OpenSourceIntelligencePage({ study }: { study: CaseStudy }) {
  return (
    <main className={styles.page}>
      <header className={`site-header ${styles.nav}`}>
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label="Open Source Intelligence page navigation"><a href="#system">System</a><a href="#method">Method</a><a href="#validation">Validation</a></nav>
        <Link className="header-link" href="/#projects">Close ×</Link>
      </header>

      <article>
        <header className={styles.hero}>
          <div className={styles.heroMeta}><span>Project / {study.number}</span><span>Point-in-time disclosure research</span></div>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}><p>Complete evidence · explicit time</p><h1>Open Source<br />Intelligence</h1><p>A mathematical research specification for turning complete DART disclosure bundles and pre-entry FSC market paths into probabilistic 1·3·5-session forecasts—without hiding a bounded negative result.</p></div>
            <figure className={styles.timeField} aria-labelledby="time-field-caption">
              <div aria-hidden="true">
                <span>DART<br /><b>RECEIPT</b></span><i /><span>FSC<br /><b>AVAILABLE</b></span><i /><span>NEXT SESSION<br /><b>ENTRY</b></span>
                <em>DOCUMENT</em><em>CONTEXT</em><em>LABEL</em>
              </div>
              <figcaption id="time-field-caption">Information moves from an immutable DART receipt through provider availability into the next complete market-session entry. Pre-entry context and post-entry labels remain separate.</figcaption>
            </figure>
          </div>
          <dl className={styles.heroFacts}><div><dt>Observation</dt><dd>Issuer × receipt bundle</dd></div><div><dt>Context</dt><dd>60 sessions × 8 channels</dd></div><div><dt>Forecast</dt><dd>Joint 1 · 3 · 5 returns</dd></div><div><dt>Locked result</dt><dd>Negative vs baselines</dd></div></dl>
        </header>

        <div className={styles.paper}>
          <section className={styles.chapter} id="system" aria-labelledby="system-title">
            <div className={styles.chapterRail}><span>01 / System</span><b>Information<br />Time</b></div>
            <div className={styles.chapterBody}>
              <header className={styles.chapterHead}><div><ScopeTag /><h2 id="system-title">The model may be opaque. Its information set may not.</h2></div><p>The unit is one issuer and one DART receipt-date bundle. Identity, document version, market availability, execution time, and future labels are separate typed objects.</p></header>

              <div className={styles.definitionGrid}>
                <article><span>01</span><h3>Immutable event</h3><p>A receipt preserves the original ZIP, ordered member inventory, individual hashes, structural blocks, native table coordinates, and DOM positions. A correction is a new receipt/version; it never overwrites the source event.</p></article>
                <article><span>02</span><h3>Admissible context</h3><p>A market row is input only when its trade date precedes the receipt and the FSC-declared availability precedes the next complete session open. Unknown calendars, partial KOSPI/KOSDAQ days, or stale identity fail closed.</p></article>
                <article><span>03</span><h3>Tradable label</h3><p>Execution begins at the first observed Korean-equity session strictly after receipt date. The three labels share that opening price and terminate at the close of the first, third, and fifth observed sessions.</p></article>
              </div>

              <Formula label="Admissible information and first execution" expression={equations.admissibility} note="trade_date, provider availability, retrieval time, receipt date, and execution timestamp remain distinct; equality at the cutoff is unavailable." />
              <Formula label="Multi-horizon return target" expression={equations.target} note="Every post-entry bar is label-only. Fees and slippage belong to downstream replay, not the source target." />

              <table className={styles.timelineTable} aria-label="Point-in-time data roles">
                <thead><tr><th>Object</th><th>Time contract</th><th>Model role</th><th>Failure boundary</th></tr></thead>
                <tbody>
                  <tr><th scope="row">DART bundle</th><td>Indexed on receipt date D</td><td>Document input</td><td>Hash or version mismatch</td></tr>
                  <tr><th scope="row">FSC market row</th><td>available_at &lt; open(E)</td><td>60-session context</td><td>Partial day or late availability</td></tr>
                  <tr><th scope="row">Entry session E</th><td>First complete session after D</td><td>Common entry open</td><td>Missing or unresolved identity</td></tr>
                  <tr><th scope="row">Future bars</th><td>E through horizon 5</td><td>Labels only</td><td>Any contact with encoder input</td></tr>
                  <tr><th scope="row">Correction family</th><td>Official viewer receipt links</td><td>Fold grouping only</td><td>Cross-partition family</td></tr>
                </tbody>
              </table>

              <aside className={styles.observedNote}><ScopeTag observed /><p>The bounded collection completed 38 of 38 selected documents across 20 issuers and preserved all 38 dataset examples. A label-free 32-chunk ceiling excluded two document-size outliers without truncation, leaving 22 TRAIN, 6 VALIDATION, and 8 TEST observations for the frozen encoder cache.</p></aside>
            </div>
          </section>

          <section className={`${styles.chapter} ${styles.method}`} id="method" aria-labelledby="method-title">
            <div className={styles.chapterRail}><span>02 / Method</span><b>Latent<br />Geometry</b></div>
            <div className={styles.chapterBody}>
              <header className={styles.chapterHead}><div><ScopeTag /><h2 id="method-title">Two frozen encoders. Four learned slots. One correlated path.</h2></div><p>Complete document blocks and causal market tokens meet only after separate, provenance-bound encoding. The trainable head learns compression, cross-modal interaction, and uncertainty.</p></header>

              <div className={styles.modelSplit}>
                <article><span>Document path</span><h3>Tokens return to evidence blocks</h3><p>Every normalized block is packed losslessly into at most 4,096-token KoBigBird chunks. Token states are averaged back over their originating block positions, preserving a pointer from each cached row to its source structure.</p><Formula label="Block reconstruction" expression={equations.document} note="Bᵢ varies from 16 to 785 in the observed support; batch padding is masked and cannot contribute to attention." /></article>
                <article><span>Market path</span><h3>Channels become causal tokens</h3><p>The ordered channels are open, high, low, close, volume, turnover, market capitalization, and listed shares. Five length-12 patches plus CLS per channel yield 48 market tokens.</p><Formula label="Frozen market representation" expression={equations.market} note="Only the 70 IBM encoder tensors are retained. The ETTh1 forecast head is discarded, and the checkpoint is not described as finance-pretrained." /></article>
              </div>

              <Formula label="Input-conditioned document slots" expression={equations.slots} note="Four global queries attend to variable-length block states. Each sigmoid gate depends on both the slot and the document’s masked mean; slots have no assigned economic meaning." />
              <Formula label="Slot-to-market fusion" expression={equations.fusion} note="Document slots and 48 market tokens are projected to width 64. Normalized gates aggregate four attended slots before the document and market summaries are fused." />
              <Formula label="Correlated probabilistic decoder" expression={equations.gaussian} note="Three means and six lower-triangular values define a positive-definite 3×3 covariance; softplus on the diagonal prevents a non-positive scale." />
              <Formula label="Training objective" expression={equations.loss} note="Joint likelihood learns horizon covariance. Equal 10⁻³ penalties discourage always-on and collapsed document slots." />

              <div className={styles.ledgerGrid}>
                <table aria-label="Observed tensor ledger"><caption>Observed IRVS tensor ledger</caption><thead><tr><th>Stage</th><th>Shape</th></tr></thead><tbody>
                  <tr><th scope="row">Raw market</th><td>60 × 8</td></tr><tr><th scope="row">Market encoder</th><td>8 × 6 × 128 → 48 × 128</td></tr><tr><th scope="row">Document states</th><td>Bᵢ × 768 · Bᵢ=16…785</td></tr><tr><th scope="row">Document chunks</th><td>217 total · max 26</td></tr><tr><th scope="row">Slot attention</th><td>n × 4 × B*</td></tr><tr><th scope="row">Market attention</th><td>n × 4 × 48</td></tr><tr><th scope="row">Fused state</th><td>n × 64</td></tr><tr><th scope="row">Gaussian output</th><td>μ: n × 3 · L: n × 3 × 3</td></tr>
                </tbody></table>
                <table aria-label="Trainable parameter ledger"><caption>Trainable head parameters</caption><thead><tr><th>Module</th><th>Parameters</th></tr></thead><tbody>
                  <tr><th scope="row">Dynamic slots</th><td>3,548,161</td></tr><tr><th scope="row">Cross-modal fusion</th><td>82,624</td></tr><tr><th scope="row">Gaussian decoder</th><td>585</td></tr><tr className={styles.totalRow}><th scope="row">Total</th><td>3,631,370</td></tr>
                </tbody></table>
              </div>
              <aside className={styles.observedNote}><ScopeTag observed /><p>The immutable cache contains 36 observations and no raw text, raw market values, labels, or targets. Both encoders are frozen. The 14,528,080-byte checkpoint contains 27 float32 tensors from the slot, fusion, and Gaussian head—and zero encoder tensors.</p></aside>
            </div>
          </section>

          <section className={styles.stack} aria-labelledby="stack-title">
            <div><span>03 / Technology stack</span><h2 id="stack-title">Source to distribution</h2></div>
            <ul>{["Python","PyTorch","Transformers","NumPy","SafeTensors","KoBigBird","IBM PatchTST","OpenDART","FSC / KRX","pytest"].map((item) => <li key={item}>{item}</li>)}</ul>
            <p>IBM’s checkpoint is pretrained on ETTh1, not finance. Its forecast head is excluded; only the frozen pre-head encoder states enter this study.</p>
          </section>

          <section className={`${styles.chapter} ${styles.validation}`} id="validation" aria-labelledby="validation-title">
            <div className={styles.chapterRail}><span>04 / Validation</span><b>Sealed<br />Evidence</b></div>
            <div className={styles.chapterBody}>
              <header className={styles.chapterHead}><div><ScopeTag /><h2 id="validation-title">Select in the past. Calibrate once. Open TEST once.</h2></div><p>The full specification separates model selection, uncertainty calibration, predictive evaluation, and executable replay. No downstream return may choose an upstream model.</p></header>

              <div className={styles.validationGrid}>
                <article><span>Fold contract</span><h3>Expanding walk-forward</h3><p>Training expands chronologically. Labels ending near a later partition are purged, a fixed embargo follows validation, and every official correction family remains inside one partition. Candidate capacity, gate regularization, and compute trade-offs use validation only.</p></article>
                <article><span>Comparator contract</span><h3>Same support, new fit</h3><p>Full, document-only, market-only, structure-removed, and train-only timing-shuffle variants are retrained on identical folds. Zero return and train historical mean remain fixed simple references; TEST never enters selection.</p></article>
                <article><span>Replay contract</span><h3>Prediction is not P&amp;L</h3><p>A separate long-only replay applies next-session entry, fees, two-way slippage, turnover participation, square-root impact, halts, capacity, and tradability. Replay cannot retroactively select the forecast model.</p></article>
              </div>

              <section className={styles.governance} aria-labelledby="governance-title">
                <header><ScopeTag /><h3 id="governance-title">Strict G1–G12 research gate ledger</h3><p>These are ordered completion gates, not claims about the bounded IRVS below.</p></header>
                <ol>
                  <li><b>G1</b><span>Master preregistration and plan-ID enforcement</span></li>
                  <li><b>G2</b><span>Result-blind real corpus and failure accounting</span></li>
                  <li><b>G3</b><span>Deterministic dataset, support, and leakage gates</span></li>
                  <li><b>G4</b><span>Correction-family registry and fold isolation</span></li>
                  <li><b>G5</b><span>File-hashed production runtime and round trip</span></li>
                  <li><b>G6</b><span>Resumable folds, selection, calibration, and refit</span></li>
                  <li><b>G7</b><span>Separate sealed labels and one-time TEST ledger</span></li>
                  <li><b>G8</b><span>Joint forecast, stability, and comparator evaluation</span></li>
                  <li><b>G9</b><span>Constrained replay with capital lifecycle and stress</span></li>
                  <li><b>G10</b><span>Exact artifact-to-DART/FSC evidence trace</span></li>
                  <li><b>G11</b><span>Public-safe delivery, experiment index, limitations</span></li>
                  <li><b>G12</b><span>Clean restore, resume, leakage, rights, security audit</span></li>
                </ol>
              </section>

              <Formula label="Validation-only selection and scale calibration" expression={equations.selection} note="The specification selects a capacity/compute trade-off on validation records, then freezes horizon-wise conformal scale multipliers before sealed evaluation." />
              <Formula label="Constrained long-only replay" expression={equations.replay} note="cⱼ is the per-name capital cap; qⱼVⱼ is source-turnover capacity. Untradable observations are exclusions, never forward-filled positions." />

              <section className={styles.resultBlock} aria-labelledby="result-title">
                <header><ScopeTag observed /><h3 id="result-title">One bounded IRVS. One terminal TEST.</h3><p>The fixed vertical slice proves an auditable research cycle, not predictive superiority.</p></header>
                <dl><div><dt>Cache observations</dt><dd>36</dd></div><div><dt>TRAIN / VALIDATION / TEST</dt><dd>22 / 6 / 8</dd></div><div><dt>Best epoch</dt><dd>15</dd></div><div><dt>Best validation NLL</dt><dd>−3.2648975849</dd></div><div><dt>Trainable parameters</dt><dd>3,631,370</dd></div><div><dt>TEST stage</dt><dd>Exactly once</dd></div></dl>
                <table aria-label="Fixed IRVS test metrics"><caption>Three-horizon TEST averages · lower is better for NLL, CRPS, and MAE</caption><thead><tr><th>Method</th><th>NLL</th><th>CRPS</th><th>MAE</th><th>Direction</th><th>80% coverage</th></tr></thead><tbody>
                  <tr><th scope="row">Model</th><td>−0.9690</td><td>0.04285</td><td>0.04839</td><td>0.2917</td><td>1.0000</td></tr>
                  <tr><th scope="row">Zero return</th><td>−2.4312</td><td>0.01038</td><td>0.01143</td><td>0.2917</td><td>0.9583</td></tr>
                  <tr><th scope="row">TRAIN historical mean</th><td>−2.4233</td><td>0.01060</td><td>0.01187</td><td>0.4583</td><td>0.9583</td></tr>
                </tbody></table>
                <p className={styles.resultInterpretation}>The model loses to both baselines on NLL, CRPS, and MAE. Coverage of 1.0000 against an 80% target is evidence of intervals that are too wide—not perfect calibration. With 22 training observations against 3,631,370 trainable parameters, over-parameterization is the first documented failure hypothesis.</p>
              </section>

              <p className={styles.evidenceBoundary} data-evidence-boundary="true"><strong>Evidence boundary.</strong> The expanding multi-fold selection, complete strict G1–G12 governance, full ablation matrix, calibrated sealed evaluation, and constrained replay above are the research specification. The completed public evidence is the smaller 36-observation IRVS: frozen encoders, one 22/6/8 head fit and checkpoint selection, one permanently locked eight-observation TEST, and a negative result against two simple baselines. It is not evidence of market-wide predictive superiority, profitability, or a production trading system.</p>

              <div className={styles.links}><a href="https://github.com/Moon-Young-Choi/open-source-intelligence" target="_blank" rel="noreferrer">Project repository ↗</a><a href="https://github.com/Moon-Young-Choi/Moon-Young-Choi.github.io" target="_blank" rel="noreferrer">Portfolio source ↗</a></div>
            </div>
          </section>
        </div>
      </article>

      <footer className={styles.references} aria-labelledby="references-title"><span id="references-title">References</span><div>
        <a href="https://github.com/Moon-Young-Choi/open-source-intelligence">Project repository</a>
        <a href="https://opendart.fss.or.kr/guide/main.do?apiGrpCd=DS001">OpenDART</a>
        <a href="https://www.data.go.kr/data/15094808/openapi.do">FSC Stock Price API</a>
        <a href="https://github.com/SKT-AI/KoBigBird">KoBigBird</a>
        <a href="https://huggingface.co/ibm-granite/granite-timeseries-patchtst">IBM Granite PatchTST</a>
        <a href="https://arxiv.org/abs/2007.14062">BigBird</a>
        <a href="https://arxiv.org/abs/2211.14730">PatchTST</a>
      </div></footer>
    </main>
  );
}
