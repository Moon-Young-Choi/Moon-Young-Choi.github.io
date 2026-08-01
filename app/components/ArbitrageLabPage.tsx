import Link from "next/link";
import type { CaseStudy } from "@/app/content";
import { ArbitrageMarketConsole } from "@/app/components/ArbitrageMarketConsole";
import { ArbitrageStatusDock } from "@/app/components/ArbitrageStatusDock";
import { TriangleRouteGraphic } from "@/app/components/TriangleRouteGraphic";
import { arbitrageShowcase } from "@/app/lib/arbitrageShowcase";
import { arbitrageUniverseManifest } from "@/app/lib/arbitrageUniverse";
import styles from "@/app/components/ArbitrageLab.module.css";

export function ArbitrageLabPage({ study }: { study: CaseStudy }) {
  return (
    <main className={styles.page}>
      <header className={`site-header ${styles.nav}`}>
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label="Arbitrage lab navigation">
          <a href="#market-universe">Universe</a>
          <a href="#selected-route">Route</a>
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
                <TriangleRouteGraphic assets={["KRW", "BTC", "ETH"]} direction="forward" variant="hero" />
              </div>
              <div className={styles.heroReadout}>
                <span>All valid listed triangles</span>
                <strong>Forward × reverse</strong>
                <span>Depth × fee × time</span>
              </div>
            </div>
          </div>
          <dl className={styles.heroFacts}>
            <div><dt>Listed-pair topology</dt><dd>{arbitrageUniverseManifest.marketCount.toLocaleString("en-US")} pairs</dd></div>
            <div><dt>Unique triangles</dt><dd>{arbitrageUniverseManifest.triangleSetCount.toLocaleString("en-US")}</dd></div>
            <div><dt>Directional points</dt><dd>{arbitrageUniverseManifest.routeCount.toLocaleString("en-US")}</dd></div>
            <div><dt>Market feed / trading</dt><dd>Simulated / off</dd></div>
          </dl>
        </header>

        <ArbitrageMarketConsole manifest={arbitrageUniverseManifest} />

        <ArbitrageStatusDock
          directionalPointCount={arbitrageUniverseManifest.routeCount}
          marketSnapshotAt={arbitrageUniverseManifest.capturedAt}
          showcase={arbitrageShowcase}
          study={study}
          triangleCount={arbitrageUniverseManifest.triangleSetCount}
        />

        <footer className={styles.footer}>
          <div><span>Public source</span><a href={study.github} target="_blank" rel="noreferrer">Open GitHub repository ↗</a></div>
          <Link href="/#projects">Back to projects ↑</Link>
        </footer>
      </article>
    </main>
  );
}
