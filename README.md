# Llakta

*Llakta* (kichwa): pueblo, comunidad. Le cuentas un problema de tu barrio a un equipo de
nueve agentes de IA y sales con ficha, investigación, seis soluciones criticadas, un plan,
un tablero con tu equipo invitado por QR, un oficio, una página de firmas y un coordinador
que reacomoda el plan cuando algo cambia.

## Correr

```bash
cp .env.example .env      # pon UNA clave (o ninguna para modo demo)
docker compose up         # http://localhost:3210
```

Para que los celulares del público escaneen el QR, abre la app desde la IP de tu laptop en
la red (por ejemplo `http://192.168.1.20:3210`), no desde `localhost`.

## Publicar en un servidor

```bash
cp .env.example .env      # la clave del proveedor y, si quieres, LLAKTA_DESTACADOS
docker compose -f docker-compose.prod.yml up -d --build
```

Los proyectos y fotos quedan en `./data`. Cada IP puede crear 5 proyectos por hora y el
servidor entero `LLAKTA_MAX_PROYECTOS_DIA` al día, para no agotar el saldo de la API.

## Proveedores de IA

| Proveedor | Costo | Variable | Notas |
|---|---|---|---|
| Modo demo | gratis | ninguna | Agentes con guion. Para ensayar o si se cae el wifi. |
| Gemini (Flash) | gratis | `GEMINI_API_KEY` | Clave en aistudio.google.com sin tarjeta. Límites por minuto bajos. |
| Groq | gratis | `GROQ_API_KEY` | Muy rápido. Límites de tokens por minuto. |
| DeepSeek | de pago (centavos) | `DEEPSEEK_API_KEY` | Barato y estable; bueno para dejarlo publicado. |
| Ollama local | gratis | `LLAKTA_PROVIDER=ollama` | Necesita el modelo descargado (`qwen2.5:7b` por defecto). |
| Claude | de pago | `ANTHROPIC_API_KEY` | Único con búsqueda web real en la investigación. |

Se detecta solo según la clave que exista; `LLAKTA_PROVIDER` lo fuerza. `LLM_MODEL` y
`LLM_FAST_MODEL` cambian los modelos, y `LLM_MAX_TOKENS` / `LLM_MAX_TOKENS_FAST` limitan la salida
de cada llamada. Con DeepSeek, la etapa principal usa `deepseek-v4-pro` con razonamiento en
esfuerzo bajo, y el resto `deepseek-flash` sin razonamiento (DeepSeek lo trae activado y en alto por defecto);
el consumo de cada llamada queda en el log del servidor (`[llm] … entrada=… salida=…`).

## Cómo está hecho

- `lib/pipeline.ts`: el orquestador. Entrevista → ficha → causas ∥ precedentes → ideas →
  abogado del diablo → estrategia → oficio ∥ campaña ∥ convocatoria → tablero.
- `lib/coordinator.ts`: agente con herramientas que modifican el proyecto
  (`crear_tarea`, `actualizar_tarea`, `marcar_disponibilidad`, `invitar_persona`,
  `redactar_documento`). El estado y el resumen de avance van en cada mensaje.
- `lib/llm.ts`: capa de proveedores (Claude con el SDK oficial; Gemini, Groq y Ollama por su
  API compatible con OpenAI). Toda salida se valida con Zod.
- Tiempo real por Server-Sent Events; datos en `data/db.json`.
