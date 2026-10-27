import { NextResponse } from "next/server";
import { coordinate } from "@/lib/coordinator";
import { limitar } from "@/lib/limit";
import { getProject } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const { texto, autor } = (await req.json()) as { texto?: string; autor?: string };
  if (!texto?.trim()) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  const tope = limitar(req, "chat", 40);
  if (tope) return tope;
  const out = await coordinate(id, autor?.trim() || p.duenoNombre, texto.trim());
  return NextResponse.json(out);
}
