"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import styles from "@/app/components/WorkExperiencePage.module.css";

const samples = [
  { value: 42, state: "normal" }, { value: 48, state: "normal" }, { value: 55, state: "normal" },
  { value: 51, state: "normal" }, { value: 61, state: "normal" }, { value: 58, state: "normal" },
  { value: 9, state: "missing" }, { value: 9, state: "missing" }, { value: 64, state: "normal" },
  { value: 93, state: "outlier" }, { value: 59, state: "normal" }, { value: 54, state: "normal" },
  { value: 49, state: "normal" }, { value: 66, state: "normal" }, { value: 61, state: "normal" },
  { value: 9, state: "missing" }, { value: 57, state: "normal" }, { value: 53, state: "normal" },
  { value: 60, state: "normal" }, { value: 56, state: "normal" }, { value: 50, state: "normal" },
  { value: 63, state: "normal" }, { value: 58, state: "normal" }, { value: 54, state: "normal" },
] as const;

export function AvikusSignalRibbon() {
  const [received, setReceived] = useState(0);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const clearTimer = () => {
      if (timer) window.clearTimeout(timer);
      timer = undefined;
    };

    const start = () => {
      clearTimer();
      if (motionQuery.matches) {
        setReceived(samples.length);
        return;
      }

      let cursor = 0;
      setReceived(0);
      const advance = () => {
        if (stopped || motionQuery.matches) return;
        cursor += 1;
        setReceived(cursor);
        timer = window.setTimeout(cursor === samples.length ? start : advance, cursor === samples.length ? 1100 : 145);
      };
      timer = window.setTimeout(advance, 240);
    };

    motionQuery.addEventListener("change", start);
    start();
    return () => {
      stopped = true;
      clearTimer();
      motionQuery.removeEventListener("change", start);
    };
  }, []);

  return (
    <figure className={styles.signalFigure} aria-labelledby="signal-caption">
      <div className={styles.signalPlot} data-received-count={received} aria-hidden="true">
        <div className={styles.signalBaseline} />
        {samples.map((sample, index) => (
          <i
            data-received={index < received ? "true" : "false"}
            data-signal-state={sample.state}
            key={`${sample.state}-${index}`}
            style={{ "--sample": `${sample.value}%` } as CSSProperties}
          />
        ))}
      </div>
      <figcaption id="signal-caption"><b>Synthetic NMEA 0183 observation stream.</b> Blue cells are received samples, outlined cells are missing observations, and the Coral cell is an injected outlier.</figcaption>
    </figure>
  );
}
