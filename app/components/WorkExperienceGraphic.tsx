import styles from "@/app/components/WorkExperienceGraphic.module.css";

type GraphicProps = {
  variant?: "panel" | "hero";
};

export function AvikusProjectiveField({ variant = "panel" }: GraphicProps) {
  return (
    <div className={`${styles.graphic} ${variant === "hero" ? styles.hero : ""}`}>
      <div className={styles.opticalField} aria-hidden="true">
        <i className={styles.wavefrontField} />
        <i className={`${styles.aperture} ${styles.apertureOne}`} />
        <i className={`${styles.aperture} ${styles.apertureTwo}`} />
        <div className={styles.refractiveLens}>
          <i className={styles.refractedBands} />
          <i className={styles.caustic} />
        </div>
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
