import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { getProject, logEvent, updateProject } from "@/lib/store";

// La persona elige con qué salida seguir; el equipo retoma desde el plan.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (p.status !== "eligiendo") return NextResponse.json({ error: "Ya no se puede elegir." }, { status: 409 });
  const { solucionId } = (await req.json()) as { solucionId?: string };
  const s = p.soluciones?.find((x) => x.id === solucionId);
  if (!s) return NextResponse.json({ error: "Esa salida no existe." }, { status: 400 });
  updateProject(id, (x) => {
    x.elegidaId = s.id;
    x.status = "trabajando";
    logEvent(x, x.duenoNombre, `Eligió seguir con «${s.nombre}»`);
  });
  void runPipeline(id);
  return NextResponse.json({ ok: true });
}
