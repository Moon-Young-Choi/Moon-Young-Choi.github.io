"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { loadPwrEmpiricalDemo, type PwrEmpiricalDemoV1, type PwrEmpiricalMethodV1, type PwrEmpiricalResultV1, type PwrEmpiricalRowV1 } from "@/app/lib/pwrEmpirical";
import styles from "@/app/components/PwrEmpiricalConsole.module.css";

export interface PwrActualEvidenceSummary {
  release: string;
  commit: string;
  fingerprint: string;
  engineeringRuns: number;
  computationalTests: number;
  campaigns: Array<{ id: string; label: string; status: string }>;
  dcase: { rocAuc: number; sensitivity: number; interpretation: string };
}

const contents = [
  ["01", "Study design", "study-design"],
  ["02", "Result overview", "result-overview"],
  ["03", "Detection power", "detection-power"],
  ["04", "Null calibration", "null-calibration"],
  ["05", "Band localization", "band-localization"],
  ["06", "Mismatch robustness", "mismatch-robustness"],
  ["07", "Permutation budget", "permutation-budget"],
  ["08", "Provenance", "empirical-provenance"],
] as const;

function formatPercent(value: number) { return `${(value * 100).toFixed(1)}%`; }
function formatRuntime(value: number) { return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`; }

function EmpiricalContents() {
  const list = <ol>{contents.map(([number, label, id]) => <li key={id}><a href={`#${id}`}><span>{number}</span>{label}</a></li>)}</ol>;
  return <><aside className={styles.desktopContents} id="empirical-contents"><nav aria-label="Empirical study contents"><h2>Empirical contents</h2>{list}</nav></aside><details className={styles.mobileContents}><summary>Empirical contents · 8 sections</summary><nav aria-label="Empirical study mobile contents">{list}</nav></details></>;
}

function Section({ id, number, title, intro, children }: { id: string; number: string; title: string; intro: string; children: ReactNode }) {
  return <section className={styles.section} id={id} aria-labelledby={`${id}-title`}><header><span>{number} / Simulated study</span><div><h2 id={`${id}-title`}>{title}</h2><p>{intro}</p></div></header>{children}</section>;
}

function Segmented({ label, values, value, render = String, onChange }: { label: string; values: number[]; value: number; render?: (value: number) => string; onChange: (value: number) => void }) {
  return <fieldset className={styles.segmented}><legend>{label}</legend><div>{values.map((item) => <button key={item} type="button" aria-pressed={item === value} onClick={() => onChange(item)}>{render(item)}</button>)}</div></fieldset>;
}

function Plot({ series, xValues, yMax = 1, ariaLabel }: { series: Array<{ method: PwrEmpiricalMethodV1; values: number[] }>; xValues: number[]; yMax?: number; ariaLabel: string }) {
  return <div className={styles.plot} role="img" aria-label={ariaLabel}>
    {[0, .25, .5, .75, 1].map((tick) => <i className={styles.gridLine} key={tick} style={{ "--y": `${tick * 100}%` } as CSSProperties}><span>{(tick * yMax).toFixed(2)}</span></i>)}
    {series.flatMap(({ method, values }) => values.map((value, index) => {
      const x = xValues.length === 1 ? 50 : (index / (xValues.length - 1)) * 100;
      const y = Math.min(100, (value / yMax) * 100);
      const next = values[index + 1];
      const nextX = xValues.length === 1 ? x : ((index + 1) / (xValues.length - 1)) * 100;
      const nextY = next === undefined ? y : Math.min(100, (next / yMax) * 100);
      const dx = nextX - x; const dy = nextY - y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
      return <span key={`${method.id}-${xValues[index]}`} className={styles.plotPoint} data-tone={method.tone} data-marker={method.marker} style={{ "--x": `${x}%`, "--y": `${y}%` } as CSSProperties} title={`${method.label}: ${value.toFixed(3)}`}>
        {next !== undefined && <i style={{ "--length": `${length}%`, "--angle": `${angle}deg` } as CSSProperties} />}
      </span>;
    }))}
    <div className={styles.xLabels}>{xValues.map((value) => <span key={value}>{value}</span>)}</div>
  </div>;
}

function MethodLegend({ methods }: { methods: PwrEmpiricalMethodV1[] }) {
  return <ul className={styles.legend} aria-label="Compared methods">{methods.map((method) => <li key={method.id}><i data-tone={method.tone} data-marker={method.marker} />{method.label}</li>)}</ul>;
}

function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return <details className={styles.dataTable}><summary>Data table</summary><div><table><caption>{caption}</caption><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => index === 0 ? <th key={index}>{cell}</th> : <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div></details>;
}

function findRow(data: PwrEmpiricalDemoV1, selection: PwrEmpiricalDemoV1["design"]["defaultSelection"]): PwrEmpiricalRowV1 {
  const row = data.rows.find((item) => item.scenarioId === selection.scenarioId && item.nPerGroup === selection.nPerGroup && item.effectSize === selection.effectSize && item.mismatch === selection.mismatch && item.permutations === selection.permutations);
  if (!row) throw new Error("The selected precomputed empirical row is unavailable");
  return row;
}

function result(row: PwrEmpiricalRowV1, methodId: string): PwrEmpiricalResultV1 {
  const value = row.results.find((item) => item.methodId === methodId);
  if (!value) throw new Error(`Missing result for ${methodId}`);
  return value;
}

export function PwrEmpiricalConsole({ evidence }: { evidence: PwrActualEvidenceSummary }) {
  const [data, setData] = useState<PwrEmpiricalDemoV1 | null>(null);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState<PwrEmpiricalDemoV1["design"]["defaultSelection"] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadPwrEmpiricalDemo(controller.signal).then((artifact) => { setData(artifact); setSelection(artifact.design.defaultSelection); }).catch((reason: unknown) => { if ((reason as { name?: string }).name !== "AbortError") setError(reason instanceof Error ? reason.message : "Empirical artifact unavailable"); });
    return () => controller.abort();
  }, []);

  const selected = useMemo(() => data && selection ? findRow(data, selection) : null, [data, selection]);
  if (error) return <div className={styles.loadState} role="alert"><strong>Empirical console unavailable</strong><p>{error}</p></div>;
  if (!data || !selection || !selected) return <div className={styles.loadState} role="status">Loading verified synthetic study…</div>;

  const scenario = data.design.scenarios.find((item) => item.id === selection.scenarioId)!;
  const pwr = result(selected, "pwr-scan");
  const bestBaseline = Math.max(...selected.results.filter((item) => item.methodId !== "pwr-scan").map((item) => item.power));
  const powerRows = data.design.controls.effectSizes.map((effectSize) => findRow(data, { ...selection, effectSize }));
  const powerSeries = data.design.methods.map((method) => ({ method, values: powerRows.map((row) => result(row, method.id).power) }));
  const mismatchRows = data.design.controls.mismatchLevels.map((mismatch) => findRow(data, { ...selection, mismatch }));
  const mismatchSeries = data.design.methods.map((method) => ({ method, values: mismatchRows.map((row) => result(row, method.id).power) }));
  const permutationRows = data.design.controls.permutationBudgets.map((permutations) => findRow(data, { ...selection, permutations }));
  const runtimeMax = Math.max(...permutationRows.flatMap((row) => row.results.map((item) => item.runtimeMs))) * 1.05;
  const runtimeSeries = data.design.methods.map((method) => ({ method, values: permutationRows.map((row) => result(row, method.id).runtimeMs) }));
  const announce = `${scenario.label}, n ${selection.nPerGroup} per group, effect ${selection.effectSize.toFixed(2)}, mismatch ${selection.mismatch.toFixed(2)}, ${selection.permutations} permutations. Synthetic PWR-Scan power ${formatPercent(pwr.power)}.`;
  const update = (patch: Partial<typeof selection>) => setSelection((current) => current ? { ...current, ...patch } : current);

  return <article className={styles.console}>
    <header className={styles.hero}>
      <div className={styles.heroMeta}><span>Project / 02</span><strong>Simulated study</strong><span>Deterministic preview · No performance claim</span></div>
      <div className={styles.heroGrid}><div><p>Pooled-whitened randomized detection</p><h1>Research<br />console</h1><p>Explore a complete synthetic benchmark surface before replacing it with a provenance-locked observed study.</p></div><div className={styles.heroVisual} aria-hidden="true"><div>{Array.from({ length: 128 }, (_, index) => <i key={index} data-band={index >= scenario.trueBand[0] && index < scenario.trueBand[1]} />)}</div><b>TRUE BAND</b><span>POWER<br />{formatPercent(pwr.power)}</span></div></div>
      <dl className={styles.heroFacts}><div><dt>Data class</dt><dd>SIMULATED</dd></div><div><dt>Study grid</dt><dd>{data.rows.length.toLocaleString()}</dd></div><div><dt>Replicates / point</dt><dd>{data.design.replicatesPerPoint.toLocaleString()}</dd></div><div><dt>Methods</dt><dd>{data.design.methods.length}</dd></div></dl>
    </header>

    <div className={styles.bodyGrid}><EmpiricalContents /><div className={styles.content}>
      <Section id="study-design" number="01" title="Study design" intro="A deterministic synthetic covariance experiment with complete precomputed rows; control changes perform lookup only.">
        <div className={styles.controls}>
          <label><span>Scenario</span><select value={selection.scenarioId} onChange={(event) => update({ scenarioId: event.target.value })}>{data.design.scenarios.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <Segmented label="Samples / group" values={data.design.controls.sampleSizes} value={selection.nPerGroup} onChange={(nPerGroup) => update({ nPerGroup })} />
          <label className={styles.range}><span>Effect size <output>{selection.effectSize.toFixed(2)}</output></span><input type="range" min="0" max="1.5" step="0.25" value={selection.effectSize} onChange={(event) => update({ effectSize: Number(event.target.value) })} /></label>
          <Segmented label="Mismatch" values={data.design.controls.mismatchLevels} value={selection.mismatch} render={(value) => value.toFixed(1)} onChange={(mismatch) => update({ mismatch })} />
          <Segmented label="Permutations" values={data.design.controls.permutationBudgets} value={selection.permutations} onChange={(permutations) => update({ permutations })} />
        </div>
        <div className={styles.designNote}><strong>{scenario.label}</strong><p>{scenario.detail}</p><span>α = {data.design.alpha.toFixed(2)} · {data.design.frequencyBins} frequency bins · recording-cluster unit</span></div>
      </Section>

      <Section id="result-overview" number="02" title="Result overview" intro="The selected synthetic result row updates every view in the console.">
        <p className={styles.liveRegion} aria-live="polite" aria-atomic="true">{announce}</p>
        <div className={styles.kpis} aria-label="Selected simulated study key results"><div><span>Simulated PWR power</span><strong>{formatPercent(pwr.power)}</strong><small>95% CI {formatPercent(pwr.powerInterval[0])}–{formatPercent(pwr.powerInterval[1])}</small></div><div><span>Vs best baseline</span><strong>{`${(100 * (pwr.power - bestBaseline) >= 0 ? "+" : "")}${(100 * (pwr.power - bestBaseline)).toFixed(1)} pp`}</strong><small>Selected condition only</small></div><div><span>Null rejection</span><strong>{formatPercent(pwr.level)}</strong><small>Nominal α = 5.0%</small></div><div><span>Support IoU</span><strong>{pwr.supportIou.toFixed(2)}</strong><small>{pwr.locationErrorBins.toFixed(1)} bins location error</small></div><div><span>Runtime</span><strong>{formatRuntime(pwr.runtimeMs)}</strong><small>{selection.permutations.toLocaleString()} permutations</small></div></div>
        <MethodLegend methods={data.design.methods} />
      </Section>

      <Section id="detection-power" number="03" title="Detection power" intro="Synthetic rejection probability across effect size at the selected sample size, mismatch and permutation budget.">
        <figure className={styles.figure}><Plot series={powerSeries} xValues={data.design.controls.effectSizes} ariaLabel={`Simulated power curves for ${scenario.label}`} /><figcaption><strong>SIMULATED STUDY.</strong> Effect size appears on the horizontal axis and rejection probability on the vertical axis.</figcaption></figure>
        <DataTable caption="Synthetic detection power by effect size" headers={["Effect", ...data.design.methods.map((item) => item.label)]} rows={powerRows.map((row) => [row.effectSize.toFixed(2), ...data.design.methods.map((method) => formatPercent(result(row, method.id).power))])} />
      </Section>

      <Section id="null-calibration" number="04" title="Null calibration" intro="Synthetic null rejection estimates and Wilson intervals remain near the nominal 5% level.">
        <figure className={styles.figure}><div className={styles.calibration} role="img" aria-label="Simulated null calibration intervals"><i className={styles.alphaLine}><span>α .05</span></i>{data.design.methods.map((method) => { const item = result(selected, method.id); return <div key={method.id}><b>{method.label}</b><span style={{ "--start": `${item.levelInterval[0] * 1000}%`, "--width": `${(item.levelInterval[1] - item.levelInterval[0]) * 1000}%`, "--point": `${item.level * 1000}%` } as CSSProperties} data-tone={method.tone}><i /></span><em>{item.level.toFixed(3)}</em></div>; })}</div><figcaption><strong>SIMULATED STUDY.</strong> The display range is 0–10%; the vertical reference marks nominal α.</figcaption></figure>
        <DataTable caption="Synthetic null calibration" headers={["Method", "Level", "95% lower", "95% upper"]} rows={data.design.methods.map((method) => { const item = result(selected, method.id); return [method.label, item.level.toFixed(3), item.levelInterval[0].toFixed(3), item.levelInterval[1].toFixed(3)]; })} />
      </Section>

      <Section id="band-localization" number="05" title="Band localization" intro="The known planted support is compared with each method’s selected synthetic band.">
        <figure className={styles.figure}><div className={styles.bandMap} role="img" aria-label={`True band ${scenario.trueBand[0]} to ${scenario.trueBand[1]} and selected bands`}><div><b>Planted band</b><span>{Array.from({ length: 128 }, (_, index) => <i key={index} data-active={index >= scenario.trueBand[0] && index < scenario.trueBand[1]} />)}</span></div>{data.design.methods.map((method) => { const item = result(selected, method.id); return <div key={method.id}><b>{method.label}</b><span>{Array.from({ length: 128 }, (_, index) => <i key={index} data-active={index >= item.selectedBand[0] && index < item.selectedBand[1]} data-tone={method.tone} />)}</span></div>; })}</div><figcaption><strong>SIMULATED STUDY.</strong> Filled cells show the planted and selected frequency-bin supports.</figcaption></figure>
        <DataTable caption="Synthetic localization results" headers={["Method", "Selected band", "Support IoU", "Location error"]} rows={data.design.methods.map((method) => { const item = result(selected, method.id); return [method.label, `[${item.selectedBand[0]}, ${item.selectedBand[1]})`, item.supportIou.toFixed(3), `${item.locationErrorBins.toFixed(1)} bins`]; })} />
      </Section>

      <Section id="mismatch-robustness" number="06" title="Mismatch robustness" intro="Synthetic power as the leading covariance direction departs from the exact planted spike.">
        <figure className={styles.figure}><Plot series={mismatchSeries} xValues={data.design.controls.mismatchLevels} ariaLabel={`Simulated mismatch robustness for ${scenario.label}`} /><figcaption><strong>SIMULATED STUDY.</strong> Mismatch η appears on the horizontal axis and power on the vertical axis.</figcaption></figure>
        <DataTable caption="Synthetic power by mismatch" headers={["Mismatch", ...data.design.methods.map((item) => item.label)]} rows={mismatchRows.map((row) => [row.mismatch.toFixed(1), ...data.design.methods.map((method) => formatPercent(result(row, method.id).power))])} />
      </Section>

      <Section id="permutation-budget" number="07" title="Permutation budget" intro="Runtime grows with the registered randomization budget while p-value resolution improves from 1/(R+1).">
        <figure className={styles.figure}><Plot series={runtimeSeries} xValues={data.design.controls.permutationBudgets} yMax={runtimeMax} ariaLabel="Simulated runtime by permutation budget" /><figcaption><strong>SIMULATED STUDY.</strong> Runtime uses the vertical scale from 0 to {formatRuntime(runtimeMax)}; minimum attainable p-values are shown in the table.</figcaption></figure>
        <DataTable caption="Synthetic runtime and permutation resolution" headers={["Permutations", "Minimum p", ...data.design.methods.map((item) => `${item.label} runtime`)]} rows={permutationRows.map((row) => [row.permutations, (1 / (row.permutations + 1)).toFixed(5), ...data.design.methods.map((method) => formatRuntime(result(row, method.id).runtimeMs))])} />
      </Section>

      <Section id="empirical-provenance" number="08" title="Provenance" intro="Synthetic interface evidence and actual repository evidence remain separate by construction.">
        <div className={styles.provenanceGrid}><article><span>Displayed study / synthetic</span><h3>Deterministic preview</h3><dl><div><dt>Seed</dt><dd>{data.provenance.seed}</dd></div><div><dt>Generator</dt><dd>{data.provenance.generatorVersion}</dd></div><div><dt>Fingerprint</dt><dd><code>{data.provenance.fingerprint}</code></dd></div><div><dt>Boundary</dt><dd>{data.boundary.statement}</dd></div></dl></article><article><span>Repository record / actual</span><h3>Evidence retained</h3><dl><div><dt>Release</dt><dd>{evidence.release} · {evidence.commit.slice(0, 12)}</dd></div><div><dt>Engineering</dt><dd>{evidence.engineeringRuns} runs · {evidence.computationalTests} tests</dd></div><div><dt>Registered studies</dt><dd>{evidence.campaigns.map((campaign) => `${campaign.id} ${campaign.status}`).join(" · ")}</dd></div><div><dt>External DCASE</dt><dd>ROC AUC {evidence.dcase.rocAuc} · sensitivity {evidence.dcase.sensitivity}. {evidence.dcase.interpretation}</dd></div></dl></article></div>
      </Section>
    </div></div>
  </article>;
}
