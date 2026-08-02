import Link from "next/link";
import type { CaseStudy } from "@/app/content";
import { EventEdgeMarketConsole } from "@/app/components/EventEdgeMarketConsole";
import styles from "@/app/components/EventEdgeMarket.module.css";

const cycle = [
  ["01", "Load configuration", "Fix games, contracts, fees, limits and the run seed."],
  ["02", "Initialize games", "Create up to twenty independent Kuhn or Leduc underlyings."],
  ["03", "Advance public action", "Apply the latest legal game action under the configured policy."],
  ["04", "Freeze public snapshot", "Expose only the state available to market participants."],
  ["05", "Enumerate local futures", "Expand hidden deals and equilibrium-policy action branches."],
  ["06", "Merge payoff states", "Aggregate terminal histories with the same registered payoff vector."],
  ["07", "Assign scenario weights", "Keep benchmark, maker and user measures explicitly separate."],
  ["08", "Mark contract values", "Map each measure through the same payoff registry."],
  ["09", "Reserve and skew", "Translate inventory covariance and uncertainty into quote centers."],
  ["10", "Publish 20 × 2 depth", "Construct bid and ask ladders before the next underlying action."],
  ["11", "Evaluate combined book", "Score candidate packages with old positions, costs and tail limits."],
  ["12", "Atomic pro-rata fill", "Use one immutable book and one common fill ratio for every leg."],
  ["13", "Reveal, settle, log", "Only now expose the terminal state, transfer payoff and close invariants."],
] as const;

const roadmap = [
  ["Typed state boundary", "Separate immutable PublicSnapshot from engine-private cards, seed and future actions at the type level."],
  ["Versioned payoff registry", "Bind contract definitions and the terminal payoff matrix to an explicit schema and content hash."],
  ["Exact / Monte Carlo split", "Retain exact single-game oracles while sampling only the joint multi-game portfolio distribution."],
  ["Solver evidence", "Record feasibility, CVaR auxiliary variables, tolerances and termination status for every proposed package."],
  ["Two-phase package commit", "Add prepare, common-fill, commit and rollback records with cash, position and depth invariants."],
  ["Evidence artifact", "Generate eventedge-evidence.v1.json with seed, config, commit, scenario and result fingerprints for later portfolio synchronization."],
  ["Validation campaign", "Cross-check Kuhn exact probabilities, CFR diagnostics, property-based accounting, net-cost OOS episodes and dependent-tail uncertainty."],
] as const;

function HeroGraphic() {
  const payoffs = [[1, 0, 1], [1, 0, 0], [0, 1, 0], [0, 1, 1]];
  return (
    <figure className={styles.heroGraphic} aria-labelledby="eventedge-hero-caption">
      <div className={styles.heroCanvas} aria-hidden="true">
        <div className={styles.heroPublic}><span>Public snapshot</span><i /><i /><i /><i /></div>
        <div className={styles.heroHidden}><span>Engine-private</span><strong>?</strong></div>
        <div className={styles.heroMatrix}>{payoffs.flatMap((row, rowIndex) => [<b key={`s${rowIndex}`}>S{rowIndex + 1}</b>, ...row.map((value, columnIndex) => <i data-on={Boolean(value)} key={`${rowIndex}-${columnIndex}`}>{value ? 100 : 0}</i>)])}</div>
        <div className={styles.heroBook}>{[34, 58, 82, 69, 47, 38, 63, 91, 74, 52].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
        <div className={styles.heroDecision}><div><span>A / EDGE +13</span><strong>REJECT</strong></div><div><span>B / EDGE −35</span><strong>φ .50</strong></div></div>
      </div>
      <figcaption id="eventedge-hero-caption" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
        Public game information is converted into four terminal payoff states, market-maker quotes and a portfolio decision while hidden cards and the realized terminal state remain inaccessible until settlement.
      </figcaption>
    </figure>
  );
}

export function EventEdgePage({ study }: { study: CaseStudy }) {
  return (
    <main className={styles.page}>
      <header className={`site-header ${styles.nav}`}>
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label="EventEdge page navigation">
          <a href="#market-console">Market</a>
          <a href="#event-cycle">Cycle</a>
          <a href="#model">Model</a>
          <a href="#validation">Evidence</a>
        </nav>
        <Link className="header-link" href="/#projects">Close ×</Link>
      </header>

      <article>
        <header className={styles.hero}>
          <div className={styles.heroMeta}>
            <span>Project / {study.number}</span>
            <div><strong>Private research artifact</strong><strong>Reconstructed demo</strong><strong>No real-money trading</strong></div>
          </div>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p>{study.eyebrow}</p>
              <h1>EventEdge<br />Derivatives</h1>
              <p className={styles.heroSummary}>Incomplete-information games become a finite event market: public states generate terminal payoff scenarios, inventory-aware quotes, portfolio-level tail decisions and atomic multi-leg settlement.</p>
            </div>
            <HeroGraphic />
          </div>
          <dl className={styles.heroFacts}>
            <div><dt>Underlying processes</dt><dd>Up to 20 Kuhn · Leduc games</dd></div>
            <div><dt>Contract families</dt><dd>Futures · options · swaps</dd></div>
            <div><dt>Quoted market</dt><dd>20 bid + 20 ask levels</dd></div>
            <div><dt>Public evidence</dt><dd>Architecture · reconstructed demo</dd></div>
          </dl>
        </header>

        <EventEdgeMarketConsole />

        <section className={styles.staticSection} id="event-cycle" aria-labelledby="eventedge-cycle-title">
          <div className={styles.sectionGrid}>
            <div className={styles.sectionLabel}>02 / Event cycle</div>
            <div className={styles.sectionBody}>
              <header className={styles.sectionHeading}>
                <div><span>Decision-time ordering</span><h2 id="eventedge-cycle-title">Trade after public action. Reveal after settlement.</h2></div>
                <p>The sequence is part of the model. A valuation may use the frozen public state and future-policy branches, but never the private card, future random draw or terminal result that the trade precedes.</p>
              </header>
              <ol className={styles.eventCycle}>
                {cycle.map(([number, title, detail], index) => <li data-boundary={index === 11 ? "trade" : index === 12 ? "hidden" : undefined} key={number}><span>{number}</span><h3>{title}</h3><p>{detail}</p></li>)}
              </ol>
            </div>
          </div>
        </section>

        <section className={styles.staticSection} id="model" aria-labelledby="eventedge-model-title">
          <div className={styles.sectionGrid}>
            <div className={styles.sectionLabel}>03 / Information model</div>
            <div className={styles.sectionBody}>
              <header className={styles.sectionHeading}>
                <div><span>One payoff basis · three measures</span><h2 id="eventedge-model-title">Separate what happens, what pays and what each agent believes.</h2></div>
                <p>The system keeps terminal generation, contract payoff and scenario weighting as independent layers. The true benchmark is evaluation-only and cannot be used by either trading agent.</p>
              </header>
              <div className={styles.modelGrid}>
                <article className={styles.boundaryCard}><span>Public observation</span><h3>Finite game snapshot</h3><p>Pot, action history, legal moves and registered contracts define the observation available to the market.</p><ul><li>Kuhn for exact small-tree checks</li><li>Leduc for public-card and checkpoint structure</li><li>Trade before the next underlying action</li></ul></article>
                <article className={styles.boundaryCard} data-tone="hidden"><span>Engine-private</span><h3>Hidden state stays hidden</h3><p>Private cards, seed, future actions and the realized terminal state remain behind the engine boundary.</p><ul><li>No look-ahead valuation</li><li>No benchmark leakage</li><li>Reveal only after decision</li></ul></article>
                <article className={styles.boundaryCard} data-tone="payoff"><span>Registered payoff</span><h3>Contracts are functions</h3><p>Futures, options and swaps map the same terminal history to different cash flows before positions are valued.</p><ul><li>Winner-linked binaries</li><li>Strike-dependent options</li><li>Path-dependent variance exposure</li></ul></article>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.staticSection} aria-labelledby="eventedge-mechanics-title">
          <div className={styles.sectionGrid}>
            <div className={styles.sectionLabel}>04 / Market mechanics</div>
            <div className={styles.sectionBody}>
              <header className={styles.sectionHeading}>
                <div><span>Scenario → quote → risk → fill</span><h2 id="eventedge-mechanics-title">The decision object is the combined portfolio.</h2></div>
                <p>A fair value is not a fill price. Spread, depth, inventory covariance, transaction cost and the old portfolio all remain inside the package decision.</p>
              </header>
              <div className={styles.formulaRail}>
                <article><span>Scenario value</span><h3>Payoff expectation</h3><div className={styles.mathScroll}><math aria-label="Contract value equals the sum of scenario weight times payoff"><mrow><msub><mi>V</mi><mi>k</mi></msub><mo>=</mo><mrow><munderover><mo>∑</mo><mrow><mi>s</mi><mo>=</mo><mn>1</mn></mrow><mi>S</mi></munderover><msub><mi>p</mi><mi>s</mi></msub><msub><mi>A</mi><mrow><mi>s</mi><mi>k</mi></mrow></msub></mrow></mrow></math></div><p>Every perspective weights the same registered payoff matrix.</p></article>
                <article><span>Tail objective</span><h3>Portfolio CVaR</h3><div className={styles.mathScroll}><math aria-label="Conditional value at risk Rockafellar Uryasev representation"><mrow><msub><mi>CVaR</mi><mi>α</mi></msub><mo>=</mo><munder><mi>min</mi><mi>ζ</mi></munder><mfenced><mrow><mi>ζ</mi><mo>+</mo><mfrac><mn>1</mn><mrow><mn>1</mn><mo>−</mo><mi>α</mi></mrow></mfrac><mi>𝔼</mi><msup><mfenced><mrow><mi>L</mi><mo>−</mo><mi>ζ</mi></mrow></mfenced><mo>+</mo></msup></mrow></mfenced></mrow></math></div><p>The console uses a labeled four-state tail proxy; the full engine target is CVaR.</p></article>
                <article><span>Inventory quote</span><h3>Reservation center</h3><div className={styles.mathScroll}><math aria-label="Reservation price equals fair value minus inventory risk adjustment"><mrow><msub><mi>r</mi><mi>k</mi></msub><mo>=</mo><msub><mi>V</mi><mi>k</mi></msub><mo>−</mo><mi>γ</mi><mi>Cov</mi><mfenced><mrow><msub><mi>Y</mi><mi>k</mi></msub><mo>,</mo><msup><mi>q</mi><mi>T</mi></msup><mi>Y</mi></mrow></mfenced></mrow></math></div><p>Inventory exposure moves quote centers and depth rather than becoming a binary rejection.</p></article>
                <article><span>Atomic execution</span><h3>Common fill ratio</h3><div className={styles.mathScroll}><math aria-label="Common fill ratio is the minimum of one and each leg available depth divided by requested depth"><mrow><mi>φ</mi><mo>=</mo><mi>min</mi><mfenced><mrow><mn>1</mn><mo>,</mo><munder><mi>min</mi><mi>ℓ</mi></munder><mfrac><msub><mi>D</mi><mi>ℓ</mi></msub><mrow><msub><mi>q</mi><mi>ℓ</mi></msub></mrow></mfrac></mrow></mfenced></mrow></math></div><p>Every leg uses the same immutable snapshot and the same proportional fill.</p></article>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.staticSection} id="validation" aria-labelledby="eventedge-validation-title">
          <div className={styles.sectionGrid}>
            <div className={styles.sectionLabel}>05 / Evidence boundary</div>
            <div className={styles.sectionBody}>
              <header className={styles.sectionHeading}>
                <div><span>Confirmed · reconstructed · roadmap</span><h2 id="eventedge-validation-title">Evidence classes do not substitute for one another.</h2></div>
                <p>The console is a deterministic explanation of system decisions, not a historical performance screen. The private implementation, reconstructed interface and future validation campaign remain distinct.</p>
              </header>
              <div className={styles.validationWrap}>
                <table className={styles.validationTable}>
                  <caption>EventEdge public claim ledger</caption>
                  <thead><tr><th scope="col">Item</th><th scope="col">Evidence class</th><th scope="col">Public statement</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Linux CLI simulator</th><td data-status="confirmed">Confirmed record</td><td>Private research implementation; source is not published.</td></tr>
                    <tr><th scope="row">Kuhn/Leduc multi-game market</th><td data-status="confirmed">Confirmed record</td><td>Up to twenty underlying games with derivatives traded outside the games.</td></tr>
                    <tr><th scope="row">20 × 2 order books and atomic packages</th><td data-status="confirmed">Confirmed record</td><td>System structure is described publicly; exact historical parameters are not.</td></tr>
                    <tr><th scope="row">Four-state console and stress profiles</th><td data-status="reconstructed">Reconstructed demo</td><td>Deterministic explanatory values, not historical configuration or observed output.</td></tr>
                    <tr><th scope="row">Performance, calibration and solver statistics</th><td data-status="roadmap">Not established</td><td>No public return, significance, latency or solver-performance claim is made.</td></tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.claimBoundary}><strong>Claim boundary</strong><p>{study.boundary} The private study guide and source are not distributed by this page.</p></div>
            </div>
          </div>
        </section>

        <section className={styles.staticSection} aria-labelledby="eventedge-roadmap-title">
          <div className={styles.sectionGrid}>
            <div className={styles.sectionLabel}>06 / Engine roadmap</div>
            <div className={styles.sectionBody}>
              <header className={styles.sectionHeading}>
                <div><span>Not implemented in this portfolio revision</span><h2 id="eventedge-roadmap-title">Make the private engine emit public evidence, not private state.</h2></div>
                <p>When the original repository is available, the interface can replace reconstructed rows with a sanitized, hashed artifact without changing the page’s decision contract.</p>
              </header>
              <div className={styles.roadmapGrid}>{roadmap.map(([title, detail], index) => <article key={title}><span>Roadmap / {String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{detail}</p></article>)}</div>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <div><span>Source status</span><strong>Private research artifact · PDF not published</strong></div>
          <Link href="/#projects">Back to projects ↑</Link>
        </footer>
      </article>
    </main>
  );
}
