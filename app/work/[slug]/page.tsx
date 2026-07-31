import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/app/components/CaseStudyPage";
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
  return <CaseStudyPage study={study} />;
}
