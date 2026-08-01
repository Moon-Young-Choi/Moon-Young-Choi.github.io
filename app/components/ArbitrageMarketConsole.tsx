"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { TriangleRouteGraphic } from "@/app/components/TriangleRouteGraphic";
import {
  decodeUniverseRouteValue,
  fetchArbitrageUniverse,
  universeRouteBooks,
  type ArbitrageUniverseV1,
  type ArbitrageUniverseManifestV1,
  type UniverseDirection,
  type UniverseFeeBps,
  type UniverseRoute,
  type UniverseRouteValue,
  type UniverseTriangleCategory,
  type UniverseTriangleSet,
} from "@/app/lib/arbitrageUniverse";
import { universeStatusAtMultiplier } from "@/app/lib/arbitrageUniverseStatus";
import {
  SimulatedUniverseSource,
  type ArbitrageUniverseDataSource,
  type ArbitrageUniverseSnapshot,
  type ArbitrageUniverseSourceFactory,
} from "@/app/lib/arbitrageUniverseSource";
import styles from "@/app/components/ArbitrageMarketConsole.module.css";

type PlotTab = "universe" | "liquidity" | "timeline";
type DirectionFilter = "both" | UniverseDirection;
type StatusFilter = "all" | "profitable" | "stale" | "shallow" | "blocked";
type HubFilter = "ALL" | UniverseTriangleCategory;
type Zoom = 1 | 2 | 4;

type PlotRecord = {
  route: UniverseRoute;
  triangle: UniverseTriangleSet;
  routeIndex: number;
  triangleIndex: number;
  value: ReturnType<typeof decodeUniverseRouteValue>;
  multiplier: number;
  status: ReturnType<typeof universeStatusAtMultiplier>;
};

const hubOptions: HubFilter[] = ["ALL", "KRW-BTC-X", "BTC-USDT-X", "KRW-USDT-X", "KRW-BTC-USDT"];
const categoryOrder: UniverseTriangleCategory[] = ["KRW-BTC-X", "BTC-USDT-X", "KRW-USDT-X", "KRW-BTC-USDT"];
const directionOptions: DirectionFilter[] = ["both", "forward", "reverse"];
const feeOptions: UniverseFeeBps[] = [0, 5, 10];
const statusOptions: StatusFilter[] = ["all", "profitable", "stale", "shallow", "blocked"];
const tabs: Array<{ id: PlotTab; label: string; detail: string }> = [
  { id: "universe", label: "Universe", detail: "Asset-set index × net multiplier" },
  { id: "liquidity", label: "Liquidity", detail: "Executable KRW notional × net multiplier" },
  { id: "timeline", label: "Timeline", detail: "Selected forward + reverse over 60 seconds" },
];

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(listener: () => void) {
  if (typeof globalThis.matchMedia !== "function") return () => {};
  const mediaQuery = globalThis.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", listener);
  return () => mediaQuery.removeEventListener("change", listener);
}

function reducedMotionSnapshot() {
  return typeof globalThis.matchMedia === "function" && globalThis.matchMedia(reducedMotionQuery).matches;
}

function multiplierAtFee(value: UniverseRouteValue, feeBps: UniverseFeeBps) {
  if (feeBps === 0) return value[0];
  if (feeBps === 5) return value[1];
  return value[2];
}

function formatMultiplier(value: number) {
  return `${value.toFixed(6)}×`;
}

function formatPercentFromMultiplier(value: number) {
  const percent = (value - 1) * 100;
  return `${percent >= 0 ? "+" : ""}${percent.toFixed(3)}%`;
}

function formatCompactKrw(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

function formatAsset(value: number, asset: string) {
  if (asset === "KRW") return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(value);
}

function routeLabel(route: UniverseRoute) {
  return route.route.join(" → ");
}

function triangleLabel(triangle: UniverseTriangleSet) {
  return `${triangle.assets.join(" / ")} · ${triangle.category}`;
}

function cssPoint(x: number, y: number): CSSProperties {
  return { "--x": `${Math.max(0, Math.min(100, x))}%`, "--y": `${Math.max(0, Math.min(100, y))}%` } as CSSProperties;
}

function extent(values: number[], anchors: number[] = []) {
  const all = [...values.filter(Number.isFinite), ...anchors];
  const minimum = Math.min(...all);
  const maximum = Math.max(...all);
  const span = Math.max(maximum - minimum, 0.0005);
  return { minimum: minimum - span * 0.12, maximum: maximum + span * 0.12 };
}

function normalize(value: number, minimum: number, maximum: number) {
  return maximum === minimum ? 50 : ((value - minimum) / (maximum - minimum)) * 100;
}

const createDefaultUniverseSource: ArbitrageUniverseSourceFactory = async (signal) => {
  const universe = await fetchArbitrageUniverse(signal);
  return new SimulatedUniverseSource(universe, { autoPlay: false });
};

function Segmented<T extends string | number>({
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
    <fieldset className={styles.segmentedGroup}>
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button aria-pressed={option === value} key={option} onClick={() => onChange(option)} type="button">
            {format(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function AssetSetCombobox({
  universe,
  selected,
  onSelect,
}: {
  universe: ArbitrageUniverseV1;
  selected: UniverseTriangleSet;
  onSelect: (triangle: UniverseTriangleSet) => void;
}) {
  const [query, setQuery] = useState(triangleLabel(selected));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;

  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("en-US");
    const selectedLabel = triangleLabel(selected).toLocaleLowerCase("en-US");
    const candidates = needle === ""
      ? universe.triangleSets
      : needle === selectedLabel
        ? [selected, ...universe.triangleSets.filter((triangle) => triangle.id !== selected.id)]
      : universe.triangleSets.filter((triangle) => {
          const searchable = [
            triangle.id,
            triangle.category,
            ...triangle.assets,
            ...triangle.assetNames.flatMap((asset) => [asset.symbol, asset.englishName ?? ""]),
          ].join(" ").toLocaleLowerCase("en-US");
          return searchable.includes(needle);
        });
    return candidates.slice(0, 40);
  }, [query, selected, universe.triangleSets]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(`${listboxId}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listboxId, open]);

  function choose(triangle: UniverseTriangleSet) {
    onSelect(triangle);
    setQuery(triangleLabel(triangle));
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(matches.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => index < 0 ? matches.length - 1 : Math.max(0, index - 1));
    } else if (event.key === "Home" && open && matches.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && open && matches.length > 0) {
      event.preventDefault();
      setActiveIndex(matches.length - 1);
    } else if (event.key === "Enter" && open && matches[activeIndex]) {
      event.preventDefault();
      choose(matches[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setQuery(triangleLabel(selected));
    }
  }

  return (
    <div
      className={styles.combobox}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setQuery(triangleLabel(selected));
          setActiveIndex(-1);
        }
      }}
    >
      <label htmlFor={inputId}>Asset set</label>
      <input
        aria-activedescendant={open && matches[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        autoComplete="off"
        id={inputId}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(-1); }}
        onFocus={() => { setOpen(true); setActiveIndex(0); }}
        onKeyDown={onKeyDown}
        role="combobox"
        spellCheck={false}
        value={query}
      />
      {open && (
        <ul id={listboxId} role="listbox">
          {matches.map((triangle, index) => (
            <li
              aria-selected={index === activeIndex}
              data-active={index === activeIndex}
              id={`${listboxId}-option-${index}`}
              key={triangle.id}
              onClick={() => choose(triangle)}
              onMouseDown={(event) => event.preventDefault()}
              role="option"
            >
              <strong>{triangle.assets.join(" / ")}</strong>
              <span>{triangle.category} · {triangle.assetNames.map((asset) => asset.englishName || asset.symbol).join(" / ")}</span>
            </li>
          ))}
          {matches.length === 0 && <li aria-disabled="true" aria-selected="false" className={styles.emptyOption} role="option">No matching listed triangle</li>}
        </ul>
      )}
    </div>
  );
}

function PlotPoint({
  record,
  x,
  y,
  selected,
  focusable,
  onSelect,
  onNavigate,
}: {
  record: PlotRecord;
  x: number;
  y: number;
  selected: boolean;
  focusable: boolean;
  onSelect: () => void;
  onNavigate: (delta: number | "first" | "last") => void;
}) {
  return (
    <button
      aria-label={`${routeLabel(record.route)}, ${formatMultiplier(record.multiplier)}, ${record.status.label}, executable ${formatCompactKrw(record.value.liquidityKrw)} KRW`}
      className={styles.plotPoint}
      data-direction={record.route.direction}
      data-plot-point="true"
      data-plot-route-index={record.routeIndex}
      data-selected={selected}
      data-status={record.status.key}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); onNavigate(1); }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); onNavigate(-1); }
        if (event.key === "Home") { event.preventDefault(); onNavigate("first"); }
        if (event.key === "End") { event.preventDefault(); onNavigate("last"); }
      }}
      style={cssPoint(x, y)}
      tabIndex={focusable ? 0 : -1}
      title={`${routeLabel(record.route)} · ${formatMultiplier(record.multiplier)}`}
      type="button"
    />
  );
}

function MarketPlot({
  universe,
  frame,
  records,
  activeTab,
  feeBps,
  zoom,
  selectedRouteId,
  selectedTriangle,
  onSelect,
  onSelectDirection,
}: {
  universe: ArbitrageUniverseV1;
  frame: ArbitrageUniverseSnapshot["frame"];
  records: PlotRecord[];
  activeTab: PlotTab;
  feeBps: UniverseFeeBps;
  zoom: Zoom;
  selectedRouteId: string;
  selectedTriangle: UniverseTriangleSet;
  onSelect: (record: PlotRecord) => void;
  onSelectDirection: (direction: UniverseDirection) => void;
}) {
  const timelineRoutes = selectedTriangle.routeIds
    .map((id) => universe.routeDetails.routes.find((route) => route.id === id))
    .filter((route): route is UniverseRoute => Boolean(route));
  const plotHelpId = useId();
  const timelineRouteCount = timelineRoutes.length;
  const selectedTimelineRouteIndex = Math.max(0, timelineRoutes.findIndex((route) => route.id === selectedRouteId));
  const [timelineFocusIndex, setTimelineFocusIndex] = useState(
    () => frame.index * Math.max(1, timelineRouteCount) + selectedTimelineRouteIndex,
  );
  const timelineValues = universe.frames.flatMap((candidate) => timelineRoutes.map((route) => (
    multiplierAtFee(candidate.routeValues[universe.routeDetails.routes.indexOf(route)], feeBps)
  )));
  const domain = extent(activeTab === "timeline" ? timelineValues : records.map((record) => record.multiplier), [1, 1.001]);
  const yPosition = (value: number) => 6 + normalize(value, domain.minimum, domain.maximum) * .88;
  const breakEvenY = yPosition(1);
  const guardedY = yPosition(1.001);
  const liquidityValues = records.map((record) => record.value.liquidityKrw).filter((value) => value > 0);
  const minLiquidity = Math.max(1, Math.min(...liquidityValues, 1));
  const maxLiquidity = Math.max(minLiquidity * 1.01, ...liquidityValues);
  const logMin = Math.log10(minLiquidity);
  const logMax = Math.log10(maxLiquidity);
  const selectedRouteIsVisible = records.some((record) => record.route.id === selectedRouteId);

  function recordX(record: PlotRecord) {
    if (activeTab === "liquidity") return 4 + normalize(Math.log10(Math.max(1, record.value.liquidityKrw)), logMin, logMax) * .92;
    return 4 + normalize(record.triangleIndex, 0, Math.max(1, universe.triangleSets.length - 1)) * .92;
  }

  function navigate(currentIndex: number, destination: number | "first" | "last") {
    const targetIndex = destination === "first"
      ? 0
      : destination === "last"
        ? records.length - 1
        : Math.max(0, Math.min(records.length - 1, currentIndex + destination));
    const target = records[targetIndex];
    if (!target) return;
    onSelect(target);
    globalThis.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-plot-route-index="${target.routeIndex}"]`)?.focus();
    });
  }

  function navigateTimeline(
    currentIndex: number,
    destination: "previous-frame" | "next-frame" | "previous-route" | "next-route" | "first" | "last",
  ) {
    if (timelineRouteCount === 0) return;
    const frameIndex = Math.floor(currentIndex / timelineRouteCount);
    const routeIndex = currentIndex % timelineRouteCount;
    let targetFrameIndex = frameIndex;
    let targetRouteIndex = routeIndex;

    if (destination === "previous-frame") targetFrameIndex = Math.max(0, frameIndex - 1);
    if (destination === "next-frame") targetFrameIndex = Math.min(universe.frames.length - 1, frameIndex + 1);
    if (destination === "previous-route") targetRouteIndex = Math.max(0, routeIndex - 1);
    if (destination === "next-route") targetRouteIndex = Math.min(timelineRouteCount - 1, routeIndex + 1);
    if (destination === "first") targetFrameIndex = 0;
    if (destination === "last") targetFrameIndex = universe.frames.length - 1;

    const targetIndex = targetFrameIndex * timelineRouteCount + targetRouteIndex;
    setTimelineFocusIndex(targetIndex);
    globalThis.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-timeline-point-index="${targetIndex}"]`)?.focus();
    });
  }

  if (activeTab === "timeline") {
    return (
      <div
        aria-label={`${triangleLabel(selectedTriangle)} sixty-second simulated multiplier timeline at ${feeBps} basis points per leg`}
        className={styles.timelinePlot}
        role="group"
      >
        <div className={styles.threshold} data-kind="break-even" style={{ "--y": `${breakEvenY}%` } as CSSProperties}><span>1.0000× break-even</span></div>
        <div className={styles.threshold} data-kind="guarded" style={{ "--y": `${guardedY}%` } as CSSProperties}><span>1.0010× guarded</span></div>
        <div className={styles.timelineColumns}>
          {universe.frames.map((candidate, frameIndex) => (
            <span className={styles.timelineColumn} data-current={candidate.index === frame.index} key={candidate.index}>
              {timelineRoutes.map((route, routeOffset) => {
                const routeIndex = universe.routeDetails.routes.indexOf(route);
                const multiplier = multiplierAtFee(candidate.routeValues[routeIndex], feeBps);
                const pointIndex = frameIndex * timelineRouteCount + routeOffset;
                return (
                  <button
                    aria-current={candidate.index === frame.index && route.id === selectedRouteId ? "true" : undefined}
                    aria-label={`${route.direction}, T plus ${frameIndex} seconds, ${formatMultiplier(multiplier)}`}
                    className={styles.timelinePoint}
                    data-direction={route.direction}
                    data-timeline-point-index={pointIndex}
                    key={route.id}
                    onClick={() => onSelectDirection(route.direction)}
                    onFocus={() => setTimelineFocusIndex(pointIndex)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowLeft") { event.preventDefault(); navigateTimeline(pointIndex, "previous-frame"); }
                      if (event.key === "ArrowRight") { event.preventDefault(); navigateTimeline(pointIndex, "next-frame"); }
                      if (event.key === "ArrowUp") { event.preventDefault(); navigateTimeline(pointIndex, "previous-route"); }
                      if (event.key === "ArrowDown") { event.preventDefault(); navigateTimeline(pointIndex, "next-route"); }
                      if (event.key === "Home") { event.preventDefault(); navigateTimeline(pointIndex, "first"); }
                      if (event.key === "End") { event.preventDefault(); navigateTimeline(pointIndex, "last"); }
                    }}
                    style={{ "--y": `${yPosition(multiplier)}%` } as CSSProperties}
                    tabIndex={pointIndex === timelineFocusIndex ? 0 : -1}
                    title={`${route.direction} T+${frameIndex}s ${formatMultiplier(multiplier)}`}
                    type="button"
                  />
                );
              })}
              {frameIndex % 10 === 0 && <small>{frameIndex}s</small>}
            </span>
          ))}
        </div>
        <p className={styles.srOnly}>Forward and reverse values are shown for every one-second frame. The current demo frame is {frame.index}. Use left and right arrows for time, up and down arrows for direction, and Home or End for the first or last frame.</p>
      </div>
    );
  }

  return (
    <div className={styles.plotScroll} data-zoom={zoom}>
      <div
        aria-describedby={plotHelpId}
        aria-label={`${activeTab === "universe" ? "Asset-set index" : "Executable liquidity"} by net cycle multiplier. ${records.length} filtered directional routes.`}
        className={styles.plotCanvas}
        role="group"
        style={{ "--zoom": zoom } as CSSProperties}
      >
        <div className={styles.threshold} data-kind="break-even" style={{ "--y": `${breakEvenY}%` } as CSSProperties}><span>1.0000× break-even</span></div>
        <div className={styles.threshold} data-kind="guarded" style={{ "--y": `${guardedY}%` } as CSSProperties}><span>1.0010× guarded</span></div>
        <span className={styles.yLabel}>{domain.maximum.toFixed(5)}×</span>
        <span className={`${styles.yLabel} ${styles.yLabelBottom}`}>{domain.minimum.toFixed(5)}×</span>
        {records.map((record, index) => (
          <PlotPoint
            key={record.route.id}
            onNavigate={(destination) => navigate(index, destination)}
            onSelect={() => onSelect(record)}
            record={record}
            focusable={record.route.id === selectedRouteId || (!selectedRouteIsVisible && index === 0)}
            selected={record.route.id === selectedRouteId}
            x={recordX(record)}
            y={yPosition(record.multiplier)}
          />
        ))}
        {activeTab === "universe" && (
          <div className={styles.plotGroups} aria-hidden="true">
            {categoryOrder.map((category) => {
              const count = universe.summary.hubBreakdown[category];
              return <span key={category} style={{ flexGrow: count }} title={`${category}: ${count}`}><b>{count > 5 ? category : "HUB"}</b></span>;
            })}
          </div>
        )}
        {records.length === 0 && <p className={styles.emptyPlot}>No routes match the active filters.</p>}
        <span className={styles.xLabel}>{activeTab === "universe" ? "Stable triangle-set index, grouped by quote hubs" : "Maximum executable notional, KRW equivalent · log scale"}</span>
        <p className={styles.srOnly} id={plotHelpId}>Use arrow keys to move through routes. Home and End move to the first and last filtered route.</p>
      </div>
    </div>
  );
}

function RouteDetail({
  universe,
  frame,
  triangle,
  direction,
  feeBps,
  onDirection,
  onFee,
}: {
  universe: ArbitrageUniverseV1;
  frame: ArbitrageUniverseSnapshot["frame"];
  triangle: UniverseTriangleSet;
  direction: UniverseDirection;
  feeBps: UniverseFeeBps;
  onDirection: (direction: UniverseDirection) => void;
  onFee: (fee: UniverseFeeBps) => void;
}) {
  const routeId = triangle.routeIds[direction === "forward" ? 0 : 1];
  const routeIndex = universe.routeDetails.routes.findIndex((candidate) => candidate.id === routeId);
  const route = universe.routeDetails.routes[routeIndex];
  const [startAmount, setStartAmount] = useState(route.startAmounts[0]);

  const row = route.feeRows.find((candidate) => candidate.feeBps === feeBps && candidate.startAmount === startAmount)
    ?? route.feeRows.find((candidate) => candidate.feeBps === feeBps)
    ?? route.feeRows[0];
  const value = decodeUniverseRouteValue(frame.routeValues[routeIndex]);
  const multiplier = feeBps === 0 ? value.netMultiplier0Bps : feeBps === 5 ? value.netMultiplier5Bps : value.netMultiplier10Bps;
  const status = universeStatusAtMultiplier(universe, value.statusCode, multiplier);
  const statusDescription = status.key === "profitable"
    ? `All synthetic guards pass and the selected ${feeBps} bp multiplier is above break-even.`
    : status.key === "eligible"
      ? `All synthetic guards pass; the selected ${feeBps} bp multiplier is not above break-even.`
      : status.description;
  const books = useMemo(() => universeRouteBooks(universe, route), [route, universe]);

  return (
    <section className={styles.routeDetail} id="selected-route" aria-labelledby="selected-route-title">
      <div className={styles.detailHeading}>
        <span>02 / Selected route</span>
        <div>
          <p>{triangle.category} · pinned detail snapshot</p>
          <h2 id="selected-route-title">{triangle.assets.join(" / ")}</h2>
        </div>
        <div className={styles.detailControls}>
          <Segmented label="Direction" onChange={onDirection} options={["forward", "reverse"] as const} value={direction} format={(item) => item === "forward" ? "Forward" : "Reverse"} />
          <label><span>Start amount</span><select onChange={(event) => setStartAmount(Number(event.target.value))} value={startAmount}>{route.startAmounts.map((amount) => <option key={amount} value={amount}>{formatAsset(amount, route.startAsset)} {route.startAsset}</option>)}</select></label>
          <Segmented label="Fee / leg" onChange={onFee} options={feeOptions} value={feeBps} format={(fee) => `${fee} bp`} />
        </div>
      </div>

      <div className={styles.detailReadout} aria-live="polite">
        <div><span>Current demo multiplier</span><strong>{formatMultiplier(multiplier)}</strong><small>{formatPercentFromMultiplier(multiplier)}</small></div>
        <div><span>Snapshot output</span><strong>{formatAsset(row.outputAmount, route.startAsset)}</strong><small>{route.startAsset}</small></div>
        <div><span>Executable notional</span><strong>{formatCompactKrw(row.liquidityKrw)}</strong><small>KRW equivalent</small></div>
        <div data-status={status.key}><span>Route state</span><strong>{status.label}</strong><small>{statusDescription}</small></div>
      </div>

      <figure className={styles.routeFigure}>
        <figcaption>Selected three-leg conversion</figcaption>
        <div className={styles.routeGraphic}>
          <TriangleRouteGraphic assets={route.route} direction={direction} variant="lab" />
        </div>
        <ol className={styles.routeSteps}>
          {route.legs.map((leg, index) => {
            const amount = row.legAmounts[index];
            return (
              <li key={leg.index}>
                <span>0{leg.index} / {leg.side}</span>
                <strong>{leg.market}</strong>
                <small>{formatAsset(amount.inputAmount, amount.inputAsset)} {amount.inputAsset} → {formatAsset(amount.outputAmount, amount.outputAsset)} {amount.outputAsset}</small>
              </li>
            );
          })}
        </ol>
      </figure>

      <div className={styles.detailSectionHeading}>
        <span>Depth / 05 levels</span>
        <div><h3>Executable book, not midpoint</h3><p>Shared deterministic books provide five bid and five ask levels for every selectable market.</p></div>
      </div>
      <div className={styles.bookGrid}>
        {books.map((book, bookIndex) => {
          const maxSize = Math.max(...book.bids.map((level) => level[1]), ...book.asks.map((level) => level[1]));
          const quote = book.market.split("-")[0];
          return (
            <table className={styles.bookTable} key={`${route.id}-${book.id}`}>
              <caption><span>Leg {bookIndex + 1}</span>{book.market}</caption>
              <thead><tr><th>Side</th><th>Price</th><th>Size</th></tr></thead>
              <tbody>
                {book.asks.map(([price, size], index) => <tr data-side="ask" key={`ask-${price}`}><th scope="row">Ask {index + 1}</th><td>{formatAsset(price, quote)}</td><td style={{ "--bar": `${Math.max(7, size / maxSize * 100)}%` } as CSSProperties}>{formatAsset(size, "SIZE")}</td></tr>)}
                {book.bids.map(([price, size], index) => <tr data-side="bid" key={`bid-${price}`}><th scope="row">Bid {index + 1}</th><td>{formatAsset(price, quote)}</td><td style={{ "--bar": `${Math.max(7, size / maxSize * 100)}%` } as CSSProperties}>{formatAsset(size, "SIZE")}</td></tr>)}
              </tbody>
            </table>
          );
        })}
      </div>

      <div className={styles.detailSectionHeading}>
        <span>Conversion / precomputed</span>
        <div><h3>Amount and fee waterfall</h3><p>The selected row is generated by the engine; the browser only formats its values.</p></div>
      </div>
      <div className={styles.waterfall}>
        {row.legAmounts.map((leg, index) => (
          <article key={leg.index}>
            <span>Leg {leg.index} / {route.markets[index]}</span>
            <i><b style={{ width: `${Math.max(12, 100 - index * 13)}%` }} /></i>
            <strong>{formatAsset(leg.outputAmount, leg.outputAsset)} {leg.outputAsset}</strong>
            <small>Fee {formatAsset(leg.feeAmount, leg.outputAsset)} {leg.outputAsset}</small>
          </article>
        ))}
        <article data-result="true">
          <span>Cycle result</span>
          <strong>{formatPercentFromMultiplier(row.feeMultiplier)}</strong>
          <small>{feeBps} bp / leg · {formatAsset(row.netProfitAmount, route.startAsset)} {route.startAsset}</small>
        </article>
      </div>

      <div aria-label="Exact precomputed leg conversions" className={styles.conversionScroll} role="region" tabIndex={0}>
        <table className={styles.conversionTable}>
          <caption>Exact precomputed leg conversions</caption>
          <thead><tr><th>Leg</th><th>Market</th><th>Input</th><th>Fee</th><th>Output</th></tr></thead>
          <tbody>{row.legAmounts.map((leg, index) => <tr key={leg.index}><th scope="row">{leg.index}</th><td>{route.markets[index]}</td><td>{formatAsset(leg.inputAmount, leg.inputAsset)} {leg.inputAsset}</td><td>{formatAsset(leg.feeAmount, leg.outputAsset)} {leg.outputAsset}</td><td>{formatAsset(leg.outputAmount, leg.outputAsset)} {leg.outputAsset}</td></tr>)}</tbody>
        </table>
      </div>

      <div className={styles.lifecycle}>
        <span>Snapshot accepted</span><i>→</i><span>Depth evaluated</span><i>→</i><span>Both directions ranked</span><i>→</i><strong>No order submitted</strong>
      </div>
      <div className={styles.residual}><span>Residual assets</span><strong>None · display-only simulation</strong></div>
    </section>
  );
}

function ArbitrageMarketConsoleLoaded({
  source,
  initialSnapshot,
}: {
  source: ArbitrageUniverseDataSource;
  initialSnapshot: ArbitrageUniverseSnapshot;
}) {
  const [feed, setFeed] = useState<ArbitrageUniverseSnapshot>(initialSnapshot);
  const universe = feed.universe;
  const featured = universe.triangleSets.find((triangle) => triangle.id === universe.summary.featuredTriangleSetId) ?? universe.triangleSets[0];
  const [selectedTriangleId, setSelectedTriangleId] = useState(featured.id);
  const [selectedDirection, setSelectedDirection] = useState<UniverseDirection>("forward");
  const [feeBps, setFeeBps] = useState<UniverseFeeBps>(5);
  const [hubFilter, setHubFilter] = useState<HubFilter>("ALL");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("both");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeTab, setActiveTab] = useState<PlotTab>("universe");
  const [zoom, setZoom] = useState<Zoom>(1);
  const [sortBy, setSortBy] = useState<"index" | "multiplier" | "liquidity">("index");
  const [tableOpen, setTableOpen] = useState(false);
  const motionReduced = useSyncExternalStore(subscribeToReducedMotion, reducedMotionSnapshot, () => false);
  const [announcement, setAnnouncement] = useState("Simulated market universe ready.");

  useEffect(() => {
    const unsubscribe = source.subscribe(setFeed);
    if (!reducedMotionSnapshot()) source.resume();
    return unsubscribe;
  }, [source]);

  useEffect(() => {
    if (motionReduced) source.pause();
  }, [motionReduced, source]);

  const triangleById = useMemo(() => {
    const ordered = [...universe.triangleSets].sort((left, right) => (
      categoryOrder.indexOf(left.category) - categoryOrder.indexOf(right.category)
      || left.id.localeCompare(right.id)
    ));
    return new Map(ordered.map((triangle, index) => [triangle.id, { triangle, index }]));
  }, [universe.triangleSets]);
  const selectedTriangle = triangleById.get(selectedTriangleId)?.triangle ?? featured;
  const selectedRouteId = selectedTriangle.routeIds[selectedDirection === "forward" ? 0 : 1];
  const selectedTimelineRoutes = useMemo(() => selectedTriangle.routeIds.map((routeId) => {
    const routeIndex = universe.routeDetails.routes.findIndex((route) => route.id === routeId);
    return { route: universe.routeDetails.routes[routeIndex], routeIndex };
  }), [selectedTriangle, universe.routeDetails.routes]);

  const records = useMemo(() => universe.routeDetails.routes.flatMap((route, routeIndex) => {
    const entry = triangleById.get(route.triangleSetId);
    const raw = feed.frame.routeValues[routeIndex];
    if (!entry || !raw) return [];
    const value = decodeUniverseRouteValue(raw);
    const multiplier = feeBps === 0 ? value.netMultiplier0Bps : feeBps === 5 ? value.netMultiplier5Bps : value.netMultiplier10Bps;
    const status = universeStatusAtMultiplier(universe, value.statusCode, multiplier);
    if (hubFilter !== "ALL" && entry.triangle.category !== hubFilter) return [];
    if (directionFilter !== "both" && route.direction !== directionFilter) return [];
    if (statusFilter === "profitable" && status.key !== "profitable") return [];
    if (["stale", "shallow", "blocked"].includes(statusFilter) && status.key !== statusFilter) return [];
    return [{ route, triangle: entry.triangle, triangleIndex: entry.index, routeIndex, value, multiplier, status } satisfies PlotRecord];
  }), [directionFilter, feeBps, feed.frame, hubFilter, statusFilter, triangleById, universe]);

  const selectedRecord = records.find((record) => record.route.id === selectedRouteId)
    ?? (() => {
      const routeIndex = universe.routeDetails.routes.findIndex((route) => route.id === selectedRouteId);
      const route = universe.routeDetails.routes[routeIndex];
      const raw = feed.frame.routeValues[routeIndex];
      const value = decodeUniverseRouteValue(raw);
      const multiplier = feeBps === 0 ? value.netMultiplier0Bps : feeBps === 5 ? value.netMultiplier5Bps : value.netMultiplier10Bps;
      return { route, triangle: selectedTriangle, triangleIndex: triangleById.get(selectedTriangle.id)?.index ?? 0, routeIndex, value, multiplier, status: universeStatusAtMultiplier(universe, value.statusCode, multiplier) } satisfies PlotRecord;
    })();

  const sortedRecords = useMemo(() => tableOpen && activeTab !== "timeline" ? [...records].sort((left, right) => {
    if (sortBy === "multiplier") return right.multiplier - left.multiplier;
    if (sortBy === "liquidity") return right.value.liquidityKrw - left.value.liquidityKrw;
    return left.triangleIndex - right.triangleIndex || left.route.direction.localeCompare(right.route.direction);
  }) : [], [activeTab, records, sortBy, tableOpen]);

  function selectRecord(record: PlotRecord) {
    setSelectedTriangleId(record.triangle.id);
    setSelectedDirection(record.route.direction);
    setAnnouncement(`${routeLabel(record.route)} selected at ${formatMultiplier(record.multiplier)}.`);
  }

  function selectTriangle(triangle: UniverseTriangleSet) {
    setSelectedTriangleId(triangle.id);
    setHubFilter("ALL");
    setDirectionFilter("both");
    setStatusFilter("all");
    setAnnouncement(`${triangle.assets.join(", ")} asset set selected.`);
  }

  function togglePlayback() {
    if (motionReduced) {
      setAnnouncement("The simulated feed remains paused while reduced motion is requested.");
      return;
    }
    if (feed.playing) {
      source.pause();
      setAnnouncement("Simulated feed paused.");
    } else {
      source.resume();
      setAnnouncement("Simulated feed resumed at one update per second.");
    }
  }

  function selectTab(tab: PlotTab) {
    setActiveTab(tab);
    setAnnouncement(`${tabs.find((candidate) => candidate.id === tab)?.label ?? tab} plot selected.`);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, tabIndex: number) {
    let nextIndex = tabIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (tabIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (tabIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    selectTab(tabs[nextIndex].id);
    globalThis.requestAnimationFrame(() => document.getElementById(`plot-tab-${tabs[nextIndex].id}`)?.focus());
  }

  return (
    <>
      <section className={styles.consoleSection} id="market-universe" aria-labelledby="market-universe-title">
        <div className={styles.consoleHeading}>
          <span>01 / Market universe</span>
          <div>
            <p>Deterministic public-listing topology · synthetic prices and books</p>
            <h2 id="market-universe-title">All valid listed triangles, one plane.</h2>
          </div>
          <div className={styles.feedBoundary}>
            <strong><i /> Simulated feed</strong>
            <strong><i /> Trading off</strong>
          </div>
        </div>

        <div className={styles.controlSurface}>
          <AssetSetCombobox key={selectedTriangle.id} onSelect={selectTriangle} selected={selectedTriangle} universe={universe} />
          <Segmented label="Hub group" onChange={setHubFilter} options={hubOptions} value={hubFilter} />
          <Segmented label="Direction" onChange={setDirectionFilter} options={directionOptions} value={directionFilter} format={(item) => item} />
          <Segmented label="Fee / leg" onChange={setFeeBps} options={feeOptions} value={feeBps} format={(item) => `${item} bp`} />
          <Segmented label="Route state" onChange={setStatusFilter} options={statusOptions} value={statusFilter} format={(item) => item} />
        </div>

        <div className={styles.feedBar}>
          <div><span>Demo clock</span><strong data-demo-clock>T+{String(feed.frame.offsetMs / 1000).padStart(2, "0")}s</strong></div>
          <div><span>Last tick</span><strong>{feed.frame.at.slice(11, 19)} UTC</strong></div>
          <div><span>Listed pairs</span><strong>{universe.summary.marketCount.toLocaleString("en-US")}</strong></div>
          <div><span>Triangle sets</span><strong>{universe.summary.triangleSetCount.toLocaleString("en-US")}</strong></div>
          <div><span>Plotted routes</span><strong>{records.length.toLocaleString("en-US")}</strong></div>
          <button
            aria-label={motionReduced ? "Simulated feed paused by reduced-motion preference" : feed.playing ? "Pause simulated feed" : "Play simulated feed"}
            data-feed-toggle
            disabled={motionReduced}
            onClick={togglePlayback}
            type="button"
          ><i aria-hidden="true">{feed.playing ? "Ⅱ" : "▶"}</i>{motionReduced ? "Reduced motion" : feed.playing ? "Pause" : "Play"}</button>
        </div>

        <div className={styles.plotHeader}>
          <div className={styles.tabs} role="tablist" aria-label="Market universe plots">
            {tabs.map((tab, index) => <button aria-controls="market-plot-panel" aria-selected={activeTab === tab.id} id={`plot-tab-${tab.id}`} key={tab.id} onClick={() => selectTab(tab.id)} onKeyDown={(event) => onTabKeyDown(event, index)} role="tab" tabIndex={activeTab === tab.id ? 0 : -1} type="button"><strong>{tab.label}</strong><small>{tab.detail}</small></button>)}
          </div>
          {activeTab === "timeline"
            ? <div className={styles.timelineMode}><span>Window</span><strong>60 × 1 second</strong></div>
            : <Segmented label="Plot scale" onChange={setZoom} options={[1, 2, 4] as const} value={zoom} format={(item) => item === 1 ? "Fit" : `${item}×`} />}
        </div>

        <div className={styles.selectedStrip}>
          <div><span>Selected route</span><strong>{routeLabel(selectedRecord.route)}</strong></div>
          <div><span>Direction</span><strong>{selectedRecord.route.direction}</strong></div>
          <div><span>Net multiplier</span><strong>{formatMultiplier(selectedRecord.multiplier)}</strong></div>
          <div data-status={selectedRecord.status.key}><span>State</span><strong>{selectedRecord.status.label}</strong></div>
          <div><span>Executable</span><strong>{formatCompactKrw(selectedRecord.value.liquidityKrw)} KRW</strong></div>
        </div>

        <div aria-labelledby={`plot-tab-${activeTab}`} id="market-plot-panel" role="tabpanel">
          <MarketPlot activeTab={activeTab} feeBps={feeBps} frame={feed.frame} key={activeTab} onSelect={selectRecord} onSelectDirection={(direction) => { setSelectedDirection(direction); setAnnouncement(`${direction} timeline route selected.`); }} records={records} selectedRouteId={selectedRouteId} selectedTriangle={selectedTriangle} universe={universe} zoom={zoom} />
        </div>

        <div className={styles.legend} aria-label="Plot legend">
          <span><i data-direction="forward" /> Forward</span>
          <span><i data-direction="reverse" /> Reverse</span>
          <span><i data-status="eligible" /> Eligible / below break-even</span>
          <span><i data-status="profitable" /> Above break-even</span>
          <span><i data-status="stale" /> Stale / unavailable</span>
          <span><i data-status="shallow" /> Shallow / hollow</span>
          <span><i data-status="blocked" /> Blocked / dark</span>
          <strong>Multiplier includes {feeBps} bp per leg.</strong>
        </div>

        <details className={styles.dataTableDisclosure} onToggle={(event) => setTableOpen(event.currentTarget.open)}>
          <summary>Open text-equivalent {activeTab === "timeline" ? "timeline" : "route"} table <span>{(activeTab === "timeline" ? universe.frames.length : records.length).toLocaleString("en-US")} rows</span></summary>
          {tableOpen && activeTab !== "timeline" && (
            <div className={styles.tableTools}>
              <label>Sort rows<select onChange={(event) => setSortBy(event.target.value as typeof sortBy)} value={sortBy}><option value="index">Asset-set index</option><option value="multiplier">Net multiplier</option><option value="liquidity">Executable notional</option></select></label>
            </div>
          )}
          {tableOpen && (
            <div aria-label={activeTab === "timeline" ? "Selected route timeline values" : "Filtered route values"} className={styles.tableScroll} role="region" tabIndex={0}>
              {activeTab === "timeline" ? (
                <table>
                  <caption>{triangleLabel(selectedTriangle)} forward and reverse multipliers at {feeBps} basis points per leg</caption>
                  <thead><tr><th>Demo frame</th>{selectedTimelineRoutes.map(({ route }) => <th key={route.id}>{route.direction}</th>)}</tr></thead>
                  <tbody>{universe.frames.map((candidate) => <tr data-selected={candidate.index === feed.frame.index} key={candidate.index}><th scope="row">T+{candidate.index}s</th>{selectedTimelineRoutes.map(({ route, routeIndex }) => <td key={route.id}>{formatMultiplier(multiplierAtFee(candidate.routeValues[routeIndex], feeBps))}</td>)}</tr>)}</tbody>
                </table>
              ) : (
                <table>
                  <caption>Filtered directional routes for the active demo frame</caption>
                  <thead><tr><th>Asset set</th><th>Direction</th><th>Route</th><th>Multiplier</th><th>Net rate</th><th>Executable KRW</th><th>Status</th></tr></thead>
                  <tbody>{sortedRecords.map((record) => <tr data-selected={record.route.id === selectedRouteId} key={record.route.id}><th scope="row"><button onClick={() => selectRecord(record)} type="button">{record.triangle.assets.join(" / ")}</button></th><td>{record.route.direction}</td><td>{routeLabel(record.route)}</td><td>{formatMultiplier(record.multiplier)}</td><td>{formatPercentFromMultiplier(record.multiplier)}</td><td>{formatCompactKrw(record.value.liquidityKrw)}</td><td>{record.status.label}</td></tr>)}</tbody>
                </table>
              )}
            </div>
          )}
        </details>

        <p aria-atomic="true" aria-live="polite" className={styles.srOnly}>{announcement}</p>
      </section>

      <RouteDetail direction={selectedDirection} feeBps={feeBps} frame={feed.frame} key={selectedRouteId} onDirection={(direction) => { setSelectedDirection(direction); setAnnouncement(`${direction} route selected.`); }} onFee={setFeeBps} triangle={selectedTriangle} universe={universe} />
    </>
  );
}

export function ArbitrageMarketConsole({
  manifest,
  sourceFactory,
}: {
  manifest: ArbitrageUniverseManifestV1;
  sourceFactory?: ArbitrageUniverseSourceFactory;
}) {
  const [loaded, setLoaded] = useState<{
    source: ArbitrageUniverseDataSource;
    snapshot: ArbitrageUniverseSnapshot;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const createSource = sourceFactory ?? createDefaultUniverseSource;

  useEffect(() => {
    const controller = new AbortController();
    let createdSource: ArbitrageUniverseDataSource | null = null;
    void createSource(controller.signal)
      .then(async (source) => {
        createdSource = source;
        const snapshot = await source.load();
        if (controller.signal.aborted) {
          source.close();
          return;
        }
        setLoaded({ source, snapshot });
      })
      .catch((error: unknown) => {
        createdSource?.close();
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : "The verified universe artifact could not be loaded.");
      });
    return () => {
      controller.abort();
      createdSource?.close();
    };
  }, [createSource]);

  if (loaded) return <ArbitrageMarketConsoleLoaded initialSnapshot={loaded.snapshot} source={loaded.source} />;

  return (
    <section className={styles.consoleSection} id="market-universe" aria-labelledby="market-universe-title">
      <div className={styles.consoleHeading}>
        <span>01 / Market universe</span>
        <div>
          <p>Deterministic public-listing topology · synthetic prices and books</p>
          <h2 id="market-universe-title">All valid listed triangles, one plane.</h2>
        </div>
        <div className={styles.feedBoundary}>
          <strong><i /> Simulated feed</strong>
          <strong><i /> Trading off</strong>
        </div>
      </div>
      <div className={styles.loadingUniverse} aria-live="polite" role="status">
        <div><span>Listed pairs</span><strong>{manifest.marketCount.toLocaleString("en-US")}</strong></div>
        <div><span>Triangle sets</span><strong>{manifest.triangleSetCount.toLocaleString("en-US")}</strong></div>
        <div><span>Directional points</span><strong>{manifest.routeCount.toLocaleString("en-US")}</strong></div>
        <p data-error={Boolean(loadError)}>{loadError ?? "Loading the verified local simulation artifact…"}</p>
      </div>
    </section>
  );
}
