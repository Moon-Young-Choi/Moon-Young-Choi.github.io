import styles from "@/app/components/QuantPlatform.module.css";

export function QuantPlatformProjectPanel() {
  return (
    <figure className={styles.projectPanel} aria-labelledby="quant-panel-caption">
      <div className={styles.panelCanvas} aria-hidden="true">
        <div className={styles.evidencePair}>
          {(["a", "b"] as const).map((rail) => (
            <div className={styles.panelRail} data-rail={rail} key={rail}>
              <b>{rail}</b>
              <i /><i /><i /><i />
              <span className={styles.panelSignal} />
            </div>
          ))}
        </div>
        <div className={styles.panelCalibration}><i /></div>
        <div className={styles.panelAllocation}>
          <i /><i /><i /><i /><i />
        </div>
        <span className={`${styles.panelSignal} ${styles.outputSignal}`} />
      </div>
      <figcaption className={styles.visuallyHidden} id="quant-panel-caption">
        Quant Platform architecture model. A single point-in-time cutoff feeds separate Algorithm A and B evidence rails; Market Price Service owns normalized prices while Historical Return Evaluator creates mature calibration labels. Request-specific calibration is followed by COSMOS distribution combination and portfolio allocation. The project is work in progress and has no live portfolio output.
      </figcaption>
    </figure>
  );
}
