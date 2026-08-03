import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { CaseStudy } from "@/app/content";
import { MathBlock } from "@/app/components/MathBlock";
import styles from "@/app/components/ResearchPaperShell.module.css";

export type PaperSectionLink = { id: string; number: string; title: string };

const accentMap: Record<CaseStudy["accent"], string> = {
  ink: "var(--ink)", paper: "var(--ink)", lime: "var(--lime)", blue: "var(--blue)",
  coral: "var(--coral)", violet: "var(--violet)",
};

type PaperShellProps = {
  study: CaseStudy;
  status: string;
  abstract: string;
  sections: PaperSectionLink[];
  children: ReactNode;
};

export function ResearchPaperShell({ study, status, abstract, sections, children }: PaperShellProps) {
  const style = { "--paper-accent": accentMap[study.accent] } as CSSProperties;
  const stack = study.stack.flatMap((group) => group.items);
  return (
    <main className={styles.page} style={style}>
      <header className={`site-header ${styles.nav}`}>
        <Link className="wordmark" href="/">MYC / 26</Link>
        <nav aria-label={`${study.title} paper navigation`}><a href="#paper-contents">Contents</a><a href="#references">References</a></nav>
        <Link className="header-link" href="/#projects">Close ×</Link>
      </header>
      <article className={styles.paper}>
        <header className={styles.masthead} data-paper-header>
          <div className={styles.runningHead}><span>Project {study.number}</span><span>{study.eyebrow}</span><span>{status}</span></div>
          <h1>{study.title}</h1>
          <div className={styles.abstract}><b>Abstract.</b><p>{abstract}</p></div>
          <dl className={styles.metadata}>
            {study.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          <p className={styles.keywords}><b>Keywords.</b> {stack.join(" · ")}</p>
          <details className={styles.contents} id="paper-contents" data-paper-toc>
            <summary>Contents — {sections.length} sections</summary>
            <ol>{sections.map((section) => <li key={section.id}><a href={`#${section.id}`}><span>{section.number}</span>{section.title}</a></li>)}</ol>
          </details>
        </header>
        <div className={styles.body}>{children}</div>
        <footer className={styles.references} id="references">
          <div><span>Evidence boundary</span><p>{study.boundary}</p></div>
          <div><span>References</span>{study.github ? <a href={study.github} target="_blank" rel="noreferrer">Source repository ↗</a> : <strong>Private research artifact</strong>}</div>
          <Link href="/#projects">Back to projects ↑</Link>
        </footer>
      </article>
    </main>
  );
}

export function PaperSection({ id, number, title, deck, children }: PaperSectionLink & { deck?: string; children: ReactNode }) {
  return (
    <section className={styles.section} id={id} data-paper-section aria-labelledby={`${id}-title`}>
      <header className={styles.sectionHead}><span>{number}</span><div><h2 id={`${id}-title`}>{title}</h2>{deck && <p>{deck}</p>}</div></header>
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
}

export function PaperEquation({ number, label, expression, note }: { number: string; label: string; expression: string; note: string }) {
  return (
    <figure className={styles.equation} aria-label={label}>
      <div><MathBlock expression={expression} /><span>({number})</span></div>
      <figcaption><b>{label}.</b> {note}</figcaption>
    </figure>
  );
}

export function PaperFigure({ number, title, children, interactive = false }: { number: string; title: string; children: ReactNode; interactive?: boolean }) {
  return (
    <figure className={styles.figure} data-interactive={interactive ? "true" : undefined}>
      <div className={styles.figureBody}>{children}</div>
      <figcaption><b>Figure {number}.</b> {title}</figcaption>
    </figure>
  );
}

export function PaperFlow({ items }: { items: string[] }) {
  return <ol className={styles.flow}>{items.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b></li>)}</ol>;
}

export function EvidenceNote({ title, children }: { title: string; children: ReactNode }) {
  return <aside className={styles.note}><b>{title}</b><div>{children}</div></aside>;
}
