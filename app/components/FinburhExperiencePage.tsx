import Link from "next/link";
import type { CaseStudy } from "@/app/content";
import { FinburhDependencyLattice } from "@/app/components/WorkExperienceGraphic";
import { finburhExperience } from "@/app/data/work-experience";
import styles from "@/app/components/WorkExperiencePage.module.css";

function EvidenceTable({ caption, rows }: { caption: string; rows: ReadonlyArray<{ label: string; detail: string; purpose: string }> }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption>{caption}</caption>
        <thead><tr><th>Layer</th><th>Public description</th><th>Responsibility</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.detail}</td><td>{row.purpose}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function ArtifactGeometry({ type }: { type: "word" | "slides" | "sheet" }) {
  return <div className={`${styles.artifactGeometry} ${styles[type]}`} aria-hidden="true"><i /><i /><i /><i /></div>;
}

export function FinburhExperiencePage({ study }: { study: CaseStudy }) {
  return (
    <main className={`${styles.page} ${styles.finburh}`}>
      <header className={`site-header ${styles.nav}`}>
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label="FINBURH experience navigation">
          <a href="#orchestration">Agents</a><a href="#assumptions">Evidence</a><a href="#outputs">Outputs</a>
        </nav>
        <Link className="header-link" href="/#experience">Close ×</Link>
      </header>

      <article>
        <header className={styles.hero}>
          <div className={styles.kicker}><span>Experience / {study.number}</span><span>{study.period}</span></div>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.status}>{finburhExperience.status}</span>
              <p className={styles.eyebrow}>{study.eyebrow}</p>
              <h1>Financial<br />Document<br />Automation</h1>
              <strong>{study.organization}</strong>
              <p>{study.summary}</p>
            </div>
            <figure className={styles.heroFigure} aria-labelledby="finburh-lattice-caption">
              <FinburhDependencyLattice variant="hero" />
              <figcaption id="finburh-lattice-caption">A conceptual dependency lattice: one request becomes a task DAG, evidence and assumptions enter the graph, and three editable artifact families form at the boundary.</figcaption>
            </figure>
          </div>
          <div className={styles.factDock}>
            <div><span>Role</span><b>Co-Founder & CEO</b></div>
            <div><span>Domain</span><b>IB · PE workflows</b></div>
            <div><span>Evidence</span><b>DART · KRX · Web</b></div>
            <div><span>Outputs</span><b>Word · PowerPoint · Excel</b></div>
          </div>
        </header>

        <div className={styles.contentSheet}>
          <section className={styles.section} id="orchestration" aria-labelledby="orchestration-title">
            <div className={styles.sectionLabel}>01 / Orchestration</div>
            <div className={styles.sectionBody}>
              <span className={styles.reconstruction}>Public architecture reconstruction</span>
              <h2 id="orchestration-title">A conversation becomes a checked execution graph.</h2>
              <div className={styles.splitFeature}>
                <figure className={`${styles.featureFigure} ${styles.latticeFigure}`} aria-labelledby="dag-caption">
                  <FinburhDependencyLattice variant="hero" />
                  <figcaption id="dag-caption">The center pulse fans into Work-sized jobs. Evidence enters from the left; a failed node reverses and rejoins another route before outputs form.</figcaption>
                </figure>
                <div className={styles.workflowStatement}>
                  <span>Execution contract</span>
                  <p>User intent is converted into a DAG whose Work nodes carry explicit success criteria. The orchestrator accepts completed work or reassigns a failed job without discarding the rest of the graph.</p>
                  <div className={styles.dagRail}><i>Conversation</i><i>Task DAG</i><i>Work</i><i>Check</i><i>Reassign</i></div>
                </div>
              </div>
              <EvidenceTable caption="Public agent responsibilities" rows={finburhExperience.agents} />
            </div>
          </section>

          <section className={styles.section} id="assumptions" aria-labelledby="assumptions-title">
            <div className={styles.sectionLabel}>02 / Evidence & assumptions</div>
            <div className={styles.sectionBody}>
              <span className={styles.reconstruction}>Structure only · no customer model or values</span>
              <h2 id="assumptions-title">Evidence stays traceable. Forecast logic stays editable.</h2>
              <div className={styles.assumptionFeature}>
                <div className={styles.assumptionTree} aria-hidden="true">
                  <div className={styles.driverColumn}><i>Revenue</i><i>COGS</i><i>Rate</i><i>Inflation</i></div>
                  <div className={styles.operatorColumn}><i>+</i><i>×</i><i>+</i></div>
                  <div className={styles.periodColumn}><i>Month</i><i>Year</i></div>
                  <div className={styles.forecastNode}>Forecast</div>
                </div>
                <div className={styles.formula}>
                  <span>Public assumption abstraction</span>
                  <math aria-label="X at t plus one equals X at t times the product of one plus growth drivers plus the sum of additive drivers"><mrow><msub><mi>X</mi><mrow><mi>t</mi><mo>+</mo><mn>1</mn></mrow></msub><mo>=</mo><msub><mi>X</mi><mi>t</mi></msub><mo>×</mo><munder><mo>∏</mo><mi>k</mi></munder><mfenced><mrow><mn>1</mn><mo>+</mo><msub><mi>g</mi><mrow><mi>k</mi><mo>,</mo><mi>t</mi></mrow></msub></mrow></mfenced><mo>+</mo><munder><mo>∑</mo><mi>l</mi></munder><msub><mi>a</mi><mrow><mi>l</mi><mo>,</mo><mi>t</mi></mrow></msub></mrow></math>
                  <p>Accounting drivers and external forecasts compose through additive and multiplicative branches over monthly or annual horizons.</p>
                </div>
              </div>
              <div className={styles.tablePair}>
                <EvidenceTable caption="Evidence planes" rows={finburhExperience.evidenceRows} />
                <EvidenceTable caption="Assumption-tree contract" rows={finburhExperience.assumptionRows} />
              </div>
            </div>
          </section>

          <section className={styles.section} id="outputs" aria-labelledby="outputs-title">
            <div className={styles.sectionLabel}>03 / Editable outputs</div>
            <div className={styles.sectionBody}>
              <span className={styles.reconstruction}>Abstract artifact paths · no templates or customer content</span>
              <h2 id="outputs-title">One evidence layer. Three generation paths.</h2>
              <div className={styles.outputGrid}>
                {finburhExperience.outputs.map((output, index) => (
                  <article key={output.label}>
                    <ArtifactGeometry type={index === 0 ? "word" : index === 1 ? "slides" : "sheet"} />
                    <span>0{index + 1}</span><h3>{output.label}</h3><p>{output.detail}</p><b>{output.purpose}</b>
                  </article>
                ))}
              </div>
              <div className={styles.metricGrid}>
                {finburhExperience.metrics.map((metric) => <div key={metric.label}><b>{metric.value}</b><span>{metric.label}</span><p>{metric.note}</p></div>)}
              </div>
              <EvidenceTable caption="Workflow validation structure" rows={finburhExperience.validationRows} />
              <aside className={styles.boundary}><span>Evidence boundary</span><p>{finburhExperience.boundary}</p></aside>
            </div>
          </section>

          <footer className={styles.footer}><div><span>Source status</span><strong>Private product artifact</strong></div><Link href="/#experience">Back to experience ↑</Link></footer>
        </div>
      </article>
    </main>
  );
}
