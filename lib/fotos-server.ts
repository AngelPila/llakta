import path from "node:path";

export function fotoPath(projectId: string, fotoId: string): string {
  return path.join(process.cwd(), "data", "fotos", `${projectId}-${fotoId}.jpg`);
}
