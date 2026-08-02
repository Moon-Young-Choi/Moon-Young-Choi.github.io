import styles from "@/app/components/WorkExperienceGraphic.module.css";
import type { CSSProperties } from "react";

type GraphicProps = {
  variant?: "panel" | "hero";
};

const signalTargets = [
  { x: 41.6, y: 40.0 },
  { x: 30.1, y: 40.7 },
  { x: 36.9, y: 21.9 },
  { x: 82.6, y: 34.8 },
  { x: 87.6, y: 63.7 },
  { x: 6.5, y: 61.6 },
  { x: 98.0, y: 51.7 },
];

const signalSlotSeconds = 1.35;
type SignalTargetStyle = CSSProperties & Record<`--${string}`, string>;

export function AvikusProjectiveField({ variant = "panel" }: GraphicProps) {
  return (
    <div className={`${styles.graphic} ${variant === "hero" ? styles.hero : ""}`}>
      <div className={styles.signalField} aria-hidden="true">
        {signalTargets.map((target, index) => {
          const reach = Math.hypot(target.x - 50, target.y - 50);
          return (
            <span
              className={styles.signalTarget}
              key={`${target.x}-${target.y}`}
              style={{
                "--target-x": `${target.x}%`,
                "--target-y": `${target.y}%`,
                "--wave-diameter": `${reach * 2}%`,
                "--signal-delay": `${(index * signalSlotSeconds).toFixed(2)}s`,
              } as SignalTargetStyle}
            >
              <i className={styles.targetPoint} />
              <i className={`${styles.signalWave} ${styles.primaryWave}`} />
              <i className={`${styles.signalWave} ${styles.secondaryWave}`} />
            </span>
          );
        })}
        <i className={styles.ownShip} />
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
