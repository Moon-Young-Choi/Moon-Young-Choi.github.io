const projects = [
  {
    number: "01",
    title: "PWR Scan",
    description:
      "Structured covariance shifts를 탐지하는 pooled-whitened randomization scan. 재현 가능성과 감사 가능한 통계 검증을 중심으로 설계했습니다.",
    tags: ["Python", "Statistical Testing", "Research"],
    href: "https://github.com/Moon-Young-Choi/pwr-scan",
    accent: "lime",
  },
  {
    number: "02",
    title: "Open Source Intelligence",
    description:
      "DART 공시와 한국 주식시장 경로를 point-in-time으로 정렬해 학습하는 리서치 파이프라인입니다.",
    tags: ["Python", "Representation Learning", "Finance"],
    href: "https://github.com/Moon-Young-Choi/open-source-intelligence",
    accent: "blue",
  },
  {
    number: "03",
    title: "Bayesian Ad Targeting",
    description:
      "증분 효과를 베이지안 방식으로 추정하고 제한된 예산 아래에서 타기팅 정책을 시뮬레이션합니다.",
    tags: ["Bayesian", "Causal Inference", "Optimization"],
    href: "https://github.com/Moon-Young-Choi/bayesian-ad-targeting",
    accent: "coral",
  },
  {
    number: "04",
    title: "Triangular Arbitrage Detector",
    description:
      "안전장치를 갖춘 Upbit 삼각 차익거래 스캐너, 리플레이 엔진, 실행 연구 시스템입니다.",
    tags: ["JavaScript", "Market Microstructure", "Systems"],
    href: "https://github.com/Moon-Young-Choi/triangular-arbitrage-detector",
    accent: "violet",
  },
];

const capabilities = [
  ["01", "Research Engineering", "아이디어를 재현 가능한 실험과 검증 가능한 코드로 옮깁니다."],
  ["02", "Statistical Learning", "불확실성을 숨기지 않고 측정하는 모델과 의사결정 규칙을 만듭니다."],
  ["03", "Financial Data Systems", "시점 정합성, 데이터 계보, 안전한 실행을 시스템의 기본값으로 둡니다."],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="홈으로 이동">
          MYC<span className="wordmark-dot">•</span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="header-link" href="https://github.com/Moon-Young-Choi" target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-kicker">
          <span className="status-dot" /> Available for thoughtful collaborations
        </div>
        <h1>
          Building systems
          <span className="outline">that make uncertainty</span>
          <span className="hero-last">useful.</span>
        </h1>
        <div className="hero-bottom">
          <p>
            통계적 엄밀함과 실제로 작동하는 소프트웨어 사이를 설계하는
            <strong> Research Engineer, Moonyoung Choi</strong>입니다.
          </p>
          <a className="round-link" href="#work" aria-label="선별 프로젝트 보기">
            <span>Selected</span>
            <span>work ↓</span>
          </a>
        </div>
        <div className="orbit orbit-one" aria-hidden="true" />
        <div className="orbit orbit-two" aria-hidden="true" />
      </section>

      <section className="ticker" aria-label="전문 분야">
        <div>
          <span>STATISTICAL LEARNING</span><i>✦</i><span>RESEARCH ENGINEERING</span><i>✦</i>
          <span>FINANCIAL DATA</span><i>✦</i><span>CAUSAL INFERENCE</span><i>✦</i>
        </div>
      </section>

      <section className="about section-pad" id="about">
        <div className="section-label">( ABOUT / 01 )</div>
        <div className="about-copy">
          <p className="big-copy">
            복잡한 문제를 <em>정확한 질문</em>으로 바꾸고, 그 답을 누구나 검증할 수 있는 시스템으로 만듭니다.
          </p>
          <p className="small-copy">
            통계적 검정, 표현 학습, 베이지안 의사결정, 금융 데이터 파이프라인을 다룹니다. 멋진 숫자보다 재현 가능한 근거를, 데모보다 실패 조건까지 설명되는 제품을 선호합니다.
          </p>
        </div>
      </section>

      <section className="capabilities section-pad" aria-label="핵심 역량">
        {capabilities.map(([number, title, body]) => (
          <article className="capability" key={number}>
            <span>{number}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="work section-pad" id="work">
        <div className="work-heading">
          <div className="section-label">( SELECTED WORK / 02 )</div>
          <h2>Proof over promises.</h2>
          <p>공개 저장소에서 코드와 접근 방식을 직접 확인할 수 있습니다.</p>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <a
              className={`project-card ${project.accent}`}
              href={project.href}
              target="_blank"
              rel="noreferrer"
              key={project.title}
            >
              <div className="card-top">
                <span>{project.number}</span>
                <span className="arrow">↗</span>
              </div>
              <div className="project-mark" aria-hidden="true"><span /></div>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="tags">
                {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="contact section-pad" id="contact">
        <div className="section-label light">( CONTACT / 03 )</div>
        <div className="contact-content">
          <p>Have a difficult question?</p>
          <h2>Let&apos;s make it<br /><em>testable.</em></h2>
          <a className="email-link" href="mailto:mnyngch8@gmail.com">
            mnyngch8@gmail.com <span>↗</span>
          </a>
        </div>
        <footer>
          <span>© 2026 Moonyoung Choi</span>
          <span>Seoul · Korea</span>
          <a href="#top">Back to top ↑</a>
        </footer>
      </section>
    </main>
  );
}
