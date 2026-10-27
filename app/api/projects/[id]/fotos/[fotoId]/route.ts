import fs from "node:fs";
import { fotoPath } from "@/lib/fotos-server";
import { getPublico } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; fotoId: string }> }) {
  const { id, fotoId } = await params;
  // Llega con la clave pública (o con el id, desde el tablero); el archivo se guarda por id.
  const p = getPublico(id);
  if (!p || !/^[\w-]+$/.test(fotoId)) return new Response("No existe", { status: 404 });
  try {
    const buf = fs.readFileSync(fotoPath(p.id, fotoId));
    return new Response(buf, { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("No existe", { status: 404 });
  }
}
