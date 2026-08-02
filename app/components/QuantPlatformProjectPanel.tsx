import styles from "@/app/components/QuantPlatformProjectPanel.module.css";

export function QuantPlatformProjectPanel() {
  return (
    <figure className={styles.panel} aria-labelledby="quant-panel-caption">
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.plane} />
        <div className={styles.axes}><i /><i /><i /></div>
        <div className={styles.surface}>
          {Array.from({ length: 8 }, (_, index) => (
            <i className={styles.contour} key={index} style={{
              width: `${100 - index * 10}%`,
              height: `${34 - index * 2}%`,
              bottom: `${index * 8}%`,
              opacity: 0.44 + index * 0.07,
            }} />
          ))}
          <span className={styles.panelSignal} />
        </div>
      </div>

      <figcaption className={styles.visuallyHidden} id="quant-panel-caption">
        A three-dimensional probability surface over a coordinate plane, representing the Quant Platform&apos;s combined forecast distribution.
      </figcaption>
    </figure>
  );
}
