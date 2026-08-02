import styles from "@/app/components/PwrTheoryProjectPanel.module.css";

export function PwrTheoryProjectPanel() {
  return (
    <div className={styles.panel} aria-hidden="true">
      <div className={styles.matrix}>
        {Array.from({ length: 49 }, (_, index) => {
          const row = Math.floor(index / 7);
          const column = index % 7;
          const distance = Math.abs(row - column);
          const tone = distance === 0 && row % 3 === 0 ? "axis" : distance <= 1 ? "signal" : "noise";

          return <i className={styles.cell} data-tone={tone} key={index} />;
        })}
        <span className={styles.scanWindow} />
      </div>
    </div>
  );
}
