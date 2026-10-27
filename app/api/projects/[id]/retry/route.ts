import { NextResponse } from "next/server";
import { freshAgents } from "@/lib/agents";
import { limitar } from "@/lib/limit";
import { provider } from "@/lib/llm";
import { runPipeline, startInterview } from "@/lib/pipeline";
import { getProject, updateProject } from "@/lib/store";

// Vuelve a correr desde donde tenga sentido: sin preguntas, la entrevista; con preguntas, todo el equipo.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const tope = limitar(req, "retry", 5);
  if (tope) return tope;
  const conPreguntas = p.preguntas.length > 0;
  updateProject(id, (x) => {
    x.agentes = freshAgents();
    x.error = undefined;
    x.proveedor = provider().label;
    x.status = conPreguntas ? "trabajando" : "preguntando";
    x.docs = [];
    x.tasks = [];
    x.members = [];
    x.campana = undefined;
  });
  void (conPreguntas ? runPipeline(id) : startInterview(id));
  return NextResponse.json({ ok: true });
}
