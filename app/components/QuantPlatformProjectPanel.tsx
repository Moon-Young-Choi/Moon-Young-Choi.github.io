import { quantArchitecture } from "@/app/lib/quantArchitecture";
import styles from "@/app/components/QuantPlatform.module.css";

export function QuantPlatformProjectPanel() {
  return (
    <figure className={styles.projectPanel} aria-labelledby="quant-panel-caption">
      <div className={styles.panelCanvas} aria-hidden="true">
        <div className={styles.panelCutoff}>
          <span>AS-OF</span>
          <i />
        </div>
        <div className={styles.panelRail} data-rail="a">
          <b>A</b><span>Evidence</span><i />
        </div>
        <div className={styles.panelRail} data-rail="b">
          <b>B</b><span>Evidence</span><i />
        </div>
        <div className={styles.panelCalibration}>CAL</div>
        <div className={styles.panelCosmos}>COSMOS</div>
        <div className={styles.panelAllocation}>
          <i /><i /><i /><i />
        </div>
        <span className={styles.panelSignal} />
      </div>
      <div className={styles.panelReadout} aria-hidden="true">
        <span>{quantArchitecture.summary.domainCount} domains</span>
        <span>Complete pair or fail</span>
        <span>No live output</span>
      </div>
      <figcaption className={styles.visuallyHidden} id="quant-panel-caption">
        Quant Platform architecture model. A single point-in-time cutoff feeds separate Algorithm A and B evidence rails; Market Price Service owns normalized prices while Historical Return Evaluator creates mature calibration labels. Request-specific calibration is followed by COSMOS distribution combination and portfolio allocation. The project is work in progress and has no live portfolio output.
      </figcaption>
    </figure>
  );
}
