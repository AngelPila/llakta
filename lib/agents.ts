import type { AgentKey, AgentRun, Project } from "./types";

export const AGENTS: { key: AgentKey; nombre: string; rol: string }[] = [
  { key: "entrevistador", nombre: "Entrevista", rol: "Entiende el problema y arma la ficha" },
  { key: "causas", nombre: "Causas", rol: "Investiga por qué pasa, con datos" },
  { key: "precedentes", nombre: "Precedentes", rol: "Busca quién es responsable y dónde ya se resolvió" },
  { key: "ideador", nombre: "Ideas", rol: "Propone seis salidas, de baratas a ambiciosas" },
  { key: "critico", nombre: "Abogado del diablo", rol: "Ataca cada idea y elige la que resiste" },
  { key: "estratega", nombre: "Estrategia", rol: "Convierte la idea en plan, roles y tareas" },
  { key: "oficio", nombre: "Oficio", rol: "Redacta la carta formal a la autoridad" },
  { key: "campana", nombre: "Campaña", rol: "Escribe la página pública para juntar firmas" },
  { key: "convocatoria", nombre: "Convocatoria", rol: "Escribe el mensaje para sumar vecinos" },
];

// El orden en que corre el pipeline; los agentes de una misma fase trabajan a la vez.
export const FASES: { nombre: string; agentes: AgentKey[] }[] = [
  { nombre: "Entender", agentes: ["entrevistador"] },
  { nombre: "Investigar", agentes: ["causas", "precedentes"] },
  { nombre: "Decidir", agentes: ["ideador", "critico"] },
  { nombre: "Planear", agentes: ["estratega"] },
  { nombre: "Redactar", agentes: ["oficio", "campana", "convocatoria"] },
];

export function freshAgents(): AgentRun[] {
  return AGENTS.map((a) => ({ ...a, estado: "espera", notas: [] }));
}

export const SYSTEM_BASE = `Eres parte de Llakta, un equipo de agentes que ayuda a jóvenes y vecinos de Latinoamérica a resolver problemas reales de su comunidad, aunque nunca hayan liderado un proyecto.
Escribe en español neutro latinoamericano, con frases cortas y concretas, sin jerga técnica y sin emojis.
Los presupuestos son realistas en dólares para grupos que casi no tienen dinero.
No inventes cifras ni instituciones: si algo es una estimación, dilo; si no sabes el nombre exacto de una entidad, nómbrala por su función (por ejemplo, "la dirección de obras públicas del municipio").`;

// Lo que el siguiente agente necesita saber. Cada agente pide solo las partes que
// usa: mandar todo a todos multiplica los tokens de entrada en cada llamada.
export type Parte = "ficha" | "causas" | "responsables" | "precedentes" | "soluciones" | "critica" | "elegida" | "plan" | "primeras";

export function contexto(p: Project, ...partes: Parte[]): string {
  const out = [`Problema contado por ${p.duenoNombre}: ${p.problema}`];
  const resp = p.preguntas
    .map((q) => (p.respuestas[q.id] ? `- ${q.pregunta} → ${p.respuestas[q.id]}` : ""))
    .filter(Boolean);
  // La ficha ya resume las respuestas; sin ficha, van tal cual.
  if (resp.length && !(p.ficha && partes.includes("ficha"))) out.push(`Respuestas a la entrevista:\n${resp.join("\n")}`);
  const inv = p.investigacion;
  const elegida = p.soluciones?.find((s) => s.id === p.critica?.elegida_id);
  for (const parte of partes) {
    if (parte === "ficha" && p.ficha) {
      const f = p.ficha;
      out.push(`Ficha: ${f.enunciado} Afecta a: ${f.afectados}. Lugar: ${f.lugar}. Desde: ${f.desde}. Intentos: ${f.intentos}. Supuestos: ${f.supuestos.join("; ")}.`);
    }
    if (parte === "causas" && inv) {
      out.push(`Causas de raíz:\n${inv.causas.map((c) => `- ${c.causa} (${c.evidencia})`).join("\n")}`);
      if (inv.datos.length) out.push(`Datos:\n${inv.datos.map((d) => `- ${d.dato} [${d.fuente}]`).join("\n")}`);
    }
    if (parte === "responsables" && inv?.responsables.length) out.push(`Responsables:\n${inv.responsables.map((r) => `- ${r.entidad}: ${r.que_le_toca}`).join("\n")}`);
    if (parte === "precedentes" && inv?.precedentes.length) out.push(`Casos parecidos:\n${inv.precedentes.map((c) => `- ${c.lugar}: ${c.que_hicieron} → ${c.resultado}`).join("\n")}`);
    if (parte === "soluciones" && p.soluciones) out.push(`Soluciones propuestas:\n${p.soluciones.map((s) => `- ${s.id} [${s.escala}] ${s.nombre}: ${s.descripcion} (~${s.costo_usd} USD, ${s.semanas} semanas)`).join("\n")}`);
    if (parte === "critica" && p.critica) out.push(`Evaluación crítica: ${JSON.stringify(p.critica)}`);
    if (parte === "elegida" && elegida) {
      const ev = p.critica!.evaluaciones.find((e) => e.id === elegida.id);
      out.push(`Solución elegida: ${elegida.nombre}. ${elegida.descripcion} (~${elegida.costo_usd} USD, ${elegida.semanas} semanas). Por qué: ${p.critica!.por_que}${ev ? ` Riesgo: ${ev.riesgo} Se opondría: ${ev.quien_se_opone}.` : ""}`);
    }
    if (parte === "plan" && p.plan) {
      const pl = p.plan;
      out.push(`Plan: ${pl.objetivo}. Meta: ${pl.meta_medible}. ${pl.semanas} semanas. Presupuesto: ${pl.presupuesto.map((x) => `${x.item} ${x.usd} USD`).join(", ")}. Hitos: ${pl.hitos.map((h) => `semana ${h.semana}: ${h.hito}`).join("; ")}.`);
    }
    if (parte === "primeras" && p.plan) out.push(`Primeras tareas:\n${p.plan.tareas.filter((t) => t.semana <= 1).map((t) => `- ${t.titulo} (${t.rol})`).join("\n")}`);
  }
  return out.join("\n\n");
}
