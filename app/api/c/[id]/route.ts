import { NextResponse } from "next/server";
import { getProject } from "@/lib/store";

export const dynamic = "force-dynamic";

// Solo lo público de la campaña: el conteo y los últimos nombres.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = getProject((await params).id);
  if (!p?.campana) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json({ firmas: p.campana.firmas.length, ultimas: p.campana.firmas.slice(-5).reverse().map((f) => ({ nombre: f.nombre, barrio: f.barrio })) });
}
