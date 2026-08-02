import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import katex from "katex";
import type { CaseStudy } from "@/app/content";
import {
  proofEntriesFor,
  pwrTheoryEvidence,
  pwrTheorySections,
  pwrTheorySummary,
  type PwrEquationV1,
  type PwrProofEntryV1,
} from "@/app/lib/pwrTheory";
import styles from "@/app/components/PwrTheoryPage.module.css";

function Equation({ equation }: { equation: PwrEquationV1 }) {
  const html = katex.renderToString(equation.tex, {
    displayMode: true,
    output: "htmlAndMathml",
    strict: false,
    throwOnError: false,
  });
  return (
    <figure className={styles.equation} id={equation.id} aria-label={equation.alt}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <figcaption><a href={`#${equation.id}`}>{equation.label}</a><span className={styles.screenReaderOnly}>{equation.alt}</span></figcaption>
    </figure>
  );
}

function InlineMath({ expression, label }: { expression: string; label: string }) {
  const html = katex.renderToString(expression, { output: "htmlAndMathml", strict: false, throwOnError: false });
  return <span className={styles.inlineMath} aria-label={label} dangerouslySetInnerHTML={{ __html: html }} />;
}

const linkableIds = new Set([
  ...pwrTheoryEvidence.proofEntries.map((entry) => entry.id),
  ...pwrTheoryEvidence.appendixSections.map((entry) => entry.id),
]);
const titleById = new Map([
  ...pwrTheoryEvidence.proofEntries.map((entry) => [entry.id, entry.label] as const),
  ...pwrTheoryEvidence.appendixSections.map((entry) => [entry.id, `Appendix ${entry.label}`] as const),
]);

function ReferenceLine({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, index) => (
        <span key={item}>{index > 0 && " · "}{linkableIds.has(item) ? <a href={`#${item}`}>{titleById.get(item) ?? item}</a> : item}</span>
      ))}
    </>
  );
}

function ProofCard({ entry }: { entry: PwrProofEntryV1 }) {
  const prerequisites = [...new Set([...entry.assumptions, ...entry.dependencies])];
  const hasProof = entry.kind === "lemma" || entry.kind === "proposition" || entry.kind === "theorem";
  return (
    <article className={styles.proofCard} id={entry.id} data-kind={entry.kind}>
      <header>
        <h3><a href={`#${entry.id}`}>{entry.label}.</a> {entry.title}</h3>
        <span>{entry.kind}</span>
      </header>
      <p className={styles.statement}>{entry.statement}</p>
      {prerequisites.length > 0 && <p className={styles.prerequisites}><strong>Uses.</strong> <ReferenceLine items={prerequisites} /></p>}
      {entry.equations.map((equation) => <Equation equation={equation} key={equation.id} />)}
      {hasProof && <p className={styles.proofText}><em>Proof.</em> {entry.proofSteps.join(" ")} <span aria-hidden="true">□</span></p>}
      <p className={styles.resolution}><em>{hasProof ? "Consequently." : "Interpretation."}</em> {entry.conclusion} <span><em>Scope.</em> {entry.boundary}</span></p>
    </article>
  );
}

function SectionShell({ id, number, title, description, children, eyebrow = "Theory" }: { id: string; number: string; title: string; description: string; children: ReactNode; eyebrow?: string }) {
  return (
    <section className={styles.chapter} id={id} aria-labelledby={`${id}-title`}>
      <header className={styles.chapterHead}>
        <span>{number} / {eyebrow}</span>
        <div><h2 id={`${id}-title`}>{title}</h2><p>{description}</p></div>
      </header>
      {children}
    </section>
  );
}

function ProofCards({ sectionId }: { sectionId: string }) {
  return <div className={styles.proofList}>{proofEntriesFor(sectionId).map((entry) => <ProofCard entry={entry} key={entry.id} />)}</div>;
}

function SignalBridgeVisual() {
  return (
    <figure className={styles.bridgeVisual} aria-labelledby="bridge-caption">
      <div className={styles.spectrum} aria-hidden="true">
        {Array.from({ length: 20 }, (_, index) => <i key={index} style={{ "--level": `${18 + ((index * 17) % 67)}%` } as CSSProperties} />)}
        <span>conditional log-power</span>
      </div>
      <div className={styles.bridgeArrow} aria-hidden="true">Taylor + covariance</div>
      <div className={styles.covariance} aria-hidden="true">
        {Array.from({ length: 64 }, (_, index) => {
          const row = Math.floor(index / 8); const column = index % 8;
          const distance = Math.abs(row - column);
          return <i key={index} data-level={distance < 2 ? "high" : distance < 4 ? "mid" : "low"} />;
        })}
        <b>τ²ℓℓᵀ + E</b>
      </div>
      <figcaption id="bridge-caption"><strong>Text equivalent.</strong> A smooth conditional log-power response produces a rank-one covariance leading term. Proposition 2.2 retains residual-covariance drift and Taylor error in an explicit operator-norm remainder.</figcaption>
    </figure>
  );
}

function ProofDependencyVisual() {
  const rows = [
    ["Acoustic bridge", "Propositions 2.2–2.3", "Pooled statistic", "Definition 4.1 · Proposition 4.2"],
    ["Exchangeability", "Assumptions 3.1 · 5.1", "Exact orbit rank", "Lemma 5.4 · Theorems 5.5, 5.8"],
    ["Observed + random tails", "Lemmas 6.3–6.4", "Fixed-scale power", "Theorem 6.6"],
    ["Direction + location mixtures", "Theorem 6.11", "Matched rate", "Theorem 6.12"],
    ["Interval cover + PSD monotonicity", "Theorem 7.1 · Lemma 7.2", "Adaptive power", "Theorem 7.3"],
  ];
  return (
    <figure className={styles.dependencyVisual} aria-labelledby="dependency-caption">
      <div className={styles.dependencyCanvas} aria-hidden="true">
        {rows.map((row, index) => (
          <div className={styles.dependencyRow} key={row[0]} data-tone={index % 3}>
            <span><small>{row[1]}</small><b>{row[0]}</b></span>
            <i>→</i>
            <span><small>{row[3]}</small><b>{row[2]}</b></span>
          </div>
        ))}
      </div>
      <table>
        <caption id="dependency-caption">Selected proof-dependency spine; every formal edge remains available on the linked numbered results.</caption>
        <thead><tr><th>Input result</th><th>Input IDs</th><th>Dependent result</th><th>Dependent IDs</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index % 2 === 0 ? <th key={cell}>{cell}</th> : <td key={cell}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </figure>
  );
}

function WhiteningVisual() {
  const stages = [
    ["01", "Group covariances", "Σ̂₀,B · Σ̂₁,B"],
    ["02", "Pooled metric", "Σ̂P,B = π₀Σ̂₀,B + π₁Σ̂₁,B"],
    ["03", "Symmetric whitening", "Σ̂P,B⁻¹ᐟ² (Σ̂₁,B − Σ̂₀,B) Σ̂P,B⁻¹ᐟ²"],
    ["04", "Positive root", "T B = λmax(D B)"],
    ["05", "Global scan", "max B T B / a B"],
  ];
  return (
    <figure className={styles.whiteningVisual} aria-labelledby="whitening-caption">
      <div aria-hidden="true">{stages.map((stage) => <div key={stage[0]}><span>{stage[0]}</span><b>{stage[1]}</b><code>{stage[2]}</code></div>)}</div>
      <table>
        <caption id="whitening-caption">Pooled-whitening transformation and its proof boundary.</caption>
        <thead><tr><th>Operation</th><th>Preserved object</th><th>Boundary</th></tr></thead>
        <tbody>
          <tr><th>Pool</th><td>One label-invariant sample metric for the block</td><td>The pooled covariance must be invertible.</td></tr>
          <tr><th>Whiten</th><td>Generalized eigenvalues under symmetric congruence</td><td>This is sample pooled whitening, not baseline whitening.</td></tr>
          <tr><th>Maximize</th><td>The strongest positive direction in the pre-fixed block</td><td>The loading is not a support confidence set or physical direction of arrival.</td></tr>
        </tbody>
      </table>
    </figure>
  );
}

function OrbitVisual() {
  const values = [0.22, 0.31, 0.35, 0.42, 0.46, 0.52, 0.59, 0.63, 0.76, 0.81, 0.93];
  return (
    <figure className={styles.orbitVisual} aria-labelledby="orbit-caption">
      <div aria-hidden="true">
        {values.map((value, index) => <i key={value} className={index === 9 ? styles.orbitObserved : undefined} style={{ "--rank": `${value * 100}%` } as CSSProperties}><span>{index === 9 ? "S(D)" : ""}</span></i>)}
        <b>upper orbit rank</b>
      </div>
      <figcaption id="orbit-caption"><strong>Text equivalent.</strong> The observed statistic is one exchangeable orbit position under the null. Counting all values at least as large, including ties, makes the rank super-uniform.</figcaption>
    </figure>
  );
}

function RateVisual() {
  return (
    <figure className={styles.rateVisual} aria-labelledby="rate-caption">
      <div aria-hidden="true">
        <span className={styles.rateAxisY}>separation</span>
        <span className={styles.rateAxisX}>complexity</span>
        <i className={styles.lowerRate} /><i className={styles.upperRate} />
        <b className={styles.lowerLabel}>mixture lower bound</b><b className={styles.upperLabel}>PWR upper rate</b>
      </div>
      <table>
        <caption id="rate-caption">Rate comparison, up to fixed constants</caption>
        <thead><tr><th>Source</th><th>Direction cost</th><th>Location cost</th><th>Result</th></tr></thead>
        <tbody>
          <tr><th>Lower bound</th><td>√(b/n)</td><td>√(log M/n)</td><td>max of the two</td></tr>
          <tr><th>PWR upper bound</th><td>√(b/n)</td><td>√(log M/n)</td><td>sum of the two</td></tr>
          <tr><th>Constant-factor match</th><td colSpan={2}>max(x,y) ≤ x+y ≤ 2 max(x,y)</td><td>same minimax rate</td></tr>
        </tbody>
      </table>
    </figure>
  );
}

function MultiscaleVisual() {
  return (
    <figure className={styles.multiscaleVisual} aria-labelledby="multiscale-caption">
      <div aria-hidden="true">
        {[0, 1, 2, 3, 4].map((scale) => (
          <div key={scale} style={{ "--scale": scale } as CSSProperties}>
            {Array.from({ length: Math.max(2, 8 - scale) }, (_, index) => <i key={index} />)}
          </div>
        ))}
        <span className={styles.trueInterval}>unknown interval I</span>
      </div>
      <figcaption id="multiscale-caption"><strong>Text equivalent.</strong> Shifted grids at geometric widths contain a block that covers every admissible interval while increasing width by less than 2(1 + ε). Scale weights add an explicit log-log adaptation cost.</figcaption>
    </figure>
  );
}

function Contents() {
  const readingOrder = [
    ...pwrTheorySections.slice(0, 12),
    pwrTheorySections.find((section) => section.id === "appendix")!,
    pwrTheorySections.find((section) => section.id === "algorithm")!,
    pwrTheorySections.find((section) => section.id === "validation")!,
  ];
  const list = (
    <ol>
      {readingOrder.map((section) => <li key={section.id}><a href={`#${section.id}`}><span>{section.number}</span>{section.shortTitle}</a></li>)}
    </ol>
  );
  return (
    <>
      <aside className={styles.desktopContents} id="contents"><nav aria-label="PWR-Scan contents"><h2>Contents</h2>{list}</nav></aside>
      <details className={styles.mobileContents}><summary>Contents · 15 sections</summary><nav aria-label="PWR-Scan mobile contents">{list}</nav></details>
    </>
  );
}

function IntroSection() {
  const section = pwrTheorySections[0];
  return (
    <SectionShell {...section}>
      <div className={styles.experimentGrid} aria-label="Statistical experiment summary">
        <p><strong>Inferential unit.</strong> The recording cluster, not an individual frame. Labels move only with the complete recording object inside pre-fixed strata or pairs.</p>
        <p><strong>Exact null.</strong> The full analysis object is invariant under the allowed transformation group; covariance equality alone is weaker.</p>
        <p><strong>Alternative.</strong> At least one pre-fixed frequency block has a positive leading pooled-whitened population contrast.</p>
        <p><strong>Decision.</strong> The registered scan returns one global rejection. Localization remains descriptive rather than a support-recovery guarantee.</p>
      </div>
      <ProofDependencyVisual />
      <Equation equation={{ id: "eq-experiment", label: "Experiment", tex: "H_0^E:\\ D\\overset d=gD\\ (\\forall g\\in\\mathcal G)\\qquad\\text{vs.}\\qquad H_1:\\max_{B\\in\\mathcal B}\\tau_B>0", alt: "the exchangeability null versus a positive pooled population root on at least one candidate block" }} />
      <div className={styles.boundaryCallout}><strong>Non-negotiable distinction</strong><p><InlineMath expression="H_0^{cov}:\\Sigma_0=\\Sigma_1" label="covariance equality null" /> does not imply the exchangeability null outside the stated common-law experiment. The exact p-value belongs to the latter.</p></div>
    </SectionShell>
  );
}

function AlgorithmSection() {
  const section = pwrTheorySections.find((item) => item.id === "algorithm")!;
  const rows = [
    ["Candidate family", "Construct before analysis", "Definition 4.4; Theorem 7.1", "runtime/src/pwrscan/candidates.py"],
    ["Preprocessing", "Apply the identical complete function to every assignment", "Theorem 5.5", "runtime/src/pwrscan/features.py"],
    ["Local root", "Symmetric pooled whitening; largest eigenvalue", "Definition 4.1; Proposition 4.2", "runtime/src/pwrscan/statistics.py"],
    ["Global scan", "Maximize T_B/a_B once", "Definition 4.5", "runtime/src/pwrscan/statistics.py"],
    ["Randomization", "Move whole clusters within allowed strata", "Assumptions 3.1 and 5.1", "runtime/src/pwrscan/randomization.py"],
    ["Monte Carlo", "Retain +1 correction and registered R", "Definition 5.7; Theorem 5.8", "runtime/src/pwrscan/randomization.py"],
    ["Audit", "Record candidate hash, orbit seed, statistic and p-value", "Evidence boundary", "runtime/src/pwrscan/audit.py"],
  ];
  return (
    <SectionShell {...section} eyebrow="Empirical appendix">
      <div className={styles.flowRail} aria-label="PWR executable analysis flow">
        {['Cluster features', 'Pre-fixed blocks', 'Pooled roots', 'Normalized max', 'Orbit rank', 'Audit record'].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><b>{item}</b></div>)}
      </div>
      <div className={styles.tableWrap}><table><caption>Proof requirement to executable invariant</caption><thead><tr><th>Surface</th><th>Invariant</th><th>Theory source</th><th>Implementation mapping</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th key={cell}>{cell}</th> : <td key={cell}>{index === 3 ? <code>{cell}</code> : cell}</td>)}</tr>)}</tbody></table></div>
      <div className={styles.boundaryCallout}><strong>Numerical boundary</strong><p>A data-selected ridge, block family, centering rule or quality filter becomes part of the statistic. It must be frozen or re-executed inside every orbit element; otherwise Theorem 5.5 does not describe the implementation.</p></div>
    </SectionShell>
  );
}

function ValidationSection() {
  const section = pwrTheorySections.find((item) => item.id === "validation")!;
  const verification = pwrTheoryEvidence.verification;
  return (
    <SectionShell {...section} eyebrow="Empirical appendix">
      <div className={styles.evidenceHero}>
        <div><span>Engineering closeout</span><strong>{verification.engineeringCloseout}</strong><p>{verification.engineeringRuns} runs · {verification.computationalTests} computational tests</p></div>
        <div><span>Publication-scale validation</span><strong>{verification.publicationScaleValidation}</strong><p>V1 locked level + V2–V5 power, rate, mismatch and adaptation</p></div>
        <div><span>Repository evidence</span><strong>{pwrTheoryEvidence.provenance.targetRelease}</strong><p>commit {pwrTheoryEvidence.provenance.releaseCommit.slice(0, 12)} · evidence {pwrTheoryEvidence.provenance.integrationEvidenceFingerprint.slice(0, 12)}…</p></div>
        <div data-negative="true"><span>External DCASE check</span><strong>Negative evidence</strong><p>{`ROC AUC ${verification.dcase.rocAuc} · sensitivity ${verification.dcase.sensitivity}`}</p></div>
      </div>
      <div className={styles.tableWrap}><table><caption>Proof–code-path–study status matrix</caption><thead><tr><th>Evidence grade</th><th>Status</th><th>What it supports</th><th>What it does not support</th></tr></thead><tbody>
        <tr><th>Mathematical proof</th><td>Complete under displayed assumptions</td><td>Finite-sample validity, Gaussian power and rate statements in the manuscript</td><td>Unstated data regimes or empirical performance</td></tr>
        <tr><th>Code-path mapping</th><td>Mapped, partial, or not applicable per formal object</td><td>Named runtime and independent-oracle computation paths</td><td>Empirical satisfaction of a theorem&apos;s assumptions or real-data performance</td></tr>
        <tr><th>Engineering closeout</th><td>Complete</td><td>{verification.engineeringRuns} execution rows and {verification.computationalTests} computational tests</td><td>Power replicates or publication precision</td></tr>
        <tr><th>Locked result</th><td>Pending</td><td>Registered V1–V5 questions and frozen boundaries</td><td>A completed level, power, rate, mismatch or adaptation campaign</td></tr>
        <tr><th>External data</th><td>Negative · validity not established</td><td>Transparent DCASE failure evidence</td><td>Real-audio discrimination or deployment readiness</td></tr>
      </tbody></table></div>
      <div className={styles.tableWrap}><table><caption>Registered validation campaigns</caption><thead><tr><th>Track</th><th>Question</th><th>Status</th></tr></thead><tbody>{verification.campaigns.map((campaign) => <tr key={campaign.id}><th>{campaign.id}</th><td>{campaign.label}</td><td><span className={styles.statusPending}>{campaign.status}</span></td></tr>)}</tbody></table></div>
      <div className={styles.claimBoundary}><h3>Claims ledger</h3><ol>{pwrTheoryEvidence.claimsBoundary.map((claim) => <li key={claim}>{claim}</li>)}</ol></div>
      <p className={styles.negativeNote}>{verification.dcase.interpretation}</p>
    </SectionShell>
  );
}

function AppendixSection() {
  const section = pwrTheorySections.find((item) => item.id === "appendix")!;
  return (
    <SectionShell {...section}>
      <ol className={styles.appendixIndex}>
        {pwrTheoryEvidence.appendixSections.map((item) => (
          <li id={item.id} key={item.id}>
            <p><a href={`#${item.id}`}>{item.label}.</a> <strong>{item.title}.</strong> {item.coreSteps.join(" ")}</p>
            {item.dependencies.length > 0 && <small>Linked objects: <ReferenceLine items={item.dependencies} /></small>}
          </li>
        ))}
      </ol>
      <ProofCards sectionId="appendix" />
      <div className={styles.foundationNote}>
        <h3>Appendix A · foundational toolkit</h3>
        <ol>{pwrTheoryEvidence.foundations.map((item) => <li id={item.id} key={item.id}><a href={`#${item.id}`}>{item.label}.</a> <strong>{item.title}.</strong> {item.role}</li>)}</ol>
      </div>
    </SectionShell>
  );
}

export function PwrTheoryPage({ study }: { study: CaseStudy }) {
  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link href="/" className={styles.wordmark}>MYC / 26</Link>
        <nav aria-label="PWR-Scan page navigation"><a href="#contents">Contents</a><a href="#exact-validity">Exactness</a><a href="#rate-optimality">Minimax</a><a href="#validation">Evidence</a></nav>
        <Link href="/#projects">Close ×</Link>
      </header>

      <article>
        <header className={styles.hero}>
          <div className={styles.heroMeta}><span>Project / {study.number}</span><span>Proof-led statistical system</span><span>No deployed detector claim</span></div>
          <div className={styles.heroGrid}>
            <div>
              <p>Pooled-whitened randomization scan</p>
              <h1>PWR<br />SCAN</h1>
              <p className={styles.heroSummary}>Finite-sample randomization, Gaussian permutation power and a matching minimax rate — joined as one explicit proof chain.</p>
            </div>
            <div className={styles.heroProof} aria-hidden="true">
              <div className={styles.heroMatrix}>{Array.from({ length: 49 }, (_, index) => <i key={index} data-hot={Math.abs(Math.floor(index / 7) - (index % 7)) < 2} />)}</div>
              <div className={styles.heroWindow}>B*</div>
              <div className={styles.heroRoot}><span>λmax</span><b>τ − η</b></div>
              <div className={styles.heroOrbit}>{Array.from({ length: 8 }, (_, index) => <i key={index} data-observed={index === 6} />)}</div>
            </div>
          </div>
          <dl className={styles.heroFacts}>
            <div><dt>Formal objects</dt><dd>{pwrTheorySummary.proofObjectCount}</dd></div>
            <div><dt>Guarantee classes</dt><dd>{pwrTheorySummary.guaranteeCount}</dd></div>
            <div><dt>Appendix B sections</dt><dd>{pwrTheorySummary.appendixSectionCount}</dd></div>
            <div><dt>Evidence SHA-256</dt><dd>{pwrTheorySummary.fingerprintShort}…</dd></div>
          </dl>
        </header>

        <div className={styles.bodyGrid}>
          <Contents />
          <div className={styles.monograph}>
            <IntroSection />
            {pwrTheorySections.slice(1, 12).map((section) => (
              <SectionShell key={section.id} {...section}>
                {section.id === "acoustic-bridge" && <SignalBridgeVisual />}
                {section.id === "statistic" && <WhiteningVisual />}
                {section.id === "exact-validity" && <OrbitVisual />}
                {section.id === "rate-optimality" && <RateVisual />}
                {section.id === "multiscale" && <MultiscaleVisual />}
                <ProofCards sectionId={section.id} />
              </SectionShell>
            ))}
            <AppendixSection />
            <section className={styles.empiricalPart} aria-labelledby="empirical-part-title">
              <header><span>Empirical appendix</span><h2 id="empirical-part-title">Implementation and evidence</h2><p>The mathematical argument ends above. What follows reports executable correspondence, computational checks, pending studies and the negative external result without treating them as proof.</p></header>
              <AlgorithmSection />
              <ValidationSection />
            </section>
          </div>
        </div>
      </article>

      <footer className={styles.footer}>
        <div><span>Public source</span><a href={pwrTheoryEvidence.provenance.repository} target="_blank" rel="noreferrer">Open consolidated PWR-Scan repository ↗</a></div>
        <div><span>Manuscript boundary</span><strong>117-page source reviewed · PDF not published</strong></div>
        <Link href="/#projects">Back to projects ↑</Link>
      </footer>
    </main>
  );
}
