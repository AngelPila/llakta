import type { Project } from "./types";
import refs from "./fotos.json";

// Fotos de referencia: imágenes con licencia abierta del mundo de estos problemas (barrios,
// quebradas, canchas). Nunca se presentan como el lugar del proyecto: el pie lo dice y da el crédito.
export interface FotoRef {
  key: string;
  src: string;
  titulo: string;
  autor: string;
  licencia: string;
  licenciaUrl?: string;
  fuente: string;
  credito: string;
  palabras: string[];
  w: number;
  h: number;
}

export const REFERENCIAS = refs as FotoRef[];

export function fotoRef(key: string): FotoRef | undefined {
  return REFERENCIAS.find((r) => r.key === key);
}

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// La referencia que más palabras comparte con el problema; si ninguna coincide, el barrio.
export function referenciaPara(texto: string): FotoRef | undefined {
  const t = sinTildes(texto);
  let best: FotoRef | undefined;
  let score = 0;
  for (const r of REFERENCIAS) {
    const n = r.palabras.filter((w) => t.includes(sinTildes(w))).length;
    if (n > score) {
      best = r;
      score = n;
    }
  }
  return best ?? fotoRef("barrio1") ?? fotoRef("home");
}

export interface Portada {
  src: string;
  w: number;
  h: number;
  propia: boolean;
  pie: string;
  credito?: string;
  fuente?: string;
}

export function portada(p: Project): Portada | undefined {
  const propia = p.fotos?.at(-1);
  if (propia)
    return { src: `/api/projects/${p.id}/fotos/${propia.id}`, w: propia.w, h: propia.h, propia: true, pie: propia.pie || `Foto de ${propia.autor}` };
  const r = referenciaPara(p.problema);
  if (!r) return undefined;
  return { src: r.src, w: r.w, h: r.h, propia: false, pie: r.titulo, credito: r.credito, fuente: r.fuente };
}
