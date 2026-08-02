import styles from "@/app/components/EventEdgeProjectPanel.module.css";

const terminalStates = ["S1", "S2", "S3", "S4"];

export function EventEdgeProjectPanel() {
  return (
    <figure className={styles.panel} aria-labelledby="eventedge-panel-caption">
      <div className={styles.diagram} aria-hidden="true">
        <div className={styles.statePlane}>
          {terminalStates.map((state, index) => (
            <span className={styles.terminalState} data-state={index + 1} key={state}><b>{state}</b></span>
          ))}
          <div className={styles.hiddenState}><i /></div>
        </div>

        <div className={styles.package}>
          {(["WA", "WB"] as const).map((contract) => (
            <div className={styles.orderRail} data-contract={contract} key={contract}>
              <b>{contract}</b>
              <div>{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</div>
              <span />
            </div>
          ))}
          <div className={styles.fillGate}><span>φ</span><b>.50</b></div>
          <div className={styles.packageSignal} data-eventedge-signal><i /><i /></div>
          <div className={styles.settlement}><i /><i /></div>
        </div>
      </div>

      <figcaption className={styles.visuallyHidden} id="eventedge-panel-caption">
        A geometric view of EventEdge: four terminal payoff states surround hidden game state, while two derivative order-book legs share one risk gate and atomic fill ratio before settlement.
      </figcaption>
    </figure>
  );
}
