import styles from "@/app/components/QuantPlatformProjectPanel.module.css";

export function QuantPlatformProjectPanel() {
  return (
    <figure className={styles.panel} aria-labelledby="quant-panel-caption">
      <div className={styles.diagram} aria-hidden="true">
        <div className={styles.cutoff}>
          {Array.from({ length: 5 }, (_, index) => <i key={index} />)}
          <span />
        </div>

        {(["a", "b"] as const).map((rail) => (
          <div className={styles.evidenceRail} data-rail={rail} key={rail}>
            <b>{rail}</b>
            <div>{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</div>
            <span className={styles.panelSignal} />
          </div>
        ))}

        <div className={styles.calibrationGate}>
          <span />
          <i />
        </div>

        <div className={styles.allocation}>
          {[38, 72, 52, 88, 30].map((height, index) => (
            <i data-active={index === 1 || index === 3} key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
        <span className={`${styles.panelSignal} ${styles.outputSignal}`} />
      </div>

      <figcaption className={styles.visuallyHidden} id="quant-panel-caption">
        A geometric view of the Quant Platform: one point-in-time cutoff feeds isolated A and B evidence rails, a central calibration gate, and a constrained portfolio allocation vector.
      </figcaption>
    </figure>
  );
}
