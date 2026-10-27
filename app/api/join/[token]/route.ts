import { NextResponse } from "next/server";
import { findByToken, logEvent, updateProject } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const found = findByToken((await params).token);
  if (!found) return NextResponse.json({ error: "Esta invitación no existe." }, { status: 404 });
  const { nombre } = (await req.json()) as { nombre?: string };
  const n = (nombre ?? "").trim();
  if (!n) return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
  const m0 = found.project.members.find((m) => m.id === found.memberId)!;
  if (m0.nombre) return NextResponse.json({ error: `Este lugar ya lo tomó ${m0.nombre}.` }, { status: 409 });
  updateProject(found.project.id, (p) => {
    const m = p.members.find((x) => x.id === found.memberId)!;
    m.nombre = n;
    m.unidoEn = Date.now();
    m.disponible = true;
    for (const t of p.tasks) if (t.responsableId === m.id) t.cambio = Date.now();
    logEvent(p, n, `Se sumó como ${m.rol}`);
    p.chat.push({ id: `j${Date.now()}`, de: "coordinador", autor: "Coordinador", texto: `${n} se sumó como ${m.rol}. Ya ve sus tareas.`, acciones: [], en: Date.now() });
  });
  return NextResponse.json({ ok: true, projectId: found.project.id, memberId: found.memberId });
}
