import { NextResponse } from "next/server";
import { memberName } from "@/lib/coordinator";
import { getProject, logEvent, updateProject } from "@/lib/store";
import type { TaskState } from "@/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const p = getProject(id);
  const t = p?.tasks.find((x) => x.id === taskId);
  if (!p || !t) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const body = (await req.json()) as { estado?: TaskState; responsableId?: string; autor?: string };
  updateProject(id, (x) => {
    const task = x.tasks.find((y) => y.id === taskId)!;
    const autor = body.autor || x.duenoNombre;
    if (body.estado && ["pendiente", "en_curso", "hecha"].includes(body.estado)) {
      task.estado = body.estado;
      logEvent(x, autor, `«${task.titulo}» → ${body.estado.replace("_", " ")}`);
    }
    if (body.responsableId) {
      const m = x.members.find((y) => y.id === body.responsableId);
      if (m) {
        task.responsableId = m.id;
        logEvent(x, autor, `«${task.titulo}» ahora la lleva ${memberName(m)}`);
      }
    }
    task.cambio = Date.now();
  });
  return NextResponse.json({ ok: true });
}
