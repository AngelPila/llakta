import { z } from "zod";

// Esquemas de salida de cada agente. Se validan siempre, venga la respuesta
// del proveedor que venga, antes de tocar el proyecto.

export const PreguntasSchema = z.object({
  titulo_corto: z.string().describe("Nombre corto del problema, máximo 6 palabras, como titular. Ej: 'El puente de La Floresta'"),
  preguntas: z
    .array(
      z.object({
        pregunta: z.string().describe("Pregunta corta y concreta, en segunda persona"),
        porque: z.string().describe("Para qué sirve saberlo, en una frase"),
      }),
    )
    .describe("Exactamente 3 preguntas"),
});

export const FichaSchema = z.object({
  titulo: z.string().describe("Nombre corto del problema, máximo 6 palabras"),
  enunciado: z.string().describe("El problema en una frase concreta y medible"),
  afectados: z.string(),
  lugar: z.string(),
  desde: z.string(),
  intentos: z.string().describe("Qué se ha intentado hasta ahora; 'Nada todavía' si no se sabe"),
  supuestos: z.array(z.string()).describe("2 a 3 cosas que estamos suponiendo y habría que confirmar"),
});

export const CausasSchema = z.object({
  causas: z.array(z.object({ causa: z.string(), evidencia: z.string() })).describe("3 a 4 causas de raíz"),
  datos: z.array(z.object({ dato: z.string(), fuente: z.string() })).describe("2 a 4 datos con su fuente"),
  fuentes: z.array(z.object({ titulo: z.string(), url: z.string() })),
});

export const PrecedentesSchema = z.object({
  responsables: z
    .array(z.object({ entidad: z.string(), que_le_toca: z.string() }))
    .describe("2 a 3 entidades responsables o aliadas"),
  precedentes: z
    .array(z.object({ lugar: z.string(), que_hicieron: z.string(), resultado: z.string() }))
    .describe("2 a 3 casos parecidos que se resolvieron en otro lugar"),
  fuentes: z.array(z.object({ titulo: z.string(), url: z.string() })),
});

export const IdeasSchema = z.object({
  soluciones: z
    .array(
      z.object({
        nombre: z.string().describe("Nombre corto, 2 a 5 palabras"),
        descripcion: z.string().describe("Qué es y cómo funciona, 1 a 2 frases"),
        costo_usd: z.number().describe("Costo estimado en dólares"),
        semanas: z.number().describe("Semanas hasta ver un resultado"),
        escala: z.enum(["rapida", "media", "ambiciosa"]),
      }),
    )
    .describe("Exactamente 6 soluciones: 2 rápidas, 2 medias, 2 ambiciosas"),
});

export const CriticaSchema = z.object({
  evaluaciones: z.array(
    z.object({
      id: z.string().describe("El id de la solución, tal cual (s1…s6)"),
      riesgo: z.string().describe("Por qué fallaría, en una frase dura y concreta"),
      quien_se_opone: z.string(),
      impacto: z.number().describe("1 a 5"),
      costo: z.number().describe("1 a 5, donde 5 es lo más barato"),
      factibilidad: z.number().describe("1 a 5 para un grupo de vecinos sin experiencia"),
    }),
  ),
  elegida_id: z.string(),
  por_que: z.string().describe("Por qué esta y no otra, 2 frases"),
});

export const PlanSchema = z.object({
  objetivo: z.string(),
  meta_medible: z.string().describe("Cómo sabremos que funcionó, con un número"),
  semanas: z.number().describe("Duración total, 3 a 8 semanas"),
  roles: z
    .array(z.object({ rol: z.string(), para_que: z.string(), personas: z.number() }))
    .describe("3 a 5 roles. El primero es siempre 'Coordinación', lo lleva quien creó el proyecto"),
  tareas: z
    .array(
      z.object({
        titulo: z.string().describe("Empieza con verbo, máximo 8 palabras"),
        detalle: z.string().describe("Qué hay que hacer exactamente, 1 frase"),
        rol: z.string().describe("Uno de los roles definidos, escrito igual"),
        semana: z.number(),
      }),
    )
    .describe("10 a 14 tareas repartidas en las semanas"),
  presupuesto: z.array(z.object({ item: z.string(), usd: z.number() })),
  hitos: z.array(z.object({ semana: z.number(), hito: z.string() })).describe("2 a 3 hitos"),
});

export const OficioSchema = z.object({
  destinatario: z.string(),
  asunto: z.string(),
  cuerpo: z.string().describe("Carta formal completa, con saludo, pedido concreto, plazo y despedida. Párrafos separados por línea en blanco"),
});

export const CampanaSchema = z.object({
  titular: z.string().describe("Máximo 7 palabras, sin signos de exclamación"),
  bajada: z.string().describe("Una frase que dice qué pedimos y a quién"),
  cuerpo: z.string().describe("2 párrafos cortos separados por línea en blanco"),
  pedido: z.string().describe("Texto del botón para firmar, 2 a 4 palabras"),
  meta_firmas: z.number(),
});

export const ConvocatoriaSchema = z.object({
  mensaje: z.string().describe("Mensaje para invitar a vecinos a sumarse, para mandar por chat. 4 a 6 líneas, cercano, con fecha de la primera actividad"),
});
