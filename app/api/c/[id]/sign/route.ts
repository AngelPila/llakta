import { NextResponse } from "next/server";
import { getPublico, updateProject } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = getPublico((await params).id);
  if (!p?.campana) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const { nombre, barrio } = (await req.json()) as { nombre?: string; barrio?: string };
  const n = (nombre ?? "").trim().slice(0, 60);
  if (!n) return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
  const out = updateProject(p.id, (x) => {
    x.campana!.firmas.push({ nombre: n, barrio: (barrio ?? "").trim().slice(0, 60), en: Date.now() });
  });
  return NextResponse.json({ ok: true, firmas: out.campana!.firmas.length });
}
