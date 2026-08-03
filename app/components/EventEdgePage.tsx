import type { CaseStudy } from "@/app/content";
import { EventEdgeMarketConsole } from "@/app/components/EventEdgeMarketConsole";
import {
  EvidenceNote,
  PaperEquation,
  PaperFigure,
  PaperFlow,
  PaperSection,
  ResearchPaperShell,
  type PaperSectionLink,
} from "@/app/components/ResearchPaperShell";

const sections: PaperSectionLink[] = [
  { id: "market-boundary", number: "1", title: "Market and information boundary" },
  { id: "reconstructed-market", number: "2", title: "Interactive reconstructed market" },
  { id: "valuation-mechanics", number: "3", title: "Valuation, CVaR, quoting, and atomic fill" },
  { id: "evidence-status", number: "4", title: "Evidence status" },
];

export function EventEdgePage({ study }: { study: CaseStudy }) {
  return (
    <ResearchPaperShell study={study} status="Private simulator · reconstructed interface" abstract="EventEdge turns public states from multiple incomplete-information games into a finite derivatives market. Registered terminal payoffs are valued under distinct scenario measures, inventory-aware order books quote depth, and multi-leg requests are accepted only when the combined portfolio satisfies tail-risk and execution constraints. The interactive market below is a deterministic reconstruction: it demonstrates the decision contract without exposing private game state or claiming observed trading performance." sections={sections}>
      <PaperSection {...sections[0]} deck="A trade can use the frozen public snapshot and registered future branches, but never a private card or realized terminal state.">
        <p>The underlying processes are independent Kuhn or Leduc games. At a decision checkpoint the engine freezes pot size, public action history, legal actions, public cards, and the registered derivative definitions. Private cards, the random seed, future actions, and the realized terminal state remain inside the game engine. Contracts are traded after the public action and before the next underlying transition; the true state is revealed only after the package decision and settlement boundary have been fixed.</p>
        <p>Terminal histories are merged when they produce the same registered payoff vector. This produces a finite scenario basis shared by every participant. The benchmark generator, market maker, and user may assign different weights to that basis, but they do not receive different payoff definitions. Separating what can happen, what each contract pays, and what each agent believes prevents valuation disagreements from becoming accidental information leakage.</p>
        <PaperFlow items={["Freeze public state", "Enumerate local futures", "Quote and decide", "Reveal and settle"]} />
        <EvidenceNote title="Information contract"><p>The true benchmark distribution is evaluation-only. Neither trading agent can inspect it, the terminal state, or engine-private data before the transaction gate.</p></EvidenceNote>
        <p>The boundary is enforced across time as well as fields. A quote is labeled by the public snapshot, payoff-registry version, scenario generator, and book sequence that produced it. Advancing an underlying game invalidates the old quote before a new one is published. Settlement references the committed package and its original contract versions, so a later configuration change cannot rewrite an outstanding obligation. This versioned lifecycle makes the simulator suitable for invariant testing even when participants disagree about probabilities.</p>
      </PaperSection>

      <PaperSection {...sections[1]} deck="The compact console preserves perspective, package, notional, book stress, terminal selection, risk decision, execution, and settlement reveal.">
        <p>The reconstruction exposes one four-state market with two candidate requests. Changing perspective changes fair values while retaining the same payoff matrix. Book profiles modify available depth and therefore the common fill ratio. Requested notional is evaluated against the user’s existing positions, cash flows, transaction costs, and tail objective rather than as a standalone spread.</p>
        <PaperFigure number="1" title="Deterministic reconstructed market. Terminal information remains locked until Reveal & Settle is activated; no order is submitted." interactive>
          <EventEdgeMarketConsole variant="paper" />
        </PaperFigure>
        <p>The console deliberately includes a positive standalone edge that can fail the combined-book gate and a hedge package that may remain acceptable after costs. This makes the distinction between valuation and action observable. A favorable expected payoff is not sufficient when it increases worst-state loss, violates a loss limit, or cannot be filled consistently across legs.</p>
      </PaperSection>

      <PaperSection {...sections[2]} deck="Every contract uses one payoff registry; reservation prices, risk, and execution are applied after valuation.">
        <p>For contract k, a perspective-specific fair value is the expectation of its registered terminal payoff. The market maker then shifts the quote center by inventory covariance and attaches spread and depth. A candidate package is scored on the distribution of the old portfolio plus requested legs and all costs. The private implementation targets CVaR; the public four-state reconstruction shows the corresponding tail decision directly.</p>
        <PaperEquation number="1" label="Valuation, tail risk, reservation quote, and common fill" expression={String.raw`\begin{aligned}V_k&=\sum_{s=1}^{S}p_sA_{sk},\\ \operatorname{CVaR}_\alpha(L)&=\min_\zeta\left[\zeta+\frac{\mathbb E(L-\zeta)_+}{1-\alpha}\right],\\ r_k&=V_k-\gamma\operatorname{Cov}(Y_k,q^\top Y),\\ \phi&=\min\left(1,\min_{\ell}\frac{D_\ell}{q_\ell}\right).\end{aligned}`} note="The immutable book snapshot supplies Dℓ. Every leg receives the same proportional fill φ." />
        <p>The package executor follows a two-phase rule. It first computes every leg against one immutable depth snapshot, derives the minimum feasible fill ratio, and evaluates the post-fill combined book. It then commits all position and cash changes or rolls them all back. After commit, buyer and seller changes sum to zero contract by contract, cash transfers reconcile, and two-sided realized PnL sums to zero at settlement.</p>
        <p>This ordering closes a common simulation loophole: later legs cannot consume a newer book than earlier legs, and the risk engine cannot authorize the requested package before learning that depth would materially alter it. Execution price, fees, and filled quantity remain inside the final gate.</p>
        <h3>Risk interpretation</h3>
        <p>Expected value and CVaR are evaluated under a declared perspective, not under the hidden benchmark. Inventory covariance moves the reservation center because a contract that looks inexpensive in isolation can reinforce an existing loss state. CVaR concentrates on the configured upper tail of loss and is paired with a hard worst-state limit; it is not presented as a complete model of ambiguity or model error. Stress profiles in the reconstruction vary depth and transaction conditions while leaving terminal payoffs fixed, making it possible to see whether rejection comes from economics, tail exposure, or execution capacity.</p>
      </PaperSection>

      <PaperSection {...sections[3]} deck="Private implementation claims, public reconstruction, and unestablished performance claims are kept in separate evidence classes.">
        <p>The project record supports a Linux C++ simulator containing multiple Kuhn or Leduc underlyings, derivatives traded outside those games, depth on both sides of the quoted market, package execution, and settlement checks. The portfolio interface is reconstructed from the architecture and uses deterministic explanatory values. It is not a recording of the private engine, a live feed, or a historical result.</p>
        <p>Small-game probabilities and policy behavior are intended to be checked against exact enumeration before Monte Carlo scenarios are trusted. Accounting tests cover cash conservation, position conservation, common-fill invariants, rollback, and terminal settlement. A full validation campaign would additionally report policy exploitability, public-belief calibration, solver tolerances, scenario error, and net performance after spread, slippage, and fees.</p>
        <EvidenceNote title="Claim boundary"><p>{study.boundary} The page reports no return, significance, latency, calibration, or solver-performance statistic.</p></EvidenceNote>
        <p>The reconstruction is therefore useful as an executable specification: it makes the information gate, valuation disagreement, portfolio risk test, atomic fill, and settlement journal inspectable without conflating those mechanisms with empirical success.</p>
        <p>Because every displayed state is deterministic, reviewers can reproduce a decision, change one control, and identify exactly which valuation, risk, depth, or settlement field caused the outcome to change.</p>
        <p>Important open questions remain empirical. Scenario weights may be misspecified, approximate policies may drift from equilibrium, dependent underlyings can thicken the portfolio tail, and a solver can terminate with a feasible but economically poor package. A publishable evaluation would pin seeds and configuration, compare small games with exact oracles, report Monte Carlo error and solver status, and measure net outcomes on held-out episodes. Until such an artifact exists, the interface communicates mechanics and failure modes only.</p>
      </PaperSection>
    </ResearchPaperShell>
  );
}
