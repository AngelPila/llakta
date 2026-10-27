import type { Member, Project, Task } from "./types";

// Cálculos de presentación compartidos por las pantallas (sin dependencias de Node).

const DAY = 864e5;

export function semanaActual(p: Project): number {
  const total = p.plan?.semanas ?? 1;
  return Math.min(total, Math.max(1, Math.floor((Date.now() - p.creadoEn) / (7 * DAY)) + 1));
}

// Fracción de la semana actual transcurrida, para la línea de hoy en El camino.
export function avanceSemana(p: Project): number {
  return (((Date.now() - p.creadoEn) / (7 * DAY)) % 1 + 1) % 1;
}

export function inicioSemana(p: Project, n: number): Date {
  return new Date(p.creadoEn + (n - 1) * 7 * DAY);
}

export function fecha(d: Date | number): string {
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short" }).replace(".", "");
}

export function hora(d: number): string {
  return new Date(d).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

export function duracion(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const memberById = (p: Project, id: string | null) => p.members.find((m) => m.id === id);

export function nombreDe(m: Member | undefined): string {
  if (!m) return "Sin asignar";
  return m.nombre ?? `${m.rol}, por sumar`;
}

export function proximaTarea(p: Project): Task | undefined {
  const orden = { en_curso: 0, pendiente: 1, hecha: 2 } as const;
  return [...p.tasks].filter((t) => t.estado !== "hecha").sort((a, b) => a.semana - b.semana || orden[a.estado] - orden[b.estado])[0];
}

export function recien(t: { cambio?: number }, ms = 4000): boolean {
  return !!t.cambio && Date.now() - t.cambio < ms;
}

export function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}
