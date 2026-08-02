import styles from "@/app/components/WorkExperienceGraphic.module.css";

type GraphicProps = {
  variant?: "panel" | "hero";
};

const correspondencePoints = Array.from({ length: 4 });
const inputFrameClasses = [styles.inputFrameOne, styles.inputFrameTwo, styles.inputFrameThree];
const linkSetClasses = [styles.linkSetOne, styles.linkSetTwo, styles.linkSetThree];

export function AvikusProjectiveField({ variant = "panel" }: GraphicProps) {
  return (
    <div className={`${styles.graphic} ${variant === "hero" ? styles.hero : ""}`}>
      <div className={styles.homographyField}>
        <div className={`${styles.imagePlane} ${styles.referencePlane}`}>
          {correspondencePoints.map((_, index) => <i key={`reference-${index}`} />)}
        </div>
        <div className={styles.inputFrames}>
          {inputFrameClasses.map((frameClass, frameIndex) => (
            <div className={`${styles.imagePlane} ${styles.inputFrame} ${frameClass}`} key={frameClass}>
              {correspondencePoints.map((_, pointIndex) => <i key={`input-${frameIndex}-${pointIndex}`} />)}
            </div>
          ))}
        </div>
        <div className={styles.correspondenceLinks}>
          {linkSetClasses.map((linkClass) => (
            <div className={`${styles.linkSet} ${linkClass}`} key={linkClass}>
              {correspondencePoints.map((_, index) => <span key={index} />)}
            </div>
          ))}
        </div>
        <span className={styles.overlapRegion} />
      </div>
    </div>
  );
}

export function FinburhDependencyLattice({ variant = "panel" }: GraphicProps) {
  return (
    <div className={`${styles.graphic} ${styles.finburh} ${variant === "hero" ? styles.hero : ""}`}>
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
