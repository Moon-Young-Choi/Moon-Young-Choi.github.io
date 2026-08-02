import type { CSSProperties } from "react";
import styles from "@/app/components/QuantPlatformProjectPanel.module.css";

type SurfacePoint = { x: number; y: number; z: number };

const GRID_SIZE = 11;
const SCENE_ASPECT = 630 / 248;

function surfaceHeight(u: number, v: number) {
  const primary = 0.88 * Math.exp(-2.15 * ((u - 0.22) ** 2 + 1.45 * (v + 0.12) ** 2));
  const shoulder = 0.3 * Math.exp(-7.8 * ((u + 0.62) ** 2 + 1.2 * (v - 0.46) ** 2));
  const tilt = 0.055 * (u - v);
  return primary + shoulder + tilt - 0.08;
}

function projectSurface(u: number, v: number, z: number): SurfacePoint {
  return {
    x: 50 + (u - v) * 22,
    y: 77 + (u + v) * 11 - z * 58,
    z,
  };
}

const surfaceRows = Array.from({ length: GRID_SIZE }, (_, row) => {
  const v = -1 + (row / (GRID_SIZE - 1)) * 2;
  return Array.from({ length: GRID_SIZE }, (_, column) => {
    const u = -1 + (column / (GRID_SIZE - 1)) * 2;
    return projectSurface(u, v, surfaceHeight(u, v));
  });
});

const surfaceCells = Array.from({ length: GRID_SIZE - 1 }, (_, row) => (
  Array.from({ length: GRID_SIZE - 1 }, (_, column) => {
    const corners = [
      surfaceRows[row][column],
      surfaceRows[row][column + 1],
      surfaceRows[row + 1][column + 1],
      surfaceRows[row + 1][column],
    ];
    const left = Math.min(...corners.map((point) => point.x));
    const right = Math.max(...corners.map((point) => point.x));
    const top = Math.min(...corners.map((point) => point.y));
    const bottom = Math.max(...corners.map((point) => point.y));
    const width = Math.max(right - left, 0.01);
    const height = Math.max(bottom - top, 0.01);
    const averageZ = corners.reduce((sum, point) => sum + point.z, 0) / corners.length;
    const tone = Math.max(0, Math.min(4, Math.floor(((averageZ + 0.11) / 0.93) * 5)));

    return {
      left,
      top,
      width,
      height,
      tone,
      depth: row + column,
      polygon: corners.map((point) => (
        `${((point.x - left) / width) * 100}% ${((point.y - top) / height) * 100}%`
      )).join(", "),
    };
  })
)).flat().sort((a, b) => a.depth - b.depth);

function createMeshLine(start: SurfacePoint, end: SurfacePoint) {
  const dx = end.x - start.x;
  const dy = (end.y - start.y) / SCENE_ASPECT;
  return {
    left: start.x,
    top: start.y,
    width: Math.hypot(dx, dy),
    angle: Math.atan2(dy, dx) * (180 / Math.PI),
  };
}

const meshLines = [
  ...surfaceRows.flatMap((row) => row.slice(0, -1).map((point, index) => createMeshLine(point, row[index + 1]))),
  ...Array.from({ length: GRID_SIZE }, (_, column) => (
    surfaceRows.slice(0, -1).map((row, index) => createMeshLine(row[column], surfaceRows[index + 1][column]))
  )).flat(),
];

const surfacePeak = surfaceRows.flat().reduce((peak, point) => point.z > peak.z ? point : peak);

export function QuantPlatformProjectPanel() {
  return (
    <figure className={styles.panel} aria-labelledby="quant-panel-caption">
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.surfaceMesh}>
          {surfaceCells.map((cell, index) => (
            <i
              className={styles.surfaceCell}
              data-tone={cell.tone}
              key={`cell-${index}`}
              style={{
                left: `${cell.left}%`,
                top: `${cell.top}%`,
                width: `${cell.width}%`,
                height: `${cell.height}%`,
                clipPath: `polygon(${cell.polygon})`,
              }}
            />
          ))}
          {meshLines.map((line, index) => (
            <i
              className={styles.meshLine}
              key={`line-${index}`}
              style={{
                left: `${line.left}%`,
                top: `${line.top}%`,
                width: `${line.width}%`,
                transform: `rotate(${line.angle}deg)`,
              }}
            />
          ))}
          <span
            className={styles.panelSignal}
            style={{ left: `${surfacePeak.x}%`, top: `${surfacePeak.y}%` } as CSSProperties}
          />
        </div>
      </div>

      <figcaption className={styles.visuallyHidden} id="quant-panel-caption">
        A fitted joint-probability surface rendered as a colored three-dimensional mesh over a coordinate plane.
      </figcaption>
    </figure>
  );
}
