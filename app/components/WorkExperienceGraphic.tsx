import styles from "@/app/components/WorkExperienceGraphic.module.css";

type GraphicProps = {
  variant?: "panel" | "hero";
};

function ShipWire({ thermal = false }: { thermal?: boolean }) {
  return (
    <div className={`${styles.shipTrack} ${thermal ? styles.thermalShip : styles.visibleShip}`}>
      <span className={styles.shipCuboid}>
        <i /><i /><i /><i /><b />
      </span>
    </div>
  );
}

export function AvikusProjectiveField({ variant = "panel" }: GraphicProps) {
  return (
    <div className={`${styles.graphic} ${styles.avikus} ${styles[variant]}`}>
      <div className={styles.panoramaFrame}>
        <span className={styles.horizon} />
        <div className={styles.seaSurface}><i /><i /><i /></div>
        <ShipWire />
        <ShipWire thermal />
        <div className={styles.thermalWindow}><span /></div>
      </div>
    </div>
  );
}

export function FinburhDependencyLattice({ variant = "panel" }: GraphicProps) {
  return (
    <div className={`${styles.graphic} ${styles.finburh} ${styles[variant]}`}>
      <div className={styles.commandRoutes}>
        <span className={styles.conversationRoute}><i /></span>
        <span className={styles.taskRoute}><i /></span>
        <span className={styles.taskResearchRoute}><i /></span>
        <span className={styles.workResearchRoute}><i /></span>
      </div>
      <span className={`${styles.agentNode} ${styles.conversationAgent}`}><i /></span>
      <span className={`${styles.agentNode} ${styles.taskAgent}`}><i /></span>
      <div className={styles.workAgent}><i /><i /><i /></div>
      <span className={`${styles.agentNode} ${styles.researchAgent}`}><i /></span>
    </div>
  );
}
