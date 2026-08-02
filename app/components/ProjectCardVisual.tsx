import type { CaseStudy } from "@/app/content";
import { ArbitrageProjectPanel } from "@/app/components/ArbitrageProjectPanel";
import { EventEdgeProjectPanel } from "@/app/components/EventEdgeProjectPanel";
import { ProjectShape } from "@/app/components/ProjectShape";
import { PwrTheoryProjectPanel } from "@/app/components/PwrTheoryProjectPanel";
import { QuantPlatformProjectPanel } from "@/app/components/QuantPlatformProjectPanel";

export function ProjectCardVisual({ study }: { study: CaseStudy }) {
  switch (study.presentation) {
    case "quant-platform":
      return <QuantPlatformProjectPanel />;
    case "pwr-theory":
      return <PwrTheoryProjectPanel />;
    case "arbitrage-lab":
      return <ArbitrageProjectPanel />;
    case "eventedge-market":
      return <EventEdgeProjectPanel />;
    default:
      return <ProjectShape type={study.shape} />;
  }
}
