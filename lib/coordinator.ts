import { z } from "zod";
import { SYSTEM_BASE } from "./agents";
import { provider, toolLoop, type Tool, type Turn } from "./llm";
import { getProject, logEvent, newId, updateProject } from "./store";
import type { Member, Project, TaskState } from "./types";

// El coordinador: un agente con herramientas que mueven el tablero de verdad.
// Cada herramienta cambia el proyecto y deja constancia en `acciones`, que el
// chat muestra debajo de la respuesta.

const HUES = [195, 25, 145, 330, 55, 100, 230, 0];

export function memberName(m: Member | undefined): string {
  if (!m) return "nadie";
  return m.nombre ?? `${m.rol} (sin asignar)`;
}

export function resumen(p: Project): string {
  const total = p.tasks.length;
  const hechas = p.tasks.filter((t) => t.estado === "hecha").length;
  const enCurso = p.tasks.filter((t) => t.estado === "en_curso").length;
  const semanaActual = Math.min(p.plan?.semanas ?? 1, Math.floor((Date.now() - p.creadoEn) / (7 * 864e5)) + 1);
  const atrasadas = p.tasks.filter((t) => t.estado !== "hecha" && t.semana < semanaActual);
  const sinGente = p.members.filter((m) => !m.nombre);
  const ausentes = p.members.filter((m) => !m.disponible);
  const firmas = p.campana?.firmas.length ?? 0;
  return [
    `Semana ${semanaActual} de ${p.plan?.semanas ?? "?"}.`,
    `Tareas: ${hechas} hechas, ${enCurso} en curso, ${total - hechas - enCurso} pendientes de ${total}.`,
    atrasadas.length ? `Atrasadas: ${atrasadas.map((t) => t.titulo).join("; ")}.` : "Nada atrasado.",
    sinGente.length ? `Roles sin persona: ${sinGente.map((m) => m.rol).join(", ")}.` : "Todos los roles tienen persona.",
    ausentes.length ? `No disponibles: ${ausentes.map((m) => `${memberName(m)} (${m.motivo ?? "sin motivo"})`).join(", ")}.` : "",
    p.campana ? `Firmas: ${firmas} de ${p.campana.metaFirmas}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function estadoParaModelo(p: Project): string {
  return JSON.stringify({
    objetivo: p.plan?.objetivo,
    meta: p.plan?.meta_medible,
    semanas: p.plan?.semanas,
    personas: p.members.map((m) => ({ id: m.id, nombre: m.nombre ?? "(lugar sin persona)", rol: m.rol, disponible: m.disponible, motivo: m.motivo ?? null })),
    tareas: p.tasks.map((t) => ({ id: t.id, titulo: t.titulo, rol: t.rol, semana: t.semana, estado: t.estado, responsable_id: t.responsableId })),
    documentos: p.docs.map((d) => d.titulo),
    resumen: resumen(p),
  });
}

function buildTools(id: string, acciones: string[], autor: string): Tool[] {
  const mutate = (fn: (p: Project) => string) => {
    let msg = "";
    updateProject(id, (p) => {
      msg = fn(p);
      acciones.push(msg);
      logEvent(p, autor === "Coordinador" ? "Coordinador" : `Coordinador (pedido de ${autor})`, msg);
    });
    return msg;
  };

  const tools = [
    {
      name: "resumen_avance",
      description: "Devuelve el estado actual del proyecto: avance, atrasos, roles sin gente y firmas.",
      schema: z.object({}),
      run: async () => resumen(getProject(id)!),
    },
    {
      name: "crear_tarea",
      description: "Crea una tarea nueva en el tablero.",
      schema: z.object({
        titulo: z.string().describe("Empieza con verbo, máximo 8 palabras"),
        detalle: z.string(),
        rol: z.string(),
        semana: z.number(),
        responsable_id: z.string().nullable().describe("id de la persona, o null"),
      }),
      run: async (i: { titulo: string; detalle: string; rol: string; semana: number; responsable_id: string | null }) =>
        mutate((p) => {
          const resp = p.members.find((m) => m.id === i.responsable_id) ?? p.members.find((m) => m.rol === i.rol) ?? null;
          p.tasks.push({ id: newId(8), titulo: i.titulo, detalle: i.detalle, rol: i.rol, semana: Math.max(1, Math.round(i.semana)), estado: "pendiente", responsableId: resp?.id ?? null, origen: "coordinador", cambio: Date.now() });
          return `Creé la tarea «${i.titulo}» para la semana ${i.semana}${resp ? `, a cargo de ${memberName(resp)}` : ""}`;
        }),
    },
    {
      name: "actualizar_tarea",
      description: "Cambia el estado, el responsable o la semana de una tarea existente. Usa los ids que aparecen en el estado.",
      schema: z.object({
        tarea_id: z.string(),
        estado: z.enum(["pendiente", "en_curso", "hecha"]).nullable(),
        responsable_id: z.string().nullable(),
        semana: z.number().nullable(),
      }),
      run: async (i: { tarea_id: string; estado: TaskState | null; responsable_id: string | null; semana: number | null }) =>
        mutate((p) => {
          const t = p.tasks.find((x) => x.id === i.tarea_id);
          if (!t) throw new Error(`No existe la tarea ${i.tarea_id}`);
          const partes: string[] = [];
          if (i.estado && i.estado !== t.estado) {
            t.estado = i.estado;
            partes.push(i.estado === "hecha" ? "marcada como hecha" : i.estado === "en_curso" ? "en curso" : "de vuelta a pendiente");
          }
          if (i.responsable_id && i.responsable_id !== t.responsableId) {
            const m = p.members.find((x) => x.id === i.responsable_id);
            if (!m) throw new Error(`No existe la persona ${i.responsable_id}`);
            t.responsableId = m.id;
            partes.push(`ahora la lleva ${memberName(m)}`);
          }
          if (i.semana && Math.round(i.semana) !== t.semana) {
            t.semana = Math.max(1, Math.round(i.semana));
            partes.push(`pasa a la semana ${t.semana}`);
          }
          t.cambio = Date.now();
          return `«${t.titulo}»: ${partes.join(", ") || "sin cambios"}`;
        }),
    },
    {
      name: "marcar_disponibilidad",
      description: "Marca si una persona está disponible o no (por ejemplo, si avisó que no puede). Después reasigna sus tareas con actualizar_tarea.",
      schema: z.object({ persona_id: z.string(), disponible: z.boolean(), motivo: z.string().nullable() }),
      run: async (i: { persona_id: string; disponible: boolean; motivo: string | null }) =>
        mutate((p) => {
          const m = p.members.find((x) => x.id === i.persona_id);
          if (!m) throw new Error(`No existe la persona ${i.persona_id}`);
          m.disponible = i.disponible;
          m.motivo = i.motivo ?? undefined;
          return i.disponible ? `${memberName(m)} vuelve a estar disponible` : `${memberName(m)} no está disponible${i.motivo ? ` (${i.motivo})` : ""}`;
        }),
    },
    {
      name: "invitar_persona",
      description: "Abre un lugar nuevo en el equipo para un rol y genera su enlace de invitación.",
      schema: z.object({ rol: z.string(), para_que: z.string() }),
      run: async (i: { rol: string; para_que: string }) =>
        mutate((p) => {
          const m: Member = { id: newId(8), nombre: null, rol: i.rol, paraQue: i.para_que, personas: 1, token: newId(12), hue: HUES[p.members.length % HUES.length], esDueno: false, disponible: true };
          p.members.push(m);
          return `Abrí un lugar para ${i.rol}; su enlace está en Equipo`;
        }),
    },
    {
      name: "redactar_documento",
      description: "Guarda un documento nuevo (acta, mensaje, carta de seguimiento). Escribe tú el cuerpo completo.",
      schema: z.object({ titulo: z.string(), cuerpo: z.string() }),
      run: async (i: { titulo: string; cuerpo: string }) =>
        mutate((p) => {
          p.docs.push({ id: newId(8), tipo: "otro", titulo: i.titulo, cuerpo: i.cuerpo, autor: "Coordinador", creadoEn: Date.now() });
          return `Guardé el documento «${i.titulo}»`;
        }),
    },
  ];
  return tools as unknown as Tool[];
}

const SYSTEM = `${SYSTEM_BASE}
Eres el coordinador del proyecto: un jefe de proyecto que acompaña a un grupo de vecinos sin experiencia.
Cada mensaje trae el estado actual del proyecto en JSON. Usa las herramientas para cambiar el tablero de verdad; no digas que hiciste algo si no llamaste a la herramienta.
Si alguien avisa que no puede, márcalo como no disponible y reasigna cada una de sus tareas pendientes a otra persona disponible con un rol cercano; si no hay nadie, abre un lugar con invitar_persona.
Si piden un documento, redáctalo completo con redactar_documento.
Responde en 1 a 3 frases, en tono cercano, diciendo qué cambiaste y cuál es el siguiente paso. Sin listas largas, sin emojis.`;

export async function coordinate(id: string, autor: string, texto: string): Promise<{ texto: string; acciones: string[] }> {
  const acciones: string[] = [];
  updateProject(id, (p) => {
    p.chat.push({ id: newId(8), de: "persona", autor, texto, acciones: [], en: Date.now() });
  });

  let respuesta: string;
  try {
    respuesta = provider().id === "demo" ? demoCoordinate(id, texto, acciones, autor) : await realCoordinate(id, autor, texto, acciones);
  } catch (e) {
    respuesta = `No pude completar eso: ${(e as Error).message}`;
  }

  updateProject(id, (p) => {
    p.chat.push({ id: newId(8), de: "coordinador", autor: "Coordinador", texto: respuesta || "Listo.", acciones, en: Date.now() });
  });
  return { texto: respuesta, acciones };
}

async function realCoordinate(id: string, autor: string, texto: string, acciones: string[]): Promise<string> {
  const p = getProject(id)!;
  const history: Turn[] = [];
  for (const m of p.chat.slice(-13, -1)) {
    const role = m.de === "persona" ? "user" : "assistant";
    const content = m.de === "persona" ? `${m.autor}: ${m.texto}` : m.texto;
    if (history.length && history[history.length - 1].role === role) history[history.length - 1].content += `\n${content}`;
    else history.push({ role, content });
  }
  if (history[0]?.role === "assistant") history.shift();
  const actual = `Estado actual del proyecto:\n${estadoParaModelo(p)}\n\nMensaje de ${autor}: ${texto}`;
  if (history.length && history[history.length - 1].role === "user") history[history.length - 1].content += `\n\n${actual}`;
  else history.push({ role: "user", content: actual });
  return toolLoop(SYSTEM, history, buildTools(id, acciones, autor));
}

// ---------- Modo demo: reglas simples sobre el texto ----------

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

function demoCoordinate(id: string, texto: string, acciones: string[], autor: string): string {
  const tools = Object.fromEntries(buildTools(id, acciones, autor).map((t) => [t.name, t.run as (i: unknown) => Promise<string>]));
  const run = (name: string, input: unknown) => void tools[name](input);
  const p = getProject(id)!;
  const t = norm(texto);

  const persona = p.members.find((m) => m.nombre && t.includes(norm(m.nombre).split(" ")[0]));

  if (/no (puede|podra|va a poder)|se baja|enferm|viaj|no esta disponible/.test(t)) {
    if (!persona) return "¿Quién es la persona que no puede? Escríbeme su nombre tal como aparece en Equipo.";
    run("marcar_disponibilidad", { persona_id: persona.id, disponible: false, motivo: texto.length < 80 ? texto : "avisó que no puede" });
    const fresh = getProject(id)!;
    const pendientes = fresh.tasks.filter((x) => x.responsableId === persona.id && x.estado !== "hecha");
    const otros = fresh.members.filter((m) => m.id !== persona.id && m.disponible);
    let abierto: string | null = null;
    for (const tarea of pendientes) {
      const destino = otros.find((m) => m.rol === tarea.rol && m.nombre) ?? otros.find((m) => m.esDueno) ?? otros[0];
      if (destino) run("actualizar_tarea", { tarea_id: tarea.id, estado: null, responsable_id: destino.id, semana: null });
    }
    if (!otros.some((m) => m.rol === persona.rol)) {
      run("invitar_persona", { rol: persona.rol, para_que: persona.paraQue });
      abierto = persona.rol;
    }
    return `Anotado: ${persona.nombre} no está disponible. Reasigné sus ${pendientes.length} tareas pendientes${abierto ? ` y abrí un lugar nuevo para ${abierto}; comparte el enlace desde Equipo` : ""}.`;
  }

  if (/como vamos|avance|resumen|estado/.test(t)) {
    return resumen(p);
  }

  if (/invit|necesito (a )?(alguien|gente|personas?|mas)|sumar a/.test(t)) {
    const m = texto.match(/para (.+?)(?:[.,]|$)/i);
    const rol = m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : "Apoyo";
    run("invitar_persona", { rol, para_que: m ? m[1] : "Ayudar donde haga falta" });
    return `Abrí un lugar para ${rol}. En Equipo está su enlace y su QR para compartir.`;
  }

  const tarea = p.tasks.find((x) => norm(x.titulo).split(" ").filter((w) => w.length > 4).some((w) => t.includes(w)));
  if (tarea && /hech|termin|listo|lista|ya (hicimos|esta)/.test(t)) {
    run("actualizar_tarea", { tarea_id: tarea.id, estado: "hecha", responsable_id: null, semana: null });
    return `Bien. «${tarea.titulo}» queda como hecha. ${resumen(getProject(id)!).split(". ")[1]}.`;
  }
  if (tarea && /empez|arranc|en curso|estamos/.test(t)) {
    run("actualizar_tarea", { tarea_id: tarea.id, estado: "en_curso", responsable_id: null, semana: null });
    return `Perfecto, «${tarea.titulo}» pasa a en curso.`;
  }

  if (/(crea|agrega|anade|suma).*(tarea)|tarea (nueva|para)/.test(t)) {
    const titulo = texto.replace(/^.*?tarea( nueva)?( para| de)?:?\s*/i, "").replace(/\.$/, "") || "Tarea nueva";
    run("crear_tarea", { titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1), detalle: `Pedida por ${autor} en el chat.`, rol: "Coordinación", semana: 1, responsable_id: p.members[0]?.id ?? null });
    return `Agregué «${titulo}» al tablero, en la semana 1.`;
  }

  if (/acta|carta|mensaje|documento|redact/.test(t)) {
    run("redactar_documento", {
      titulo: "Mensaje de seguimiento",
      cuerpo: `Hola a todos.\nVamos en esto: ${resumen(p)}\nGracias por sostener el plan. La próxima tarea es la que dice el tablero para esta semana.`,
    });
    return "Redacté un mensaje de seguimiento con el avance actual; está en Documentos.";
  }

  return "Puedo reasignar tareas si alguien no puede, decirte cómo vamos, abrir lugares para invitar gente, crear tareas o redactar mensajes. ¿Qué cambió?";
}
