"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { ArbitrageShowcaseV1, ShowcaseRow } from "@/app/lib/arbitrageShowcase";
import { formatAsset, formatRate } from "@/app/lib/arbitrageShowcase";
import { TriangleRouteGraphic } from "@/app/components/TriangleRouteGraphic";
import styles from "@/app/components/ArbitrageLab.module.css";

const scenarioControlLabels: Record<string, string> = {
  normal: "Normal",
  stale: "Stale book",
  thin: "Shallow depth",
  partial: "Partial fill",
};

function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = String,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  return (
    <fieldset className={styles.controlGroup}>
      <legend>{label}</legend>
      <div className={styles.segmented}>
        {options.map((option) => (
          <button
            aria-pressed={value === option}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {format(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Orderbook({ row }: { row: ShowcaseRow }) {
  return (
    <div className={styles.bookGrid}>
      {row.orderbooks.map((book, bookIndex) => {
        const levels = [
          ...book.asks.slice(0, 3).map((level) => ({ ...level, side: "Ask" })),
          ...book.bids.slice(0, 3).map((level) => ({ ...level, side: "Bid" })),
        ];
        const maxSize = Math.max(...levels.map((level) => level.size), 1);
        return (
          <table className={styles.bookTable} key={`${row.id}-${book.market}-${bookIndex}`}>
            <caption><span>Leg {bookIndex + 1}</span>{book.market}</caption>
            <thead><tr><th>Side</th><th>Price</th><th>Size</th></tr></thead>
            <tbody>
              {levels.map((level, index) => (
                <tr className={level.side === "Ask" ? styles.askRow : styles.bidRow} key={`${level.side}-${level.price}-${index}`}>
                  <th scope="row">{level.side}</th>
                  <td>{formatAsset(level.price, book.market.startsWith("KRW-") ? "KRW" : "BTC")}</td>
                  <td
                    style={{ "--bar": `${Math.max(8, (level.size / maxSize) * 100)}%` } as CSSProperties}
                  >{formatAsset(level.size, "SIZE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </div>
  );
}

export function ArbitrageRouteLab({ showcase }: { showcase: ArbitrageShowcaseV1 }) {
  const initial = showcase.routeLab.rows.find(
    (row) => row.scenarioId === "normal" && row.direction === "forward" && row.feeBps === 5,
  ) ?? showcase.routeLab.rows[0];
  const [direction, setDirection] = useState(initial.direction);
  const [startKey, setStartKey] = useState(`${initial.startAmount.asset}:${initial.startAmount.value}`);
  const [feeBps, setFeeBps] = useState(initial.feeBps);
  const [scenarioId, setScenarioId] = useState(initial.scenarioId);

  const row = useMemo(() => showcase.routeLab.rows.find((candidate) => (
    candidate.direction === direction
      && `${candidate.startAmount.asset}:${candidate.startAmount.value}` === startKey
      && candidate.feeBps === feeBps
      && candidate.scenarioId === scenarioId
  )) ?? initial, [direction, feeBps, initial, scenarioId, showcase.routeLab.rows, startKey]);

  const selectedScenario = showcase.scenarios.find((scenario) => scenario.id === row.scenarioId);
  const outputLabel = row.status === "rejected"
    ? "Not executed"
    : row.output.value === null
      ? row.status === "aborted" ? "Cycle incomplete" : "Not executed"
      : `${formatAsset(row.output.value, row.output.asset)} ${row.output.asset}`;

  return (
    <div className={styles.labClient}>
      <div className={styles.controls} aria-label="Precomputed replay controls">
        <SegmentedControl
          label="Direction"
          options={showcase.routeLab.directions}
          value={direction}
          onChange={setDirection}
          format={(value) => value === "forward" ? "Forward" : "Reverse"}
        />
        <label className={styles.amountControl}>
          <span>Start amount</span>
          <select value={startKey} onChange={(event) => setStartKey(event.target.value)}>
            {showcase.routeLab.startAmounts.map((amount) => (
              <option key={`${amount.asset}:${amount.value}`} value={`${amount.asset}:${amount.value}`}>{amount.label}</option>
            ))}
          </select>
        </label>
        <SegmentedControl label="Fee / leg" options={showcase.routeLab.feeBps} value={feeBps} onChange={setFeeBps} format={(value) => `${value} bp`} />
        <fieldset className={`${styles.controlGroup} ${styles.scenarioControl}`}>
          <legend>Replay scenario</legend>
          <div className={styles.segmented}>
            {showcase.scenarios.map((scenario) => (
              <button aria-pressed={scenarioId === scenario.id} key={scenario.id} onClick={() => setScenarioId(scenario.id)} type="button">
                {scenarioControlLabels[scenario.id] ?? scenario.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.resultBand} aria-live="polite" aria-atomic="true">
        <div><span>Scenario</span><strong>{selectedScenario?.label ?? row.scenarioId}</strong></div>
        <div><span>Replay decision</span><strong data-status={row.status}>{row.status}</strong></div>
        <div><span>Net cycle rate</span><strong>{formatRate(row.netProfitRate)}</strong></div>
        <div><span>Final amount</span><strong>{outputLabel}</strong></div>
        <p>{row.reason ?? selectedScenario?.description}</p>
      </div>

      <figure className={styles.routeFigure}>
        <figcaption>Selected three-leg route</figcaption>
        <div className={styles.routeMap}>
          <TriangleRouteGraphic assets={row.route} direction={row.direction} variant="lab" />
        </div>
        <ol className={styles.routeSteps}>
          {row.legs.length === 0 && <li className={styles.noLegs}><span>00 / blocked</span><strong>No leg submitted</strong><small>{row.reason}</small></li>}
          {row.legs.map((leg) => (
            <li key={`${row.id}-${leg.index}`}>
              <span>{String(leg.index).padStart(2, "0")} / {leg.side}</span>
              <strong>{leg.market}</strong>
              <small>{formatAsset(leg.inputAmount, leg.inputAsset)} {leg.inputAsset} → {formatAsset(leg.outputAmount, leg.outputAsset)} {leg.outputAsset}</small>
            </li>
          ))}
        </ol>
      </figure>

      <section className={styles.labSubsection} aria-labelledby="depth-title">
        <div className={styles.subsectionHead}>
          <span>02 / Depth</span>
          <div><h3 id="depth-title">Executable book, not midpoint</h3><p>Each table is the text equivalent of its bid and ask depth bars.</p></div>
        </div>
        <Orderbook row={row} />
      </section>

      <section className={styles.labSubsection} aria-labelledby="waterfall-title">
        <div className={styles.subsectionHead}>
          <span>03 / Conversion</span>
          <div><h3 id="waterfall-title">Amount & fee waterfall</h3><p>Outputs below come directly from the selected replay row.</p></div>
        </div>
        <div className={styles.waterfall}>
          {row.legs.length === 0 && <article><span>Guard result</span><strong>No conversion</strong><small>{row.reason}</small></article>}
          {row.legs.map((leg) => (
            <article key={`${row.id}-waterfall-${leg.index}`}>
              <span>Leg {leg.index} / {leg.market}</span>
              <div className={styles.waterfallTrack}><i /></div>
              <strong>{formatAsset(leg.outputAmount, leg.outputAsset)} {leg.outputAsset}</strong>
              <small>{leg.feeAmount === null ? "Fee unknown" : `Fee ${formatAsset(leg.feeAmount, leg.feeAsset)} ${leg.feeAsset}`} · fill {(leg.fillRatio * 100).toFixed(1)}%</small>
            </article>
          ))}
          <article className={styles.waterfallResult}>
            <span>Cycle result</span>
            <strong>{formatRate(row.bufferedProfitRate)}</strong>
            <small>after {row.feeBps} bp / leg · threshold {formatRate(row.requiredNetProfitRate)}</small>
          </article>
        </div>
        <table className={styles.conversionTable}>
          <caption>Exact precomputed conversions</caption>
          <thead><tr><th>Leg</th><th>Market</th><th>Input</th><th>Fee</th><th>Output</th><th>Fill</th></tr></thead>
          <tbody>{row.legs.map((leg) => <tr key={`${row.id}-table-${leg.index}`}><th scope="row">{leg.index}</th><td>{leg.market}</td><td>{formatAsset(leg.inputAmount, leg.inputAsset)} {leg.inputAsset}</td><td>{leg.feeAmount === null ? "Unknown" : `${formatAsset(leg.feeAmount, leg.feeAsset)} ${leg.feeAsset}`}</td><td>{formatAsset(leg.outputAmount, leg.outputAsset)} {leg.outputAsset}</td><td>{(leg.fillRatio * 100).toFixed(1)}%</td></tr>)}</tbody>
        </table>
      </section>

      <section className={styles.labSubsection} aria-labelledby="timeline-title">
        <div className={styles.subsectionHead}>
          <span>04 / Lifecycle</span>
          <div><h3 id="timeline-title">Order, reconciliation & residual</h3><p>The route stops when a guarded execution cannot safely advance.</p></div>
        </div>
        <ol className={styles.executionTimeline}>
          {row.timeline.map((event, index) => (
            <li data-status={event.status} key={`${row.id}-event-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{event.label}</strong><p>{event.detail}</p></div>
            </li>
          ))}
        </ol>
        <div className={styles.residualStrip}>
          <span>Recorded residuals</span>
          {row.residuals.length ? row.residuals.map((residual, index) => (
            <strong key={`${residual.kind ?? "legacy"}-${residual.asset}-${index}`}>
              {residual.kind === "unsubmitted-input" ? "Unsubmitted input" : residual.kind === "acquired-intermediate" ? "Acquired position" : "Residual"}: {formatAsset(residual.amount, residual.asset)} {residual.asset}{residual.legIndex ? ` / leg ${residual.legIndex}` : ""}
            </strong>
          )) : <strong>None</strong>}
        </div>
      </section>
    </div>
  );
}
