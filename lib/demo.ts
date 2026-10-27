import type { Project } from "./types";
import type { z } from "zod";
import type {
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

// Modo demo: sin clave de API, los agentes siguen un guion escrito para un
// problema barrial típico. Sirve para ensayar el pitch o si se cae el wifi.

const wait = (min: number, max: number) => new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));

function lugarDe(p: Project): string {
  const r = Object.values(p.respuestas).join(" ");
  const m = (p.problema + " " + r).match(/(?:en|de|del) (?:el |la |los |las |mi |mis |nuestro |nuestra )?(barrio|sector|comunidad|colegio|escuela|parroquia|calle|parque|cancha|plaza) ((?:(?:de |del |la |el )?[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+ ?){1,4})/);
  // Sin un nombre propio reconocible no se inventa un lugar: queda vacío y la interfaz lo omite.
  return m ? `${m[1]} ${m[2].trim()}` : "";
}

// El sujeto de la primera frase: corta en el primer verbo y no termina en conector.
const VERBO = /^(se|no|está|esta|están|estan|hay|hace|lleva|llevan|tiene|tienen|es|son|fue|quedó|quedo|sigue|siguen|nos|me|ya|lo|la|le|desde)$/i;
const CONECTOR = /^(de|del|la|el|los|las|en|y|a|al|por|para|con|mi|mis|su|sus)$/i;

function corto(problema: string): string {
  const palabras = problema.replace(/\s+/g, " ").trim().replace(/[.!?,].*$/, "").split(" ");
  const out: string[] = [];
  for (const w of palabras) {
    if (out.length >= 2 && w === w.toLowerCase() && VERBO.test(w)) break;
    out.push(w);
    if (out.length >= 7) break;
  }
  // No partir un nombre propio: si el tope cayó en medio de "La Floresta", seguir hasta que termine.
  const resto = palabras.slice(out.length);
  for (const w of resto.slice(0, 3)) {
    if (!/^[A-ZÁÉÍÓÚÑ]/.test(out[out.length - 1]) || !/^[A-ZÁÉÍÓÚÑ]/.test(w)) break;
    out.push(w);
  }
  while (out.length > 2 && CONECTOR.test(out[out.length - 1])) out.pop();
  const t = out.join(" ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export async function demoPreguntas(p: Project): Promise<z.infer<typeof PreguntasSchema>> {
  await wait(1400, 2200);
  return {
    titulo_corto: corto(p.problema),
    preguntas: [
      { pregunta: "¿En qué lugar exacto pasa y a cuántas personas afecta, más o menos?", porque: "Con eso sabemos el tamaño del problema y a quién convocar." },
      { pregunta: "¿Desde cuándo pasa y qué se ha intentado hasta ahora?", porque: "Para no repetir lo que ya falló y saber con quién ya se habló." },
      { pregunta: "¿Con cuántas personas cuentas hoy para moverte?", porque: "El plan cambia mucho si son 2 o si son 20." },
    ],
  };
}

export async function demoFicha(p: Project): Promise<z.infer<typeof FichaSchema>> {
  await wait(1800, 2600);
  const r = p.preguntas.map((q) => p.respuestas[q.id]).filter(Boolean);
  return {
    titulo: p.tituloCorto || corto(p.problema),
    enunciado: p.problema.length > 160 ? p.problema.slice(0, 157) + "…" : p.problema,
    afectados: r[0] || "Vecinos y vecinas del sector, sobre todo niños y adultos mayores",
    lugar: lugarDe(p),
    desde: r[1]?.split(/[;.]/)[0].trim() || "Hace varios meses, sin fecha exacta",
    intentos: r[1]?.split(/[;.]/).slice(1).join(";").trim() || "Reclamos sueltos, sin seguimiento",
    supuestos: [
      "Que la autoridad responsable sabe del problema pero no lo tiene priorizado",
      "Que hay vecinos dispuestos a dar unas horas al mes",
      "Que una solución de bajo costo puede mostrar avance en pocas semanas",
    ],
  };
}

export async function demoCausas(onSearch: (q: string) => void): Promise<z.infer<typeof CausasSchema>> {
  await wait(800, 1200);
  onSearch("presupuesto participativo municipios obras barriales");
  await wait(1200, 1800);
  onSearch("reclamos ciudadanos tiempo de respuesta municipio");
  await wait(1200, 1600);
  return {
    causas: [
      { causa: "Nadie es dueño del problema", evidencia: "Los reclamos llegan sueltos, por distintas vías, y ninguno tiene número de trámite que se pueda seguir." },
      { causa: "No hay datos que lo hagan visible", evidencia: "Sin fotos, fechas ni un conteo de afectados, el caso compite en desventaja con otros pedidos." },
      { causa: "El presupuesto se decide sin el barrio", evidencia: "Las obras pequeñas suelen entrar por presupuesto participativo, y el sector no presentó propuesta." },
      { causa: "La organización vecinal está dormida", evidencia: "Sin directiva activa, nadie convoca ni representa al barrio en las reuniones." },
    ],
    datos: [
      { dato: "Un reclamo con firmas y fotos se responde antes que uno individual (estimación de práctica común)", fuente: "Experiencia de organizaciones barriales" },
      { dato: "Muchos municipios reservan una parte de su presupuesto de inversión a propuestas de los barrios", fuente: "Normativa de participación ciudadana local (verificar en tu municipio)" },
    ],
    fuentes: [],
  };
}

export async function demoPrecedentes(onSearch: (q: string) => void): Promise<z.infer<typeof PrecedentesSchema>> {
  await wait(1000, 1400);
  onSearch("minga barrial arreglo comunitario caso de éxito");
  await wait(1500, 2200);
  onSearch("vecinos lograron obra municipal con firmas");
  await wait(1000, 1500);
  return {
    responsables: [
      { entidad: "Dirección de obras públicas del municipio", que_le_toca: "Diagnosticar y ejecutar la obra" },
      { entidad: "Junta parroquial o concejal del sector", que_le_toca: "Llevar el caso a la sesión y presionar por presupuesto" },
      { entidad: "Universidad o instituto técnico cercano", que_le_toca: "Aliado posible para diagnóstico técnico gratuito" },
    ],
    precedentes: [
      { lugar: "Un barrio periférico de una ciudad andina", que_hicieron: "Mapearon el problema con fotos, juntaron 400 firmas y pidieron audiencia pública", resultado: "La obra entró al presupuesto del año siguiente" },
      { lugar: "Una comunidad rural organizada en minga", que_hicieron: "Hicieron un arreglo temporal con materiales donados mientras gestionaban la obra definitiva", resultado: "Resolvieron lo urgente en un fin de semana y ganaron visibilidad" },
    ],
    fuentes: [],
  };
}

export async function demoIdeas(): Promise<z.infer<typeof IdeasSchema>> {
  await wait(2200, 3000);
  return {
    soluciones: [
      { nombre: "Mapa vecinal del problema", descripcion: "Fotos, fechas y conteo de afectados en un mapa compartido que se adjunta a cada reclamo.", costo_usd: 0, semanas: 1, escala: "rapida" },
      { nombre: "Minga de arreglo temporal", descripcion: "Un sábado de trabajo comunitario con materiales donados para resolver lo más urgente.", costo_usd: 120, semanas: 2, escala: "rapida" },
      { nombre: "Oficio con firmas y audiencia", descripcion: "Carta formal con firmas y fotos pidiendo una fecha de respuesta y una audiencia pública.", costo_usd: 15, semanas: 4, escala: "media" },
      { nombre: "Alianza con la universidad", descripcion: "Estudiantes de ingeniería hacen el diagnóstico técnico gratis como práctica.", costo_usd: 40, semanas: 5, escala: "media" },
      { nombre: "Propuesta al presupuesto participativo", descripcion: "Presentar la obra definitiva como proyecto del barrio en el próximo ciclo.", costo_usd: 30, semanas: 8, escala: "ambiciosa" },
      { nombre: "Fondo concursable con ONG", descripcion: "Postular a un fondo de una ONG o empresa para financiar la obra con contraparte vecinal.", costo_usd: 60, semanas: 10, escala: "ambiciosa" },
    ],
  };
}

export async function demoCritica(): Promise<z.infer<typeof CriticaSchema>> {
  await wait(2200, 3000);
  return {
    evaluaciones: [
      { id: "s1", riesgo: "Un mapa solo no obliga a nadie; si no va acompañado de un pedido, queda en nada.", quien_se_opone: "Nadie, pero puede ignorarse", impacto: 2, costo: 5, factibilidad: 5 },
      { id: "s2", riesgo: "Un arreglo mal hecho puede ser peligroso y le quita presión a la autoridad.", quien_se_opone: "El municipio, por responsabilidad legal", impacto: 3, costo: 4, factibilidad: 3 },
      { id: "s3", riesgo: "Sin seguimiento, el oficio se archiva; hay que pedir número de trámite y volver cada semana.", quien_se_opone: "Funcionarios con otras prioridades", impacto: 4, costo: 5, factibilidad: 5 },
      { id: "s4", riesgo: "Depende de los tiempos del semestre; puede tardar más de lo que el barrio aguanta.", quien_se_opone: "Nadie", impacto: 3, costo: 4, factibilidad: 3 },
      { id: "s5", riesgo: "El ciclo puede estar cerrado este año; el resultado llega tarde.", quien_se_opone: "Otros barrios que compiten por el mismo fondo", impacto: 5, costo: 4, factibilidad: 2 },
      { id: "s6", riesgo: "Requiere personería jurídica y contrapartes que el grupo aún no tiene.", quien_se_opone: "Nadie, pero es lento", impacto: 4, costo: 3, factibilidad: 2 },
    ],
    elegida_id: "s3",
    por_que: "Es lo que más mueve a la autoridad con lo que el barrio ya tiene: firmas, fotos y un pedido con fecha. El mapa vecinal entra como la evidencia del oficio, así que se hacen las dos.",
  };
}

export async function demoPlan(p: Project): Promise<z.infer<typeof PlanSchema>> {
  await wait(2600, 3400);
  const lugar = p.ficha?.lugar || "el barrio";
  return {
    objetivo: `Conseguir que la autoridad responsable dé una fecha de solución para ${p.tituloCorto.toLowerCase()}.`,
    meta_medible: "300 firmas y una respuesta escrita con fecha en 6 semanas",
    semanas: 6,
    roles: [
      { rol: "Coordinación", para_que: "Llevar el plan, hablar con la autoridad y no soltar el seguimiento", personas: 1 },
      { rol: "Evidencia", para_que: "Sacar fotos, contar afectados y armar el mapa", personas: 2 },
      { rol: "Difusión", para_que: "Mover la campaña de firmas en redes y en la calle", personas: 2 },
      { rol: "Vocería", para_que: "Representar al barrio en la audiencia y ante la prensa local", personas: 1 },
      { rol: "Logística", para_que: "Organizar la asamblea y la jornada de firmas", personas: 3 },
    ],
    tareas: [
      { titulo: "Convocar la primera asamblea vecinal", detalle: `Fijar fecha y lugar en ${lugar} y mandar la convocatoria.`, rol: "Coordinación", semana: 1 },
      { titulo: "Fotografiar y mapear el problema", detalle: "Fotos con fecha y ubicación de cada punto afectado.", rol: "Evidencia", semana: 1 },
      { titulo: "Contar a las personas afectadas", detalle: "Encuesta corta casa por casa o por chat del barrio.", rol: "Evidencia", semana: 1 },
      { titulo: "Publicar la página de firmas", detalle: "Compartir el enlace de la campaña en los grupos del barrio.", rol: "Difusión", semana: 1 },
      { titulo: "Conseguir local y sillas para la asamblea", detalle: "Casa comunal, iglesia o escuela; confirmar por escrito.", rol: "Logística", semana: 1 },
      { titulo: "Hacer la asamblea y elegir vocería", detalle: "Presentar el plan, sumar gente a cada rol.", rol: "Coordinación", semana: 2 },
      { titulo: "Jornada de firmas en la calle", detalle: "Mesa el sábado en el punto de más paso, con la tablet o en papel.", rol: "Logística", semana: 2 },
      { titulo: "Pedir apoyo a la universidad", detalle: "Escribir a la facultad de ingeniería para un diagnóstico técnico.", rol: "Coordinación", semana: 2 },
      { titulo: "Entregar el oficio con firmas", detalle: "Radicarlo y pedir número de trámite.", rol: "Vocería", semana: 3 },
      { titulo: "Contactar a la prensa local", detalle: "Radio comunitaria y páginas del barrio con fotos del mapa.", rol: "Difusión", semana: 3 },
      { titulo: "Dar seguimiento al trámite", detalle: "Llamar o ir cada semana y anotar qué respondieron.", rol: "Coordinación", semana: 4 },
      { titulo: "Pedir audiencia pública", detalle: "Si no hay respuesta, solicitar audiencia con el concejal del sector.", rol: "Vocería", semana: 5 },
      { titulo: "Informar al barrio el resultado", detalle: "Asamblea corta o mensaje con lo logrado y lo que sigue.", rol: "Coordinación", semana: 6 },
    ],
    presupuesto: [
      { item: "Impresiones de convocatoria y formularios", usd: 15 },
      { item: "Refrigerio para la asamblea", usd: 25 },
      { item: "Pasajes para trámites y audiencia", usd: 20 },
    ],
    hitos: [
      { semana: 2, hito: "Asamblea hecha y 150 firmas" },
      { semana: 3, hito: "Oficio entregado con número de trámite" },
      { semana: 6, hito: "Respuesta escrita con fecha" },
    ],
  };
}

export async function demoOficio(p: Project): Promise<z.infer<typeof OficioSchema>> {
  await wait(2000, 3200);
  const lugar = p.ficha?.lugar || "nuestro barrio";
  return {
    destinatario: "Dirección de Obras Públicas del Municipio",
    asunto: `Pedido de solución: ${p.tituloCorto}`,
    cuerpo: `Señores de la Dirección de Obras Públicas:

Quienes firmamos somos vecinas y vecinos de ${lugar}. Les escribimos por un problema que nos afecta a diario: ${p.problema.replace(/\.$/, "")}.

Adjuntamos un mapa con fotografías fechadas de cada punto afectado y el conteo de las personas perjudicadas, junto con las firmas que respaldan este pedido.

Solicitamos, en un plazo de quince días hábiles, una respuesta escrita que indique qué entidad se hará cargo, qué solución se propone y en qué fecha se ejecutará. Pedimos también un número de trámite para dar seguimiento.

Quedamos atentos y disponibles para una reunión o una visita técnica al lugar.

Atentamente,
${p.duenoNombre}
Coordinación vecinal`,
  };
}

export async function demoCampana(p: Project): Promise<z.infer<typeof CampanaSchema>> {
  await wait(1800, 2800);
  return {
    titular: p.tituloCorto,
    bajada: "Pedimos a la autoridad una respuesta con fecha. Tu firma suma.",
    cuerpo: `${p.problema.replace(/\.$/, "")}. No es un caso aislado: nos afecta a todos los que vivimos aquí.

Vamos a entregar un oficio con fotos, datos y firmas para pedir una solución con fecha. Mientras más seamos, más difícil es ignorarnos.`,
    pedido: "Firmo el pedido",
    meta_firmas: 300,
  };
}

export async function demoConvocatoria(p: Project): Promise<z.infer<typeof ConvocatoriaSchema>> {
  await wait(1400, 2400);
  return {
    mensaje: `Hola, vecinos. Soy ${p.duenoNombre}.
Nos estamos organizando por esto: ${p.tituloCorto.toLowerCase()}.
Ya tenemos un plan de 6 semanas y una carta para la autoridad.
Primera asamblea: este sábado a las 10:00. Lleven ganas, no hace falta experiencia.
Si puedes sumarte, entra al enlace y elige en qué ayudar.`,
  };
}
