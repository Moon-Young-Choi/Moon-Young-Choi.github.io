import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import katex from "katex";
import type { CaseStudy } from "@/app/content";
import { PwrEmpiricalConsole } from "@/app/components/PwrEmpiricalConsole";
import { PwrStudyTabs } from "@/app/components/PwrStudyTabs";
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

function TheoryContents() {
  const readingOrder = [
    ...pwrTheorySections.slice(0, 12),
    pwrTheorySections.find((section) => section.id === "appendix")!,
  ];
  const list = (
    <ol>
      {readingOrder.map((section) => <li key={section.id}><a href={`#${section.id}`}><span>{section.number}</span>{section.shortTitle}</a></li>)}
    </ol>
  );
  return (
    <>
      <aside className={styles.desktopContents} id="theory-contents"><nav aria-label="PWR-Scan theory contents"><h2>Theory contents</h2>{list}</nav></aside>
      <details className={styles.mobileContents}><summary>Theory contents · 13 sections</summary><nav aria-label="PWR-Scan theory mobile contents">{list}</nav></details>
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
  const theory = (
    <article className={styles.theoryView}>
      <header className={styles.hero}>
        <div className={styles.heroMeta}><span>Project / {study.number}</span><span>Proof-led statistical system</span><span>Results conditional on displayed assumptions</span></div>
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
        <TheoryContents />
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
        </div>
      </div>
    </article>
  );
  const verification = pwrTheoryEvidence.verification;
  const empirical = <PwrEmpiricalConsole evidence={{
    release: pwrTheoryEvidence.provenance.targetRelease,
    commit: pwrTheoryEvidence.provenance.releaseCommit,
    fingerprint: pwrTheoryEvidence.provenance.integrationEvidenceFingerprint,
    engineeringRuns: verification.engineeringRuns,
    computationalTests: verification.computationalTests,
    campaigns: verification.campaigns,
    dcase: verification.dcase,
  }} />;

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link href="/" className={styles.wordmark}>MYC / 26</Link>
        <span className={styles.navContext}>PWR-Scan · proof and study console</span>
        <Link href="/#projects">Close ×</Link>
      </header>
      <PwrStudyTabs theory={theory} empirical={empirical} />

      <footer className={styles.footer}>
        <div><span>Public source</span><a href={pwrTheoryEvidence.provenance.repository} target="_blank" rel="noreferrer">Open consolidated PWR-Scan repository ↗</a></div>
        <div><span>Manuscript boundary</span><strong>117-page source reviewed · PDF not published</strong></div>
        <Link href="/#projects">Back to projects ↑</Link>
      </footer>
    </main>
  );
}
