import styles from "@/app/components/PwrTheoryProjectPanel.module.css";

export function PwrTheoryProjectPanel() {
  return (
    <div className={styles.panel} aria-hidden="true">
      <div className={styles.header}>
        <span>Pooled covariance</span>
        <b>Proof chain / 49 objects</b>
      </div>
      <div className={styles.matrix}>
        {Array.from({ length: 36 }, (_, index) => (
          <i key={index} data-band={Math.abs(Math.floor(index / 6) - (index % 6)) <= 1 ? "signal" : "noise"} />
        ))}
        <span className={styles.scanWindow}>B*</span>
      </div>
      <div className={styles.whitener}>
        <span>ΣP</span><b>−1/2</b>
      </div>
      <div className={styles.root}>
        <span>λmax</span>
        <i /><i /><i /><i />
      </div>
      <div className={styles.orbit}>
        {Array.from({ length: 9 }, (_, index) => <i key={index} className={index === 7 ? styles.observed : undefined} />)}
        <span>orbit rank</span>
      </div>
      <div className={styles.footer}>
        <span>exact level</span><span>power</span><span>minimax</span>
      </div>
    </div>
  );
}
