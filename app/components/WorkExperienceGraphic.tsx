import styles from "@/app/components/WorkExperienceGraphic.module.css";
import type { CSSProperties } from "react";

type GraphicProps = {
  variant?: "panel" | "hero";
};

const signalTargets = [
  { x: 24, y: 31 },
  { x: 48, y: 20 },
  { x: 73, y: 28 },
  { x: 78, y: 53 },
  { x: 67, y: 77 },
  { x: 35, y: 75 },
  { x: 22, y: 58 },
];

const signalCycleSeconds = 7.7;
const signalSlotSeconds = signalCycleSeconds / signalTargets.length;
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
                "--signal-delay": `${index * signalSlotSeconds}s`,
              } as SignalTargetStyle}
            >
              <i className={styles.targetPoint} />
              <i className={styles.signalWave} />
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
