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

export function freshAgents(): AgentRun[] {
  return AGENTS.map((a) => ({ ...a, estado: "espera", notas: [] }));
}

export const SYSTEM_BASE = `Eres parte de Llakta, un equipo de agentes que ayuda a jóvenes y vecinos de Latinoamérica a resolver problemas reales de su comunidad, aunque nunca hayan liderado un proyecto.
Escribe en español neutro latinoamericano, con frases cortas y concretas, sin jerga técnica y sin emojis.
Los presupuestos son realistas en dólares para grupos que casi no tienen dinero.
No inventes cifras ni instituciones: si algo es una estimación, dilo; si no sabes el nombre exacto de una entidad, nómbrala por su función (por ejemplo, "la dirección de obras públicas del municipio").`;

// Todo lo que el equipo sabe hasta ahora, para darle contexto al siguiente agente.
export function contexto(p: Project): string {
  const partes = [`Problema contado por ${p.duenoNombre}: ${p.problema}`];
  const resp = p.preguntas
    .map((q) => (p.respuestas[q.id] ? `- ${q.pregunta} → ${p.respuestas[q.id]}` : ""))
    .filter(Boolean);
  if (resp.length) partes.push(`Respuestas a la entrevista:\n${resp.join("\n")}`);
  if (p.ficha) partes.push(`Ficha del problema: ${JSON.stringify(p.ficha)}`);
  if (p.investigacion) partes.push(`Investigación: ${JSON.stringify(p.investigacion)}`);
  if (p.soluciones) partes.push(`Soluciones propuestas: ${JSON.stringify(p.soluciones)}`);
  if (p.critica) partes.push(`Evaluación crítica: ${JSON.stringify(p.critica)}`);
  if (p.plan) partes.push(`Plan: ${JSON.stringify(p.plan)}`);
  return partes.join("\n\n");
}
