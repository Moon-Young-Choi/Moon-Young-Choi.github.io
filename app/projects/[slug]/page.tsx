import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/app/components/CaseStudyPage";
import { ArbitrageLabPage } from "@/app/components/ArbitrageLabPage";
import { PwrTheoryPage } from "@/app/components/PwrTheoryPage";
import { QuantPlatformPage } from "@/app/components/QuantPlatformPage";
import { findStudy, projectAliases, projectStudies, resolveProjectSlug } from "@/app/content";

export function generateStaticParams() {
  return [
    ...projectStudies.map((study) => ({ slug: study.slug })),
    ...Object.keys(projectAliases).map((slug) => ({ slug })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = findStudy("project", resolveProjectSlug(slug));
  return study
    ? {
        title: `${study.title} — Moonyoung Choi`,
        description: study.summary,
        alternates: { canonical: `/projects/${study.slug}/` },
      }
    : { title: "Project — Moonyoung Choi" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = findStudy("project", resolveProjectSlug(slug));
  if (!study) notFound();
  if (study.presentation === "quant-platform") return <QuantPlatformPage study={study} />;
  if (study.presentation === "pwr-theory") return <PwrTheoryPage study={study} />;
  if (study.presentation === "arbitrage-lab") return <ArbitrageLabPage study={study} />;
  return <CaseStudyPage study={study} />;
}
