import styles from "@/app/components/EventEdgeProjectPanel.module.css";

const matrix = [
  [100, 0, 100],
  [100, 0, 0],
  [0, 100, 0],
  [0, 100, 100],
];

export function EventEdgeProjectPanel() {
  return (
    <div className={styles.panel} aria-hidden="true">
      <div className={styles.canvas}>
        <div className={styles.publicState}><span>Public state</span><i /><i /><i /></div>
        <div className={styles.hiddenState}><span>Hidden</span><b>?</b></div>
        <div className={styles.matrix}>
          <div className={styles.matrixHead}><span>State</span><span>WA</span><span>WB</span><span>VOL</span></div>
          {matrix.map((row, index) => (
            <div className={styles.matrixRow} key={index}>
              <b>S{index + 1}</b>
              {row.map((value, column) => <i data-on={value === 100} key={column} />)}
            </div>
          ))}
        </div>
        <div className={styles.book}>
          <span>Bid</span><span>Ask</span>
          {[42, 64, 86, 58, 32].map((height, index) => <i className={styles.bid} key={`b${index}`} style={{ height: `${height}%` }} />)}
          {[29, 49, 77, 92, 54].map((height, index) => <i className={styles.ask} key={`a${index}`} style={{ height: `${height}%` }} />)}
        </div>
        <div className={styles.riskCompare}>
          <div><span>A</span><i style={{ width: "92%" }} /><b>REJECT</b></div>
          <div><span>B</span><i style={{ width: "31%" }} /><b>φ .50</b></div>
        </div>
        <i className={styles.signal} data-eventedge-signal />
      </div>
    </div>
  );
}
