/* eslint-disable @next/next/no-img-element -- GitHub Pages serves these small, local brand assets directly. */
import { AvikusProjectiveField, FinburhDependencyLattice } from "@/app/components/WorkExperienceGraphic";

export function WorkCardVisual({ type }: { type: string }) {
  const isAvikus = type === "navigation";

  return (
    <div className={`work-card-visual ${isAvikus ? "work-card-avikus" : "work-card-finburh"}`} aria-hidden="true">
      {isAvikus ? (
        <div className="employer-logo-lockup">
          <img src="/brand/hd-hyundai.png" width="1320" height="198" alt="" />
          <img src="/brand/avikus.png" width="2241" height="572" alt="" />
        </div>
      ) : (
        <div className="maingate-wordmark">
          <strong>MainGate</strong>
          <span>Partners Inc.</span>
        </div>
      )}
      <span className="brand-cross">×</span>
      <div className="work-shape-wrap">
        {isAvikus ? <AvikusProjectiveField /> : <FinburhDependencyLattice />}
      </div>
    </div>
  );
}
