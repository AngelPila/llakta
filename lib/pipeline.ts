import { SYSTEM_BASE, contexto, type Parte } from "./agents";
import * as demo from "./demo";
import { generateJSON, provider } from "./llm";
import {
  CampanaSchema,
  CausasSchema,
  ConvocatoriaSchema,
  CriticaSchema,
  FichaSchema,
  IdeasSchema,
  OficioSchema,
  PlanSchema,
  PrecedentesSchema,
  PreguntasSchema,
} from "./schemas";
import { getProject, logEvent, newId, updateProject } from "./store";
import type { AgentKey, Member, Project } from "./types";

// El orquestador: corre los agentes en orden, en paralelo cuando no dependen
// uno del otro, y va guardando cada resultado para que la sala lo muestre en vivo.

const HUES = [195, 25, 145, 330, 55, 100, 230, 0];

function note(id: string, key: AgentKey, texto: string) {
  updateProject(id, (p) => {
    p.agentes.find((a) => a.key === key)?.notas.push(texto);
  });
}

function orquestador(id: string, texto: string) {
  updateProject(id, (p) => logEvent(p, "Orquestador", texto));
}

async function step<T>(id: string, key: AgentKey, nota: string, work: () => Promise<T>, done: (p: Project, out: T) => string): Promise<T> {
  updateProject(id, (p) => {
    const a = p.agentes.find((x) => x.key === key)!;
    a.estado = "trabajando";
    a.inicio = Date.now();
    a.notas.push(nota);
  });
  try {
    const out = await work();
    updateProject(id, (p) => {
      const a = p.agentes.find((x) => x.key === key)!;
      a.notas.push(done(p, out));
      a.estado = "listo";
      a.fin = Date.now();
    });
    return out;
  } catch (e) {
    updateProject(id, (p) => {
      const a = p.agentes.find((x) => x.key === key)!;
      a.estado = "error";
      a.fin = Date.now();
      a.notas.push(`No pudo terminar: ${(e as Error).message}`);
    });
    throw e;
  }
}

const isDemo = () => provider().id === "demo";

// Al reintentar, lo que ya salió bien no se vuelve a pedir al modelo.
function reuse<T>(id: string, keys: AgentKey[], prev: T | undefined): T | undefined {
  if (prev === undefined) return undefined;
  updateProject(id, (p) => {
    for (const k of keys) {
      const a = p.agentes.find((x) => x.key === k)!;
      if (a.estado === "listo") continue;
      a.estado = "listo";
      a.notas.push("Reutilizó el resultado anterior");
    }
  });
  return prev;
}

// Paso 1: la entrevista. Corre apenas se crea el proyecto.
export async function startInterview(id: string) {
  const p0 = getProject(id)!;
  try {
    const out = await step(
      id,
      "entrevistador",
      "Leyendo el problema",
      () =>
        isDemo()
          ? demo.demoPreguntas(p0)
          : generateJSON({
              schema: PreguntasSchema,
              fast: true,
              system: `${SYSTEM_BASE}\nEres la entrevistadora. Haces exactamente 3 preguntas cortas para entender lo que falta: dónde y a cuántos afecta, qué se intentó, con quién se cuenta. No preguntes lo que el texto ya dice.`,
              prompt: contexto(p0),
            }),
      (_p, o) => `Preparó ${o.preguntas.length} preguntas`,
    );
    updateProject(id, (p) => {
      p.tituloCorto = out.titulo_corto;
      p.preguntas = out.preguntas.slice(0, 3).map((q) => ({ id: newId(6), ...q }));
      p.status = "entrevista";
      const a = p.agentes.find((x) => x.key === "entrevistador")!;
      a.estado = "espera";
      a.notas.push("Esperando tus respuestas");
    });
  } catch (e) {
    updateProject(id, (p) => {
      p.status = "error";
      p.error = (e as Error).message;
    });
  }
}

// Paso 2: con las respuestas, el resto del equipo.
export async function runPipeline(id: string) {
  const sys = (rol: string) => `${SYSTEM_BASE}\n${rol}`;
  const ctx = (...partes: Parte[]) => contexto(getProject(id)!, ...partes);
  const web = provider().webSearch;
  const prev = getProject(id)!;

  try {
    if (!prev.ficha) orquestador(id, "Recibí tus respuestas. Empieza la ficha del problema.");
    const ficha = reuse(id, ["entrevistador"], prev.ficha) ?? await step(
      id,
      "entrevistador",
      "Armando la ficha del problema",
      () =>
        isDemo()
          ? demo.demoFicha(getProject(id)!)
          : generateJSON({ schema: FichaSchema, fast: true, system: sys("Eres la entrevistadora. Ordenas lo que contó la persona en una ficha clara. Lo que no se sabe, lo marcas como supuesto."), prompt: ctx() }),
      () => "Ficha lista",
    );
    updateProject(id, (p) => {
      p.ficha = ficha;
      p.tituloCorto = ficha.titulo || p.tituloCorto;
    });

    if (!prev.investigacion) {
    orquestador(id, web ? "Activé dos investigadores en paralelo, con búsqueda en la web." : "Activé dos investigadores en paralelo.");
    const [causas, precedentes] = await Promise.all([
      step(
        id,
        "causas",
        web ? "Buscando datos y causas en la web" : "Analizando causas",
        () =>
          isDemo()
            ? demo.demoCausas((q) => note(id, "causas", `Buscó: ${q}`))
            : generateJSON({
                schema: CausasSchema,
                fast: true,
                webSearch: true,
                onSearch: (q) => note(id, "causas", `Buscó: ${q}`),
                system: sys("Eres el investigador de causas. Encuentras las causas de raíz del problema (no los síntomas) y datos que lo respalden, idealmente del país o la ciudad del problema. Si no tienes fuentes verificables, deja 'fuentes' vacío y marca los datos como estimación."),
                prompt: ctx("ficha"),
              }),
        (_p, o) => `Encontró ${o.causas.length} causas de raíz`,
      ),
      step(
        id,
        "precedentes",
        web ? "Buscando responsables y casos parecidos" : "Revisando responsables y casos parecidos",
        () =>
          isDemo()
            ? demo.demoPrecedentes((q) => note(id, "precedentes", `Buscó: ${q}`))
            : generateJSON({
                schema: PrecedentesSchema,
                fast: true,
                webSearch: true,
                onSearch: (q) => note(id, "precedentes", `Buscó: ${q}`),
                system: sys("Eres el investigador de precedentes. Identificas qué entidad es responsable de resolver esto y casos parecidos que se resolvieron en otros lugares de Latinoamérica, con lo que hicieron. Si no tienes fuentes verificables, deja 'fuentes' vacío y no inventes nombres propios."),
                prompt: ctx("ficha"),
              }),
        (_p, o) => `Encontró ${o.precedentes.length} casos y ${o.responsables.length} responsables`,
      ),
    ]);
    updateProject(id, (p) => {
      p.investigacion = {
        causas: causas.causas,
        datos: causas.datos,
        responsables: precedentes.responsables,
        precedentes: precedentes.precedentes,
        fuentes: [...causas.fuentes, ...precedentes.fuentes].filter((f) => /^https?:\/\//.test(f.url)),
      };
    });
    } else reuse(id, ["causas", "precedentes"], prev.investigacion);

    if (!prev.soluciones) orquestador(id, "Con la investigación lista, le paso el caso al equipo de ideas.");
    const ideas = reuse(id, ["ideador"], prev.soluciones && { soluciones: prev.soluciones }) ?? await step(
      id,
      "ideador",
      "Pensando salidas distintas",
      () =>
        isDemo()
          ? demo.demoIdeas()
          : generateJSON({
              schema: IdeasSchema,
              system: sys("Eres el ideador. Propones 6 soluciones distintas entre sí, que ataquen las causas encontradas: 2 rápidas y baratas que un grupo de vecinos pueda hacer en días, 2 medias, 2 ambiciosas. Nada genérico: cada una debe nombrar el lugar o la causa que ataca."),
              prompt: ctx("ficha", "causas", "responsables", "precedentes"),
            }),
      (_p, o) => `Propuso ${o.soluciones.length} soluciones`,
    );
    updateProject(id, (p) => {
      p.soluciones = ideas.soluciones.map((s, i) => ({ id: `s${i + 1}`, ...s }));
    });

    const critica = reuse(id, ["critico"], prev.critica) ?? await step(
      id,
      "critico",
      "Buscando por qué fallaría cada una",
      () =>
        isDemo()
          ? demo.demoCritica()
          : generateJSON({
              schema: CriticaSchema,
              system: sys("Eres el abogado del diablo. Atacas cada solución con honestidad: por qué fallaría, quién se opondría, y la puntúas de 1 a 5 en impacto, costo (5 = barato) y factibilidad para un grupo sin experiencia. Luego eliges la que mejor resiste. Usa los ids s1…s6 tal cual."),
              prompt: ctx("ficha", "causas", "soluciones"),
            }),
      (p, o) => `Recomienda: ${p.soluciones?.find((s) => s.id === o.elegida_id)?.nombre ?? o.elegida_id}`,
    );
    updateProject(id, (p) => {
      p.critica = critica;
    });

    // La persona elige la salida antes del plan; la elección vuelve a llamar a runPipeline.
    if (!getProject(id)!.elegidaId) {
      updateProject(id, (p) => {
        p.status = "eligiendo";
      });
      orquestador(id, "Hay una salida recomendada. Falta que elijas con cuál seguir.");
      return;
    }

    orquestador(id, "Hay solución elegida. La estrategia arma el plan.");
    const plan = reuse(id, ["estratega"], prev.plan) ?? await step(
      id,
      "estratega",
      "Armando plan, roles y tareas",
      () =>
        isDemo()
          ? demo.demoPlan(getProject(id)!)
          : generateJSON({
              schema: PlanSchema,
              system: sys(`Eres la estratega. Conviertes la solución elegida en un plan que un grupo de vecinos pueda cumplir: roles, tareas semana a semana, presupuesto y hitos. El primer rol es "Coordinación" y lo lleva ${getProject(id)!.duenoNombre}. Cada tarea usa uno de los roles, escrito exactamente igual.`),
              prompt: ctx("ficha", "responsables", "elegida"),
            }),
      (_p, o) => `${o.tareas.length} tareas en ${o.semanas} semanas, ${o.roles.length} roles`,
    );
    updateProject(id, (p) => {
      p.plan = plan;
      materialize(p);
      logEvent(p, "Orquestador", `Armé el tablero: ${p.tasks.length} tareas y ${p.members.length - 1} lugares para invitar.`);
    });

    orquestador(id, "Tres redactores trabajan en paralelo en los documentos.");
    const [oficio, campana, convocatoria] = await Promise.all([
      step(
        id,
        "oficio",
        "Redactando la carta formal",
        () =>
          isDemo()
            ? demo.demoOficio(getProject(id)!)
            : generateJSON({ schema: OficioSchema, fast: true, system: sys(`Eres el redactor legal. Escribes el oficio formal a la entidad responsable, firmado por ${getProject(id)!.duenoNombre} en nombre de la coordinación vecinal. Pide algo concreto con plazo y número de trámite.`), prompt: ctx("ficha", "responsables", "elegida", "plan") }),
        () => "Oficio listo para firmar",
      ),
      step(
        id,
        "campana",
        "Escribiendo la página de firmas",
        () =>
          isDemo()
            ? demo.demoCampana(getProject(id)!)
            : generateJSON({ schema: CampanaSchema, fast: true, system: sys("Escribes la página pública de la campaña de firmas. Directa, humana, sin exageraciones ni signos de exclamación. La meta de firmas sale del plan."), prompt: ctx("ficha", "elegida", "plan") }),
        () => "Página publicada",
      ),
      step(
        id,
        "convocatoria",
        "Escribiendo el mensaje para vecinos",
        () =>
          isDemo()
            ? demo.demoConvocatoria(getProject(id)!)
            : generateJSON({ schema: ConvocatoriaSchema, fast: true, system: sys(`Escribes el mensaje con el que ${getProject(id)!.duenoNombre} invita a sus vecinos a sumarse, para mandar por chat. Cercano, corto, con la primera actividad del plan.`), prompt: ctx("ficha", "elegida", "primeras") }),
        () => "Mensaje listo para enviar",
      ),
    ]);

    updateProject(id, (p) => {
      const now = Date.now();
      p.docs.push(
        { id: newId(8), tipo: "oficio", titulo: `Oficio: ${oficio.asunto}`, cuerpo: `Para: ${oficio.destinatario}\nAsunto: ${oficio.asunto}\n\n${oficio.cuerpo}`, autor: "Oficio", creadoEn: now },
        { id: newId(8), tipo: "convocatoria", titulo: "Mensaje para sumar vecinos", cuerpo: convocatoria.mensaje, autor: "Convocatoria", creadoEn: now },
      );
      p.campana = { titular: campana.titular, bajada: campana.bajada, cuerpo: campana.cuerpo, pedido: campana.pedido, metaFirmas: Math.max(10, Math.round(campana.meta_firmas)), firmas: [] };
      p.status = "listo";
      logEvent(p, "Orquestador", "Listo. El coordinador queda a cargo del seguimiento.");
      p.chat.push({
        id: newId(8),
        de: "coordinador",
        autor: "Coordinador",
        texto: `Hola, ${p.duenoNombre}. Ya tienes plan, tablero y documentos. Lo primero es invitar a tu equipo: hay ${p.members.length - 1} lugares esperando gente. Cuéntame cualquier cambio ("Ana no puede el sábado", "¿cómo vamos?") y reacomodo el plan.`,
        acciones: [],
        en: Date.now(),
      });
    });
  } catch (e) {
    updateProject(id, (p) => {
      p.status = "error";
      p.error = (e as Error).message;
      logEvent(p, "Orquestador", `Se detuvo: ${(e as Error).message}`);
    });
  }
}

// El plan se vuelve tablero: un lugar por rol y cada tarea a su rol.
function materialize(p: Project) {
  const plan = p.plan!;
  const roles = plan.roles.length ? plan.roles : [{ rol: "Coordinación", para_que: "Llevar el plan", personas: 1 }];
  p.members = roles.map(
    (r, i): Member => ({
      id: newId(8),
      nombre: i === 0 ? p.duenoNombre : null,
      rol: r.rol,
      paraQue: r.para_que,
      personas: Math.max(1, Math.round(r.personas)),
      token: newId(12),
      hue: HUES[i % HUES.length],
      esDueno: i === 0,
      disponible: true,
      unidoEn: i === 0 ? Date.now() : undefined,
    }),
  );
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
  p.tasks = plan.tareas.map((t) => ({
    id: newId(8),
    titulo: t.titulo,
    detalle: t.detalle,
    rol: t.rol,
    semana: Math.max(1, Math.round(t.semana)),
    estado: "pendiente",
    responsableId: (p.members.find((m) => norm(m.rol) === norm(t.rol)) ?? p.members[0]).id,
    origen: "plan",
  }));
}
