import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { getProject, updateProject } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (p.status !== "entrevista") return NextResponse.json({ error: "Los agentes ya están trabajando." }, { status: 409 });
  const { respuestas } = (await req.json()) as { respuestas: Record<string, string> };
  updateProject(id, (x) => {
    x.respuestas = Object.fromEntries(Object.entries(respuestas ?? {}).map(([k, v]) => [k, String(v).trim()]));
    x.status = "trabajando";
  });
  void runPipeline(id);
  return NextResponse.json({ ok: true });
}
