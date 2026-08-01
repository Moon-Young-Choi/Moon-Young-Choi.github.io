import type { CSSProperties } from "react";
import { arbitrageShowcase, defaultShowcaseRow } from "@/app/lib/arbitrageShowcase";
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
        {row.route.slice(0, 3).map((asset, index) => (
          <span className={styles[`homeNode${index + 1}`]} key={asset}>{asset}</span>
        ))}
        <i className={styles.homeEdgeA} />
        <i className={styles.homeEdgeB} />
        <i className={styles.homeEdgeC} />
        <b className={styles.homeSignal} />
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
        <span><b>{arbitrageShowcase.verification.passedTests}</b> tests passing</span>
        <span><b>{arbitrageShowcase.guards.rows.filter((guard) => guard.passed).length}/{arbitrageShowcase.guards.rows.length}</b> baseline gates</span>
        <span><b>Off</b> live trading</span>
      </div>
    </div>
  );
}
