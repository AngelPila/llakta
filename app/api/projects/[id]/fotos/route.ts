import fs from "node:fs";
import { NextResponse } from "next/server";
import { fotoPath } from "@/lib/fotos-server";
import { getProject, logEvent, newId, updateProject } from "@/lib/store";

// El navegador ya reduce la foto a 1600px antes de subirla; esto es solo el tope.
const MAX = 6 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getProject(id)) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const form = await req.formData();
  const file = form.get("foto");
  if (!(file instanceof File) || !file.type.startsWith("image/")) return NextResponse.json({ error: "Eso no parece una foto." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "La foto pesa demasiado (máximo 6 MB)." }, { status: 413 });
  const autor = String(form.get("autor") || "Alguien del equipo").slice(0, 60);
  const pie = String(form.get("pie") || "").slice(0, 140);
  const w = Number(form.get("w")) || 0;
  const h = Number(form.get("h")) || 0;
  const fotoId = newId(8);
  const dest = fotoPath(id, fotoId);
  fs.mkdirSync(dest.slice(0, dest.lastIndexOf("/")), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));
  updateProject(id, (p) => {
    (p.fotos ??= []).push({ id: fotoId, autor, pie, en: Date.now(), w, h });
    logEvent(p, autor, "subió una foto del lugar");
  });
  return NextResponse.json({ ok: true, id: fotoId });
}
