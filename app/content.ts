export type Accent = "lime" | "ink" | "blue" | "coral" | "violet" | "paper";

export type Formula = {
  label: string;
  expression: string;
  note: string;
};

export type CaseStudy = {
  kind: "work" | "project";
  number: string;
  slug: string;
  title: string;
  organization?: string;
  period?: string;
  accent: Accent;
  shape: string;
  eyebrow: string;
  summary: string;
  tags: string[];
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
    period: "2019 — 2027 (expected)",
    detail: "Signal Processing · Derivatives · Advanced Econometrics · Economic Forecasting & Data Intelligence",
  },
  {
    institution: "Sejong Science High School",
    degree: "Early graduation",
    period: "2014 — 2016",
    detail: "Seoul, South Korea",
  },
];

export const workStudies: CaseStudy[] = [
  {
    kind: "work",
    number: "01",
    slug: "avikus-simulation-perception",
    title: "Simulation & Perception Systems",
    organization: "HD Hyundai Avikus",
    period: "Dec 2025 — Jan 2026",
    accent: "blue",
    shape: "navigation",
    eyebrow: "Research internship · Integrated situational awareness",
    summary:
      "Synthetic signal and video scenarios for autonomous-navigation training, coupled with an accelerated panoramic alignment pipeline.",
    tags: ["C++", "CUDA", "OpenCV", "OpenMP"],
    facts: [
      ["Role", "Research Intern"],
      ["Domain", "Autonomous navigation"],
      ["Inputs", "Signals · video · vessel states"],
      ["Disclosure", "Architecture only"],
    ],
    flow: ["Scenario state", "Signal synthesis", "Frame alignment", "Replay & inspection"],
    formulas: [
      {
        label: "Signal model",
        expression: String.raw`\widetilde{s}_t=m_t\,(s_t+\varepsilon_t)+(1-m_t)\,s_{\mathrm{miss}},\quad m_t\sim\operatorname{Bernoulli}(1-p_t)`,
        note: "A compact public abstraction of missingness, sensor noise, and scenario-dependent observations.",
      },
      {
        label: "Image registration",
        expression: String.raw`\widetilde{\mathbf{x}}'\;\propto\;\mathbf{H}\widetilde{\mathbf{x}},\qquad \mathbf{H}\in\mathbb{R}^{3\times3}`,
        note: "Homography maps overlapping camera views into a common projective frame before blending.",
      },
    ],
    sections: [
      {
        title: "Scenario synthesis",
        paragraphs: [
          "The simulator varied own-ship and target-ship distance, speed, and region-entry conditions. Signal generation introduced outliers, missing observations, and sensor noise so that training and inspection could be repeated over controlled uncertainty rather than a single clean trajectory.",
          "The design separated scenario state from rendering. That boundary made a vessel interaction reusable across signal traces and video outputs while keeping the failure mechanism explicit in the generated record.",
        ],
      },
      {
        title: "Accelerated perception path",
        paragraphs: [
          "Panoramic alignment used OpenCV homography estimation and CUDA image operations. Execution, output, and visualization were separated with OpenMP so that inspection work did not block the compute path.",
          "At final product validation, the pipeline remained stable at the processor-limited 350× replay rate. The figure below describes the engineering boundary; it does not reproduce internal imagery, datasets, thresholds, or source code.",
        ],
      },
    ],
    validation: [
      "Replay the same scenario under controlled missingness and noise seeds.",
      "Check geometric consistency across overlapping frames before blending.",
      "Keep compute, output, and visualization paths independently observable.",
      "Stress the completed pipeline at accelerated replay speed.",
    ],
    boundary:
      "This page is a public-safe reconstruction from the role description. No employer code, imagery, dataset, parameter, or internal system name is shown.",
  },
  {
    kind: "work",
    number: "02",
    slug: "finburh-document-automation",
    title: "Financial Document Automation",
    organization: "Main Gate Partners · FINBURH",
    period: "Feb 2025 — Dec 2025",
    accent: "lime",
    shape: "agents",
    eyebrow: "Co-Founder & CEO · Product, engineering, operations",
    summary:
      "An agentic workflow that converted public financial evidence into editable valuation and transaction documents.",
    tags: ["Python", "Agent orchestration", "DART · KRX", "MCP"],
    facts: [
      ["Role", "Co-Founder & CEO"],
      ["Domain", "IB · PE workflows"],
      ["Outputs", "Models · presentations"],
      ["Disclosure", "Architecture only"],
    ],
    flow: ["DART · KRX · web", "Evidence tools", "Agent graph", "Sheets · slides"],
    formulas: [
      {
        label: "Evidence contract",
        expression: String.raw`E(q,t)=E_{\mathrm{exact}}(q,t)\;\cup\;E_{\mathrm{narrative}}(q,t),\qquad \operatorname{available}(e)\le t`,
        note: "Exact values and narrative evidence remain distinct while sharing an availability-aware retrieval contract.",
      },
      {
        label: "Context allocation",
        expression: String.raw`\min_{S\subseteq E}\ \sum_{e\in S}\operatorname{tokens}(e)\quad\text{s.t.}\quad \operatorname{coverage}(S,q)\ge\tau`,
        note: "The routing objective is to cover the task with the smallest relevant evidence set, not to place every source in every prompt.",
      },
    ],
    sections: [
      {
        title: "Workflow decomposition",
        paragraphs: [
          "Valuation and M&A advisory work was decomposed into conversation, task, work, and research agents with an explicit assumption layer. The orchestrator routed bounded tasks, retained intermediate artifacts, and could reassign failed steps rather than restart an entire document.",
          "This made the unit of recovery smaller than the final workbook or presentation. A user revision could target one assumption, table, or slide while preserving upstream evidence and unaffected outputs.",
        ],
      },
      {
        title: "Evidence to editable output",
        paragraphs: [
          "Purpose-built tools collected and parsed DART, KRX, and web sources. Structured values were normalized separately from embedded narrative material, then retrieved only for the active task to reduce irrelevant context.",
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
    number: "01",
    slug: "pwr-scan",
    title: "PWR-Scan",
    accent: "lime",
    shape: "scan",
    eyebrow: "Pooled-Whitened Randomization Scan",
    summary:
      "A local research workstation for detecting a structured covariance increase when its frequency interval and direction are both unknown.",
    tags: ["Python", "Covariance", "Randomization"],
    facts: [
      ["Scope", "CPU-first · local only"],
      ["Inputs", "Feature matrices · audio"],
      ["Decision", "One global p-value"],
      ["Status", "Research software"],
    ],
    flow: ["Frequency features", "Pooled whitening", "Multiscale scan", "Randomization rank"],
    formulas: [
      {
        label: "Local and global statistic",
        expression: String.raw`T_B=\lambda_{\max}\!\left[\widehat\Sigma_{P,B}^{-1/2}(\widehat\Sigma_{1,B}-\widehat\Sigma_{0,B})\widehat\Sigma_{P,B}^{-1/2}\right],\quad S=\max_{B\in\mathcal B}\frac{T_B}{a_B}`,
        note: "The pooled covariance supplies a label-invariant metric; the maximum scans both unknown interval and unknown positive direction.",
      },
      {
        label: "Monte Carlo randomization",
        expression: String.raw`\widehat p_R=\frac{1+\sum_{r=1}^{R}\mathbf 1\{S(g_rD)\ge S(D)\}}{R+1}`,
        note: "The +1 correction includes the observed assignment and prevents zero p-values in the sampled orbit.",
      },
    ],
    sections: [
      {
        title: "Decision rule",
        paragraphs: [
          "Each candidate block compares two second-moment matrices after whitening by their pooled matrix. The largest eigenvalue selects the strongest positive covariance direction inside that block; a multiscale penalty accounts for direction dimension and the number of possible locations.",
          "The entire maximum statistic—not separate block p-values—is recalculated across valid label transformations. Under the stated exchangeability law, the resulting orbit rank controls the finite-sample global false-alarm probability.",
        ],
      },
      {
        title: "Theory and implementation boundary",
        paragraphs: [
          "For the balanced Gaussian benchmark, the separation scale combines an unknown-direction cost and an unknown-location cost: √(b/n)+√(log M/n). Operational extensions such as ridge whitening and audio preprocessing are recorded separately because the same power theorem does not transfer automatically.",
          "The repository includes feature and audio modes, fixed and multiscale interval libraries, several randomization designs, synthetic fixtures, and a machine-readable numerical audit. It is not a safety or certification system.",
        ],
      },
    ],
    validation: [
      "Freeze centering, transformations, block library, and randomization unit before inference.",
      "Recompute the same analysis map for every allowed label transformation.",
      "Separate finite-sample level claims from Gaussian power assumptions.",
      "Record numerical tolerances, hashes, candidate order, and applicable guarantees.",
    ],
    boundary:
      "Exact randomization requires label invariance of the full analysis unit; covariance equality alone is insufficient for general non-Gaussian data.",
    github: "https://github.com/Moon-Young-Choi/pwr-scan",
  },
  {
    kind: "project",
    number: "02",
    slug: "pwr-scan-validation",
    title: "PWR-Scan Validation",
    accent: "ink",
    shape: "validation",
    eyebrow: "Theory-first validation suite",
    summary:
      "An executable claim map linking algebraic identities, randomization calibration, simulation designs, and figure provenance.",
    tags: ["Python", "Validation", "Simulation"],
    facts: [
      ["Completed", "V0 reference audit"],
      ["In progress", "V1 global level"],
      ["Planned", "V2 — V6"],
      ["Unit", "Independent cluster"],
    ],
    flow: ["Claim", "Frozen design", "Executable check", "Evidence status"],
    formulas: [
      {
        label: "Full-orbit level",
        expression: String.raw`p_{\mathcal G}(D)=\frac{1}{|\mathcal G|}\sum_{g\in\mathcal G}\mathbf 1\{S(gD)\ge S(D)\},\qquad \Pr_0\!\left(p_{\mathcal G}\le\alpha\right)\le\alpha`,
        note: "Validity follows from invariance under the allowed transformation group, with ties retained in the upper tail.",
      },
      {
        label: "Benchmark separation rate",
        expression: String.raw`\theta_n^*\asymp \sqrt{\frac{b}{n}}+\sqrt{\frac{\log M}{n}}`,
        note: "This rate belongs to the specified balanced Gaussian parameter space, not to every audio or covariance problem.",
      },
    ],
    sections: [
      {
        title: "A claim is a testable object",
        paragraphs: [
          "The suite treats a theorem, its executable statistic, its simulation cell, and its resulting figure as one chain. V0 audits deterministic identities and small full orbits. Later tracks are explicitly marked development or planned until a locked result exists.",
          "Two modes prevent scope drift: theorem_core fixes common centering, zero ridge, a frozen candidate library, and the correct randomization unit; exploratory admits operational changes but cannot inherit theorem-aligned figure status.",
        ],
      },
      {
        title: "Failure is part of the result",
        paragraphs: [
          "Null controls measure global level rather than per-block behavior. Structured alternatives test power and rate only under their declared model. Mismatch cells perturb rank, localization, and distributional assumptions without silently changing the claim being evaluated.",
          "The current repository does not claim manuscript-level power, minimax, localization, or real-audio evidence. That visible boundary is intentional: a pending benchmark is different from a completed scientific result.",
        ],
      },
    ],
    validation: [
      "V0: pooled-moment, Rayleigh, Roy, scan, and orbit-rank identities.",
      "V1: finite-sample global level under exchangeable labels.",
      "V2 — V5: power, rate, mismatch, and scale adaptation.",
      "V6: paired waveform injection as external validation, not theorem evidence.",
    ],
    boundary:
      "Only the deterministic V0 reference audit is complete. Development diagnostics remain separate from locked, paper-eligible results.",
    github: "https://github.com/Moon-Young-Choi/pwr-scan-validation",
  },
  {
    kind: "project",
    number: "03",
    slug: "open-source-intelligence",
    title: "Open Source Intelligence",
    accent: "blue",
    shape: "grid",
    eyebrow: "Point-in-time disclosure research",
    summary:
      "A source-to-result pipeline for Korean disclosures and post-disclosure return paths, with immutable evidence and explicit leakage controls.",
    tags: ["Python", "DART · FSC", "Point-in-time"],
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
    number: "04",
    slug: "bayesian-ad-targeting",
    title: "Bayesian Ad Targeting",
    accent: "coral",
    shape: "bayes",
    eyebrow: "Offline incremental-effect allocation",
    summary:
      "A compact decision system that estimates treatment uplift and allocates a limited budget by sampled net incremental value.",
    tags: ["Python", "Bayesian inference", "Policy simulation"],
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
  {
    kind: "project",
    number: "05",
    slug: "triangular-arbitrage-detector",
    title: "Triangular Arbitrage Detector",
    accent: "violet",
    shape: "arbitrage",
    eyebrow: "Safety-gated market microstructure engine",
    summary:
      "An Upbit scanner and replay engine that evaluates three-leg routes against order-book depth, fees, latency, and execution constraints.",
    tags: ["JavaScript", "Order books", "Replay"],
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
    number: "06",
    slug: "eventedge-derivatives",
    title: "EventEdge Derivatives",
    accent: "paper",
    shape: "derivatives",
    eyebrow: "Incomplete-information market simulator",
    summary:
      "A multi-game derivatives market where public game states generate joint payoff scenarios, quotes, package orders, and portfolio risk.",
    tags: ["C++", "Monte Carlo", "CVaR", "Market making"],
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
      "This is a research specification and simulator, not a poker agent, exchange, or live trading system. Source code is not public.",
  },
];

export const allStudies = [...workStudies, ...projectStudies];

export function findStudy(kind: "work" | "project", slug: string) {
  return allStudies.find((study) => study.kind === kind && study.slug === slug);
}
