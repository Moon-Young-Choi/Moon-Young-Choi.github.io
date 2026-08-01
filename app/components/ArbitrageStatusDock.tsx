import type { CaseStudy } from "@/app/content";
import type { ArbitrageShowcaseV1 } from "@/app/lib/arbitrageShowcase";
import styles from "@/app/components/ArbitrageLab.module.css";

const modes = [
  { name: "Observe", detail: "Price and rank routes. No order plan is submitted.", state: "open" },
  { name: "Dry-run", detail: "Simulate depth-aware fills with the current snapshots.", state: "open" },
  { name: "Replay", detail: "Reproduce a decision from an immutable, fingerprinted tape.", state: "open" },
  { name: "Real-guarded", detail: "Require explicit authorization and every independent gate.", state: "locked" },
];

const upgrades = [
  ["Fail-closed freshness", "Guarded execution requires 1,000 ms book age, 500 ms inter-leg skew and 500 ms observe-to-verify drift limits."],
  ["Mode-aware profit floor", "Observe and simulation keep a 0 bp buffer; guarded execution adds a configurable 10 bp margin."],
  ["Bounded reconciliation", "A 500 ms acknowledgement or 3,000 ms reconciliation breach stops the next leg and records the residual."],
  ["Portable evidence", "A platform-independent test command and deterministic portfolio artifact keep the public record reproducible."],
];

type ArbitrageStatusDockProps = {
  study: CaseStudy;
  showcase: ArbitrageShowcaseV1;
  marketSnapshotAt: string;
  triangleCount: number;
  directionalPointCount: number;
};

export function ArbitrageStatusDock({
  study,
  showcase,
  marketSnapshotAt,
  triangleCount,
  directionalPointCount,
}: ArbitrageStatusDockProps) {
  const evidenceShort = showcase.provenance.coreFingerprint.slice(0, 16);
  const declaredNodeVersions = showcase.verification.declaredCiMatrix?.nodeVersions ?? ["22", "24"];
  const captured = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(marketSnapshotAt));

  return (
    <section className={styles.statusSection} id="evidence" aria-labelledby="evidence-title">
      <div className={styles.sectionIntroCompact}>
        <span className={styles.sectionLabel}>03 / System record</span>
        <div>
          <h2 id="evidence-title">Guards and evidence stay attached.</h2>
          <p>The market topology is a pinned public listing snapshot. Every price, book, multiplier and timeline value shown above is deterministic synthetic evidence.</p>
        </div>
      </div>

      <dl className={styles.statusDock} aria-label="Arbitrage lab status">
        <div data-tone="lime"><dt>Evidence feed</dt><dd>Simulated</dd></div>
        <div data-tone="coral"><dt>Trading</dt><dd>Off</dd></div>
        <div><dt>Engine tests</dt><dd>{showcase.verification.passedTests}/{showcase.verification.totalTests}</dd></div>
        <div><dt>Triangle sets</dt><dd>{triangleCount.toLocaleString("en-US")}</dd></div>
        <div><dt>Directional points</dt><dd>{directionalPointCount.toLocaleString("en-US")}</dd></div>
        <div><dt>Market snapshot</dt><dd>{captured}</dd></div>
      </dl>

      <div className={styles.evidenceDrawers}>
        <details id="guards">
          <summary><span>01</span><strong>Safety gates</strong><small>Fail-closed guarded-mode requirements</small></summary>
          <div className={styles.drawerBody}>
            <div className={styles.guardLayout}>
              <table className={styles.guardTable}>
                <caption>Baseline guarded-mode requirements</caption>
                <thead><tr><th>Gate</th><th>Observed</th><th>Required</th><th>Status</th></tr></thead>
                <tbody>
                  {showcase.guards.rows.map((guard) => (
                    <tr key={guard.id}>
                      <th scope="row"><span>{guard.label}</span><small>{guard.reason}</small></th>
                      <td>{guard.value}</td>
                      <td>{guard.required}</td>
                      <td><strong data-pass={guard.passed}>{guard.passed ? "Pass" : "Block"}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.guardStamp}>
                <span>Default guarded buffer</span>
                <strong>{String(showcase.guards.configuration.realGuardedProfitBufferBps ?? 10)} bp</strong>
                <p>A conservative operating default, not a profit guarantee.</p>
              </div>
            </div>
          </div>
        </details>

        <details>
          <summary><span>02</span><strong>Execution modes</strong><small>Observe through real-guarded</small></summary>
          <div className={`${styles.drawerBody} ${styles.drawerDark}`}>
            <ol className={styles.modeFlow}>
              {modes.map((mode, index) => (
                <li data-state={mode.state} key={mode.name}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{mode.name}</strong>
                  <p>{mode.detail}</p>
                  <i>{mode.state === "locked" ? "Locked" : "Available"}</i>
                </li>
              ))}
            </ol>
          </div>
        </details>

        <details>
          <summary><span>03</span><strong>Verification</strong><small>Tests, commit and SHA-256 provenance</small></summary>
          <div className={`${styles.drawerBody} ${styles.drawerBlue}`}>
            <div className={styles.evidenceGrid}>
              <div className={styles.testBlock}>
                <span>Verification</span>
                <strong>{showcase.verification.passedTests}<small> / {showcase.verification.totalTests}</small></strong>
                <p>{showcase.verification.testCommand} · declared Node {declaredNodeVersions.join(" + ")}</p>
              </div>
              <div className={styles.fingerprintBlock}>
                <span>Core SHA-256</span>
                <strong>{evidenceShort}<wbr />…</strong>
                <p>Inputs, scenarios, guards and boundaries are stable-key serialized before hashing.</p>
              </div>
              <div className={styles.commitBlock}>
                <span>Engine commit</span>
                <strong>{showcase.provenance.engineCommit.slice(0, 12)}</strong>
                <p>{showcase.provenance.generatedAt}</p>
              </div>
            </div>
            <div className={styles.techStrip} aria-label="Technology stack">
              <span>Runtime &amp; connectivity</span>
              {study.stack.flatMap((group) => group.items).map((item) => <strong key={item}>{item}</strong>)}
            </div>
            <div className={styles.auditStrip} aria-label="Append-only evidence stages">
              <span>snapshot.accepted</span><i>→</i><span>candidate.ranked</span><i>→</i><span>plan.validated</span><i>→</i><span>replay.recorded</span>
            </div>
          </div>
        </details>

        <details id="boundary">
          <summary><span>04</span><strong>Boundary &amp; upgrades</strong><small>No live calls, orders or profit claims</small></summary>
          <div className={styles.drawerBody}>
            <p className={styles.boundaryStatement}>{showcase.boundary.statement}</p>
            <ul className={styles.boundaryList}>
              <li><span>Synthetic tape</span><strong>{showcase.boundary.syntheticData ? "Yes" : "No"}</strong></li>
              <li><span>Live market calls</span><strong>{showcase.boundary.liveMarketData ? "Yes" : "No"}</strong></li>
              <li><span>Orders placed</span><strong>{showcase.boundary.liveTrading ? "Yes" : "No"}</strong></li>
              <li><span>Realized profit claim</span><strong>{showcase.boundary.profitClaim || showcase.boundary.realizedPnlIncluded ? "Yes" : "No"}</strong></li>
            </ul>
            <div className={styles.upgradeList}>
              {upgrades.map(([title, detail], index) => (
                <article key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{title}</h3><p>{detail}</p></div>
                </article>
              ))}
            </div>
          </div>
        </details>

        <details id="feed-seam">
          <summary><span>05</span><strong>Public feed seam</strong><small>SSE identity, sequence and fail-closed states</small></summary>
          <div className={styles.drawerBody}>
            <p className={styles.boundaryStatement}>A future <code>LiveUniverseSource</code> may consume a public SSE service using <code>streamId</code> and monotonic <code>sequence</code> values. Its shared snapshot contract already exposes source, state, server time and market-data time. The browser will not call Upbit directly or receive exchange API keys.</p>
            <ul className={styles.boundaryList}>
              <li><span>Transport</span><strong>SSE</strong></li>
              <li><span>Integrity</span><strong>Stream + seq</strong></li>
              <li><span>Browser → Upbit</span><strong>Never</strong></li>
              <li><span>API keys</span><strong>None</strong></li>
            </ul>
            <p className={styles.boundaryStatement}>A gap or disconnect must surface as <strong>STALE</strong>, <strong>RECONNECTING</strong> or <strong>UNAVAILABLE</strong>. It must not silently switch to synthetic data.</p>
          </div>
        </details>
      </div>
    </section>
  );
}
