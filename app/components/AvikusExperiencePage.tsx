import Link from "next/link";
import type { CSSProperties } from "react";
import type { CaseStudy } from "@/app/content";
import { AvikusProjectiveField } from "@/app/components/WorkExperienceGraphic";
import { avikusExperience } from "@/app/data/work-experience";
import styles from "@/app/components/WorkExperiencePage.module.css";

const signalSamples = [42, 48, 55, 51, 61, 58, 0, 0, 64, 93, 59, 54, 49, 66, 61, 0, 57, 53, 60, 56, 50, 63, 58, 54];
const missingSamples = new Set([6, 7, 15]);
const outlierSamples = new Set([9]);

function EvidenceTable({ caption, rows }: { caption: string; rows: ReadonlyArray<{ label: string; detail: string; purpose: string }> }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption>{caption}</caption>
        <thead><tr><th>Element</th><th>Public description</th><th>Purpose</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.detail}</td><td>{row.purpose}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function AvikusExperiencePage({ study }: { study: CaseStudy }) {
  return (
    <main className={`${styles.page} ${styles.avikus}`}>
      <header className={`site-header ${styles.nav}`}>
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label="Avikus experience navigation">
          <a href="#scenario">Signals</a><a href="#alignment">Alignment</a><a href="#evidence">Evidence</a>
        </nav>
        <Link className="header-link" href="/#experience">Close ×</Link>
      </header>

      <article>
        <header className={styles.hero}>
          <div className={styles.kicker}><span>Experience / {study.number}</span><span>{study.period}</span></div>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.status}>{avikusExperience.status}</span>
              <p className={styles.eyebrow}>{study.eyebrow}</p>
              <h1>Simulation<br />& Perception</h1>
              <strong>{study.organization}</strong>
              <p>{study.summary}</p>
            </div>
            <figure className={styles.heroFigure} aria-labelledby="avikus-field-caption">
              <AvikusProjectiveField variant="hero" />
              <figcaption id="avikus-field-caption">Fourteen planar fragments begin near their target path, then lock in sequence to form one loose spiral mosaic.</figcaption>
            </figure>
          </div>
          <div className={styles.factDock}>
            <div><span>Role</span><b>Research Intern</b></div>
            <div><span>Domain</span><b>Autonomous navigation</b></div>
            <div><span>Signal</span><b>NMEA 0183</b></div>
            <div><span>Validated replay</span><b>350× stable</b></div>
          </div>
        </header>

        <div className={styles.contentSheet}>
          <section className={styles.section} id="scenario" aria-labelledby="scenario-title">
            <div className={styles.sectionLabel}>01 / Scenario stream</div>
            <div className={styles.sectionBody}>
              <span className={styles.reconstruction}>Conceptual reconstruction · normalized display only</span>
              <h2 id="scenario-title">Controlled uncertainty, not a clean trajectory.</h2>
              <p className={styles.lede}>The simulator linked own-ship and target-ship conditions to a synthetic NMEA 0183 stream, then introduced explicit observation failures so the same maritime interaction could be replayed under controlled uncertainty.</p>
              <figure className={styles.signalFigure} aria-labelledby="signal-caption">
                <div className={styles.signalPlot} aria-hidden="true">
                  <div className={styles.signalBaseline} />
                  {signalSamples.map((value, index) => (
                    <i
                      data-missing={missingSamples.has(index) || undefined}
                      data-outlier={outlierSamples.has(index) || undefined}
                      key={index}
                      style={{ "--sample": `${value}%`, "--index": index } as CSSProperties}
                    />
                  ))}
                </div>
                <figcaption id="signal-caption"><b>NMEA 0183 observation ribbon.</b> Gaps, an outlier and low-amplitude noise are illustrative; they are not employer samples or physical units.</figcaption>
              </figure>
              <div className={styles.tablePair}>
                <EvidenceTable caption="Public scenario-state model" rows={avikusExperience.scenarioRows} />
                <EvidenceTable caption="Synthetic observation conditions" rows={avikusExperience.degradations} />
              </div>
            </div>
          </section>

          <section className={styles.section} id="alignment" aria-labelledby="alignment-title">
            <div className={styles.sectionLabel}>02 / Alignment path</div>
            <div className={styles.sectionBody}>
              <span className={styles.reconstruction}>Architecture reconstruction · no internal imagery</span>
              <h2 id="alignment-title">Fourteen fragments. One projective sequence. One continuous field.</h2>
              <div className={styles.splitFeature}>
                <figure className={styles.featureFigure} aria-labelledby="alignment-caption">
                  <AvikusProjectiveField variant="hero" />
                  <figcaption id="alignment-caption">The coral activation follows the curve as each nearby fragment settles into the shared spiral, turning a loose arrangement into one continuous geometric field.</figcaption>
                </figure>
                <div>
                  <div className={styles.formula}>
                    <span>Projective relation</span>
                    <math aria-label="projected x prime is proportional to homography H times x"><mrow><msup><mi>x</mi><mo>′</mo></msup><mo>∝</mo><mi>H</mi><mi>x</mi></mrow></math>
                    <p>Overlapping camera views are mapped into a shared projective frame before blending.</p>
                  </div>
                  <div className={styles.pipeline} aria-label={`Processing flow: ${avikusExperience.pipeline.join(", then ")}`}>
                    {avikusExperience.pipeline.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b></div>)}
                  </div>
                </div>
              </div>
              <EvidenceTable caption="Separated execution lanes" rows={avikusExperience.executionRows} />
            </div>
          </section>

          <section className={styles.section} id="evidence" aria-labelledby="avikus-evidence-title">
            <div className={styles.sectionLabel}>03 / Evidence</div>
            <div className={styles.sectionBody}>
              <h2 id="avikus-evidence-title">A public result with a hard disclosure boundary.</h2>
              <div className={styles.metricFeature}>
                <div><b>{avikusExperience.metric.value}</b><span>{avikusExperience.metric.label}</span></div>
                <p>{avikusExperience.metric.note}</p>
              </div>
              <EvidenceTable caption="Validation structure" rows={avikusExperience.validationRows} />
              <aside className={styles.boundary}><span>Evidence boundary</span><p>{avikusExperience.boundary}</p></aside>
            </div>
          </section>

          <footer className={styles.footer}><div><span>Source status</span><strong>Private employer artifact</strong></div><Link href="/#experience">Back to experience ↑</Link></footer>
        </div>
      </article>
    </main>
  );
}
