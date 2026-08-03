"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  betaMean,
  betaUpdate,
  constrainedAllocation,
  posteriorExpectedSplitGain,
  precisionBounds,
  splitLogBayesFactor,
  summarizeUplift,
  upliftDraws,
  type BinomialEvidence,
  type LeafPosterior,
} from "@/app/lib/bayesianMath";
import styles from "@/app/components/BayesianTargetingPage.module.css";

type Preset = "baseline" | "heterogeneous";
type Rates = { leftControl: number; leftTreatment: number; rightControl: number; rightTreatment: number };

const DEFAULT_RATES: Record<Preset, Rates> = {
  baseline: { leftControl: 0.02, leftTreatment: 0.025, rightControl: 0.08, rightTreatment: 0.085 },
  heterogeneous: { leftControl: 0.038, leftTreatment: 0.04, rightControl: 0.01, rightTreatment: 0.028 },
};

const DEFAULTS = {
  preset: "heterogeneous" as Preset,
  rates: DEFAULT_RATES.heterogeneous,
  leftMass: 0.5,
  selected: "right",
  replayScale: 1,
  kappa: 100,
  discount: 1,
  value: 100,
  cost: 1,
  budget: 0.25,
  cap: 0.7,
  gate: 0.8,
  seed: 20260721,
  redraw: 0,
};

const DRAW_COUNT = 4096;
const POPULATION = 100_000;
const subscribeHydration = () => () => {};
const fmtPct = (value: number, digits = 2) => `${(value * 100).toFixed(digits)}%`;
const fmt = (value: number, digits = 3) => Number.isFinite(value) ? value.toFixed(digits) : "—";

function evidence(rate: number, trials: number): BinomialEvidence {
  return { successes: Math.round(rate * trials), trials };
}

function RangeControl({
  id,
  label,
  value,
  min,
  max,
  step,
  output,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  output: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className={styles.range} htmlFor={id}>
      <span>{label}<output htmlFor={id}>{output}</output></span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.currentTarget.value))} />
    </label>
  );
}

function DensityBars({ draws, hurdle }: { draws: number[]; hurdle: number }) {
  const bins = useMemo(() => {
    const min = Math.min(-0.03, ...draws);
    const max = Math.max(0.05, ...draws);
    const counts = Array.from({ length: 24 }, () => 0);
    for (const draw of draws) {
      const index = Math.min(counts.length - 1, Math.max(0, Math.floor(((draw - min) / (max - min)) * counts.length)));
      counts[index] += 1;
    }
    const peak = Math.max(...counts);
    return counts.map((count, index) => ({
      count,
      height: peak ? count / peak : 0,
      above: min + ((index + 0.5) / counts.length) * (max - min) > hurdle,
    }));
  }, [draws, hurdle]);
  return (
    <figure className={styles.density} aria-labelledby="uplift-density-caption">
      <div aria-hidden="true">{bins.map((bin, index) => <i key={index} data-above={bin.above} style={{ height: `${Math.max(2, bin.height * 100)}%` }} />)}</div>
      <figcaption id="uplift-density-caption">Posterior uplift density; blue bars exceed the current break-even uplift.</figcaption>
    </figure>
  );
}

export function BayesianScenarioLabs({ variant = "full" }: { variant?: "full" | "paper" }) {
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [preset, setPreset] = useState<Preset>(DEFAULTS.preset);
  const [rates, setRates] = useState<Rates>(DEFAULTS.rates);
  const [leftMass, setLeftMass] = useState(DEFAULTS.leftMass);
  const [selected, setSelected] = useState(DEFAULTS.selected);
  const [replayScale, setReplayScale] = useState(DEFAULTS.replayScale);
  const [kappa, setKappa] = useState(DEFAULTS.kappa);
  const [value, setValue] = useState(DEFAULTS.value);
  const [cost, setCost] = useState(DEFAULTS.cost);
  const [budget, setBudget] = useState(DEFAULTS.budget);
  const [cap, setCap] = useState(DEFAULTS.cap);
  const [redraw, setRedraw] = useState(DEFAULTS.redraw);

  const updatePreset = (next: Preset) => {
    setPreset(next);
    setRates(DEFAULT_RATES[next]);
  };
  const setRate = (key: keyof Rates, next: number) => setRates((current) => ({ ...current, [key]: next }));
  const hurdle = cost / value;

  const model = useMemo(() => {
    const masses = { left: leftMass, right: 1 - leftMass };
    const baseTrials = { left: Math.max(200, Math.round(4000 * masses.left)), right: Math.max(200, Math.round(4000 * masses.right)) };
    const raw = {
      left: { treatment: evidence(rates.leftTreatment, baseTrials.left), control: evidence(rates.leftControl, baseTrials.left) },
      right: { treatment: evidence(rates.rightTreatment, baseTrials.right), control: evidence(rates.rightControl, baseTrials.right) },
    };
    const discoveryTrials = { left: Math.round(100_000 * masses.left), right: Math.round(100_000 * masses.right) };
    const discovery = {
      left: { treatment: evidence(rates.leftTreatment, discoveryTrials.left), control: evidence(rates.leftControl, discoveryTrials.left) },
      right: { treatment: evidence(rates.rightTreatment, discoveryTrials.right), control: evidence(rates.rightControl, discoveryTrials.right) },
    };
    const developmentMean = {
      treatment: masses.left * rates.leftTreatment + masses.right * rates.rightTreatment,
      control: masses.left * rates.leftControl + masses.right * rates.rightControl,
    };
    const prior = {
      treatment: { alpha: developmentMean.treatment * kappa, beta: (1 - developmentMean.treatment) * kappa },
      control: { alpha: developmentMean.control * kappa, beta: (1 - developmentMean.control) * kappa },
    };
    const makeLeaf = (id: "left" | "right", label: string): LeafPosterior => {
      const replay = {
        treatment: evidence(id === "left" ? rates.leftTreatment : rates.rightTreatment, Math.round(raw[id].treatment.trials * replayScale)),
        control: evidence(id === "left" ? rates.leftControl : rates.rightControl, Math.round(raw[id].control.trials * replayScale)),
      };
      return {
        id,
        label,
        mass: masses[id],
        treatment: betaUpdate(prior.treatment, replay.treatment),
        control: betaUpdate(prior.control, replay.control),
      };
    };
    const leaves = [makeLeaf("left", "Child L"), makeLeaf("right", "Child R")];
    const discoveryLeaves: LeafPosterior[] = (["left", "right"] as const).map((id) => ({
      id,
      label: id === "left" ? "Child L" : "Child R",
      mass: masses[id],
      treatment: betaUpdate({ alpha: 1, beta: 1 }, discovery[id].treatment),
      control: betaUpdate({ alpha: 1, beta: 1 }, discovery[id].control),
    }));
    const draws = leaves.map((leaf, index) => upliftDraws(leaf, DRAW_COUNT, DEFAULTS.seed + index * 1009));
    const summaries = draws.map((leafDraws) => summarizeUplift(leafDraws, hurdle));
    return {
      masses,
      raw,
      prior,
      leaves,
      draws,
      summaries,
      logBf: splitLogBayesFactor(Object.values(discovery)),
      splitGain: posteriorExpectedSplitGain(discoveryLeaves, hurdle, value, DRAW_COUNT, DEFAULTS.seed),
    };
  }, [leftMass, rates, replayScale, kappa, hurdle, value]);

  const selectedIndex = selected === "left" ? 0 : 1;
  const selectedLeaf = model.leaves[selectedIndex];
  const selectedDraws = model.draws[selectedIndex];
  const selectedSummary = model.summaries[selectedIndex];
  const allocations = useMemo(() => {
    const allocationLeaves = model.leaves.map((leaf, index) => {
      const sampledUplift = upliftDraws(leaf, 1, DEFAULTS.seed + redraw * 7919 + index * 101)[0];
      const treatmentRate = betaMean(leaf.treatment);
      const controlRate = betaMean(leaf.control);
      const bounds = precisionBounds(leaf.mass, POPULATION, treatmentRate, controlRate, 0.01, cap);
      return {
        id: leaf.id,
        label: leaf.label,
        mass: leaf.mass,
        sampledNetValue: value * sampledUplift - cost,
        posteriorProbability: model.summaries[index].probabilityAbove,
        lower: bounds.lower,
        upper: bounds.upper,
        bounds,
      };
    });
    const optimized = constrainedAllocation(allocationLeaves, budget, DEFAULTS.gate);
    return {
      ...optimized,
      allocations: optimized.allocations.map((leaf) => ({ ...leaf, bounds: allocationLeaves.find((item) => item.id === leaf.id)!.bounds })),
    };
  }, [model, redraw, cap, budget, value, cost]);

  const reset = () => {
    setPreset(DEFAULTS.preset); setRates(DEFAULTS.rates); setLeftMass(DEFAULTS.leftMass); setSelected(DEFAULTS.selected);
    setReplayScale(DEFAULTS.replayScale); setKappa(DEFAULTS.kappa); setValue(DEFAULTS.value); setCost(DEFAULTS.cost);
    setBudget(DEFAULTS.budget); setCap(DEFAULTS.cap); setRedraw(DEFAULTS.redraw);
  };

  return (
    <div className={styles.labs} data-hydrated={hydrated ? "true" : "false"} data-variant={variant}>
      <section className={styles.lab} id="split-lab" aria-labelledby="split-lab-title">
        <header><span>Lab 01</span><div><h3 id="split-lab-title">Split Value Lab</h3><p>Structural evidence is not yet decision value.</p></div></header>
        <p className={styles.demoNote}>Illustrative controls only · 4,096 seeded posterior draws · never mixed with the 500k benchmark below.</p>
        <div className={styles.labGrid}>
          <fieldset className={styles.controls}>
            <legend>Counterexample</legend>
            <div className={styles.presetButtons}>
              <button type="button" aria-pressed={preset === "baseline"} onClick={() => updatePreset("baseline")}>Baseline shift</button>
              <button type="button" aria-pressed={preset === "heterogeneous"} onClick={() => updatePreset("heterogeneous")}>Uplift heterogeneity</button>
            </div>
            <RangeControl id="left-mass" label="Child L mass" value={leftMass} min={0.2} max={0.8} step={0.05} output={fmtPct(leftMass, 0)} onChange={setLeftMass} />
            <RangeControl id="left-control" label="L control rate" value={rates.leftControl} min={0.005} max={0.1} step={0.001} output={fmtPct(rates.leftControl)} onChange={(next) => setRate("leftControl", next)} />
            <RangeControl id="left-treatment" label="L treatment rate" value={rates.leftTreatment} min={0.005} max={0.12} step={0.001} output={fmtPct(rates.leftTreatment)} onChange={(next) => setRate("leftTreatment", next)} />
            <RangeControl id="right-control" label="R control rate" value={rates.rightControl} min={0.005} max={0.1} step={0.001} output={fmtPct(rates.rightControl)} onChange={(next) => setRate("rightControl", next)} />
            <RangeControl id="right-treatment" label="R treatment rate" value={rates.rightTreatment} min={0.005} max={0.12} step={0.001} output={fmtPct(rates.rightTreatment)} onChange={(next) => setRate("rightTreatment", next)} />
          </fieldset>
          <div className={styles.results} aria-live="polite" data-testid="split-live">
            <div className={styles.metricGrid}>
              <div><span>Parent uplift</span><strong>{fmtPct(leftMass * (rates.leftTreatment - rates.leftControl) + (1 - leftMass) * (rates.rightTreatment - rates.rightControl))}</strong></div>
              <div><span>Child L / R</span><strong>{fmtPct(rates.leftTreatment - rates.leftControl)} / {fmtPct(rates.rightTreatment - rates.rightControl)}</strong></div>
              <div><span>log Bayes factor</span><strong>{fmt(model.logBf, 2)}</strong><small>BF ≈ {model.logBf > 20 ? `e^${fmt(model.logBf, 1)}` : fmt(Math.exp(model.logBf), 1)}</small></div>
              <div><span>Expected split gain</span><strong>{fmt(model.splitGain, 4)}</strong><small>normalized value / person</small></div>
            </div>
            <p>{preset === "baseline" ? "Both children have the same uplift. The outcome model strongly prefers separate baselines, but the treatment policy does not improve." : "The children cross the economic hurdle differently, so a split can change who receives treatment and add policy value."}</p>
          </div>
        </div>
      </section>

      <section className={styles.lab} id="posterior-lab" aria-labelledby="posterior-lab-title">
        <header><span>Lab 02</span><div><h3 id="posterior-lab-title">Posterior & Pooling Lab</h3><p>Parent reference, fresh replay evidence, one posterior.</p></div></header>
        <div className={styles.labGrid}>
          <fieldset className={styles.controls}>
            <legend>Evidence replay</legend>
            <label className={styles.selectLabel} htmlFor="selected-child">Selected child
              <select id="selected-child" value={selected} onChange={(event) => setSelected(event.currentTarget.value)}><option value="left">Child L</option><option value="right">Child R</option></select>
            </label>
            <RangeControl id="replay-evidence" label="Replay evidence" value={replayScale} min={0.25} max={2} step={0.25} output={`${replayScale.toFixed(2)}×`} onChange={setReplayScale} />
            <RangeControl id="prior-strength" label="Prior strength κ" value={kappa} min={20} max={300} step={10} output={String(kappa)} onChange={setKappa} />
            <div className={styles.fixedControl}><span>Discount λ</span><output>1.00</output></div>
          </fieldset>
          <div className={styles.results} aria-live="polite" data-testid="posterior-live">
            <DensityBars draws={selectedDraws} hurdle={hurdle} />
            <div className={styles.metricGrid}>
              <div><span>Posterior mean</span><strong>{fmtPct(selectedSummary.mean)}</strong></div>
              <div><span>90% credible interval</span><strong>[{fmtPct(selectedSummary.lower90)}, {fmtPct(selectedSummary.upper90)}]</strong></div>
              <div><span>P(Δ &gt; c/v)</span><strong>{fmtPct(selectedSummary.probabilityAbove, 1)}</strong></div>
              <div><span>Partial-pooling weight</span><strong>{fmtPct(kappa / (kappa + selectedLeaf.treatment.alpha + selectedLeaf.treatment.beta - kappa), 1)}</strong><small>prior share of arm precision</small></div>
            </div>
            <table aria-label="Development prior and replay evidence">
              <thead><tr><th>Source</th><th>Treatment</th><th>Control</th></tr></thead>
              <tbody>
                <tr><th scope="row">Development prior</th><td>α {fmt(model.prior.treatment.alpha, 1)} · β {fmt(model.prior.treatment.beta, 1)}</td><td>α {fmt(model.prior.control.alpha, 1)} · β {fmt(model.prior.control.beta, 1)}</td></tr>
                <tr><th scope="row">Fresh replay count</th><td>{Math.round(model.raw[selected as "left" | "right"].treatment.trials * replayScale).toLocaleString()} rows</td><td>{Math.round(model.raw[selected as "left" | "right"].control.trials * replayScale).toLocaleString()} rows</td></tr>
                <tr><th scope="row">Posterior</th><td>Beta({fmt(selectedLeaf.treatment.alpha, 1)}, {fmt(selectedLeaf.treatment.beta, 1)})</td><td>Beta({fmt(selectedLeaf.control.alpha, 1)}, {fmt(selectedLeaf.control.beta, 1)})</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={styles.lab} id="decision-lab" aria-labelledby="decision-lab-title">
        <header><span>Lab 03</span><div><h3 id="decision-lab-title">Decision Lab</h3><p>One Thompson draw, then constrained allocation.</p></div></header>
        <div className={styles.labGrid}>
          <fieldset className={styles.controls}>
            <legend>Economic scenario</legend>
            <RangeControl id="conversion-value" label="Conversion value v" value={value} min={25} max={200} step={5} output={value.toFixed(0)} onChange={setValue} />
            <RangeControl id="exposure-cost" label="Exposure cost c" value={cost} min={0.25} max={3} step={0.25} output={cost.toFixed(2)} onChange={setCost} />
            <RangeControl id="budget-share" label="Budget share" value={budget} min={0.05} max={0.5} step={0.05} output={fmtPct(budget, 0)} onChange={setBudget} />
            <RangeControl id="segment-cap" label="Segment cap" value={cap} min={0.2} max={1} step={0.05} output={fmtPct(cap, 0)} onChange={setCap} />
            <div className={styles.actionRow}><button type="button" onClick={() => setRedraw((current) => current + 1)}>New Thompson draw</button><button type="button" onClick={reset}>Reset</button></div>
          </fieldset>
          <div className={styles.results} aria-live="polite" data-testid="decision-live">
            <div className={styles.decisionLead}><span>Break-even uplift c/v</span><strong>{fmtPct(hurdle)}</strong><small>Gate {fmtPct(DEFAULTS.gate, 0)} · seed {DEFAULTS.seed} · draw {redraw}</small></div>
            <table aria-label="Constrained Thompson allocation">
              <thead><tr><th>Leaf</th><th>Sampled net</th><th>Precision bounds</th><th>Allocated</th></tr></thead>
              <tbody>{allocations.allocations.map((leaf) => <tr key={leaf.id} data-testid={`allocation-${leaf.id}`}><th scope="row">{leaf.label}</th><td>{fmt(leaf.sampledNetValue, 3)}</td><td>{fmtPct(leaf.lower, 1)}–{fmtPct(leaf.upper, 1)} of population</td><td><strong>{fmtPct(leaf.allocated, 1)}</strong>{leaf.eligible ? "" : " · gated"}</td></tr>)}</tbody>
            </table>
            <div className={styles.allocationBar} aria-hidden="true">{allocations.allocations.map((leaf) => <i key={leaf.id} style={{ width: `${leaf.allocated * 100}%` }} />)}<span style={{ width: `${allocations.unspent * 100}%` }} /></div>
            <p>Used {fmtPct(allocations.used, 1)} of the population; unspent budget {fmtPct(allocations.unspent, 1)}. Every non-zero leaf lies inside its treatment/control precision interval and its {fmtPct(cap, 0)} within-segment cap.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
