import styles from "@/app/components/WorkExperienceGraphic.module.css";
import type { CSSProperties } from "react";

type GraphicProps = {
  variant?: "panel" | "hero";
};

const spiralScatter = [
  [-11, 8, -9], [7, -9, 8], [-8, -6, -7], [10, 5, 10], [-5, 9, -8], [8, -7, 6], [-9, 4, -10],
  [6, 8, 7], [-7, -8, -6], [9, 3, 9], [-5, 7, -8], [7, -5, 6], [-6, -3, -7], [5, 5, 8],
] as const;

const spiralPoints = Array.from({ length: 15 }, (_, index) => {
  const progress = index / 14;
  const theta = 2.72 + progress * Math.PI * 2.3;
  const radius = 1 - progress * 0.76;
  return {
    x: 50 + 40 * radius * Math.cos(theta),
    y: 50 + 39 * radius * Math.sin(theta),
  };
});

const spiralTiles = spiralPoints.slice(0, -1).map((point, index) => {
  const next = spiralPoints[index + 1];
  const dx = next.x - point.x;
  const dy = next.y - point.y;
  const displayDy = dy / 1.62;
  const [scatterX, scatterY, scatterRotate] = spiralScatter[index];
  return {
    x: (point.x + next.x) / 2,
    y: (point.y + next.y) / 2,
    width: Math.hypot(dx, displayDy) + 0.8,
    angle: Math.atan2(displayDy, dx) * 180 / Math.PI,
    scatterX,
    scatterY,
    scatterRotate,
  };
});

type SpiralTileStyle = CSSProperties & Record<`--${string}`, string | number>;

export function AvikusProjectiveField({ variant = "panel" }: GraphicProps) {
  return (
    <div className={`${styles.graphic} ${variant === "hero" ? styles.hero : ""}`}>
      <div className={styles.mosaicField} aria-hidden="true">
        <div className={styles.mosaicSpiral}>
          {spiralTiles.map((tile, index) => (
            <i
              className={styles.spiralTile}
              key={index}
              style={{
                "--tile-x": `${tile.x}%`,
                "--tile-y": `${tile.y}%`,
                "--tile-width": `${tile.width}%`,
                "--tile-angle": `${tile.angle}deg`,
                "--scatter-x": `${tile.scatterX}px`,
                "--scatter-y": `${tile.scatterY}px`,
                "--scatter-rotate": `${tile.scatterRotate}deg`,
                "--tile-delay": `${index * 0.22}s`,
                "--tile-fill": index % 3 === 1
                  ? "color-mix(in srgb, var(--blue) 22%, var(--paper))"
                  : "var(--paper)",
              } as SpiralTileStyle}
            />
          ))}
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
