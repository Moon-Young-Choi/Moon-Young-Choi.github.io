import Link from "next/link";
import type { CaseStudy } from "@/app/content";
import { ArbitrageRouteLab } from "@/app/components/ArbitrageRouteLab";
import { arbitrageShowcase } from "@/app/lib/arbitrageShowcase";
import styles from "@/app/components/ArbitrageLab.module.css";

const modes = [
  { name: "Observe", detail: "Price and rank routes. No order plan is submitted.", state: "open" },
  { name: "Dry-run", detail: "Simulate depth-aware fills with the current snapshots.", state: "open" },
  { name: "Replay", detail: "Reproduce a decision from an immutable, fingerprinted tape.", state: "open" },
  { name: "Real-guarded", detail: "Require explicit authorization and every independent gate.", state: "locked" },
];

const upgrades = [
  ["Fail-closed freshness", "Guarded execution now requires 1,000 ms book age, 500 ms inter-leg skew and 500 ms observe-to-verify drift limits."],
  ["Mode-aware profit floor", "Observe and simulation keep a 0 bp buffer; guarded execution adds a configurable 10 bp margin."],
  ["Bounded reconciliation", "A 500 ms acknowledgement or 3,000 ms reconciliation breach stops the next leg and records the residual."],
  ["Portable evidence", "A platform-independent test command and deterministic portfolio artifact keep the public record reproducible."],
];

export function ArbitrageLabPage({ study }: { study: CaseStudy }) {
  const evidenceShort = arbitrageShowcase.provenance.coreFingerprint.slice(0, 16);
  const declaredNodeVersions = arbitrageShowcase.verification.declaredCiMatrix?.nodeVersions ?? ["22", "24"];

  return (
    <main className={styles.page}>
      <header className={`site-header ${styles.nav}`}>
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label="Arbitrage lab navigation">
          <a href="#route-lab">Route lab</a>
          <a href="#guards">Guards</a>
          <a href="#evidence">Evidence</a>
        </nav>
        <Link className="header-link" href="/#projects">Close ×</Link>
      </header>

      <article>
        <header className={styles.hero}>
          <div className={styles.heroMeta}>
            <span>Project / {study.number}</span>
            <strong><i /> Live trading disabled</strong>
          </div>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p>{study.eyebrow}</p>
              <h1>Triangular<br />Arbitrage<br />Detector</h1>
              <p className={styles.heroSummary}>{study.summary}</p>
            </div>
            <div className={styles.heroSystem} aria-hidden="true">
              <div className={styles.heroTriangle}>
                <span className={styles.heroKrw}>KRW</span>
                <span className={styles.heroBtc}>BTC</span>
                <span className={styles.heroEth}>ETH</span>
                <i className={styles.heroLineA}><b /></i>
                <i className={styles.heroLineB}><b /></i>
                <i className={styles.heroLineC}><b /></i>
              </div>
              <div className={styles.heroReadout}>
                <span>Ask → ask → bid</span>
                <strong>Depth × fee × time</strong>
                <span>Replay before execution</span>
              </div>
            </div>
          </div>
          <dl className={styles.heroFacts}>
            <div><dt>Venue</dt><dd>Upbit</dd></div>
            <div><dt>Runtime</dt><dd>Node.js</dd></div>
            <div><dt>Evidence</dt><dd>Deterministic replay</dd></div>
            <div><dt>Default live mode</dt><dd>Off</dd></div>
          </dl>
        </header>

        <section className={styles.intro} aria-labelledby="overview-title">
          <span className={styles.sectionLabel}>00 / Overview</span>
          <div>
            <h2 id="overview-title">A spread is only a candidate.</h2>
            <p>The engine treats a cycle as a sequence of executable conversions, not a product of midpoint prices. Each leg consumes the correct side of a synthetic order book, carries fees and partial fills forward, and preserves any asset that cannot complete the cycle.</p>
          </div>
          <div className={styles.introMetric}><span>Route directions</span><strong>02</strong><small>canonical + reverse</small></div>
          <div className={styles.introMetric}><span>Execution legs</span><strong>03</strong><small>sequential, state-aware</small></div>
        </section>

        <section className={styles.routeLabSection} id="route-lab" aria-labelledby="route-lab-title">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionLabel}>01 / Replay lab</span>
            <div><h2 id="route-lab-title">Inspect a precomputed route.</h2><p>Change direction, amount, fee, or failure scenario. The interface selects an engine-produced row; it does not recreate the trading calculation in the browser.</p></div>
          </div>
          <ArbitrageRouteLab showcase={arbitrageShowcase} />
        </section>

        <section className={styles.guardsSection} id="guards" aria-labelledby="guards-title">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionLabel}>05 / Safety gates</span>
            <div><h2 id="guards-title">Live readiness fails closed.</h2><p>A profitable replay cannot bypass stale data, grouped depth, timing, balance, permission, or policy checks. Null and disabled safety settings are invalid in guarded mode.</p></div>
          </div>
          <div className={styles.guardLayout}>
            <table className={styles.guardTable}>
              <caption>Baseline guarded-mode requirements</caption>
              <thead><tr><th>Gate</th><th>Observed</th><th>Required</th><th>Status</th></tr></thead>
              <tbody>
                {arbitrageShowcase.guards.rows.map((guard) => (
                  <tr key={guard.id}>
                    <th scope="row"><span>{guard.label}</span><small>{guard.reason}</small></th>
                    <td>{guard.value}</td><td>{guard.required}</td><td><strong data-pass={guard.passed}>{guard.passed ? "Pass" : "Block"}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.guardStamp}>
              <span>Default guarded buffer</span><strong>{arbitrageShowcase.guards.configuration.realGuardedProfitBufferBps} bp</strong><p>A conservative operating default, not a profit guarantee.</p>
            </div>
          </div>
        </section>

        <section className={styles.modesSection} aria-labelledby="modes-title">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionLabel}>06 / Modes</span>
            <div><h2 id="modes-title">One valuation path, four permissions.</h2></div>
          </div>
          <ol className={styles.modeFlow}>
            {modes.map((mode, index) => (
              <li data-state={mode.state} key={mode.name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{mode.name}</strong><p>{mode.detail}</p><i>{mode.state === "locked" ? "Locked" : "Available"}</i></li>
            ))}
          </ol>
        </section>

        <section className={styles.evidenceSection} id="evidence" aria-labelledby="evidence-title">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionLabel}>07 / Evidence</span>
            <div><h2 id="evidence-title">The interface carries its provenance.</h2><p>The committed artifact is generated from fixed synthetic tapes after the engine test suite passes. Production rendering reads only this local copy and makes no exchange or account request.</p></div>
          </div>
          <div className={styles.evidenceGrid}>
            <div className={styles.testBlock}><span>Verification</span><strong>{arbitrageShowcase.verification.passedTests}<small> / {arbitrageShowcase.verification.totalTests}</small></strong><p>{arbitrageShowcase.verification.testCommand} · declared Node {declaredNodeVersions.join(" + ")}</p></div>
            <div className={styles.fingerprintBlock}><span>Core SHA-256</span><strong>{evidenceShort}<wbr />…</strong><p>Inputs, scenarios, guards and boundaries are stable-key serialized before hashing.</p></div>
            <div className={styles.commitBlock}><span>Engine commit</span><strong>{arbitrageShowcase.provenance.engineCommit.slice(0, 12)}</strong><p>{arbitrageShowcase.provenance.generatedAt}</p></div>
          </div>
          <div className={styles.techStrip} aria-label="Technology stack">
            <span>Runtime & connectivity</span>
            {study.stack.flatMap((group) => group.items).map((item) => <strong key={item}>{item}</strong>)}
          </div>
          <div className={styles.auditStrip} aria-label="Append-only evidence stages">
            <span>snapshot.accepted</span><i>→</i><span>candidate.ranked</span><i>→</i><span>plan.validated</span><i>→</i><span>replay.recorded</span>
          </div>
        </section>

        <section className={styles.boundarySection} aria-labelledby="boundary-title">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionLabel}>08 / Boundary</span>
            <div><h2 id="boundary-title">What this evidence does not claim.</h2><p>{arbitrageShowcase.boundary.statement}</p></div>
          </div>
          <ul className={styles.boundaryList}>
            <li><span>Synthetic tape</span><strong>{arbitrageShowcase.boundary.syntheticData ? "Yes" : "No"}</strong></li>
            <li><span>Live market calls</span><strong>{arbitrageShowcase.boundary.liveMarketData ? "Yes" : "No"}</strong></li>
            <li><span>Orders placed</span><strong>{arbitrageShowcase.boundary.liveTrading ? "Yes" : "No"}</strong></li>
            <li><span>Realized profit claim</span><strong>{arbitrageShowcase.boundary.profitClaim || arbitrageShowcase.boundary.realizedPnlIncluded ? "Yes" : "No"}</strong></li>
          </ul>
          <div className={styles.upgradeList}>
            {upgrades.map(([title, detail], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}
          </div>
        </section>

        <footer className={styles.footer}>
          <div><span>Public source</span><a href={study.github} target="_blank" rel="noreferrer">Open GitHub repository ↗</a></div>
          <Link href="/#projects">Back to projects ↑</Link>
        </footer>
      </article>
    </main>
  );
}
