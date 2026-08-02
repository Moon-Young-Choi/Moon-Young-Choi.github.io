"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "@/app/components/PwrTheoryPage.module.css";

const tabs = ["theory", "empirical"] as const;
type TabId = (typeof tabs)[number];

export function PwrStudyTabs({ theory, empirical }: { theory: ReactNode; empirical: ReactNode }) {
  const [active, setActive] = useState<TabId>("theory");
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function activate(index: number) {
    const normalized = (index + tabs.length) % tabs.length;
    setActive(tabs[normalized]);
    refs.current[normalized]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (["ArrowRight", "ArrowDown"].includes(event.key)) { event.preventDefault(); activate(index + 1); }
    if (["ArrowLeft", "ArrowUp"].includes(event.key)) { event.preventDefault(); activate(index - 1); }
    if (event.key === "Home") { event.preventDefault(); activate(0); }
    if (event.key === "End") { event.preventDefault(); activate(tabs.length - 1); }
  }

  return (
    <>
      <div className={styles.studyTabs} role="tablist" aria-label="PWR-Scan study view">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            ref={(node) => { refs.current[index] = node; }}
            id={`pwr-${tab}-tab`}
            type="button"
            role="tab"
            aria-selected={active === tab}
            aria-controls={`pwr-${tab}-panel`}
            tabIndex={active === tab ? 0 : -1}
            onClick={() => setActive(tab)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <span>0{index + 1}</span>{tab}
          </button>
        ))}
      </div>
      <section id="pwr-theory-panel" role="tabpanel" aria-labelledby="pwr-theory-tab" hidden={active !== "theory"}>{theory}</section>
      <section id="pwr-empirical-panel" role="tabpanel" aria-labelledby="pwr-empirical-tab" hidden={active !== "empirical"}>{empirical}</section>
    </>
  );
}
