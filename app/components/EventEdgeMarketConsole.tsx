"use client";

import { useEffect, useMemo, useState } from "react";
import {
  eventEdgeDecisionId,
  loadEventEdgeDemo,
  type EventEdgeBookV1,
  type EventEdgeCandidateId,
  type EventEdgeContractId,
  type EventEdgeDecisionRowV1,
  type EventEdgeDemoV1,
  type EventEdgeNotional,
  type EventEdgePerspectiveId,
  type EventEdgeProfileId,
  type EventEdgeStateId,
} from "@/app/lib/eventEdgeDemo";
import styles from "@/app/components/EventEdgeMarket.module.css";

function signed(value: number, digits = 2) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(digits)}`;
}

function controlLabel(value: string | number) {
  return typeof value === "number" ? value.toFixed(1) : value;
}

function Segmented<T extends string | number>({ label, options, value, onChange }: { label: string; options: Array<{ value: T; label: string }>; value: T; onChange: (value: T) => void }) {
  return (
    <fieldset className={styles.controlGroup}>
      <legend>{label}</legend>
      <div className={styles.segmented}>
        {options.map((option) => (
          <button aria-pressed={value === option.value} key={String(option.value)} onClick={() => onChange(option.value)} type="button">
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function BookFigure({ book, label }: { book: EventEdgeBookV1; label: string }) {
  const visible = book.levels.slice(0, 5);
  const maxQuantity = Math.max(...visible.flatMap((level) => [level.bidQuantity, level.askQuantity]));
  return (
    <figure className={styles.bookFigure}>
      <figcaption><span>{label} · 20 × 2 reconstructed levels</span><strong>Executable depth, not midpoint</strong></figcaption>
      <div className={styles.bookBars} aria-hidden="true">
        <div className={styles.bookSide}>
          <span>Bid</span>
          {visible.map((level) => <i className={styles.bidBar} key={level.level} style={{ width: `${(level.bidQuantity / maxQuantity) * 100}%` }} />)}
        </div>
        <div className={styles.bookSide}>
          <span>Ask</span>
          {visible.map((level) => <i className={styles.askBar} key={level.level} style={{ width: `${(level.askQuantity / maxQuantity) * 100}%` }} />)}
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table>
          <caption>Top five {label} order-book levels</caption>
          <thead><tr><th scope="col">Level</th><th scope="col">Bid qty</th><th scope="col">Bid</th><th scope="col">Ask</th><th scope="col">Ask qty</th></tr></thead>
          <tbody>{visible.map((level) => <tr key={level.level}><th scope="row">L{level.level}</th><td>{level.bidQuantity.toFixed(3)}</td><td>{level.bidPrice.toFixed(2)}</td><td>{level.askPrice.toFixed(2)}</td><td>{level.askQuantity.toFixed(3)}</td></tr>)}</tbody>
        </table>
      </div>
      <details className={styles.bookDetails}>
        <summary>Open all 20 levels</summary>
        <div className={styles.tableWrap}>
          <table>
            <caption>Complete reconstructed {label} order book</caption>
            <thead><tr><th scope="col">Level</th><th scope="col">Bid qty</th><th scope="col">Bid</th><th scope="col">Ask</th><th scope="col">Ask qty</th></tr></thead>
            <tbody>{book.levels.map((level) => <tr key={level.level}><th scope="row">L{level.level}</th><td>{level.bidQuantity.toFixed(3)}</td><td>{level.bidPrice.toFixed(2)}</td><td>{level.askPrice.toFixed(2)}</td><td>{level.askQuantity.toFixed(3)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function DecisionComparison({ selected, alternate }: { selected: EventEdgeDecisionRowV1; alternate: EventEdgeDecisionRowV1 }) {
  const rows = [selected, alternate].sort((first, second) => first.candidateId.localeCompare(second.candidateId));
  return (
    <div className={styles.comparisonTableWrap}>
      <table className={styles.comparisonTable}>
        <caption>Candidate comparison at the selected perspective, notional, and book profile</caption>
        <thead><tr><th scope="col">Candidate</th><th scope="col">Standalone edge</th><th scope="col">Requested J</th><th scope="col">Fill</th><th scope="col">Executed J</th><th scope="col">Decision</th></tr></thead>
        <tbody>{rows.map((row) => <tr data-selected={row.candidateId === selected.candidateId} key={row.id}><th scope="row">{row.candidateId === "wa-long" ? "A · Buy WA" : "B · Hedge package"}</th><td>{signed(row.standaloneEdge)}</td><td>{signed(row.requestedMetrics.objective)}</td><td>{(row.fillRatio * 100).toFixed(0)}%</td><td>{signed(row.executedMetrics.objective)}</td><td>{row.decision === "conditional-commit" ? "CONDITIONAL COMMIT" : "REJECT"}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function EventEdgeMarketConsole() {
  const [data, setData] = useState<EventEdgeDemoV1 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [perspectiveId, setPerspectiveId] = useState<EventEdgePerspectiveId>("user");
  const [candidateId, setCandidateId] = useState<EventEdgeCandidateId>("hedge-package");
  const [notional, setNotional] = useState<EventEdgeNotional>(1);
  const [profileId, setProfileId] = useState<EventEdgeProfileId>("baseline");
  const [stateId, setStateId] = useState<EventEdgeStateId>("S1");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadEventEdgeDemo(controller.signal).then((artifact) => {
      setData(artifact);
      setPerspectiveId(artifact.market.defaultSelection.perspectiveId);
      setCandidateId(artifact.market.defaultSelection.candidateId);
      setNotional(artifact.market.defaultSelection.notional);
      setProfileId(artifact.market.defaultSelection.profileId);
      setStateId(artifact.market.defaultSelection.stateId);
    }).catch((reason: unknown) => {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "The verified local artifact could not be loaded.");
    });
    return () => controller.abort();
  }, []);

  const selected = useMemo(() => {
    if (!data) return null;
    return data.decisionRows.find((row) => row.id === eventEdgeDecisionId(perspectiveId, candidateId, notional, profileId)) ?? null;
  }, [candidateId, data, notional, perspectiveId, profileId]);

  if (error) return <section className={styles.loadState} role="alert"><strong>Demo unavailable</strong><p>{error}</p></section>;
  if (!data || !selected) return <section className={styles.loadState} aria-live="polite"><strong>Loading verified reconstructed market</strong><p>No external market or source-code request is made.</p></section>;

  const perspective = data.market.perspectives.find(({ id }) => id === perspectiveId)!;
  const profile = data.market.profiles.find(({ id }) => id === profileId)!;
  const candidate = data.market.candidates.find(({ id }) => id === candidateId)!;
  const selectedState = data.market.states.find(({ id }) => id === stateId)!;
  const settlement = data.settlementRows.find((row) => row.decisionRowId === selected.id && row.stateId === stateId)!;
  const alternateCandidateId: EventEdgeCandidateId = candidateId === "wa-long" ? "hedge-package" : "wa-long";
  const alternate = data.decisionRows.find((row) => row.id === eventEdgeDecisionId(perspectiveId, alternateCandidateId, notional, profileId))!;
  const books = Object.fromEntries((data.orderBooks.filter((book) => book.profileId === profileId)).map((book) => [book.contractId, book])) as Record<EventEdgeContractId, EventEdgeBookV1>;
  const comparisonMax = Math.max(1, ...selected.oldMetrics.outcomes.flatMap((outcome) => [Math.abs(outcome.pnl)]), ...selected.requestedMetrics.outcomes.flatMap((outcome) => [Math.abs(outcome.pnl)]), ...selected.executedMetrics.outcomes.flatMap((outcome) => [Math.abs(outcome.pnl)]));

  return (
    <section className={styles.console} id="market-console" aria-labelledby="eventedge-console-title">
      <header className={styles.consoleHeader}>
        <div><span>01 / Reconstructed market console</span><h2 id="eventedge-console-title">One public snapshot. Two decisions. Four terminal states.</h2></div>
        <div className={styles.consoleStatus}><strong>RECONSTRUCTED DEMO</strong><strong>NO LIVE FEED</strong><strong>NO ORDER SUBMISSION</strong></div>
      </header>

      <div className={styles.controls}>
        <Segmented label="Perspective" options={data.market.perspectives.map(({ id, label }) => ({ value: id, label }))} value={perspectiveId} onChange={setPerspectiveId} />
        <Segmented label="Candidate" options={data.market.candidates.map(({ id, label }) => ({ value: id, label }))} value={candidateId} onChange={setCandidateId} />
        <Segmented label="Requested notional" options={data.market.controls.notionals.map((value) => ({ value, label: controlLabel(value) }))} value={notional} onChange={setNotional} />
        <Segmented label="Book profile" options={data.market.profiles.map(({ id, label }) => ({ value: id, label }))} value={profileId} onChange={(value) => { setProfileId(value); setRevealed(false); }} />
        <Segmented label="Terminal state" options={data.market.states.map(({ id }) => ({ value: id, label: id }))} value={stateId} onChange={(value) => { setStateId(value); setRevealed(false); }} />
        <div className={styles.revealControl}><span>Information gate</span><button aria-pressed={revealed} onClick={() => setRevealed((current) => !current)} type="button">{revealed ? "HIDE TERMINAL" : "REVEAL & SETTLE"}</button></div>
      </div>

      <p className={styles.liveResult} aria-live="polite">
        {candidate.label}; {profile.label}; {notional.toFixed(1)} requested; {(selected.fillRatio * 100).toFixed(0)}% filled; {selected.decision === "conditional-commit" ? "conditional commit" : "rejected"}; executed objective {signed(selected.executedMetrics.objective)}.
      </p>

      <div className={styles.kpis}>
        <div><span>Standalone edge</span><strong>{signed(selected.standaloneEdge)}</strong><small>{selected.standaloneEdge > 0 ? "Positive before portfolio risk" : "Negative before portfolio risk"}</small></div>
        <div><span>Common fill ratio</span><strong>{selected.fillRatio.toFixed(2)}</strong><small>{selected.filledNotional.toFixed(2)} executed</small></div>
        <div><span>Requested → executed J</span><strong>{signed(selected.requestedMetrics.objective)} → {signed(selected.executedMetrics.objective)}</strong><small>Old book {signed(selected.oldMetrics.objective)}</small></div>
        <div data-decision={selected.decision}><span>Decision</span><strong>{selected.decision === "conditional-commit" ? "CONDITIONAL COMMIT" : "REJECT"}</strong><small>Costs and final VWAP remain binding</small></div>
      </div>

      <DecisionComparison alternate={alternate} selected={selected} />

      <div className={styles.marketGrid}>
        <section className={styles.statePanel} aria-labelledby="eventedge-state-title">
          <header><span>Public information boundary</span><h3 id="eventedge-state-title">Scenario weight is not terminal knowledge</h3></header>
          <div className={styles.stateBoundary}>
            <div><strong>PUBLIC TO AGENTS</strong>{data.market.underlying.publicState.map((item) => <span key={item}>{item}</span>)}</div>
            <div><strong>ENGINE-PRIVATE</strong>{data.market.underlying.hiddenState.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.stateTable}>
              <caption>Scenario weights and registered contract payoffs</caption>
              <thead><tr><th scope="col">State</th><th scope="col">{perspective.label}</th><th scope="col">True benchmark</th><th scope="col">WA</th><th scope="col">WB</th><th scope="col">VOL</th></tr></thead>
              <tbody>{data.market.states.map((state) => <tr data-selected={state.id === stateId} key={state.id}><th scope="row">{state.id}</th><td>{(perspective.weights[state.id] * 100).toFixed(0)}%</td><td>{revealed ? `${(state.trueWeight * 100).toFixed(0)}%` : "LOCKED"}</td><td>{state.payoffs.WA}</td><td>{state.payoffs.WB}</td><td>{state.payoffs.VOL}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className={styles.valuationPanel} aria-labelledby="eventedge-value-title">
          <header><span>Same payoff · different weights</span><h3 id="eventedge-value-title">Valuation separation</h3></header>
          {data.market.contracts.map((contract) => {
            const mm = data.market.perspectives[0].values[contract.id];
            const user = data.market.perspectives[1].values[contract.id];
            return <div className={styles.valueRow} key={contract.id}><div><strong>{contract.id}</strong><span>{contract.kind}</span></div><div><span>MM {mm.toFixed(0)}</span><i className={styles.mmValue} style={{ width: `${mm}%` }} /></div><div><span>User {user.toFixed(0)}</span><i className={styles.userValue} style={{ width: `${user}%` }} /></div></div>;
          })}
          <p>{profile.description}</p>
        </section>
      </div>

      <div className={styles.bookGrid}>
        <BookFigure book={books.WA} label="WA" />
        <BookFigure book={books.WB} label="WB" />
      </div>

      <section className={styles.riskPanel} aria-labelledby="eventedge-risk-title">
        <header><div><span>Combined book · four-state tail proxy</span><h3 id="eventedge-risk-title">Positive edge may be rejected. A hedge may survive.</h3></div><p>{selected.reason}</p></header>
        <div className={styles.pnlChart} aria-hidden="true">
          {data.market.states.map((state) => {
            const old = selected.oldMetrics.outcomes.find((item) => item.stateId === state.id)!.pnl;
            const requested = selected.requestedMetrics.outcomes.find((item) => item.stateId === state.id)!.pnl;
            const executed = selected.executedMetrics.outcomes.find((item) => item.stateId === state.id)!.pnl;
            return <div className={styles.pnlState} key={state.id}><span>{state.id}</span><div><i data-sign={old >= 0 ? "positive" : "negative"} style={{ width: `${(Math.abs(old) / comparisonMax) * 100}%` }} /><small>Old {signed(old)}</small></div><div><i data-sign={requested >= 0 ? "positive" : "negative"} style={{ width: `${(Math.abs(requested) / comparisonMax) * 100}%` }} /><small>Requested {signed(requested)}</small></div><div><i data-sign={executed >= 0 ? "positive" : "negative"} style={{ width: `${(Math.abs(executed) / comparisonMax) * 100}%` }} /><small>Executed {signed(executed)}</small></div></div>;
          })}
        </div>
        <div className={styles.tableWrap}>
          <table>
            <caption>State PnL behind the combined-book distribution</caption>
            <thead><tr><th scope="col">State</th><th scope="col">Old book</th><th scope="col">Requested</th><th scope="col">Executed</th><th scope="col">Perspective weight</th></tr></thead>
            <tbody>{data.market.states.map((state) => <tr key={state.id}><th scope="row">{state.id}</th><td>{signed(selected.oldMetrics.outcomes.find(({ stateId: id }) => id === state.id)!.pnl)}</td><td>{signed(selected.requestedMetrics.outcomes.find(({ stateId: id }) => id === state.id)!.pnl)}</td><td>{signed(selected.executedMetrics.outcomes.find(({ stateId: id }) => id === state.id)!.pnl)}</td><td>{(perspective.weights[state.id] * 100).toFixed(0)}%</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.executionPanel} aria-labelledby="eventedge-execution-title">
        <header><span>Immutable snapshot · common fill ratio</span><h3 id="eventedge-execution-title">Package legs advance together or roll back together</h3></header>
        <div className={styles.legGrid}>
          {selected.legs.map((leg, index) => (
            <article key={`${leg.contractId}-${leg.side}`}>
              <span>Leg {String(index + 1).padStart(2, "0")} · {leg.side}</span>
              <h4>{leg.contractId} @ {leg.price.toFixed(2)}</h4>
              <div className={styles.fillRail}><i style={{ width: `${leg.fillRatio * 100}%` }} /></div>
              <dl><div><dt>Requested</dt><dd>{leg.requestedQuantity.toFixed(2)}</dd></div><div><dt>Available L0</dt><dd>{leg.availableQuantity.toFixed(2)}</dd></div><div><dt>Filled</dt><dd>{leg.filledQuantity.toFixed(2)}</dd></div><div><dt>Cash flow</dt><dd>{signed(leg.cashFlow)}</dd></div></dl>
            </article>
          ))}
          <article className={styles.commitCard} data-decision={selected.decision}><span>Post-fill gate</span><h4>{selected.decision === "conditional-commit" ? "COMMIT IF COSTS HOLD" : "ROLL BACK / NO TRADE"}</h4><p>{selected.passesObjective ? "Objective improves" : "Objective fails"} · {selected.passesLossLimit ? "Loss limit passes" : "Loss limit fails"}</p></article>
        </div>
      </section>

      <section className={styles.settlementPanel} aria-labelledby="eventedge-settlement-title">
        <header><div><span>Terminal reveal · selected {stateId}</span><h3 id="eventedge-settlement-title">Settlement journal</h3></div><strong data-revealed={revealed}>{revealed ? `${selectedState.label} · ${signed(settlement.userRealizedPnl)} user PnL` : "TRUE STATE LOCKED"}</strong></header>
        {revealed ? (
          <div className={styles.settlementGrid}>
            <div><span>Selected payoff</span><strong>WA {selectedState.payoffs.WA} · WB {selectedState.payoffs.WB} · VOL {selectedState.payoffs.VOL}</strong><p>{selectedState.description}</p></div>
            <div><span>User cash / payoff</span><strong>{signed(settlement.userCashAfterTrades)} / {signed(settlement.userSettlementPayoff)}</strong><p>Realized PnL {signed(settlement.userRealizedPnl)}</p></div>
            <div><span>Conservation ledger</span><strong>{settlement.positionConservation && settlement.cashConservation && settlement.pnlConservation ? "ALL INVARIANTS PASS" : "INVARIANT FAILURE"}</strong><p>Positions, cash and two-sided PnL sum to zero.</p></div>
          </div>
        ) : <p className={styles.lockedCopy}>The interface preserves the decision-time boundary. Choose a terminal state, then reveal it only after the quote and package decision are fixed.</p>}
      </section>

      <footer className={styles.artifactStrip}>
        <span>Local artifact · {data.decisionRows.length} decisions · {data.settlementRows.length} settlements</span>
        <span>SHA-256 · {data.provenance.fingerprint.slice(0, 16)}…</span>
        <span>Browser calculation · off</span>
      </footer>
    </section>
  );
}
