import Link from "next/link";
import type { CaseStudy } from "@/app/content";
import { FinburhDependencyLattice } from "@/app/components/WorkExperienceGraphic";
import { finburhExperience } from "@/app/data/work-experience";
import styles from "@/app/components/WorkExperiencePage.module.css";

function TechnologyStrip({ items }: { items: readonly string[] }) {
  return (
    <aside className={styles.technologyStrip} aria-label="Technology stack">
      <span>Technology stack</span>
      <div>{items.map((item) => <b key={item}>{item}</b>)}</div>
    </aside>
  );
}

export function FinburhExperiencePage({ study }: { study: CaseStudy }) {
  return (
    <main className={`${styles.page} ${styles.finburh}`}>
      <header className={`site-header ${styles.nav}`}>
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label="FINBURH experience navigation">
          <a href="#orchestration">Agents</a><a href="#assumptions">Assumptions</a><a href="#retrieval">Retrieval</a><a href="#outputs">Outputs</a>
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
              <h1>{study.title}</h1>
              <strong>{study.organization} · {study.role}</strong>
              <p>{study.summary}</p>
            </div>
            <figure className={styles.heroFigure} aria-labelledby="finburh-lattice-caption">
              <FinburhDependencyLattice variant="hero" />
              <figcaption id="finburh-lattice-caption">Conversation, Task, Work, and Research form the execution graph; a separate LLM orchestrator checks and redistributes assignments.</figcaption>
            </figure>
          </div>
          <div className={styles.factDock}>
            <div><span>Role</span><b>Co-Founder & CEO</b></div>
            <div><span>Agents</span><b>Four execution · one orchestrator</b></div>
            <div><span>Data tools</span><b>DART · KRX · Web MCP</b></div>
            <div><span>Context</span><b>~30% of initial tokens</b></div>
          </div>
        </header>

        <div className={styles.contentSheet}>
          <section className={styles.section} id="orchestration" aria-labelledby="orchestration-title">
            <div className={styles.sectionLabel}>01 / Multi-agent orchestration</div>
            <div className={styles.sectionBody}>
              <h2 id="orchestration-title">Built four execution agents and a separate LLM orchestrator.</h2>
              <div className={styles.splitFeature}>
                <figure className={`${styles.featureFigure} ${styles.latticeFigure}`} aria-labelledby="dag-caption">
                  <FinburhDependencyLattice variant="hero" />
                  <figcaption id="dag-caption">The four-node geometry represents Conversation, Task, Work, and Research. Assumption is not an agent.</figcaption>
                </figure>
                <div className={styles.agentList}>{finburhExperience.agents.map((agent) => <div key={agent.label}><b>{agent.label}</b><span>{agent.detail}</span></div>)}</div>
              </div>
              <div className={styles.orchestratorCallout}><span>Separate LLM orchestrator</span><p>{finburhExperience.orchestrator}</p></div>
              <div className={styles.mcpGrid} aria-label="DART, KRX, and Web MCP connections to Work and Research">
                {finburhExperience.mcpSources.map((source) => <div key={source}><b>{source}</b><span>→</span><i>Work</i><i>Research</i></div>)}
              </div>
            </div>
          </section>

          <section className={styles.section} id="assumptions" aria-labelledby="assumptions-title">
            <div className={styles.sectionLabel}>02 / Assumption-driven forecasting</div>
            <div className={styles.sectionBody}>
              <h2 id="assumptions-title">Generated forecast values from editable assumption-driver trees.</h2>
              <p className={styles.lede}>Assumption was not an agent. It was a driver system that populated future financial values from operating inputs, market conditions, and scenario paths, while keeping each forecast dependency editable.</p>
              <div className={styles.assumptionTree} aria-label="Operating, market, and scenario drivers combine through an assumption tree into forecast values">
                <div className={styles.driverColumn}>{finburhExperience.assumptionDrivers.map((driver) => <i key={driver}>{driver}</i>)}</div>
                <span className={styles.treeArrow}>→</span>
                <div className={styles.assumptionNode}>Assumption tree</div>
                <span className={styles.treeArrow}>→</span>
                <div className={styles.forecastNode}>Forecast values</div>
              </div>
              <TechnologyStrip items={finburhExperience.stack} />
            </div>
          </section>

          <section className={styles.section} id="retrieval" aria-labelledby="retrieval-title">
            <div className={styles.sectionLabel}>03 / Context-efficient retrieval</div>
            <div className={styles.sectionBody}>
              <h2 id="retrieval-title">Retrieved only task-relevant evidence and reduced prompt tokens to about 30%.</h2>
              <p className={styles.lede}>DART disclosures, KRX market data, and web material were partitioned and embedded by company, period, and material type. The system retrieved only the evidence required by the active job and injected that subset into agent context.</p>
              <div className={styles.retrievalFeature}>
                <div className={styles.flowDiagram} aria-label="Sources, partitioned embeddings, task-specific retrieval, and agent context flow">
                  {finburhExperience.retrievalFlow.map((item, index) => <div key={item}><span>0{index + 1}</span><b>{item}</b></div>)}
                </div>
                <div className={styles.contextMetric}><b>{finburhExperience.contextMetric.value}</b><span>{finburhExperience.contextMetric.label}</span><p>{finburhExperience.contextMetric.note}</p></div>
              </div>
            </div>
          </section>

          <section className={styles.section} id="outputs" aria-labelledby="outputs-title">
            <div className={styles.sectionLabel}>04 / Role-period outputs</div>
            <div className={styles.sectionBody}>
              <h2 id="outputs-title">Generated editable Word, PowerPoint, and Excel outputs.</h2>
              <div className={styles.metricStrip}>{finburhExperience.outputMetrics.map((metric) => <div key={metric.label}><b>{metric.value}</b><span>{metric.label}</span><p>{metric.note}</p></div>)}</div>
            </div>
          </section>

          <footer className={styles.footer}>
            <div><span>Source status</span><strong>Private product artifact</strong><p>{finburhExperience.boundary}</p></div>
            <Link href="/#experience">Back to experience ↑</Link>
          </footer>
        </div>
      </article>
    </main>
  );
}
