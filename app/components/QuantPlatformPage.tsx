import Link from "next/link";
import type { CaseStudy } from "@/app/content";
import { quantArchitecture } from "@/app/lib/quantArchitecture";
import styles from "@/app/components/QuantPlatform.module.css";

function ArchitectureCover() {
  return (
    <figure className={styles.cover} aria-labelledby="quant-cover-caption">
      <div className={styles.coverFrame} aria-hidden="true">
        <div className={styles.coverCutoff}>
          <span>Latest complete</span>
          <strong>AS-OF</strong>
        </div>
        <div className={styles.coverRails}>
          <div><b>A</b><span>Point-in-time bundle</span><i /></div>
          <div><b>B</b><span>Point-in-time bundle</span><i /></div>
        </div>
        <div className={styles.coverCalibration}>
          <span>Historical replay</span>
          <strong>CAL</strong>
        </div>
        <div className={styles.coverCosmos}>
          <span>A/B + weights</span>
          <strong>COSMOS</strong>
        </div>
        <div className={styles.coverPortfolio}>
          <i /><i /><i /><i /><i />
          <span>Allocation</span>
        </div>
        <i className={styles.coverSignal} />
      </div>
      <figcaption className={styles.visuallyHidden} id="quant-cover-caption">
        Architecture sequence: resolve one common point-in-time cutoff, prepare independent evidence bundles for Algorithm A and B, calibrate request-specific weights on complete mature historical samples, combine the current pair in COSMOS, and pass a joint distribution to portfolio optimization.
      </figcaption>
    </figure>
  );
}

function StatusMark({ value }: { value: boolean }) {
  return <span className={value ? styles.statusOn : styles.statusOff}>{value ? "Yes" : "No"}</span>;
}

export function QuantPlatformPage({ study }: { study: CaseStudy }) {
  const { boundary, contracts, deployments, domains, failureConditions, flow, lifecycle, provenance, summary } = quantArchitecture;

  return (
    <main className={styles.page}>
      <header className={`site-header ${styles.nav}`}>
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label="Quant Platform page navigation">
          <a href="#request-flow">Flow</a>
          <a href="#architecture">Architecture</a>
          <a href="#contracts">Contracts</a>
          <a href="#boundary">Boundary</a>
        </nav>
        <Link className="header-link" href="/#projects">Close ×</Link>
      </header>

      <article>
        <header className={styles.hero}>
          <div className={styles.heroMeta}>
            <span>Project / {study.number}</span>
            <div><strong>Architecture model</strong><strong>Work in progress</strong><strong>No live portfolio output</strong></div>
          </div>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p>Point-in-time evidence · request-scoped calibration</p>
              <h1>Quant<br />Platform</h1>
              <p className={styles.heroSummary}>
                A LikeC4 architecture snapshot for resolving one time-compatible forecast context, running independent algorithm services, calibrating request-specific weights, and returning only a final optimized portfolio.
              </p>
            </div>
            <ArchitectureCover />
          </div>
          <dl className={styles.heroFacts}>
            <div><dt>Operational domains</dt><dd>{summary.domainCount}</dd></div>
            <div><dt>Modeled components</dt><dd>{summary.componentCount}</dd></div>
            <div><dt>Deployment boundaries</dt><dd>{summary.deploymentBoundaryCount}</dd></div>
            <div><dt>Evidence class</dt><dd>Architecture only</dd></div>
          </dl>
        </header>

        <div className={styles.sheet}>
          <section className={styles.section} id="request-flow" aria-labelledby="quant-flow-title">
            <div className={styles.sectionLabel}>01 / Request flow</div>
            <div className={styles.sectionBody}>
              <div className={styles.sectionHeading}>
                <div>
                  <p>One request · one frozen context</p>
                  <h2 id="quant-flow-title">Access → As-of → Calibration → Forecast → COSMOS → Portfolio</h2>
                </div>
                <p>The ordering is a contract: calibration completes before the current pair is combined, and only the final portfolio may cross the response boundary.</p>
              </div>
              <ol className={styles.flowGrid}>
                {flow.map((phase) => (
                  <li key={phase.id}>
                    <span>{String(phase.order).padStart(2, "0")}</span>
                    <strong>{phase.title}</strong>
                    <small>{phase.owner}</small>
                    <p>{phase.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className={`${styles.section} ${styles.architectureSection}`} id="architecture" aria-labelledby="quant-architecture-title">
            <div className={styles.sectionLabel}>02 / Architecture</div>
            <div className={styles.sectionBody}>
              <div className={styles.sectionHeading}>
                <div>
                  <p>Navigation boundaries · not deployment units</p>
                  <h2 id="quant-architecture-title">Five operational domains</h2>
                </div>
                <p>The domain map shows ownership and forbidden crossings. Concrete cloud products remain intentionally undecided.</p>
              </div>
              <div className={styles.domainGrid}>
                {domains.map((domain, index) => (
                  <article className={styles.domainCard} key={domain.id}>
                    <header><span>{String(index + 1).padStart(2, "0")}</span><h3>{domain.title}</h3></header>
                    <p>{domain.purpose}</p>
                    <ul>
                      {domain.components.map((component) => (
                        <li key={component.id}>
                          <span>{component.kind}</span>
                          <strong>{component.title}</strong>
                          <p>{component.responsibility}</p>
                          {component.children?.length ? (
                            <dl className={styles.logicalList} aria-label={`${component.title} logical children`}>
                              {component.children.map((child) => (
                                <div key={child.id}>
                                  <dt><small>{child.kind}</small>{child.title}</dt>
                                  <dd>{child.responsibility}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className={`${styles.section} ${styles.contextSection}`} id="contracts" aria-labelledby="quant-context-title">
            <div className={styles.sectionLabel}>03 / Data contracts</div>
            <div className={styles.sectionBody}>
              <div className={styles.sectionHeading}>
                <div>
                  <p>Time compatibility before computation</p>
                  <h2 id="quant-context-title">Forecast Context is fixed once</h2>
                </div>
                <p>A and B may need different evidence, but they must refer to the same target, horizon, cutoff, and compatible version set.</p>
              </div>

              <div className={styles.contextGrid}>
                <div className={styles.contextFrame}>
                  <span>Immutable Forecast Context</span>
                  <dl>
                    <div><dt>Target</dt><dd>Asset universe</dd></div>
                    <div><dt>Horizon</dt><dd>Common supported horizon</dd></div>
                    <div><dt>As-of</dt><dd>Latest cutoff complete for A and B</dd></div>
                    <div><dt>Versions</dt><dd>Pinned compatibility manifest</dd></div>
                  </dl>
                </div>
                <figure className={styles.bundleFigure}>
                  <div aria-hidden="true">
                    <span className={styles.bundleCutoff}>COMMON AS-OF</span>
                    <div className={styles.bundleA}><b>A</b><span>Requirements A</span><i /><strong>Bundle A</strong></div>
                    <div className={styles.bundleB}><b>B</b><span>Requirements B</span><i /><strong>Bundle B</strong></div>
                    <div className={styles.bundleGate}>PAIR<br />OR FAIL</div>
                  </div>
                  <figcaption>
                    Requirements and evidence remain separate. The gateway admits both compatible conclusions together or returns a failure; it never emits a partial pair.
                  </figcaption>
                </figure>
              </div>

              <div className={styles.contractGrid}>
                {contracts.map((contract, index) => (
                  <article key={contract.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h3>{contract.title}</h3>
                    <p>{contract.rule}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="quant-lifecycle-title">
            <div className={styles.sectionLabel}>04 / Evidence lifecycle</div>
            <div className={styles.sectionBody}>
              <div className={styles.sectionHeading}>
                <div>
                  <p>Request-scoped reuse</p>
                  <h2 id="quant-lifecycle-title">Reuse without lookahead</h2>
                </div>
                <p>Market Price Service owns normalization and coverage; Historical Return Evaluator alone turns a matching result window into a mature label. Neither result crosses the request boundary.</p>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.lifecycleTable}>
                  <caption>Public text alternative for the evidence lifecycle</caption>
                  <thead><tr><th scope="col">Data class</th><th scope="col">Created by</th><th scope="col">Permitted reuse</th><th scope="col">Cleanup</th></tr></thead>
                  <tbody>
                    {lifecycle.map((row) => (
                      <tr key={row.dataClass}>
                        <th scope="row">{row.dataClass}</th><td>{row.createdBy}</td><td>{row.reuseBoundary}</td><td>{row.cleanup}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className={`${styles.section} ${styles.deploymentSection}`} aria-labelledby="quant-deployment-title">
            <div className={styles.sectionLabel}>05 / Deployment boundary</div>
            <div className={styles.sectionBody}>
              <div className={styles.sectionHeading}>
                <div>
                  <p>Five non-overlapping GCP projects</p>
                  <h2 id="quant-deployment-title">Isolation before product selection</h2>
                </div>
                <p>The model fixes ownership boundaries only. It does not select managed products, runtime sizes, regions, or a production topology.</p>
              </div>
              <ol className={styles.deploymentGrid}>
                {deployments.map((deployment, index) => (
                  <li key={deployment.id}>
                    <span>GCP / {String(index + 1).padStart(2, "0")}</span>
                    <h3>{deployment.title}</h3>
                    <p>{deployment.purpose}</p>
                    <small>Product selection pending</small>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className={`${styles.section} ${styles.boundarySection}`} id="boundary" aria-labelledby="quant-boundary-title">
            <div className={styles.sectionLabel}>06 / Failure & boundary</div>
            <div className={styles.sectionBody}>
              <div className={styles.sectionHeading}>
                <div>
                  <p>Fail closed · claim narrowly</p>
                  <h2 id="quant-boundary-title">What stops the request</h2>
                </div>
                <p>A failed prerequisite is visible as failure. The architecture does not substitute a stale, partial, or simulated portfolio result.</p>
              </div>
              <div className={styles.failureGrid}>
                <ol>
                  {failureConditions.map((condition, index) => (
                    <li key={condition}><span>{String(index + 1).padStart(2, "0")}</span><p>{condition}</p></li>
                  ))}
                </ol>
                <div className={styles.boundaryCard}>
                  <span>Published evidence boundary</span>
                  <dl>
                    <div><dt>Architecture model only</dt><dd><StatusMark value={boundary.architectureModelOnly} /></dd></div>
                    <div><dt>Live portfolio output</dt><dd><StatusMark value={boundary.livePortfolioOutput} /></dd></div>
                    <div><dt>Implemented service claim</dt><dd><StatusMark value={boundary.implementedServiceClaim} /></dd></div>
                    <div><dt>Performance claim</dt><dd><StatusMark value={boundary.publishedPerformanceClaim} /></dd></div>
                    <div><dt>Cloud products selected</dt><dd><StatusMark value={boundary.cloudProductsSelected} /></dd></div>
                    <div><dt>Public repository</dt><dd><StatusMark value={boundary.publicRepository} /></dd></div>
                  </dl>
                  <div>
                    <strong>Out of scope</strong>
                    <ul>{boundary.outOfScope.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className={styles.snapshotStrip} aria-label="Quant architecture snapshot provenance">
            <span>Frozen public snapshot</span>
            <strong>{provenance.capturedOn}</strong>
            <span>LikeC4 source</span>
            <code>{provenance.sourceSha256.slice(0, 12)}</code>
            <span>{summary.deploymentUnitCount} deployment units · {summary.logicalComponentCount} logical children</span>
            <span>{summary.viewCount} validated views · QP-001—012</span>
            <span>No local paths · no live data</span>
          </aside>

          <footer className={styles.footer}>
            <div><span>Source status</span><strong>Private architecture artifact · no public repository</strong></div>
            <Link href="/#projects">Back to projects ↑</Link>
          </footer>
        </div>
      </article>
    </main>
  );
}
