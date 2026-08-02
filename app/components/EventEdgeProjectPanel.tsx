"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import styles from "@/app/components/EventEdgeProjectPanel.module.css";

const polynomialControlPoints = [
  [0, 0.72],
  [0.25, 0.56],
  [0.5, 0.66],
  [0.75, 0.28],
  [1, 0.22],
] as const;

function pricePolynomial(t: number) {
  return polynomialControlPoints.reduce((sum, [x, y], index) => {
    let basis = 1;
    for (let other = 0; other < polynomialControlPoints.length; other += 1) {
      if (other === index) continue;
      basis *= (t - polynomialControlPoints[other][0]) / (x - polynomialControlPoints[other][0]);
    }
    return sum + y * basis;
  }, 0);
}

const CHART_ASPECT = 1.85;
const PRICE_SAMPLES = 80;
const sampledPrice = Array.from({ length: PRICE_SAMPLES + 1 }, (_, index) => {
  const t = index / PRICE_SAMPLES;
  return { x: t * 100, y: pricePolynomial(t) * 100 };
});

const priceSegments = sampledPrice.slice(0, -1).map((point, index) => {
  const next = sampledPrice[index + 1];
  const dx = next.x - point.x;
  const dy = (next.y - point.y) / CHART_ASPECT;
  return {
    left: point.x,
    top: point.y,
    width: Math.hypot(dx, dy),
    angle: Math.atan2(dy, dx) * (180 / Math.PI),
  };
});

const depth = [
  [42, 66],
  [58, 82],
  [76, 96],
  [94, 88],
  [69, 72],
  [51, 54],
  [34, 39],
];

export function EventEdgeProjectPanel() {
  const tickerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const positionTicker = (t: number) => {
      ticker.style.left = `${t * 100}%`;
      ticker.style.top = `${pricePolynomial(t) * 100}%`;
    };

    if (reducedMotion) {
      positionTicker(0.72);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const t = ((now - startedAt) % 7000) / 7000;
      positionTicker(t);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <figure className={styles.panel} aria-labelledby="eventedge-panel-caption">
      <div className={styles.market} aria-hidden="true">
        <div className={styles.chart}>
          <div className={styles.pricePath}>
            {priceSegments.map((segment, index) => (
              <i key={index} style={{
                left: `${segment.left}%`,
                top: `${segment.top}%`,
                width: `${segment.width}%`,
                transform: `rotate(${segment.angle}deg)`,
              }} />
            ))}
          </div>
          <span className={styles.ticker} data-eventedge-signal ref={tickerRef} />
        </div>

        <div className={styles.orderBook}>
          {depth.map(([bid, ask], index) => (
            <div className={styles.depthLevel} key={index} style={{ "--delay": `${index * -0.23}s` } as CSSProperties}>
              <i className={styles.bid} style={{ width: `${bid}%` }} />
              <i className={styles.ask} style={{ width: `${ask}%` }} />
            </div>
          ))}
        </div>
      </div>

      <figcaption className={styles.visuallyHidden} id="eventedge-panel-caption">
        A smooth polynomial derivatives price path with a marker constrained to the same function, beside a moving bid and ask order book.
      </figcaption>
    </figure>
  );
}
