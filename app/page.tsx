import Link from "next/link";
import { ProjectCardVisual } from "@/app/components/ProjectCardVisual";
import { WorkCardVisual } from "@/app/components/WorkCardVisual";
import { education, projectStudies, workStudies } from "@/app/content";

export default function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <main id="top">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Back to top">MYC / 26</a>
        <nav aria-label="Primary navigation">
          <a href="#education">Education</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
        </nav>
        <a className="header-link email-link" href="mailto:mnyngch8@gmail.com">email</a>
      </header>

      <section className="identity" id="education" aria-labelledby="identity-title">
        <div className="identity-meta mono">
          <span>Portfolio / 2026</span>
          <span>Seoul, South Korea</span>
        </div>

        <div className="identity-grid">
          <div className="identity-name">
            <h1 id="identity-title"><span>Moonyoung</span><span>Choi</span></h1>
            <div className="identity-links mono">
              <a className="email-link" href="mailto:mnyngch8@gmail.com">mnyngch8@gmail.com</a>
              <a href="https://github.com/Moon-Young-Choi" target="_blank" rel="noreferrer">GitHub ↗</a>
            </div>
          </div>

          <div className="education-index">
            <div className="education-label mono">Education / 02</div>
            {education.map((item, index) => (
              <article className="education-row" key={item.institution}>
                <span className="mono">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2>{item.institution}</h2>
                  <p>{item.degree}</p>
                  <small className="education-location">{item.location}</small>
                  {item.detail && <small className="education-detail">{item.detail}</small>}
                </div>
                <time className="mono">{item.period}</time>
              </article>
            ))}
          </div>
        </div>

        <div className="identity-geometry" aria-hidden="true">
          <div className="identity-orbit"><span /><span /><span /></div>
          <div className="identity-axis"><span /><span /><span /><span /><span /></div>
          <div className="identity-block" />
        </div>
      </section>

      <section className="experience" id="experience">
        <div className="section-head">
          <span className="mono">01 / Experience</span>
          <h2>Work experience</h2>
          <span className="mono section-count">02 roles</span>
        </div>

        <div className="experience-grid">
          {workStudies.map((study) => (
            <Link className={`project-card ${study.accent}`} href={`/experience/${study.slug}/`} key={study.slug}>
              <div className="card-top mono">
                <span>{study.number}</span>
                <span>Case study <i aria-hidden="true">↗</i></span>
              </div>
              <div className="experience-card-body">
                <div className="card-copy">
                  <span className="card-org mono">
                    <span>{study.organization} · {study.role}</span>
                    <time>{study.period}</time>
                  </span>
                  <h3>{study.title}</h3>
                  <p>{study.summary}</p>
                  <div className="tags">{study.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
                <WorkCardVisual type={study.shape} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="repositories" id="projects">
        <div className="section-head">
          <span className="mono">02 / Projects</span>
          <h2>Research and tech experience</h2>
          <span className="mono section-count">06 projects</span>
        </div>

        <div className="project-grid">
          {projectStudies.map((study) => (
            <Link className={`project-card ${study.accent}`} href={`/projects/${study.slug}/`} key={study.slug}>
              <div className="card-top mono">
                <span>{study.number}</span>
                <span>{study.github ? "Study + source" : "Case study"} <i aria-hidden="true">↗</i></span>
              </div>
              <ProjectCardVisual study={study} />
              <div className="card-copy">
                <h3>{study.title}</h3>
                <p>{study.summary}</p>
                <div className="tags">{study.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <a className="email-link" href="mailto:mnyngch8@gmail.com">mnyngch8@gmail.com</a>
        <div className="footer-links mono">
          <a href="https://github.com/Moon-Young-Choi" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href="#top">Top ↑</a>
        </div>
        <span className="mono">© {currentYear} Moonyoung Choi</span>
      </footer>
    </main>
  );
}
