# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Vecinos organizadores**: una persona común (dirigente barrial, joven, vecina) que quiere mover un problema de su barrio o comunidad en Ecuador y Latinoamérica. No tiene experiencia organizando ni escribiendo oficios.
- **Equipo invitado**: vecinos que entran por un enlace o QR para ocupar un rol, ver sus tareas y hablar con el coordinador.
- **Firmantes**: cualquiera que abre la página pública de firmas desde el celular.
- **Jurado y público de NAUFest 2026 (#AIforImpact)**: ven la app en una demo en vivo o en el video del concurso y tienen que entender en segundos qué hace la IA y por qué importa.

## Product Purpose
Llakta (kichwa: pueblo, comunidad) convierte un problema contado con tus palabras en acción organizada. Un equipo de nueve agentes de IA entrevista, investiga causas y precedentes, propone seis salidas, las critica, arma un plan con roles y tareas, y redacta el oficio, la página de firmas y el mensaje para sumar vecinos. Un agente coordinador con herramientas sigue el proyecto y reacomoda el plan cuando algo cambia. El éxito es que un grupo de vecinos sin experiencia salga con un plan que puede cumplir y gente sumada.

## Positioning
No es un chatbot que da consejos: es un equipo de agentes visibles, con roles y un abogado del diablo, cuyo resultado se vuelve un tablero compartido, documentos listos y un equipo invitado por QR. La persona elige la salida; la IA no decide sola.

## Operating Context
- Flujo: proponer problema → 3 preguntas → sala de agentes en vivo → elegir salida → plan, tablero, documentos.
- Proyecto: Resumen, Tareas, Vecinos (QR y enlaces), Documentos (copiar/imprimir), Investigación, Sala de agentes, chat con el coordinador.
- Páginas públicas: firmas (`/c/[id]`), unirse (`/i/[token]`), comunidad (`/comunidad`).
- Se usa en demos con proyector y celulares del público escaneando el QR.

## Capabilities and Constraints
- Next.js 15 + React 19, CSS propio en `app/globals.css` (sin Tailwind), datos en JSON, tiempo real por SSE.
- Debe funcionar bien en celular: QR, firmas y unirse se abren desde teléfonos.
- Todo el texto está en español.
- Proveedores de IA intercambiables, incluido un modo demo sin API.

## Brand Commitments
- Nombre: Llakta. Palabra kichwa, raíz andina y comunitaria.

## Evidence on Hand
- Fotos con créditos de comunidades, mingas y barrios de Ecuador en `assets/` (`assets/credits.json`).
- Material de video sobre las inundaciones de Guayaquil del 26 de octubre de 2026 en `videos para pitch/`.
- No hay testimonios, usuarios reales ni métricas de impacto: no inventarlos.

## Product Principles
1. La persona decide; la IA propone, critica y redacta.
2. Mostrar el trabajo de los agentes, no esconderlo.
3. Todo termina en algo que se puede hacer esta semana.
4. Español sencillo, para alguien sin experiencia.
5. Primero el celular.
