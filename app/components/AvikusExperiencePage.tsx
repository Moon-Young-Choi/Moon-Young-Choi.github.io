import Link from "next/link";
import type { CaseStudy } from "@/app/content";
import { AvikusProjectiveField } from "@/app/components/WorkExperienceGraphic";
import { AvikusSignalRibbon } from "@/app/components/AvikusSignalRibbon";
import { avikusExperience } from "@/app/data/work-experience";
import styles from "@/app/components/WorkExperiencePage.module.css";

function TechnologyStrip({ items }: { items: readonly string[] }) {
  return (
    <aside className={styles.technologyStrip} aria-label="Technology stack">
      <span>Technology stack</span>
      <div>{items.map((item) => <b key={item}>{item}</b>)}</div>
    </aside>
  );
}

function PanoramaAlignment() {
  return (
    <figure className={styles.panoramaFigure} aria-labelledby="panorama-caption">
      <div className={styles.cameraPlanes} aria-hidden="true">
        <i>Camera 01</i><i>Camera 02</i><i>Camera 03</i>
      </div>
      <div className={styles.panoramaProcess} aria-hidden="true">OpenCV homography → CUDA warp + blend</div>
      <div className={styles.panoramaFrame} aria-hidden="true">
        <span className={styles.visualLabel}>Visible panorama</span>
        <i className={`${styles.vessel} ${styles.vesselLeft}`} /><i className={`${styles.vessel} ${styles.vesselRight}`} />
        <div className={styles.infraredWindow}>
          <span>Infrared camera</span><i className={styles.thermalVessel} />
        </div>
      </div>
      <figcaption id="panorama-caption">Separate pinhole-camera image planes are projected into one wide visible panorama; the infrared camera region remains aligned inside the shared frame.</figcaption>
    </figure>
  );
}

export function AvikusExperiencePage({ study }: { study: CaseStudy }) {
  return (
    <main className={`${styles.page} ${styles.avikus}`}>
      <header className={`site-header ${styles.nav}`}>
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label="Avikus experience navigation">
          <a href="#signals">Signals</a><a href="#events">Events</a><a href="#panorama">Panorama</a><a href="#runtime">Runtime</a>
        </nav>
        <Link className="header-link" href="/#experience">Close ×</Link>
      </header>

      <article>
        <header className={styles.hero}>
          <div className={styles.kicker}><span>Experience / {study.number}</span><span>{study.period}</span></div>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.status}>{avikusExperience.status}</span>
              <p className={styles.eyebrow}>{study.eyebrow}</p>
              <h1>{study.title}</h1>
              <strong>{study.organization} · {study.role}</strong>
              <p>{study.summary}</p>
            </div>
            <figure className={styles.heroFigure} aria-labelledby="avikus-field-caption">
              <AvikusProjectiveField variant="hero" />
              <figcaption id="avikus-field-caption">Target signals reach one own-ship receiver across a changing observation grid.</figcaption>
            </figure>
          </div>
          <div className={styles.factDock}>
            <div><span>Role</span><b>Research Intern</b></div>
            <div><span>System</span><b>AI-training simulator</b></div>
            <div><span>Inputs</span><b>NMEA 0183 · visible · infrared</b></div>
            <div><span>Validation</span><b>350× simulation</b></div>
          </div>
        </header>

        <div className={styles.contentSheet}>
          <section className={styles.section} id="signals" aria-labelledby="signals-title">
            <div className={styles.sectionLabel}>01 / Signal generation</div>
            <div className={styles.sectionBody}>
              <h2 id="signals-title">Generated repeatable NMEA 0183 streams with controlled missingness, outliers, and sensor noise.</h2>
              <p className={styles.lede}>I implemented a signal-generation pipeline that injected probability-controlled missing observations, abnormal samples, and sensor noise so maritime scenarios could be tested repeatedly under explicit data uncertainty.</p>
              <AvikusSignalRibbon />
            </div>
          </section>

          <section className={styles.section} id="events" aria-labelledby="events-title">
            <div className={styles.sectionLabel}>02 / Event-driven scenario engine</div>
            <div className={styles.sectionBody}>
              <h2 id="events-title">Built reusable vessel scenarios from conditional events.</h2>
              <p className={styles.lede}>An event fired when a target vessel reached a relative-speed or region-entry condition, then changed course, speed, or route state. I combined these events with if, else, while, and condition synchronization so one scenario could coordinate multiple vessel behaviors.</p>
              <div className={styles.flowDiagram} aria-label="Trigger, action, control, and scenario flow">
                {avikusExperience.eventFlow.map((item, index) => <div key={item.label}><span>0{index + 1}</span><b>{item.label}</b><p>{item.detail}</p></div>)}
              </div>
              <TechnologyStrip items={avikusExperience.stack} />
            </div>
          </section>

          <section className={styles.section} id="panorama" aria-labelledby="panorama-title">
            <div className={styles.sectionLabel}>03 / Visible and infrared panorama alignment</div>
            <div className={styles.sectionBody}>
              <h2 id="panorama-title">Aligned visible and infrared pinhole-camera views into one CUDA-accelerated panorama.</h2>
              <p className={styles.lede}>I projected separate pinhole-camera image planes into a common frame with OpenCV homography, then used CUDA warp-and-blend operations to assemble visible and infrared inputs into one panoramic view.</p>
              <PanoramaAlignment />
            </div>
          </section>

          <section className={styles.section} id="runtime" aria-labelledby="runtime-title">
            <div className={styles.sectionLabel}>04 / Accelerated simulation</div>
            <div className={styles.sectionBody}>
              <h2 id="runtime-title">Ran the simulator itself at 350× by separating execution, output, and visualization with OpenMP.</h2>
              <p className={styles.lede}>OpenMP isolated the execution, output, and visualization processes so inspection work did not block simulation. During final product validation, the completed simulator ran stably at the processor performance ceiling.</p>
              <div className={styles.runtimeGrid}>
                <div className={styles.metricFeature}><b>{avikusExperience.metric.value}</b><span>{avikusExperience.metric.label}</span><p>{avikusExperience.metric.note}</p></div>
                <div className={styles.laneList}>{avikusExperience.runtimeLanes.map((lane) => <div key={lane.label}><b>{lane.label}</b><span>{lane.detail}</span></div>)}</div>
              </div>
            </div>
          </section>

          <footer className={styles.footer}>
            <div><span>Source status</span><strong>Private employer artifact</strong><p>{avikusExperience.boundary}</p></div>
            <Link href="/#experience">Back to experience ↑</Link>
          </footer>
        </div>
      </article>
    </main>
  );
}
