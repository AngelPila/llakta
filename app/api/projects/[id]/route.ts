import { NextResponse } from "next/server";
import { getProject, logEvent, updateProject } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = getProject((await params).id);
  if (!p) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(p);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (p.status !== "listo") return NextResponse.json({ error: "Se publica cuando el plan esté listo." }, { status: 409 });
  const body = (await req.json()) as { publico?: boolean };
  if (typeof body.publico !== "boolean") return NextResponse.json({ error: "Falta publico" }, { status: 400 });
  updateProject(id, (x) => {
    x.publico = body.publico;
    logEvent(x, x.duenoNombre, body.publico ? "Publicó el proyecto en la comunidad" : "Quitó el proyecto de la comunidad");
  });
  return NextResponse.json({ ok: true });
}
