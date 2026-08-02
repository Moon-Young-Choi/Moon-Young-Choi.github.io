import styles from "@/app/components/WorkExperienceGraphic.module.css";

type GraphicProps = {
  variant?: "panel" | "hero";
};

const correspondencePoints = Array.from({ length: 4 });

export function AvikusProjectiveField({ variant = "panel" }: GraphicProps) {
  return (
    <div className={`${styles.graphic} ${styles.avikus} ${styles[variant]}`}>
      <div className={styles.homographyField}>
        <div className={`${styles.imagePlane} ${styles.referencePlane}`}>
          {correspondencePoints.map((_, index) => <i key={`reference-${index}`} />)}
        </div>
        <div className={`${styles.imagePlane} ${styles.projectedPlane}`}>
          {correspondencePoints.map((_, index) => <i key={`projected-${index}`} />)}
        </div>
        <div className={styles.correspondenceLinks}>
          {correspondencePoints.map((_, index) => <span key={index} />)}
        </div>
        <span className={styles.overlapRegion} />
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
