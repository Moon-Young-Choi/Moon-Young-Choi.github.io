import type { CSSProperties } from "react";
import { arbitrageShowcase, defaultShowcaseRow } from "@/app/lib/arbitrageShowcase";
import { arbitrageUniverseManifest } from "@/app/lib/arbitrageUniverse";
import { TriangleRouteGraphic } from "@/app/components/TriangleRouteGraphic";
import styles from "@/app/components/ArbitrageLab.module.css";

export function ArbitrageProjectPanel() {
  const row = defaultShowcaseRow();
  if (!row) return null;

  const book = row.orderbooks[0];
  const levels = [...book.bids.slice(0, 3), ...book.asks.slice(0, 3)];
  const maxSize = Math.max(...levels.map((level) => level.size), 1);

  return (
    <div className={styles.homePanel} aria-hidden="true">
      <div className={styles.homeTriangle}>
        <TriangleRouteGraphic assets={row.route} direction={row.direction} variant="card" />
      </div>
      <div className={styles.homeBook}>
        <span className={styles.homePanelLabel}>{book.market} / depth</span>
        {levels.map((level, index) => (
          <i
            className={index < 3 ? styles.homeBid : styles.homeAsk}
            key={`${level.price}-${index}`}
            style={{ "--bar": `${Math.max(12, (level.size / maxSize) * 100)}%` } as CSSProperties}
          />
        ))}
      </div>
      <div className={styles.homeStats}>
        <span><b>{arbitrageUniverseManifest.triangleSetCount}</b> listed triangles</span>
        <span><b>{arbitrageUniverseManifest.routeCount}</b> directional points</span>
        <span><b>{arbitrageShowcase.verification.passedTests}</b> engine tests</span>
      </div>
    </div>
  );
}
