import { NextResponse } from "next/server";
import { freshAgents } from "@/lib/agents";
import { cupoDiario, limitar } from "@/lib/limit";
import { provider } from "@/lib/llm";
import { startInterview } from "@/lib/pipeline";
import { newId, saveProject } from "@/lib/store";

export async function POST(req: Request) {
  const body = (await req.json()) as { problema?: string; nombre?: string };
  const problema = (body.problema ?? "").trim();
  const nombre = (body.nombre ?? "").trim();
  if (problema.length < 15) return NextResponse.json({ error: "Cuéntanos el problema con un poco más de detalle." }, { status: 400 });
  if (!nombre) return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
  const tope = limitar(req, "proyecto", 5) ?? cupoDiario();
  if (tope) return tope;
  const id = newId(8);
  saveProject({
    id,
    creadoEn: Date.now(),
    duenoNombre: nombre,
    problema,
    status: "preguntando",
    proveedor: provider().label,
    tituloCorto: "",
    preguntas: [],
    respuestas: {},
    agentes: freshAgents(),
    tasks: [],
    members: [],
    docs: [],
    chat: [],
    log: [{ en: Date.now(), autor: "Orquestador", texto: "Recibí el problema. La entrevista arma las preguntas." }],
  });
  void startInterview(id);
  return NextResponse.json({ id });
}
