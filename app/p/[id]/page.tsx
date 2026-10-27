import { notFound } from "next/navigation";
import { provider } from "@/lib/llm";
import { getProject } from "@/lib/store";
import ProjectApp from "@/components/ProjectApp";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const p = getProject((await params).id);
  if (!p) notFound();
  const prov = provider();
  return <ProjectApp initial={p} webSearch={prov.webSearch} />;
}
