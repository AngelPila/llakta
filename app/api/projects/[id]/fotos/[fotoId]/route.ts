import fs from "node:fs";
import { fotoPath } from "@/lib/fotos-server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; fotoId: string }> }) {
  const { id, fotoId } = await params;
  if (!/^[\w-]+$/.test(id) || !/^[\w-]+$/.test(fotoId)) return new Response("No existe", { status: 404 });
  try {
    const buf = fs.readFileSync(fotoPath(id, fotoId));
    return new Response(buf, { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("No existe", { status: 404 });
  }
}
