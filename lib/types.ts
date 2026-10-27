// Modelo de datos de Llakta. Un proyecto nace de un problema y acumula
// lo que producen los agentes (ficha → investigación → ideas → crítica → plan)
// y lo que hace el equipo después (tareas, personas, documentos, chat).

export type AgentKey =
  | "entrevistador"
  | "causas"
  | "precedentes"
  | "ideador"
  | "critico"
  | "estratega"
  | "oficio"
  | "campana"
  | "convocatoria";

export type AgentState = "espera" | "trabajando" | "listo" | "error";

export interface AgentRun {
  key: AgentKey;
  nombre: string;
  rol: string;
  estado: AgentState;
  inicio?: number;
  fin?: number;
  notas: string[];
}

export interface Pregunta {
  id: string;
  pregunta: string;
  porque: string;
}

export interface Ficha {
  titulo: string;
  enunciado: string;
  afectados: string;
  lugar: string;
  desde: string;
  intentos: string;
  supuestos: string[];
}

export interface Causa {
  causa: string;
  evidencia: string;
}

export interface Precedente {
  lugar: string;
  que_hicieron: string;
  resultado: string;
}

export interface Investigacion {
  causas: Causa[];
  datos: { dato: string; fuente: string }[];
  responsables: { entidad: string; que_le_toca: string }[];
  precedentes: Precedente[];
  fuentes: { titulo: string; url: string }[];
}

export interface Solucion {
  id: string;
  nombre: string;
  descripcion: string;
  costo_usd: number;
  semanas: number;
  escala: "rapida" | "media" | "ambiciosa";
}

export interface Evaluacion {
  id: string;
  riesgo: string;
  quien_se_opone: string;
  impacto: number;
  costo: number;
  factibilidad: number;
}

export interface Critica {
  evaluaciones: Evaluacion[];
  elegida_id: string;
  por_que: string;
}

export interface Plan {
  objetivo: string;
  meta_medible: string;
  semanas: number;
  roles: { rol: string; para_que: string; personas: number }[];
  tareas: { titulo: string; detalle: string; rol: string; semana: number }[];
  presupuesto: { item: string; usd: number }[];
  hitos: { semana: number; hito: string }[];
}

export type TaskState = "pendiente" | "en_curso" | "hecha";

export interface Task {
  id: string;
  titulo: string;
  detalle: string;
  rol: string;
  semana: number;
  estado: TaskState;
  responsableId: string | null;
  origen: "plan" | "coordinador" | "persona";
  cambio?: number;
}

export interface Member {
  id: string;
  nombre: string | null;
  rol: string;
  paraQue: string;
  personas: number;
  token: string;
  hue: number;
  esDueno: boolean;
  disponible: boolean;
  motivo?: string;
  unidoEn?: number;
}

export interface Doc {
  id: string;
  tipo: "oficio" | "convocatoria" | "otro";
  titulo: string;
  cuerpo: string;
  autor: string;
  creadoEn: number;
}

export interface Campana {
  titular: string;
  bajada: string;
  cuerpo: string;
  pedido: string;
  metaFirmas: number;
  firmas: { nombre: string; barrio: string; en: number }[];
}

// Una foto que alguien del equipo sube del lugar del problema. La más reciente es la portada
// del proyecto y de la página de firmas; sin ninguna, se muestra una foto de referencia.
export interface Foto {
  id: string;
  autor: string;
  pie: string;
  en: number;
  w: number;
  h: number;
}

export interface ChatMsg {
  id: string;
  de: "persona" | "coordinador";
  autor: string;
  texto: string;
  acciones: string[];
  en: number;
}

export interface Evento {
  en: number;
  autor: string;
  texto: string;
}

export type ProjectStatus = "preguntando" | "entrevista" | "trabajando" | "eligiendo" | "listo" | "error";

export interface Project {
  id: string;
  creadoEn: number;
  duenoNombre: string;
  problema: string;
  status: ProjectStatus;
  error?: string;
  proveedor: string;
  tituloCorto: string;
  preguntas: Pregunta[];
  respuestas: Record<string, string>;
  agentes: AgentRun[];
  ficha?: Ficha;
  investigacion?: Investigacion;
  soluciones?: Solucion[];
  critica?: Critica;
  plan?: Plan;
  tasks: Task[];
  members: Member[];
  docs: Doc[];
  campana?: Campana;
  fotos?: Foto[];
  // La salida que eligió la persona; sin ella, vale la recomendada por el abogado del diablo.
  elegidaId?: string;
  // El organizador lo publica en /comunidad; sin eso, solo se llega por su enlace.
  publico?: boolean;
  // Lo que va en los enlaces públicos (firmas, comunidad, fotos). El id es la llave del
  // tablero completo: nunca sale en una página que vea alguien de afuera.
  publicoId: string;
  chat: ChatMsg[];
  log: Evento[];
}
