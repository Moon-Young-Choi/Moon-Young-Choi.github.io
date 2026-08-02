import { defaultShowcaseRow } from "@/app/lib/arbitrageShowcase";
import { TriangleRouteGraphic } from "@/app/components/TriangleRouteGraphic";
import styles from "@/app/components/ArbitrageLab.module.css";

export function ArbitrageProjectPanel() {
  const row = defaultShowcaseRow();
  if (!row) return null;

  return (
    <div className={styles.homePanel} aria-hidden="true">
      <div className={styles.homeTriangle}>
        <TriangleRouteGraphic assets={row.route} direction={row.direction} variant="card" />
      </div>
    </div>
  );
}
