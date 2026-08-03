"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import styles from "@/app/components/WorkExperienceGraphic.module.css";

const CELL_COUNT = 8;
const POINT_COUNT = CELL_COUNT + 1;
const FRAME_INTERVAL = 1000 / 30;
const TAU = Math.PI * 2;

type GridPoint = {
  column: number;
  row: number;
};

type GridSegment = {
  from: number;
  orientation: "horizontal" | "vertical";
  to: number;
};

type SignalTarget = {
  x: number;
  y: number;
};

type AvikusWaterGridProps = {
  cycleSeconds: number;
  slotSeconds: number;
  targets: readonly SignalTarget[];
};

const gridPoints: GridPoint[] = Array.from({ length: POINT_COUNT * POINT_COUNT }, (_, index) => ({
  column: index % POINT_COUNT,
  row: Math.floor(index / POINT_COUNT),
}));

const gridSegments: GridSegment[] = [
  ...Array.from({ length: POINT_COUNT }, (_, row) =>
    Array.from({ length: CELL_COUNT }, (_, column) => ({
      from: row * POINT_COUNT + column,
      orientation: "horizontal" as const,
      to: row * POINT_COUNT + column + 1,
    })),
  ).flat(),
  ...Array.from({ length: POINT_COUNT }, (_, column) =>
    Array.from({ length: CELL_COUNT }, (_, row) => ({
      from: row * POINT_COUNT + column,
      orientation: "vertical" as const,
      to: (row + 1) * POINT_COUNT + column,
    })),
  ).flat(),
];

const gridCells = Array.from({ length: CELL_COUNT * CELL_COUNT }, (_, index) => {
  const column = index % CELL_COUNT;
  const row = Math.floor(index / CELL_COUNT);
  return {
    corners: [
      row * POINT_COUNT + column,
      row * POINT_COUNT + column + 1,
      (row + 1) * POINT_COUNT + column + 1,
      (row + 1) * POINT_COUNT + column,
    ],
  };
});

const rippleOffsets = [0.05, 0.22];
const rippleTravelSeconds = 0.8;

function unitHash(value: number) {
  const sine = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return sine - Math.floor(sine);
}

function initialPointStyle(point: GridPoint): CSSProperties {
  return {
    left: `${(point.column / CELL_COUNT) * 100}%`,
    top: `${(point.row / CELL_COUNT) * 100}%`,
  };
}

function initialSegmentStyle(segment: GridSegment): CSSProperties {
  const point = gridPoints[segment.from];
  return {
    left: `${(point.column / CELL_COUNT) * 100}%`,
    top: `${(point.row / CELL_COUNT) * 100}%`,
    transform: segment.orientation === "vertical" ? "rotate(90deg)" : undefined,
    width: `${100 / CELL_COUNT}%`,
  };
}

export function AvikusWaterGrid({ cycleSeconds, slotSeconds, targets }: AvikusWaterGridProps) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Array<HTMLElement | null>>([]);
  const pointRefs = useRef<Array<HTMLElement | null>>([]);
  const segmentRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastPaint = -Infinity;
    let width = field.getBoundingClientRect().width;
    let height = field.getBoundingClientRect().height;

    const draw = (timestamp: number, forceStatic = false) => {
      const isStatic = forceStatic || motionQuery.matches;
      const seconds = timestamp / 1000;
      const scale = Math.min(width, height);
      const positions = gridPoints.map((point, index) => {
        const baseX = (point.column / CELL_COUNT) * width;
        const baseY = (point.row / CELL_COUNT) * height;
        if (isStatic) return { x: baseX, y: baseY };

        const xPhase = unitHash(index + 1) * TAU;
        const yPhase = unitHash(index + 103) * TAU;
        const xPeriod = 4.8 + unitHash(index + 211) * 3.7;
        const yPeriod = 5.1 + unitHash(index + 307) * 3.9;
        const xAmplitude = scale * (0.004 + unitHash(index + 401) * 0.009);
        const yAmplitude = scale * (0.004 + unitHash(index + 503) * 0.009);
        const x = baseX + xAmplitude * (
          Math.sin((seconds / xPeriod) * TAU + xPhase) * 0.72
          + Math.sin((seconds / (xPeriod * 0.61)) * TAU + yPhase) * 0.28
        );
        const y = baseY + yAmplitude * (
          Math.sin((seconds / yPeriod) * TAU + yPhase) * 0.7
          + Math.sin((seconds / (yPeriod * 0.67)) * TAU + xPhase) * 0.3
        );
        return { x, y };
      });

      positions.forEach((position, index) => {
        const point = pointRefs.current[index];
        if (!point) return;
        point.style.left = "0";
        point.style.top = "0";
        point.style.transform = `translate3d(${position.x - 1}px, ${position.y - 1}px, 0)`;
      });

      const cycleTime = seconds % cycleSeconds;
      let litCells = 0;
      gridCells.forEach((cell, index) => {
        const tile = cellRefs.current[index];
        if (!tile) return;
        const corners = cell.corners.map((corner) => positions[corner]);
        tile.style.clipPath = `polygon(${corners.map(({ x, y }) => `${x}px ${y}px`).join(", ")})`;

        if (isStatic) {
          tile.style.opacity = "0";
          return;
        }

        const center = corners.reduce((sum, corner) => ({ x: sum.x + corner.x / 4, y: sum.y + corner.y / 4 }), { x: 0, y: 0 });
        const bandWidth = scale * 0.052;
        let brightness = 0;
        targets.forEach((target, targetIndex) => {
          const source = { x: (target.x / 100) * width, y: (target.y / 100) * height };
          const reach = Math.hypot(source.x - width / 2, source.y - height / 2);
          rippleOffsets.forEach((offset) => {
            const elapsed = cycleTime - targetIndex * slotSeconds - offset;
            if (elapsed < 0 || elapsed > rippleTravelSeconds) return;
            const radius = reach * (elapsed / rippleTravelSeconds);
            const cellDistance = Math.hypot(center.x - source.x, center.y - source.y);
            const proximity = Math.max(0, 1 - Math.abs(cellDistance - radius) / bandWidth);
            brightness = Math.max(brightness, proximity * proximity);
          });
        });
        tile.style.opacity = (brightness * 0.28).toFixed(3);
        if (brightness > 0.04) litCells += 1;
      });

      gridSegments.forEach((segment, index) => {
        const line = segmentRefs.current[index];
        if (!line) return;
        const start = positions[segment.from];
        const end = positions[segment.to];
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;
        line.style.left = "0";
        line.style.top = "-0.5px";
        line.style.width = `${Math.hypot(deltaX, deltaY)}px`;
        line.style.transform = `translate3d(${start.x}px, ${start.y}px, 0) rotate(${Math.atan2(deltaY, deltaX)}rad)`;
      });

      field.dataset.gridMotion = isStatic ? "static" : "active";
      field.dataset.litCells = String(litCells);
    };

    const tick = (timestamp: number) => {
      if (timestamp - lastPaint >= FRAME_INTERVAL) {
        draw(timestamp);
        lastPaint = timestamp;
      }
      frame = window.requestAnimationFrame(tick);
    };

    const start = () => {
      window.cancelAnimationFrame(frame);
      if (motionQuery.matches) {
        draw(0, true);
      } else {
        lastPaint = -Infinity;
        frame = window.requestAnimationFrame(tick);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      const bounds = field.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      draw(performance.now(), motionQuery.matches);
    });
    resizeObserver.observe(field);
    motionQuery.addEventListener("change", start);
    start();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      motionQuery.removeEventListener("change", start);
    };
  }, [cycleSeconds, slotSeconds, targets]);

  return (
    <div className={styles.signalGrid} data-grid-cells={CELL_COUNT} ref={fieldRef}>
      {gridCells.map((cell, index) => (
        <i
          className={styles.gridCell}
          key={`cell-${cell.corners.join("-")}`}
          ref={(node) => { cellRefs.current[index] = node; }}
        />
      ))}
      {gridSegments.map((segment, index) => (
        <i
          className={styles.gridSegment}
          data-orientation={segment.orientation}
          key={`${segment.orientation}-${segment.from}-${segment.to}`}
          ref={(node) => { segmentRefs.current[index] = node; }}
          style={initialSegmentStyle(segment)}
        />
      ))}
      {gridPoints.map((point, index) => (
        <i
          className={styles.gridPoint}
          data-grid-column={point.column}
          data-grid-row={point.row}
          key={`${point.column}-${point.row}`}
          ref={(node) => { pointRefs.current[index] = node; }}
          style={initialPointStyle(point)}
        />
      ))}
    </div>
  );
}
