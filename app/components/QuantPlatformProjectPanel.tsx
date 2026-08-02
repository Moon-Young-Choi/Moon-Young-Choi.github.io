"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import styles from "@/app/components/QuantPlatformProjectPanel.module.css";

type SurfaceGridPoint = {
  u: number;
  v: number;
  x: number;
  baseY: number;
  baseZ: number;
  motion: MotionProfile;
};

type MotionProfile = {
  amplitude: number;
  primaryRate: number;
  secondaryRate: number;
  primaryPhase: number;
  secondaryPhase: number;
};

type SurfacePoint = { x: number; y: number; z: number };
type CellGeometry = {
  left: number;
  top: number;
  width: number;
  height: number;
  polygon: string;
  color: string;
};

const GRID_SIZE = 11;
const SCENE_ASPECT = 630 / 248;
const Z_PROJECTION = 58;
const CYCLE_MS = 5_143;

function surfaceHeight(u: number, v: number) {
  const primary = 0.88 * Math.exp(-2.15 * ((u - 0.22) ** 2 + 1.45 * (v + 0.12) ** 2));
  const shoulder = 0.3 * Math.exp(-7.8 * ((u + 0.62) ** 2 + 1.2 * (v - 0.46) ** 2));
  const tilt = 0.055 * (u - v);
  return primary + shoulder + tilt - 0.08;
}

function hashedUnit(index: number, salt: number) {
  const raw = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43_758.5453;
  return raw - Math.floor(raw);
}

function motionProfile(index: number): MotionProfile {
  return {
    amplitude: 0.095 + hashedUnit(index, 1) * 0.11,
    primaryRate: 0.72 + hashedUnit(index, 2) * 0.5,
    secondaryRate: 1.5 + hashedUnit(index, 3) * 0.85,
    primaryPhase: hashedUnit(index, 4) * Math.PI * 2,
    secondaryPhase: hashedUnit(index, 5) * Math.PI * 2,
  };
}

function createGridPoint(u: number, v: number, index: number): SurfaceGridPoint {
  return {
    u,
    v,
    x: 50 + (u - v) * 22,
    baseY: 77 + (u + v) * 11,
    baseZ: surfaceHeight(u, v),
    motion: motionProfile(index),
  };
}

function animatedHeight(point: SurfaceGridPoint, phase: number) {
  const { amplitude, primaryRate, secondaryRate, primaryPhase, secondaryPhase } = point.motion;
  const primaryWave = Math.sin(phase * primaryRate + primaryPhase);
  const secondaryWave = Math.sin(phase * secondaryRate + secondaryPhase);
  return point.baseZ + amplitude * (primaryWave * 0.72 + secondaryWave * 0.28);
}

function projectSurface(point: SurfaceGridPoint, z: number): SurfacePoint {
  return {
    x: point.x,
    y: point.baseY - z * Z_PROJECTION,
    z,
  };
}

const surfaceRows = Array.from({ length: GRID_SIZE }, (_, row) => {
  const v = -1 + (row / (GRID_SIZE - 1)) * 2;
  return Array.from({ length: GRID_SIZE }, (_, column) => {
    const u = -1 + (column / (GRID_SIZE - 1)) * 2;
    return createGridPoint(u, v, row * GRID_SIZE + column);
  });
});

const surfacePoints = surfaceRows.flat();

const surfaceCells = Array.from({ length: GRID_SIZE - 1 }, (_, row) => (
  Array.from({ length: GRID_SIZE - 1 }, (_, column) => ({
    pointIndexes: [
      row * GRID_SIZE + column,
      row * GRID_SIZE + column + 1,
      (row + 1) * GRID_SIZE + column + 1,
      (row + 1) * GRID_SIZE + column,
    ],
    depth: row + column,
  }))
)).flat().sort((a, b) => a.depth - b.depth);

const meshLines = [
  ...Array.from({ length: GRID_SIZE }, (_, row) => (
    Array.from({ length: GRID_SIZE - 1 }, (_, column) => ({
      start: row * GRID_SIZE + column,
      end: row * GRID_SIZE + column + 1,
    }))
  )).flat(),
  ...Array.from({ length: GRID_SIZE }, (_, column) => (
    Array.from({ length: GRID_SIZE - 1 }, (_, row) => ({
      start: row * GRID_SIZE + column,
      end: (row + 1) * GRID_SIZE + column,
    }))
  )).flat(),
];

const surfacePeakIndex = surfacePoints.reduce(
  (peakIndex, point, index) => point.baseZ > surfacePoints[peakIndex].baseZ ? index : peakIndex,
  0,
);

function projectedPatchArea(corners: SurfacePoint[]) {
  return Math.abs(corners.reduce((sum, point, index) => {
    const next = corners[(index + 1) % corners.length];
    return sum + point.x * (next.y / SCENE_ASPECT) - next.x * (point.y / SCENE_ASPECT);
  }, 0)) / 2;
}

function surfacePointsAt(phase: number) {
  return surfacePoints.map((point) => projectSurface(point, animatedHeight(point, phase)));
}

const patchAreaRanges = (() => {
  const ranges = surfaceCells.map(() => ({ minimum: Infinity, maximum: -Infinity }));
  const sampleCount = 360;

  for (let sample = 0; sample < sampleCount; sample += 1) {
    const phase = (sample / (sampleCount - 1)) * Math.PI * 18;
    const points = surfacePointsAt(phase);
    surfaceCells.forEach((cell, index) => {
      const area = projectedPatchArea(cell.pointIndexes.map((pointIndex) => points[pointIndex]));
      ranges[index].minimum = Math.min(ranges[index].minimum, area);
      ranges[index].maximum = Math.max(ranges[index].maximum, area);
    });
  }

  return ranges;
})();

function cellGeometry(corners: SurfacePoint[], normalizedArea: number): CellGeometry {
  const left = Math.min(...corners.map((point) => point.x));
  const right = Math.max(...corners.map((point) => point.x));
  const top = Math.min(...corners.map((point) => point.y));
  const bottom = Math.max(...corners.map((point) => point.y));
  const width = Math.max(right - left, 0.01);
  const height = Math.max(bottom - top, 0.01);
  const lightness = normalizedArea * 100;

  return {
    left,
    top,
    width,
    height,
    polygon: corners.map((point) => (
      `${((point.x - left) / width) * 100}% ${((point.y - top) / height) * 100}%`
    )).join(", "),
    color: `hsl(0 0% ${lightness.toFixed(2)}%)`,
  };
}

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

function createSurfaceFrame(phase: number) {
  const points = surfacePointsAt(phase);
  const cellsWithArea = surfaceCells.map((cell) => {
    const corners = cell.pointIndexes.map((index) => points[index]);
    return { corners, area: projectedPatchArea(corners) };
  });

  return {
    cells: cellsWithArea.map(({ corners, area }, index) => {
      const range = patchAreaRanges[index];
      const areaRange = Math.max(range.maximum - range.minimum, Number.EPSILON);
      const normalizedArea = Math.max(0, Math.min(1, (area - range.minimum) / areaRange));
      return cellGeometry(corners, normalizedArea);
    }),
    lines: meshLines.map((line) => createMeshLine(points[line.start], points[line.end])),
    peak: points[surfacePeakIndex],
  };
}

const initialFrame = createSurfaceFrame(0);

export function QuantPlatformProjectPanel() {
  const cellRefs = useRef<Array<HTMLElement | null>>([]);
  const lineRefs = useRef<Array<HTMLElement | null>>([]);
  const peakRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    let lastPaint = -Infinity;
    const startedAt = performance.now();

    const paint = (now: number) => {
      if (now - lastPaint >= 32 || reducedMotion) {
        const phase = reducedMotion ? 0 : ((now - startedAt) / CYCLE_MS) * Math.PI * 2;
        const frame = createSurfaceFrame(phase);

        frame.cells.forEach((cell, index) => {
          const node = cellRefs.current[index];
          if (!node) return;
          node.style.left = `${cell.left}%`;
          node.style.top = `${cell.top}%`;
          node.style.width = `${cell.width}%`;
          node.style.height = `${cell.height}%`;
          node.style.clipPath = `polygon(${cell.polygon})`;
          node.style.backgroundColor = cell.color;
        });

        frame.lines.forEach((line, index) => {
          const node = lineRefs.current[index];
          if (!node) return;
          node.style.left = `${line.left}%`;
          node.style.top = `${line.top}%`;
          node.style.width = `${line.width}%`;
          node.style.transform = `rotate(${line.angle}deg)`;
        });

        if (peakRef.current) {
          peakRef.current.style.left = `${frame.peak.x}%`;
          peakRef.current.style.top = `${frame.peak.y}%`;
        }
        lastPaint = now;
      }

      if (!reducedMotion) animationFrame = window.requestAnimationFrame(paint);
    };

    paint(startedAt);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <figure className={styles.panel} aria-labelledby="quant-panel-caption">
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.surfaceMesh}>
          {initialFrame.cells.map((cell, index) => (
            <i
              className={styles.surfaceCell}
              key={`cell-${index}`}
              ref={(node) => { cellRefs.current[index] = node; }}
              style={{
                left: `${cell.left}%`,
                top: `${cell.top}%`,
                width: `${cell.width}%`,
                height: `${cell.height}%`,
                clipPath: `polygon(${cell.polygon})`,
                backgroundColor: cell.color,
              }}
            />
          ))}
          {initialFrame.lines.map((line, index) => (
            <i
              className={styles.meshLine}
              key={`line-${index}`}
              ref={(node) => { lineRefs.current[index] = node; }}
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
            ref={peakRef}
            style={{ left: `${initialFrame.peak.x}%`, top: `${initialFrame.peak.y}%` } as CSSProperties}
          />
        </div>
      </div>

      <figcaption className={styles.visuallyHidden} id="quant-panel-caption">
        A fitted joint-probability surface whose fixed planar grid points follow independent smooth height paths, with each patch&apos;s relative projected area mapped continuously from black to white.
      </figcaption>
    </figure>
  );
}
