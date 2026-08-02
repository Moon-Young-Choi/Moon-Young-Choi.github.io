import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/app/components/CaseStudyPage";
import { AvikusExperiencePage } from "@/app/components/AvikusExperiencePage";
import { FinburhExperiencePage } from "@/app/components/FinburhExperiencePage";
import { findStudy, workStudies } from "@/app/content";

export function generateStaticParams() {
  return workStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = findStudy("work", slug);
  return study
    ? { title: `${study.organization} — Moonyoung Choi`, description: study.summary }
    : { title: "Experience — Moonyoung Choi" };
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = findStudy("work", slug);
  if (!study) notFound();
  if (study.presentation === "avikus-experience") return <AvikusExperiencePage study={study} />;
  if (study.presentation === "finburh-experience") return <FinburhExperiencePage study={study} />;
  return <CaseStudyPage study={study} />;
}
