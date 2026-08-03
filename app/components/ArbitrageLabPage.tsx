import type { CaseStudy } from "@/app/content";
import { ArbitrageMarketConsole } from "@/app/components/ArbitrageMarketConsole";
import {
  EvidenceNote,
  PaperEquation,
  PaperFigure,
  PaperFlow,
  PaperSection,
  ResearchPaperShell,
  type PaperSectionLink,
} from "@/app/components/ResearchPaperShell";
import { arbitrageUniverseManifest } from "@/app/lib/arbitrageUniverse";

const sections: PaperSectionLink[] = [
  { id: "universe-admissibility", number: "1", title: "Market universe and admissibility" },
  { id: "route-scanner", number: "2", title: "Interactive route scanner" },
  { id: "execution-plan", number: "3", title: "Depth-aware execution plan" },
  { id: "safety-evidence", number: "4", title: "Safety and evidence" },
];

export function ArbitrageLabPage({ study }: { study: CaseStudy }) {
  return (
    <ResearchPaperShell study={study} status="Public scanner · live trading disabled" abstract={`The detector enumerates every valid triangular route implied by ${arbitrageUniverseManifest.marketCount.toLocaleString("en-US")} listed Upbit pairs, evaluates both directions against order-book depth and per-leg fees, and produces an auditable execution plan. The embedded scanner uses a deterministic synthetic tape with ${arbitrageUniverseManifest.triangleSetCount.toLocaleString("en-US")} unique asset sets and ${arbitrageUniverseManifest.routeCount.toLocaleString("en-US")} directional routes. It submits no orders: a displayed spread remains a candidate until liquidity, freshness, precision, balance, and explicit live-readiness gates all pass.`} sections={sections}>
      <PaperSection {...sections[0]} deck="Topology comes from listed pairs; eligibility additionally requires fresh, connected books and a fully specified conversion path.">
        <p>A market pair is represented as a directed conversion in each executable direction. The detector joins three conversions only when their asset endpoints form a closed cycle and every edge corresponds to a listed market. Equivalent rotations are canonicalized into one asset set, then expanded into forward and reverse routes. This prevents duplicated opportunities from crowding the ranking while preserving the economically distinct directions.</p>
        <p>Admissibility is evaluated before profitability. All three books must be present, synchronized within the registered freshness tolerance, deep enough for the requested amount, and compatible with venue precision and minimum-order rules. Missing or stale legs invalidate the route; they are never filled from a previous snapshot. Public scanning needs no API key and remains separated from authenticated execution state.</p>
        <PaperEquation number="1" label="Fee-adjusted route multiplier" expression={String.raw`M_{a\to b\to c\to a}(q)=\prod_{\ell=1}^{3}\left(\frac{\operatorname{out}_\ell(q_{\ell-1};\,\mathcal B_\ell)}{q_{\ell-1}}\right)(1-f_\ell),\qquad \Pi(q)=q\,[M(q)-1]`} note="Each out operation walks the correct bid or ask side of the observed order book; it is not a top-of-book multiplication." />
        <PaperFlow items={["Listed-pair graph", "Canonical triangles", "Two directions", "Eligibility gates"]} />
        <p>Conversion semantics depend on market orientation. Spending a quote asset consumes asks and divides by price; selling a base asset consumes bids and multiplies by price. The route registry stores this operation explicitly for each leg rather than inferring it from a display label at runtime. That distinction is tested with inverse-market cases because a route can have the correct three symbols and still be economically reversed. Canonicalization changes only identity and ordering, never the conversion operation.</p>
      </PaperSection>

      <PaperSection {...sections[1]} deck="Search, hub, fee, direction, state, route, amount, and playback controls operate on one deterministic tape.">
        <p>The scanner below exposes the full route universe without turning the page into a dashboard. Search selects an asset set; filters restrict hub group, direction, fee schedule, and route state. The plot and its keyboard-accessible tabs show the universe, liquidity, or a selected-route timeline. Opening the numeric disclosure gives a fixed-height text-equivalent table whose rows can be sorted and selected.</p>
        <PaperFigure number="1" title="Interactive route universe and selected-route plan. Prices and books are synthetic; listing topology and deterministic artifact identity are recorded." interactive>
          <ArbitrageMarketConsole manifest={arbitrageUniverseManifest} variant="paper" />
        </PaperFigure>
        <p>Direction selection is not cosmetic. Reversing the same asset set changes which side of each book is consumed, the intermediate denomination, and the maximum executable start amount. Fee changes are applied at every leg. The selected detail therefore reports exact leg inputs, fees, outputs, residual assets, and the route’s final net amount rather than presenting a single theoretical percentage.</p>
      </PaperSection>

      <PaperSection {...sections[2]} deck="A candidate is sized by sequential book walking; later legs consume the actual output of earlier legs.">
        <p>For a starting amount q, each conversion walks price levels until the required input has been consumed or liquidity is exhausted. The fee is deducted in the output asset, and that net output becomes the next leg’s input. The plan records every fill level and computes the largest starting quantity supported by all three books. A positive top-of-book loop can disappear when a realistic amount crosses deeper levels.</p>
        <PaperEquation number="2" label="Sequential conversion and residual" expression={String.raw`q_\ell=(1-f_\ell)\,\operatorname{out}_\ell(q_{\ell-1};\mathcal B_\ell),\quad q_3-q_0=\Pi(q_0),\quad R=\sum_{x\ne a}\left|\operatorname{balance}^{\mathrm{after}}_x-\operatorname{balance}^{\mathrm{before}}_x\right|`} note="A clean plan closes in the start asset and reports any intermediate residual instead of silently marking it to KRW." />
        <p>The execution plan is immutable once created. It binds market identifiers, sides, limit prices, quantities, fee assumptions, book timestamps, and a snapshot fingerprint. Before any private action, the engine checks that the current book is not older than the plan, the projected net result remains above its safety margin, balances cover all legs, and venue rounding does not invalidate a minimum order.</p>
        <p>Partial fills create inventory risk rather than guaranteed arbitrage. The implementation therefore distinguishes detection, planning, submission, reconciliation, and unwind. A REST fallback reconciles private order state when the streaming channel is incomplete, while every decision and fill is appended to the audit log. The public portfolio stops at deterministic planning and never enters the submission phase.</p>
        <h3>Amount search</h3>
        <p>Profit is not monotone in size once discrete books and minimum orders are included. The planner evaluates registered candidate amounts and may refine around changes in consumed levels. It ranks feasible plans by net start-asset profit while retaining executable notional and residual inventory as separate fields. A larger percentage on a negligible quantity is therefore not automatically preferred to a smaller percentage on meaningful depth. The displayed amount control exposes the same sequential conversion path so that the selected route can be audited leg by leg.</p>
      </PaperSection>

      <PaperSection {...sections[3]} deck="Determinism explains what the scanner knew; independent gates decide whether authenticated execution may even be attempted.">
        <p>The demonstration tape is immutable and content-addressed. Its SHA-256 fingerprint covers the listing snapshot, order-book frames, route values, and provenance metadata, so candidate rankings and selected plans can be compared across browsers and test runs. Reduced-motion mode pauses automatic frame advancement while leaving manual controls and all numeric data available.</p>
        <p>Live readiness is fail-closed. Configuration must explicitly enable trading; credentials must be present; the venue and account must match the plan; clocks and books must be fresh; balances, precision, minimum notional, loss limits, and maximum exposure must pass; and an operator confirmation boundary must be satisfied. Any failed or unknown gate keeps order submission disabled. A detected spread is never itself authorization.</p>
        <EvidenceNote title="Execution boundary"><p>Live trading is disabled on this site. The scanner demonstrates deterministic market ingestion, route enumeration, depth-aware conversion, fee accounting, and an execution plan—not realized profit or safe production deployment.</p></EvidenceNote>
        <p>Verification combines route-graph identities, deterministic replay hashes, numerical conversion cases, fee and rounding properties, stale-book rejection, balance guards, and append-only audit assertions. These checks support implementation claims. They do not remove latency, adverse selection, fill uncertainty, or exchange risk, all of which remain outside a browser reconstruction.</p>
        <p>The principal operational threat is a mismatch between detection state and execution state. Network delay can move one book, an earlier order can change balances, a venue can reject precision, or a partially filled first leg can leave an exposed asset before the third leg is attempted. The safety design therefore records intent before action, revalidates independent gates at each boundary, and treats reconciliation as a first-class state transition. Recovery must be explicit; an unobserved or ambiguous order status is never interpreted as a successful arbitrage.</p>
      </PaperSection>
    </ResearchPaperShell>
  );
}
