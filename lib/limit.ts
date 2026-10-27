import { NextResponse } from "next/server";

// Tope de llamadas por IP y por día, en memoria. Publicada, cualquiera puede crear
// proyectos y cada uno gasta saldo del proveedor de IA: esto pone un techo.

const hits = new Map<string, number[]>();
let dia = { fecha: "", proyectos: 0 };

function ip(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

// Devuelve una respuesta 429 si `req` ya hizo `max` llamadas a `clave` en la última hora.
export function limitar(req: Request, clave: string, max: number): NextResponse | null {
  const k = `${clave}:${ip(req)}`;
  const ahora = Date.now();
  const recientes = (hits.get(k) ?? []).filter((t) => ahora - t < 3600e3);
  if (recientes.length >= max) return NextResponse.json({ error: "Muchos intentos seguidos. Prueba de nuevo en un rato." }, { status: 429 });
  recientes.push(ahora);
  hits.set(k, recientes);
  return null;
}

// Proyectos nuevos por día en todo el servidor (LLAKTA_MAX_PROYECTOS_DIA, 0 = sin tope).
export function cupoDiario(): NextResponse | null {
  const max = Number(process.env.LLAKTA_MAX_PROYECTOS_DIA) || 0;
  if (!max) return null;
  const hoy = new Date().toISOString().slice(0, 10);
  if (dia.fecha !== hoy) dia = { fecha: hoy, proyectos: 0 };
  if (dia.proyectos >= max) return NextResponse.json({ error: "Llakta llegó al límite de proyectos de hoy. Vuelve mañana." }, { status: 429 });
  dia.proyectos++;
  return null;
}
