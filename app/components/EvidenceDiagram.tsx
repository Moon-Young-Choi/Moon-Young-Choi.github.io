function Flow({ items }: { items: string[] }) {
  return (
    <div className="system-flow" aria-label={`System flow: ${items.join(", then ")}`}>
      {items.map((item, index) => (
        <div className="flow-step" key={item}>
          <span className="mono">{String(index + 1).padStart(2, "0")}</span>
          <strong>{item}</strong>
          {index < items.length - 1 && <i aria-hidden="true">→</i>}
        </div>
      ))}
    </div>
  );
}

function SignalDiagram() {
  const points = [36, 24, 48, 32, 74, 50, 42, 66, 28, 58, 39, 70, 45, 31, 62, 40];
  return (
    <div className="analytic-panel signal-panel" aria-label="Synthetic signal and panorama alignment diagram">
      <div className="signal-strip">
        {points.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
      </div>
      <div className="frame-stack"><span /><span /><span /></div>
      <div className="panel-axis mono"><span>Scenario</span><span>Aligned output</span></div>
    </div>
  );
}

function AgentDiagram() {
  return (
    <div className="analytic-panel agent-panel" aria-label="Evidence and agent orchestration graph">
      <div className="agent-node source">DART<br />KRX</div>
      <div className="agent-node evidence">Evidence</div>
      <div className="agent-node orchestrator">Route</div>
      <div className="agent-node sheet">Model</div>
      <div className="agent-node slides">Deck</div>
      <span className="agent-line l1" /><span className="agent-line l2" />
      <span className="agent-line l3" /><span className="agent-line l4" />
    </div>
  );
}

function ScanDiagram() {
  return (
    <div className="analytic-panel scan-panel" aria-label="Multiscale covariance block scan diagram">
      <div className="frequency-row row-a"><span /><span /><span /></div>
      <div className="frequency-row row-b"><span /><span /><span /><span /></div>
      <div className="frequency-row row-c"><span /><span /><span /><span /><span /></div>
      <div className="scan-window" />
      <div className="scan-root"><span /><span /><span /></div>
      <div className="panel-axis mono"><span>Frequency blocks</span><span>Largest root</span></div>
    </div>
  );
}

function ValidationDiagram() {
  const nullPoints = [18, 27, 31, 38, 42, 47, 53, 58, 61, 66, 70, 74, 79];
  return (
    <div className="analytic-panel validation-panel" aria-label="Observed statistic compared with a randomization distribution">
      <div className="null-label mono">Randomization distribution</div>
      <div className="null-line">
        {nullPoints.map((left, index) => <span key={index} style={{ left: `${left}%`, bottom: `${18 + (index % 4) * 14}px` }} />)}
      </div>
      <div className="observed-line"><span className="mono">Observed</span></div>
      <div className="panel-axis mono"><span>Compatible</span><span>Tail rank</span></div>
    </div>
  );
}

function EvidenceGridDiagram() {
  return (
    <div className="analytic-panel evidence-panel" aria-label="Point-in-time evidence planes diagram">
      <div className="evidence-source"><span>DART</span><span>FSC</span><span>KRX</span></div>
      <div className="evidence-plane exact"><b>Exact</b><i /><i /><i /></div>
      <div className="evidence-plane narrative"><b>Narrative</b><i /><i /><i /></div>
      <div className="bundle">Evidence<br />bundle</div>
      <div className="cutoff mono">t ≤ cutoff</div>
    </div>
  );
}

function PosteriorDiagram() {
  const control = [12, 22, 39, 63, 78, 66, 43, 23, 12];
  const treated = [7, 14, 25, 43, 67, 82, 71, 48, 24];
  return (
    <div className="analytic-panel posterior-panel" aria-label="Treatment and control posterior distributions">
      <div className="posterior-bars control">
        {control.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
      </div>
      <div className="posterior-bars treated">
        {treated.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
      </div>
      <div className="break-even"><span className="mono">c / v</span></div>
      <div className="posterior-legend mono"><span>Control</span><span>Treatment</span></div>
    </div>
  );
}

function TriangleDiagram() {
  return (
    <div className="analytic-panel triangle-panel" aria-label="Three-leg market conversion route">
      <div className="route-triangle"><span className="route-a">KRW</span><span className="route-b">BTC</span><span className="route-c">ALT</span></div>
      <div className="route-label r1 mono">bid · fee</div><div className="route-label r2 mono">ask · depth</div><div className="route-label r3 mono">fill · residual</div>
      <div className="gate-list mono"><span>Latency</span><span>Balance</span><span>Minimum</span><span>Loss</span></div>
    </div>
  );
}

function DerivativesDiagram() {
  return (
    <div className="analytic-panel derivatives-panel" aria-label="Scenario payoff matrix and portfolio risk diagram">
      <div className="matrix-head mono"><span>Scenario</span><span>Future</span><span>Call</span><span>Swap</span></div>
      {["S₁", "S₂", "S₃", "S₄"].map((scenario, row) => (
        <div className="matrix-row" key={scenario}>
          <b>{scenario}</b><i style={{ height: `${34 + row * 11}%` }} /><i style={{ height: `${75 - row * 13}%` }} /><i style={{ height: `${23 + (row % 2) * 51}%` }} />
        </div>
      ))}
      <div className="risk-tail"><span /><span /><span /><span /><span /><span /><span /></div>
      <div className="risk-label mono">Portfolio loss tail</div>
    </div>
  );
}

export function EvidenceDiagram({ type, flow }: { type: string; flow: string[] }) {
  const diagrams: Record<string, React.ReactNode> = {
    navigation: <SignalDiagram />,
    agents: <AgentDiagram />,
    scan: <ScanDiagram />,
    validation: <ValidationDiagram />,
    grid: <EvidenceGridDiagram />,
    bayes: <PosteriorDiagram />,
    arbitrage: <TriangleDiagram />,
    derivatives: <DerivativesDiagram />,
  };

  return (
    <div className="evidence-figure">
      <Flow items={flow} />
      {diagrams[type]}
    </div>
  );
}
