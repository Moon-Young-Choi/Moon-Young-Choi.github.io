import styles from "@/app/components/WorkExperienceGraphic.module.css";

type GraphicProps = {
  variant?: "panel" | "hero";
};

const gridCells = Array.from({ length: 16 });
const packets = Array.from({ length: 12 });
const routes = Array.from({ length: 6 });

export function AvikusProjectiveField({ variant = "panel" }: GraphicProps) {
  return (
    <div className={`${styles.graphic} ${styles.avikus} ${styles[variant]}`}>
      <div className={`${styles.projectionGrid} ${styles.gridA}`}>{gridCells.map((_, index) => <i key={`a-${index}`} />)}</div>
      <div className={`${styles.projectionGrid} ${styles.gridB}`}>{gridCells.map((_, index) => <i key={`b-${index}`} />)}</div>
      <div className={styles.correspondenceField}>{routes.map((_, index) => <i key={index} />)}</div>
      <div className={styles.packetOrbit}>{packets.map((_, index) => <i data-missing={index === 3 || index === 8 || undefined} key={index} />)}</div>
      <span className={styles.projectiveCore} />
      <span className={styles.speedMark}>350×</span>
    </div>
  );
}

export function FinburhDependencyLattice({ variant = "panel" }: GraphicProps) {
  return (
    <div className={`${styles.graphic} ${styles.finburh} ${styles[variant]}`}>
      <div className={styles.dependencyRoutes}>{routes.map((_, index) => <i key={index} />)}</div>
      <div className={styles.evidenceParticles}>{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</div>
      <span className={styles.conversationCore} />
      <div className={styles.workNodes}>{Array.from({ length: 4 }, (_, index) => <i data-failed={index === 2 || undefined} key={index} />)}</div>
      <div className={styles.assumptionBranch}><i /><i /><i /><b>+</b><b>×</b></div>
      <div className={`${styles.outputCluster} ${styles.wordCluster}`}><i /><i /><i /></div>
      <div className={`${styles.outputCluster} ${styles.slideCluster}`}><i /><i /><i /></div>
      <div className={`${styles.outputCluster} ${styles.sheetCluster}`}><i /></div>
      <span className={styles.routeSignal} />
    </div>
  );
}
