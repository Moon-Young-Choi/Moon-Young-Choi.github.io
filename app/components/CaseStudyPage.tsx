import Link from "next/link";
import type { CaseStudy } from "@/app/content";
import { EvidenceDiagram } from "@/app/components/EvidenceDiagram";
import { MathBlock } from "@/app/components/MathBlock";
import { ProjectShape } from "@/app/components/ProjectShape";

export function CaseStudyPage({ study }: { study: CaseStudy }) {
  const indexHref = study.kind === "work" ? "/#experience" : "/#projects";

  return (
    <main className={`case-page case-${study.accent}`}>
      <header className="site-header case-nav">
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label="Case study navigation">
          <Link href={indexHref}>Index</Link>
          <a href="#method">Method</a>
          <a href="#stack">Stack</a>
          <a href="#validation">Validation</a>
        </nav>
        <Link className="header-link" href={indexHref}>Close ×</Link>
      </header>

      <article>
        <header className="case-hero">
          <div className="case-kicker mono">
            <span>{study.kind === "work" ? "Experience" : "Project"} / {study.number}</span>
            <span>{study.period ?? "Research system"}</span>
          </div>
          <div className="case-title-grid">
            <div>
              <p className="case-eyebrow mono">{study.eyebrow}</p>
              <h1>{study.title}</h1>
              {study.organization && <strong className="case-organization">{study.organization}</strong>}
              <p className="case-summary">{study.summary}</p>
            </div>
            <div className="case-shape-wrap"><ProjectShape type={study.shape} /></div>
          </div>
          <div className="case-facts">
            {study.facts.map(([label, value]) => (
              <div key={label}><span className="mono">{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </header>

        <div className="case-sheet">
          <section className="case-section case-system" aria-labelledby="system-title">
            <div className="case-section-label mono">01 / System</div>
            <div className="case-section-content">
              <h2 id="system-title">System map</h2>
              <EvidenceDiagram type={study.shape} flow={study.flow} />
            </div>
          </section>

          <section className="case-section" id="method" aria-labelledby="method-title">
            <div className="case-section-label mono">02 / Method</div>
            <div className="case-section-content">
              <h2 id="method-title">Model & decisions</h2>
              <div className="formula-grid">
                {study.formulas.map((formula) => (
                  <div className="formula-card" key={formula.label}>
                    <span className="mono">{formula.label}</span>
                    <MathBlock expression={formula.expression} />
                    <p>{formula.note}</p>
                  </div>
                ))}
              </div>
              <div className="method-grid">
                {study.sections.map((section) => (
                  <div key={section.title}>
                    <h3>{section.title}</h3>
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="case-section" id="stack" aria-labelledby="stack-title">
            <div className="case-section-label mono">03 / Technology stack</div>
            <div className="case-section-content">
              <h2 id="stack-title">Technology stack</h2>
              <div className="stack-grid">
                {study.stack.map((group) => (
                  <div className="stack-group" key={group.group}>
                    <h3 className="mono">{group.group}</h3>
                    <div className="stack-items">
                      {group.items.map((item) => <span key={item}>{item}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="case-section" id="validation" aria-labelledby="validation-title">
            <div className="case-section-label mono">04 / Validation</div>
            <div className="case-section-content">
              <h2 id="validation-title">Checks & boundary</h2>
              <ol className="validation-list">
                {study.validation.map((item, index) => (
                  <li key={item}><span className="mono">{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>
                ))}
              </ol>
              <div className="boundary-note">
                <span className="mono">Evidence boundary</span>
                <p>{study.boundary}</p>
              </div>
            </div>
          </section>

          <footer className="case-footer">
            <div>
              <span className="mono">{study.github ? "Public source" : "Source status"}</span>
              {study.github ? (
                <a href={study.github} target="_blank" rel="noreferrer">Open GitHub repository ↗</a>
              ) : (
                <strong>Private research artifact</strong>
              )}
            </div>
            <Link href={indexHref}>Back to {study.kind === "work" ? "experience" : "projects"} ↑</Link>
          </footer>
        </div>
      </article>
    </main>
  );
}
