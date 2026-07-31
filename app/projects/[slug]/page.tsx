import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/app/components/CaseStudyPage";
import { findStudy, projectStudies } from "@/app/content";

export function generateStaticParams() {
  return projectStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = findStudy("project", slug);
  return study
    ? { title: `${study.title} — Moonyoung Choi`, description: study.summary }
    : { title: "Project — Moonyoung Choi" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = findStudy("project", slug);
  if (!study) notFound();
  return <CaseStudyPage study={study} />;
}
