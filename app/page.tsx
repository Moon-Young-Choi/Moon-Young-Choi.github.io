const repositories = [
  {
    number: "01",
    title: "PWR Scan",
    href: "https://github.com/Moon-Young-Choi/pwr-scan",
    description:
      "Detects covariance-structure changes in acoustic frequency data when affected intervals are unknown. Uses pooled whitening, a Roy-type maximum generalized eigenvalue statistic, and permutation calibration for finite-sample global error control.",
    tags: ["Python", "Covariance", "Permutation Test"],
    accent: "lime",
    shape: "scan",
  },
  {
    number: "02",
    title: "PWR Scan Validation",
    href: "https://github.com/Moon-Young-Choi/pwr-scan-validation",
    description:
      "A theory-first validation suite for exchangeability, calibration, null controls, structured alternatives, and reproducible simulation cases used by PWR Scan.",
    tags: ["Python", "Validation", "Simulation"],
    accent: "ink",
    shape: "validation",
  },
  {
    number: "03",
    title: "Open Source Intelligence",
    href: "https://github.com/Moon-Young-Choi/open-source-intelligence",
    description:
      "Ingests DART disclosures and Korean market data as point-in-time evidence bundles. Exact values remain separate from encoded narrative evidence behind a standardized model input layer.",
    tags: ["Python", "DART", "Point-in-time Data"],
    accent: "blue",
    shape: "grid",
  },
  {
    number: "04",
    title: "Bayesian Ad Targeting",
    href: "https://github.com/Moon-Young-Choi/bayesian-ad-targeting",
    description:
      "Estimates incremental effects with Bayesian updates and simulates budget-constrained policies with uncertainty-aware allocation and policy evaluation.",
    tags: ["Python", "Bayesian Inference", "Policy Simulation"],
    accent: "coral",
    shape: "bayes",
  },
  {
    number: "05",
    title: "Triangular Arbitrage Detector",
    href: "https://github.com/Moon-Young-Choi/triangular-arbitrage-detector",
    description:
      "Scans Upbit three-leg paths with safety gates, replays recorded order books, and separates signal generation, simulation, and execution research.",
    tags: ["JavaScript", "Market Data", "Replay Engine"],
    accent: "violet",
    shape: "arbitrage",
  },
];

const records = [
  {
    label: "Education",
    entries: [
      ["Seoul National University", "B.S. Naval Architecture & Ocean Engineering / Economics", "2019 - 2027 (expected)"],
      ["Sejong Science High School", "Early graduation", "2014 - 2016"],
    ],
  },
  {
    label: "Experience",
    entries: [
      ["HD Hyundai Avikus", "Research Intern / CUDA, OpenCV, OpenMP", "Dec 2025 - Jan 2026"],
      ["Main Gate Partners (FINBURH)", "Co-Founder & CEO / Financial document automation", "Feb 2025 - Dec 2025"],
    ],
  },
];

const tools = [
  "Python",
  "C++",
  "CUDA",
  "OpenCV",
  "OpenMP",
  "Monte Carlo Simulation",
  "Bayesian Inference",
  "Econometrics",
  "Time-Series Analysis",
  "Signal Processing",
];

function ProjectShape({ type }: { type: string }) {
  return (
    <div className={`project-shape shape-${type}`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Back to top">MYC / 26</a>
        <nav aria-label="Primary navigation">
          <a href="#repositories">Repositories</a>
          <a href="#record">Record</a>
        </nav>
        <a className="header-link" href="mailto:mnyngch8@gmail.com">Email</a>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-index mono">
          <span>Portfolio / 2026</span>
          <span>Seoul, South Korea</span>
        </div>

        <div className="kinetic-field" aria-hidden="true">
          <div className="field-grid" />
          <div className="field-orbit orbit-a"><span /><span /><span /></div>
          <div className="field-orbit orbit-b"><span /><span /></div>
          <div className="field-triangle"><span /><span /><span /></div>
          <div className="field-axis"><span /><span /><span /><span /><span /></div>
          <div className="field-square" />
        </div>

        <h1 id="hero-title">
          <span>Moonyoung</span>
          <span>Choi</span>
        </h1>

        <div className="hero-footer mono">
          <span>Public repositories / 05</span>
          <a href="#repositories">View index <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section className="repositories" id="repositories">
        <div className="section-head">
          <span className="mono">01 / Repositories</span>
          <h2>Public work</h2>
          <span className="mono section-count">05 systems</span>
        </div>

        <div className="project-grid">
          {repositories.map((repo) => (
            <a
              className={`project-card ${repo.accent}`}
              href={repo.href}
              target="_blank"
              rel="noreferrer"
              key={repo.title}
            >
              <div className="card-top mono">
                <span>{repo.number}</span>
                <span>GitHub <i aria-hidden="true">↗</i></span>
              </div>
              <ProjectShape type={repo.shape} />
              <div className="card-copy">
                <h3>{repo.title}</h3>
                <p>{repo.description}</p>
                <div className="tags">
                  {repo.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="record" id="record">
        <div className="section-head record-head">
          <span className="mono">02 / Record</span>
          <h2>Education & experience</h2>
          <span className="mono section-count">Seoul / KR</span>
        </div>

        <div className="record-grid">
          {records.map((group) => (
            <div className="record-group" key={group.label}>
              <h3 className="mono">{group.label}</h3>
              {group.entries.map(([organization, detail, date]) => (
                <div className="record-row" key={organization}>
                  <strong>{organization}</strong>
                  <span>{detail}</span>
                  <time>{date}</time>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="tool-index">
          <h3 className="mono">Technical index</h3>
          <div>
            {tools.map((tool, index) => (
              <span key={tool}><i>{String(index + 1).padStart(2, "0")}</i>{tool}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <a href="mailto:mnyngch8@gmail.com">mnyngch8@gmail.com</a>
        <div className="footer-links mono">
          <a href="https://github.com/Moon-Young-Choi" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href="#top">Top ↑</a>
        </div>
        <span className="mono">&copy; 2026 Moonyoung Choi</span>
      </footer>
    </main>
  );
}
