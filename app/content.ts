export type Accent = "lime" | "ink" | "blue" | "coral" | "violet" | "paper";

export type Formula = {
  label: string;
  expression: string;
  note: string;
};

export type CaseStudy = {
  kind: "work" | "project";
  presentation: "standard" | "quant-platform" | "pwr-theory" | "arbitrage-lab" | "eventedge-market" | "bayesian-math" | "osint-math" | "avikus-experience" | "finburh-experience";
  number: string;
  slug: string;
  title: string;
  organization?: string;
  role?: string;
  period?: string;
  accent: Accent;
  shape: string;
  eyebrow: string;
  summary: string;
  tags: string[];
  stack: Array<{ group: string; items: string[] }>;
  facts: Array<[string, string]>;
  flow: string[];
  formulas: Formula[];
  sections: Array<{ title: string; paragraphs: string[] }>;
  validation: string[];
  boundary: string;
  github?: string;
};

export const education = [
  {
    institution: "Seoul National University",
    degree: "B.S. Naval Architecture & Ocean Engineering · Double major in Economics",
    period: "Mar 2019 — Feb 2027 (expected)",
    location: "Seoul, South Korea",
    detail: "Signal Processing · Derivatives · Advanced Econometrics · Economic Forecasting & Data Intelligence",
  },
  {
    institution: "Sejong Science High School",
    degree: "Early graduation",
    period: "Mar 2014 — Feb 2016",
    location: "Seoul, South Korea",
  },
];

export const workStudies: CaseStudy[] = [
  {
    kind: "work",
    presentation: "avikus-experience",
    number: "01",
    slug: "avikus-simulation-perception",
    title: "Synthetic Signal & Video Simulator for Autonomous-Navigation AI Training",
    organization: "HD Hyundai Avikus",
    role: "Research Intern",
    period: "Dec 2025 — Jan 2026",
    accent: "blue",
    shape: "navigation",
    eyebrow: "Integrated situational awareness research",
    summary:
      "Built NMEA 0183 signal, conditional vessel-event, and visible-infrared video simulation for repeatable autonomous-navigation AI training.",
    tags: ["C++", "CUDA", "OpenCV", "OpenMP"],
    stack: [
      { group: "Core", items: ["C++", "CUDA"] },
      { group: "Vision & parallelism", items: ["OpenCV", "OpenMP"] },
      { group: "Methods", items: ["Homography", "Synthetic signal generation"] },
    ],
    facts: [
      ["Role", "Research Intern"],
      ["Domain", "Autonomous navigation"],
      ["Inputs", "NMEA 0183 · visible · infrared"],
      ["Validation", "350× simulation"],
    ],
    flow: ["Conditional vessel events", "NMEA 0183 synthesis", "Visible-infrared panorama", "350× simulation"],
    formulas: [],
    sections: [
      {
        title: "Signal and event simulation",
        paragraphs: [
          "The simulator injected outliers, probability-controlled missing observations, and sensor noise into generated NMEA 0183 streams.",
          "Conditional events changed vessel course, speed, and route state, then combined into reusable maritime scenarios.",
        ],
      },
      {
        title: "Panorama alignment and accelerated execution",
        paragraphs: [
          "OpenCV homography and CUDA warp-and-blend aligned visible and infrared pinhole-camera views into one panorama.",
          "OpenMP separated execution, output, and visualization so the simulator itself ran stably at 350× during final product validation under the processor ceiling.",
        ],
      },
    ],
    validation: [
      "Repeat the same scenario under controlled missingness and noise seeds.",
      "Check geometric consistency across overlapping frames before blending.",
      "Keep compute, output, and visualization paths independently observable.",
      "Stress the completed simulator at 350× execution speed.",
    ],
    boundary:
      "This page is a public-safe reconstruction from the role description. No employer code, imagery, dataset, parameter, or internal system name is shown.",
  },
  {
    kind: "work",
    presentation: "finburh-experience",
    number: "02",
    slug: "finburh-document-automation",
    title: "Financial Modeling Architecture with a Multi-Agent Orchestrator",
    organization: "Main Gate Partners Inc. · FINBURH",
    role: "Co-Founder & CEO",
    period: "Feb 2025 — Dec 2025",
    accent: "lime",
    shape: "agents",
    eyebrow: "Product · engineering · operations",
    summary:
      "Built four execution agents, a separate LLM orchestrator, three financial-data MCPs, and assumption-driven forecasting for editable financial models.",
    tags: ["Python", "Agent orchestration", "DART · KRX", "MCP"],
    stack: [
      { group: "Core", items: ["Python", "MCP"] },
      { group: "Orchestration", items: ["Multi-agent orchestration"] },
      { group: "Data & retrieval", items: ["DART", "KRX", "Embedding & retrieval"] },
      { group: "Output", items: ["Word, PowerPoint and Excel generation"] },
    ],
    facts: [
      ["Role", "Co-Founder & CEO"],
      ["Domain", "IB · PE workflows"],
      ["Agents", "Four execution · one orchestrator"],
      ["Context", "~30% of initial tokens"],
    ],
    flow: ["DART · KRX · web MCPs", "Task-specific retrieval", "Agent orchestration", "Editable financial outputs"],
    formulas: [],
    sections: [
      {
        title: "Workflow decomposition",
        paragraphs: [
          "Valuation and M&A advisory work was decomposed into Conversation, Task, Work, and Research agents. A separate LLM orchestrator checked success criteria and reassigned failed steps.",
          "This made the unit of recovery smaller than the final workbook or presentation. A user revision could target one assumption, table, or slide while preserving upstream evidence and unaffected outputs.",
        ],
      },
      {
        title: "Evidence to editable output",
        paragraphs: [
          "DART, KRX, and web MCPs served both Work and Research. Evidence was partitioned by company, period, and material type, then only the active-task subset was injected into agent context.",
          "The production workflow generated workbooks with more than 30 sheets and presentations with roughly 200 slides in about five minutes, after which individual edits were applied within seconds. These figures describe the role period, not a public benchmark or a guarantee for other workloads.",
        ],
      },
    ],
    validation: [
      "Attach provenance and period to every exact financial value.",
      "Keep assumptions explicit and editable across dependent outputs.",
      "Retry or reassign failed nodes without discarding completed artifacts.",
      "Recalculate only the affected workbook and slide dependencies after edits.",
    ],
    boundary:
      "The diagrams expose the public architecture and workflow logic only. Customer material, prompts, financial models, internal services, and source code are omitted.",
  },
];

export const projectStudies: CaseStudy[] = [
  {
    kind: "project",
    presentation: "quant-platform",
    number: "01",
    slug: "quant-platform",
    title: "Quantitative Platform",
    accent: "lime",
    shape: "quant-platform",
    eyebrow: "Joint-distribution portfolio design",
    summary:
      "A completed functional and mathematical design that combines probabilistic algorithm views, recalibrates their weights for each portfolio request, and optimizes allocation under expected return, CVaR, and turnover.",
    tags: ["Entropy pooling", "CRPS", "Portfolio optimization"],
    stack: [
      { group: "Distribution", items: ["Empirical joint returns", "Entropy pooling", "Weighted log pooling"] },
      { group: "Calibration", items: ["Rolling Window", "CRPS", "Simplex grid search"] },
      { group: "Decision", items: ["Expected return", "CVaR", "Turnover penalty"] },
    ],
    facts: [
      ["Status", "Functional design complete"],
      ["Modules", "Seven fixed boundaries"],
      ["Calibration", "Request-specific CRPS"],
      ["Output", "Optimal portfolio"],
    ],
    flow: ["Four-field request", "Historical calibration", "Current joint distribution", "Optimal portfolio"],
    formulas: [
      {
        label: "Request identity",
        expression: String.raw`\mathcal R=(\mathcal U,w_0,H,\mathcal W)`,
        note: "Algorithm weights are recalculated for the complete asset-universe, current-portfolio, horizon, and Rolling-Window request.",
      },
      {
        label: "Portfolio objective",
        expression: String.raw`\max_{w\in\mathcal C}\;\mathbb E_q(w^\top R)-\lambda\operatorname{CVaR}_\alpha(-w^\top R)-\kappa\lVert w-w_0\rVert_1`,
        note: "The final allocation balances expected return, tail loss, and change from the current portfolio.",
      },
    ],
    sections: [
      {
        title: "Request-specific joint distribution",
        paragraphs: [
          "The system recalibrates algorithm weights for every combination of asset universe, current portfolio, forecast horizon, and Rolling Window.",
          "Probabilistic algorithm views adjust a shared empirical return distribution through entropy pooling and weighted log pooling.",
        ],
      },
      {
        title: "Completed design boundary",
        paragraphs: [
          "The artifact completes the functional and mathematical specification for seven modules, current and historical paths, calibration, distribution construction, and portfolio optimization.",
          "Communication, implementation, deployment, live portfolio output, and investment performance remain outside the published evidence.",
        ],
      },
    ],
    validation: [
      "Treat the asset universe, current portfolio, horizon, and Rolling Window as one request identity.",
      "Use the same algorithm implementation at current and historical reference times.",
      "Keep algorithm Evidence Bundles separate from FSC prices used to calculate realized calibration outcomes.",
      "Evaluate every 0.1-spaced simplex candidate by mean historical CRPS.",
      "Pass only the pooled joint distribution into the final portfolio objective.",
    ],
    boundary:
      "This is a completed functional and mathematical design, not a claim of deployed services, live portfolio output, backtested returns, algorithm performance, or investment results.",
  },
  {
    kind: "project",
    presentation: "pwr-theory",
    number: "02",
    slug: "pwr-scan",
    title: "PWR-Scan",
    accent: "ink",
    shape: "pwr-proof",
    eyebrow: "Pooled-Whitened Randomization Scan",
    summary:
      "A proof-first randomization scan for a localized positive covariance change with unknown interval and direction, paired with an independent validation oracle and explicit evidence boundaries.",
    tags: ["Python", "Randomization", "Minimax theory"],
    stack: [
      { group: "Runtime", items: ["Python", "NumPy", "SciPy", "FastAPI"] },
      { group: "Independent validation", items: ["pytest", "pandas", "deterministic oracle"] },
      { group: "Evidence", items: ["Exact orbits", "Monte Carlo randomization", "SHA-256 provenance"] },
    ],
    facts: [
      ["Theory", "Finite-sample and minimax manuscript"],
      ["Engineering", "v0.2.2 closeout complete"],
      ["Publication validation", "Pending"],
      ["External validity", "Not established"],
    ],
    flow: ["Pooled whitening", "Multiscale block scan", "Randomization rank", "Claim ledger"],
    formulas: [
      {
        label: "Pooled-whitened scan",
        expression: String.raw`S_{\mathrm{PWR}}=\max_{B\in\mathcal B}\frac{\lambda_{\max}\!\left[\widehat\Sigma_{P,B}^{-1/2}(\widehat\Sigma_{1,B}-\widehat\Sigma_{0,B})\widehat\Sigma_{P,B}^{-1/2}\right]}{a_B}`,
        note: "The statistic searches an unknown positive covariance direction and interval in one global decision function.",
      },
      {
        label: "Full-orbit level",
        expression: String.raw`p_{\mathcal G}(D)=\frac{1}{|\mathcal G|}\sum_{g\in\mathcal G}\mathbf 1\{S(gD)\ge S(D)\},\qquad \Pr_0\!\left(p_{\mathcal G}\le\alpha\right)\le\alpha`,
        note: "The guarantee follows from full-law exchangeability of the inference units, not covariance equality alone.",
      },
    ],
    sections: [
      {
        title: "Proof before performance",
        paragraphs: [
          "The manuscript separates finite-sample randomization validity from Gaussian power assumptions and connects the same decision rule to a direction-and-location minimax lower bound.",
          "The public page exposes every assumption and proof dependency before showing implementation or empirical evidence.",
        ],
      },
      {
        title: "Evidence classes stay separate",
        paragraphs: [
          "The v0.2.2 engineering closeout verifies execution, provenance, and deterministic audit paths; it is not a publication-scale power study.",
          "The reported DCASE evaluation did not establish external validity. Its near-random AUC and zero sensitivity remain visible as a negative result rather than being promoted or omitted.",
        ],
      },
    ],
    validation: [
      "Independent oracle: pooled-moment, Roy/PWR, scan, and small full-orbit identities.",
      "Engineering closeout: 56/56 execution rows and 246 implementation tests, without interpreting rejection counts as power.",
      "Locked global-level and publication-scale power, rate, mismatch, and adaptation campaigns remain pending.",
      "DCASE aggregate: ROC AUC 0.4843 and sensitivity 0; external validity is not established.",
    ],
    boundary:
      "Mathematical statements apply only under their displayed assumptions. Engineering tests, synthetic studies, and external-data performance are distinct evidence classes.",
    github: "https://github.com/Moon-Young-Choi/pwr-scan",
  },
  {
    kind: "project",
    presentation: "osint-math",
    number: "03",
    slug: "open-source-intelligence",
    title: "Open Source Intelligence",
    accent: "blue",
    shape: "grid",
    eyebrow: "Point-in-time disclosure research",
    summary:
      "A source-to-result pipeline for Korean disclosures and post-disclosure return paths, with immutable evidence and explicit leakage controls.",
    tags: ["Python", "DART · FSC", "Point-in-time"],
    stack: [
      { group: "Core", items: ["Python", "NumPy"] },
      { group: "Modeling", items: ["PyTorch", "Transformers", "SafeTensors"] },
      { group: "Data", items: ["DART", "FSC/KRX"] },
      { group: "Verification", items: ["pytest"] },
    ],
    facts: [
      ["Unit", "Issuer × receipt-date bundle"],
      ["Horizons", "1 · 3 · 5 sessions"],
      ["Execution", "Next eligible open"],
      ["Result", "Negative predictive result"],
    ],
    flow: ["DART · FSC snapshots", "Immutable source locks", "Latent representation", "Chronological test"],
    formulas: [
      {
        label: "Point-in-time admissibility",
        expression: String.raw`\mathcal I_i(t_c)=\{e:\ t_{\mathrm{available}}(e)\le t_c<t_{\mathrm{entry},i}\}`,
        note: "Only information declared available before the execution cutoff may enter observation i.",
      },
      {
        label: "Probabilistic path forecast",
        expression: String.raw`p(\mathbf r_{i,1:H}\mid D_i,M_i)=\int p(\mathbf r_{i,1:H}\mid z_i,M_i)\,q(z_i\mid D_i)\,dz_i`,
        note: "A long-document representation is fused with prior market context before a multi-horizon probabilistic decode.",
      },
    ],
    sections: [
      {
        title: "Evidence before representation",
        paragraphs: [
          "DART source documents and FSC market snapshots are stored with immutable hashes and availability metadata. Corrections remain linked as source families, and the first eligible execution is the next observed Korean-equity session open.",
          "Exact lineage is maintained independently of the learned document representation. This makes a model input traceable even when the encoder or decoder changes.",
        ],
      },
      {
        title: "A useful negative result",
        paragraphs: [
          "The bounded interview vertical slice completed one fixed chronological test. It did not outperform simple predictive baselines, so the repository records a negative predictive-performance result rather than reframing it as market superiority.",
          "What did survive is the reproducible pipeline: cutoff-aware snapshots, credential-free processed builds, leakage tests, frozen selection, evidence cards, and a constrained replay path. Governance success and predictive success are reported separately.",
        ],
      },
    ],
    validation: [
      "Hash-lock raw documents and declared source availability.",
      "Use chronological folds; never tune on the single fixed TEST result.",
      "Isolate correction families across train and evaluation boundaries.",
      "Compare probabilistic forecasts with simple baselines and record negative outcomes.",
    ],
    boundary:
      "The completed bounded experiment is not evidence of market-wide predictive superiority or profitability.",
    github: "https://github.com/Moon-Young-Choi/open-source-intelligence",
  },
  {
    kind: "project",
    presentation: "eventedge-market",
    number: "04",
    slug: "eventedge-derivatives",
    title: "EventEdge Derivatives",
    accent: "coral",
    shape: "derivatives",
    eyebrow: "Incomplete-information market simulator",
    summary:
      "A multi-game derivatives market where public game states generate joint payoff scenarios, quotes, package orders, and portfolio risk.",
    tags: ["C++", "Monte Carlo", "CVaR", "Market making"],
    stack: [
      { group: "Core", items: ["C++", "Linux CLI"] },
      { group: "Risk & simulation", items: ["Monte Carlo simulation", "CVaR"] },
      { group: "Market model", items: ["order-book simulation"] },
      { group: "Verification", items: ["exact-enumeration/CFR validation"] },
    ],
    facts: [
      ["Underlyings", "Kuhn · Leduc games"],
      ["Contracts", "Futures · options · swaps"],
      ["Market", "20-level order books"],
      ["Source", "Private research artifact"],
    ],
    flow: ["Public game state", "Joint scenarios", "Payoff matrix", "Quotes · package risk"],
    formulas: [
      {
        label: "Scenario payoff map",
        expression: String.raw`A=[\mathbf y_1\;\cdots\;\mathbf y_K],\qquad \Pi^{(n)}=\mathbf a_n^{\mathsf T}(\mathbf q+\Delta\mathbf q)-C^{(n)}`,
        note: "A joint scenario row values every contract, preserving cross-game and cross-contract dependence in one portfolio cash flow.",
      },
      {
        label: "Tail-risk objective",
        expression: String.raw`\operatorname{CVaR}_\alpha(L)=\min_\zeta\left[\zeta+\frac{1}{(1-\alpha)N}\sum_{n=1}^{N}(L_n-\zeta)_+\right]`,
        note: "Candidate packages are evaluated against the existing portfolio rather than as isolated trades.",
      },
    ],
    sections: [
      {
        title: "A market over uncertain events",
        paragraphs: [
          "Up to twenty simultaneous Kuhn or Leduc games act as small incomplete-information event processes. Underlying players follow equilibrium policies; the market maker and user agent observe only public state. Futures, options, and variance swaps translate game outcomes and probability changes into scenario-dependent cash flows.",
          "Different agent beliefs are represented as disciplined tilts of a common reference distribution. Joint Monte Carlo scenarios produce a single payoff matrix, so a package can hedge one game with another without discarding dependence.",
        ],
      },
      {
        title: "Quotes, packages, and invariants",
        paragraphs: [
          "The market maker converts scenario value and inventory covariance into reservation prices, bid–ask spreads, and depth. The user evaluates expected P&L, CVaR, worst-case loss, leverage, margin, and concentration for the combined portfolio.",
          "Multi-leg packages share one fill ratio and commit atomically. If any leg violates available depth or a risk gate, the state rolls back; after a successful commit, buyer and seller position changes must still sum to zero contract by contract.",
        ],
      },
    ],
    validation: [
      "Compare small games with exact enumeration before using Monte Carlo scenarios.",
      "Measure equilibrium-policy exploitability and public-belief calibration.",
      "Check cash, position, fill-ratio, and atomic rollback invariants.",
      "Evaluate net P&L after spread, slippage, fees, and portfolio tail risk.",
    ],
    boundary:
      "This is a research specification and simulator, not a poker agent, exchange, live trading system, or observed performance study. Source code is not public.",
  },
  {
    kind: "project",
    presentation: "arbitrage-lab",
    number: "05",
    slug: "triangular-arbitrage-detector",
    title: "Triangular Arbitrage Detector",
    accent: "violet",
    shape: "arbitrage",
    eyebrow: "Safety-gated market microstructure engine",
    summary:
      "An Upbit scanner and replay engine that evaluates three-leg routes against order-book depth, fees, latency, and execution constraints.",
    tags: ["JavaScript", "Order books", "Replay"],
    stack: [
      { group: "Runtime", items: ["Node.js", "JavaScript"] },
      { group: "Connectivity", items: ["Axios", "WebSocket", "Upbit REST/WebSocket"] },
      { group: "Verification", items: ["Node test runner"] },
    ],
    facts: [
      ["Venue", "Upbit"],
      ["Modes", "Observe · dry-run · replay"],
      ["Evidence", "Append-only logs"],
      ["Live path", "Disabled by default"],
    ],
    flow: ["Order-book snapshot", "Route valuation", "Safety gates", "Replay evidence"],
    formulas: [
      {
        label: "Depth-aware cycle return",
        expression: String.raw`G(q)=\frac{Q_3(q)}{q}-1,\qquad Q_{i+1}=\operatorname{fill}_i\!\left(Q_i;\ \text{book}_i,f_i\right)`,
        note: "Each leg consumes the actual side of the book and carries fees, rounding, and residual assets into the next leg.",
      },
      {
        label: "Execution admissibility",
        expression: String.raw`\operatorname{execute}(q)=\mathbf1\{G(q)>\tau\}\prod_j\mathbf1\{g_j(q)=1\}`,
        note: "A positive theoretical cycle is insufficient; every balance, depth, minimum-order, latency, and loss gate must pass.",
      },
    ],
    sections: [
      {
        title: "The route is an execution plan",
        paragraphs: [
          "The engine discovers canonical and reverse cycles across KRW, BTC, and USDT start assets. Valuation is bid/ask-aware and depth-aware rather than based on mid-prices, and each conversion carries its fee and market-specific minimum into the resulting plan.",
          "Signal evaluation, ranking, execution planning, and explanation are separate strategy stages. This separation allows the same candidate to be inspected, dry-run, or replayed without changing its economic calculation.",
        ],
      },
      {
        title: "Live capability is a guarded boundary",
        paragraphs: [
          "The repository contains a real-order path, but it is disabled by default and requires explicit runtime authorization plus credential, permission, private-feed, balance, latency, and policy readiness checks.",
          "Deterministic tapes and SHA-256 fingerprints make candidates, plans, executions, and reports comparable across runs. Append-only decisions and fills preserve what the engine knew and intended at each step.",
        ],
      },
    ],
    validation: [
      "Replay immutable order-book tapes with deterministic fingerprints.",
      "Account for fees, slippage, partial fills, and residual assets by leg.",
      "Reconcile private order state with a REST fallback and append-only audit.",
      "Refuse live submission unless every independent readiness gate passes.",
    ],
    boundary:
      "A detected spread is not guaranteed executable profit. Public scanning requires no keys; authenticated execution remains opt-in and safety-gated.",
    github: "https://github.com/Moon-Young-Choi/triangular-arbitrage-detector",
  },
  {
    kind: "project",
    presentation: "bayesian-math",
    number: "06",
    slug: "bayesian-ad-targeting",
    title: "Bayesian Ad Targeting",
    accent: "paper",
    shape: "bayes",
    eyebrow: "Offline incremental-effect allocation",
    summary:
      "A compact decision system that estimates treatment uplift and allocates a limited budget by sampled net incremental value.",
    tags: ["Python", "Bayesian inference", "Policy simulation"],
    stack: [
      { group: "Core", items: ["Python", "NumPy", "pandas"] },
      { group: "Inference & policy", items: ["Beta–Bernoulli inference", "Thompson Sampling"] },
    ],
    facts: [
      ["Evidence", "Randomized treatment logs"],
      ["Model", "Beta–Bernoulli"],
      ["Policy", "Thompson allocation"],
      ["Mode", "Offline CLI"],
    ],
    flow: ["Randomized log", "Segment posteriors", "Budget policy", "Independent holdout"],
    formulas: [
      {
        label: "Segment uplift posterior",
        expression: String.raw`\theta_{\ell,z}\mid D\sim\operatorname{Beta}(\alpha_{\ell,z}+r_{\ell,z},\ \beta_{\ell,z}+q_{\ell,z}),\qquad \Delta_\ell=\theta_{\ell,1}-\theta_{\ell,0}`,
        note: "Treatment and control response rates are updated separately; the decision object is their difference.",
      },
      {
        label: "Economic decision gate",
        expression: String.raw`\Pr\!\left(\Delta_\ell>\frac{c}{v}\mid D\right)\ge\tau,\qquad \sum_\ell x_\ell\le B`,
        note: "A segment must clear break-even uplift under posterior uncertainty and the global allocation budget.",
      },
    ],
    sections: [
      {
        title: "From response to incrementality",
        paragraphs: [
          "The system uses randomized treatment and control evidence from the Criteo Uplift Prediction Dataset. An adaptive feature tree defines policy segments; empirical-Bayes root priors stabilize sparse leaves, and sufficient statistics may be discounted for sequential replay.",
          "Thompson samples turn posterior uncertainty into exploration and exploitation. Exposure cost divided by normalized conversion value defines the break-even uplift, so a high response rate alone cannot authorize allocation.",
        ],
      },
      {
        title: "Independent policy evidence",
        paragraphs: [
          "Development, replay, and test partitions have separate roles. The policy is learned and replayed before the untouched test split evaluates incremental conversion and normalized net value. A reusable case is retained only when both the posterior gate and positive holdout uplift agree.",
          "The public benchmark is one reproducible offline split, not a production advertising claim. The dataset has anonymized features and lacks user identity, campaign cost, and timestamp fields, so frequency control is represented only by a segment-level allocation cap.",
        ],
      },
    ],
    validation: [
      "Preserve randomized treatment/control balance while sampling the source file.",
      "Fit priors and segment structure without access to the independent test split.",
      "Report credible intervals and posterior probability above break-even.",
      "Retain cases only after an independent positive-uplift check.",
    ],
    boundary:
      "This is an offline research simulator on a public randomized dataset, not a deployed ad platform or evidence of production lift.",
    github: "https://github.com/Moon-Young-Choi/bayesian-ad-targeting",
  },
];

export const allStudies = [...workStudies, ...projectStudies];

export const projectAliases: Readonly<Record<string, string>> = {
  "pwr-scan-validation": "pwr-scan",
};

export function resolveProjectSlug(slug: string) {
  return projectAliases[slug] ?? slug;
}

export function findStudy(kind: "work" | "project", slug: string) {
  return allStudies.find((study) => study.kind === kind && study.slug === slug);
}
