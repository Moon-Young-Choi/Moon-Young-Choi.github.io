import type { CaseStudy } from "@/app/content";
import {
  EvidenceNote,
  PaperEquation,
  PaperFigure,
  PaperFlow,
  PaperSection,
  ResearchPaperShell,
  type PaperSectionLink,
} from "@/app/components/ResearchPaperShell";
import styles from "@/app/components/QuantPlatform.module.css";

const sections: PaperSectionLink[] = [
  { id: "request-contract", number: "1", title: "Request contract and seven-module boundary" },
  { id: "current-distribution", number: "2", title: "Current joint-distribution construction" },
  { id: "historical-calibration", number: "3", title: "Historical weight calibration" },
  { id: "portfolio-objective", number: "4", title: "Portfolio objective and specification boundary" },
];

const modules = [
  ["1", "Portfolio Optimization", "Requests one joint distribution, solves the allocation problem, and returns the optimal portfolio."],
  ["2", "Joint Probability Distribution", "Combines current algorithm views with request-specific weights over an empirical reference distribution."],
  ["3", "Algorithm", "Runs the same algorithms and decoders at current or historical reference times and returns probabilistic conclusions."],
  ["4", "Algorithm Data Collection", "Builds algorithm-specific Evidence Bundles from FSC and DART through an Exact Data Plane and common encoder."],
  ["5", "Weight Optimization", "Recomputes algorithm weights for the request by minimizing historical portfolio-distribution CRPS."],
  ["6", "Return Calculation", "Applies the current weights at each historical reference time and computes the realized hold-to-horizon return."],
  ["7", "Optimization Data Collection", "Supplies FSC outcome-window prices to Return Calculation and performs no prediction work."],
] as const;

export function QuantPlatformPage({ study }: { study: CaseStudy }) {
  return (
    <ResearchPaperShell
      study={study}
      status="Completed functional and mathematical design"
      abstract="Quantitative Platform defines a request-scoped system that constructs a joint probability distribution for a user-selected tradable asset universe and forecast horizon, then returns an optimal portfolio relative to the user’s current holdings. Seven functional modules separate prediction evidence from historical outcome data, reuse the same algorithms at current and historical reference times, calibrate algorithm weights against the current portfolio with CRPS, and combine probabilistic views by entropy pooling. This page records the completed functional and mathematical design; communication protocols, implementation technology, deployment, and investment performance are outside its evidence boundary."
      sections={sections}
    >
      <PaperSection {...sections[0]} deck="One request is identified by four user-controlled fields; every algorithm weight belongs to that complete identity rather than to an asset universe alone.">
        <p>The external contract is deliberately narrow. A user supplies the tradable asset universe, current portfolio weights, forecast horizon, and Rolling Window range. The system returns one optimal portfolio over that universe. Algorithm-specific data requirements, intermediate conclusions, inter-algorithm weights, and entropy-pooling calculations remain internal. A request is therefore not identified by ticker set alone: changing the current portfolio, horizon, or Rolling Window creates a different calibration problem even when every asset remains the same.</p>
        <PaperEquation number="1" label="Request identity" expression={String.raw`\mathcal R=\left(\mathcal U,w_0,H,\mathcal W\right)`} note="The tradable universe U, current portfolio w₀, horizon H, and Rolling Window range W jointly determine the request. Algorithm weights are recomputed for this identity and are not reused across a changed field." />
        <PaperFigure number="1" title="The complete functional boundary. Numbers identify the seven modules fixed by the V2 specification; the user is the only external actor.">
          <div className={styles.moduleGrid}>
            {modules.map(([number, title, description]) => (
              <article key={number}>
                <span>{number.padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </PaperFigure>
        <p>The boundaries prevent prediction and evaluation data from collapsing into one ambiguous pipeline. Portfolio Optimization does not run algorithms or estimate their weights. Joint Probability Distribution does not walk historical windows or calculate realized portfolio returns. Algorithm does not collect raw sources, and Weight Optimization does not clone algorithm implementations. Return Calculation only creates historical outcomes for calibration; it is not an ongoing portfolio-management service.</p>
        <EvidenceNote title="Fixed scope"><p>The design contains exactly seven internal modules. It does not add gateways, coordinators, workspaces, control planes, registries, caches, monitoring, audit, authentication, or deployment services. Those concepts are not implied by the functional diagram.</p></EvidenceNote>
      </PaperSection>

      <PaperSection {...sections[1]} deck="Current forecasting preserves historical joint asset movements, expresses each algorithm as probabilistic views, and combines their probability adjustments rather than averaging point forecasts.">
        <p>At the current request time, Joint Probability Distribution asks Weight Optimization for weights specific to the complete request identity and asks Algorithm for each algorithm’s conclusion over the same universe, reference time, and horizon. Algorithm obtains a separate Evidence Bundle for each method. Algorithm Data Collection places exact FSC and DART values in an Exact Data Plane, encodes narrative material once with a common encoder, and packages both representations for the relevant algorithm decoder. Each decoder and prediction function is owned by Algorithm, not by data collection.</p>
        <p>An algorithm conclusion is a collection of probabilistic views, not a point forecast with a separate confidence score. A view pairs a deterministic target function of the asset-return vector with its predicted quantile function. The target may describe one asset, a relative return, or a basket. Common probability levels make views comparable; uncertainty is represented by quantile width and shape, while relative trust between algorithms is represented by calibrated weights.</p>
        <PaperEquation number="2" label="Algorithm conclusion contract" expression={String.raw`R_{t,H}\in\mathbb R^m,\qquad C_k=(\mathcal U,t,H,\mathcal V_k),\qquad V_{k,j}=\left(g_{k,j}(R),Q_{k,j}\right)`} note="Every algorithm addresses the same asset universe, reference time, and holding horizon. A common view is g(R)=aᵀR, though a predefined nonlinear event may also be used." />
        <p>The reference distribution is empirical. It consists of jointly observed horizon holding-period return vectors whose outcome intervals ended before the applicable reference time. Every scenario initially receives probability 1/S. Sliding scenario starts by one observation inside the user’s Rolling Window preserves observed cross-asset co-movement and distribution shape without fitting a separate parametric law or generating new Monte Carlo returns.</p>
        <PaperEquation number="3" label="Entropy-pooled view and weighted log pool" expression={String.raw`q^{(k)}=\operatorname{EntropyPool}(p,C_k),\qquad q_s(w)=\frac{p_s\prod_k\left(q_s^{(k)}/p_s\right)^{w_k}}{\sum_r p_r\prod_k\left(q_r^{(k)}/p_r\right)^{w_k}},\quad w_k\ge0,\ \sum_k w_k=1`} note="Each algorithm first adjusts the same empirical prior independently. The final pool weights the probability adjustment made by each algorithm; a zero-weight view has no effect." />
        <p>A predicted quantile Q(α)=x becomes a cumulative-probability constraint: the pooled probability of empirical scenarios satisfying g(R)≤x should be approximately α. Entropy pooling changes scenario probabilities while retaining the observed return vectors. Weighted log pooling then combines those algorithm-specific adjustments. The result is a multivariate joint distribution represented by empirical return scenarios and revised probabilities, which becomes the only forecast object passed to Portfolio Optimization.</p>
        <PaperFigure number="2" title="Current path. Each current algorithm executes once after request-specific weights have been calibrated; only the final portfolio crosses back to the user.">
          <PaperFlow items={["Four-field request", "Request-specific weights", "Current algorithm views", "Joint distribution → portfolio"]} />
        </PaperFigure>
      </PaperSection>

      <PaperSection {...sections[2]} deck="Historical calibration asks the same Algorithm module to forecast at earlier reference times, then scores each candidate mixture against what the current portfolio would actually have earned.">
        <p>Weight Optimization moves the reference time one observation at a time through the user-selected Rolling Window. At every historical time τ, it invokes the same Algorithm module, decoders, and prediction functions used by the current path; only the reference time changes. The module does not know whether its conclusion will support a current forecast or historical calibration. Its evidence is cut off at τ and its prediction still concerns the following horizon H.</p>
        <p>In parallel, Return Calculation requests only the FSC prices covering the outcome interval from Optimization Data Collection. It applies the current request’s portfolio weights w₀ at τ, holds without intermediate rebalancing until the horizon ends, and returns the realized portfolio return. The calculation does not reconstruct a user’s historical holdings and does not imply continued management after the platform returns a new allocation.</p>
        <PaperEquation number="4" label="Historical portfolio projection and realized outcome" expression={String.raw`X_\tau^{(s)}=w_0^\top R_{\tau,H}^{(s)},\qquad y_\tau=w_0^\top R_{\tau,H}`} note="Candidate joint scenarios and the realized outcome are evaluated through the same current portfolio. This is why the calibrated algorithm weights are portfolio-specific." />
        <p>For every candidate algorithm-weight vector, each historical set of views is entropy-pooled against the empirical reference distribution available before τ and combined with the same weighted log-pooling rule used in the current path. The resulting asset distribution is projected through w₀. Its empirical portfolio-return distribution is compared with yτ using the continuous ranked probability score, which rewards proximity to the outcome while penalizing unnecessarily diffuse distributions.</p>
        <PaperEquation number="5" label="CRPS calibration objective" expression={String.raw`\operatorname{CRPS}(F_{\tau,w},y_\tau)=\sum_s q_s|X_\tau^{(s)}-y_\tau|-\frac12\sum_s\sum_r q_sq_r|X_\tau^{(s)}-X_\tau^{(r)}|,\qquad w^*=\arg\min_w\frac1N\sum_{\tau=1}^{N}\operatorname{CRPS}(F_{\tau,w},y_\tau)`} note="The selected simplex point minimizes average CRPS across the complete historical calibration range." />
        <p>Candidate weights lie on a nonnegative simplex grid with initial spacing δ=0.1. Two algorithms produce eleven candidates from (0,1) through (1,0); additional algorithms use every 0.1-spaced combination whose components sum to one. This is an exhaustive functional rule, not a claim about a later numerical implementation. The selected weights return to Joint Probability Distribution and are then used for the current views.</p>
        <PaperFigure number="3" title="Historical calibration. Forecast evidence and outcome prices share FSC as a source but remain in separate modules because their meanings and consumers differ.">
          <div className={styles.laneFigure}>
            <div><span>Prediction lane</span><b>FSC + DART</b><i>Algorithm Data Collection</i><strong>Evidence Bundle → same Algorithm</strong></div>
            <div><span>Outcome lane</span><b>FSC only</b><i>Optimization Data Collection</i><strong>Prices → Return Calculation</strong></div>
            <p>Historical views + realized current-portfolio return → candidate pools → mean CRPS → request-specific weights</p>
          </div>
        </PaperFigure>
      </PaperSection>

      <PaperSection {...sections[3]} deck="The joint distribution supports one explicit allocation objective: increase expected return while penalizing tail loss and unnecessary departure from the current portfolio.">
        <p>Portfolio Optimization receives empirical scenarios and pooled probabilities from Joint Probability Distribution. It does not see raw evidence, algorithm conclusions, or calibration samples. The feasible set requires portfolio weights to sum to one and carries the request or preset rules for asset bounds, shorting, and leverage. Within that set, the objective balances expected return, CVaR of portfolio loss, and an L1 turnover term relative to the current portfolio.</p>
        <PaperEquation number="6" label="Final portfolio objective" expression={String.raw`w^*=\arg\max_{w\in\mathcal C}\left[\mathbb E_q(w^\top R)-\lambda\operatorname{CVaR}_\alpha(-w^\top R)-\kappa\lVert w-w_0\rVert_1\right],\qquad \mathbf 1^\top w=1`} note="CVaR level α, risk coefficient λ, change coefficient κ, asset bounds, and shorting or leverage permissions remain request or preset parameters; the specification does not assign arbitrary values." />
        <p>The V2 design is functionally and mathematically complete at this level. It fixes the module list and responsibilities, current and historical reuse of algorithms, empirical reference distribution, probabilistic conclusion contract, entropy pooling, weighted log pooling, simplex search, CRPS evaluation, Rolling Window behavior, realized-return definition, and final allocation objective. The current reference time is the request time; historical reference times move through the selected window.</p>
        <p>Several details are intentionally outside the specification rather than unfinished architecture decisions. The user chooses the forecast horizon and Rolling Window. Common quantile levels, CVaR level, λ, κ, asset-weight bounds, and short or leverage permissions are request-level or preset parameters. Concrete message fields, APIs, serialization, encoder and decoder implementation, runtime technology, and deployment topology are excluded. No parameter value should be inferred from the diagrams on this page.</p>
        <PaperFlow items={["Empirical scenarios + pooled q", "Expected return and CVaR", "Turnover penalty from w₀", "Optimal portfolio to user"]} />
        <EvidenceNote title="Evidence boundary"><p>This page documents a completed functional and mathematical design. It does not claim a deployed platform, live data integration, generated portfolio, backtested return, algorithm performance, production reliability, or investment outcome. The existing LikeC4 artifact is not silently redefined by this presentation.</p></EvidenceNote>
      </PaperSection>
    </ResearchPaperShell>
  );
}
