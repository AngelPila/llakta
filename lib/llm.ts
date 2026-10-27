import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// Capa de proveedores. Los agentes piden dos cosas: un JSON que cumpla un
// esquema (generateJSON) y una conversación con herramientas (toolLoop).
// Detrás puede estar Claude (SDK oficial), cualquier API compatible con
// OpenAI (Gemini, Groq, Ollama) o el modo demo, que no llama a nadie.

export type ProviderId = "anthropic" | "gemini" | "groq" | "deepseek" | "ollama" | "openai" | "demo";

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  model: string;
  fastModel: string;
  webSearch: boolean;
}

const PRESETS: Record<Exclude<ProviderId, "anthropic" | "demo">, { label: string; baseUrl: string; key: string; model: string; fast: string }> = {
  gemini: {
    label: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    key: "GEMINI_API_KEY",
    model: "gemini-2.5-flash",
    fast: "gemini-2.5-flash",
  },
  groq: {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    key: "GROQ_API_KEY",
    model: "openai/gpt-oss-120b",
    fast: "llama-3.3-70b-versatile",
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    key: "DEEPSEEK_API_KEY",
    model: "deepseek-v4-pro",
    fast: "deepseek-flash",
  },
  ollama: {
    label: "Ollama local",
    baseUrl: "http://host.docker.internal:11434/v1",
    key: "OLLAMA_API_KEY",
    model: "qwen2.5:7b",
    fast: "qwen2.5:7b",
  },
  openai: {
    label: "API compatible",
    baseUrl: "",
    key: "LLM_API_KEY",
    model: "",
    fast: "",
  },
};

const env = (k: string) => (process.env[k] ?? "").trim();

export function provider(): ProviderInfo {
  let id = env("LLAKTA_PROVIDER") as ProviderId;
  if (!id) {
    if (env("ANTHROPIC_API_KEY")) id = "anthropic";
    else if (env("GEMINI_API_KEY")) id = "gemini";
    else if (env("GROQ_API_KEY")) id = "groq";
    else if (env("DEEPSEEK_API_KEY")) id = "deepseek";
    else if (env("LLM_BASE_URL")) id = "openai";
    else id = "demo";
  }
  if (id === "demo") return { id, label: "Modo demo", model: "guion", fastModel: "guion", webSearch: false };
  if (id === "anthropic") {
    return {
      id,
      label: "Claude",
      model: env("LLM_MODEL") || "claude-opus-5-5",
      fastModel: env("LLM_FAST_MODEL") || "claude-sonnet-5-5",
      webSearch: true,
    };
  }
  const p = PRESETS[id];
  return {
    id,
    label: p.label,
    model: env("LLM_MODEL") || p.model,
    fastModel: env("LLM_FAST_MODEL") || p.fast || env("LLM_MODEL") || p.model,
    webSearch: false,
  };
}

// ---------- JSON Schema a partir de Zod ----------

type Json = { [k: string]: unknown };

function tighten(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(tighten);
  if (!node || typeof node !== "object") return node;
  const out: Json = {};
  for (const [k, v] of Object.entries(node as Json)) {
    if (k === "$schema") continue;
    out[k] = tighten(v);
  }
  if (out.type === "object" && out.properties) {
    out.additionalProperties = false;
    out.required = Object.keys(out.properties as Json);
  }
  return out;
}

export function jsonSchema(schema: z.ZodType): Json {
  return tighten(z.toJSONSchema(schema)) as Json;
}

// ---------- Claude ----------

let anthropic: Anthropic | undefined;
const claude = () => (anthropic ??= new Anthropic());

// Fallback del lado del servidor ante un rechazo; Haiku no lo admite.
function fallbackParams(model: string) {
  return model.startsWith("claude-haiku") ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
}

function textOf(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function checkStop(msg: Anthropic.Beta.BetaMessage) {
  if (msg.stop_reason === "refusal") throw new Error("El modelo se negó a responder esta solicitud.");
  if (msg.stop_reason === "max_tokens") throw new Error("La respuesta se cortó por longitud.");
}

async function claudeResearch(model: string, system: string, prompt: string, onSearch?: (q: string) => void): Promise<string> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
  for (let turn = 0; turn < 4; turn++) {
    const msg = await claude().beta.messages.create({
      model,
      max_tokens: 16000,
      system,
      messages,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }],
      output_config: { effort: "low" },
      ...fallbackParams(model),
    });
    for (const b of msg.content) {
      if (b.type === "server_tool_use" && b.name === "web_search") {
        const q = (b.input as { query?: string }).query;
        if (q) onSearch?.(q);
      }
    }
    if (msg.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: msg.content });
      continue;
    }
    checkStop(msg);
    return textOf(msg.content);
  }
  throw new Error("La búsqueda no terminó a tiempo.");
}

async function claudeJSON(model: string, system: string, prompt: string, schema: z.ZodType, effort: "low" | "medium"): Promise<unknown> {
  const msg = await claude().beta.messages.create({
    model,
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: prompt }],
    output_config: { effort, format: { type: "json_schema", schema: jsonSchema(schema) } },
    ...fallbackParams(model),
  });
  checkStop(msg);
  return JSON.parse(textOf(msg.content));
}

// ---------- APIs compatibles con OpenAI ----------

interface OAMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
  // DeepSeek en modo razonamiento: con herramientas hay que devolverlo en cada turno o responde 400.
  reasoning_content?: string;
}

function oaConfig() {
  const id = provider().id as keyof typeof PRESETS;
  const p = PRESETS[id] ?? PRESETS.openai;
  return { baseUrl: env("LLM_BASE_URL") || p.baseUrl, key: env(p.key) || env("LLM_API_KEY") };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Techo de salida por llamada. Sin él, un modelo que se explaya gasta lo que quiera.
const maxOut = (fast: boolean) => Number(env(fast ? "LLM_MAX_TOKENS_FAST" : "LLM_MAX_TOKENS")) || (fast ? 3000 : 6000);

// DeepSeek razona por defecto con esfuerzo alto, y ese razonamiento se cobra como
// salida. Los pasos rápidos no lo necesitan; los demás, en esfuerzo bajo.
function thinking(fast: boolean): Json {
  if (provider().id !== "deepseek") return {};
  return fast ? { thinking: { type: "disabled" } } : { thinking: { type: "enabled" }, reasoning_effort: "low" };
}

interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  completion_tokens_details?: { reasoning_tokens?: number };
  prompt_cache_hit_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

async function oaChat(body: Json): Promise<{ message: OAMessage; finish: string }> {
  const { baseUrl, key } = oaConfig();
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(key ? { authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify(body),
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      const wait = Number(res.headers.get("retry-after")) * 1000 || 2500 * (attempt + 1);
      await sleep(Math.min(wait, 20000));
      continue;
    }
    if (!res.ok) throw new Error(`El proveedor respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { choices: { message: OAMessage; finish_reason: string }[]; usage?: Usage };
    const u = data.usage;
    if (u) console.log(`[llm] ${body.model} entrada=${u.prompt_tokens} (caché ${u.prompt_cache_hit_tokens ?? u.prompt_tokens_details?.cached_tokens ?? 0}) salida=${u.completion_tokens}${u.completion_tokens_details?.reasoning_tokens ? ` (razonando ${u.completion_tokens_details.reasoning_tokens})` : ""}`);
    return { message: data.choices[0].message, finish: data.choices[0].finish_reason };
  }
}

function extractJSON(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  return JSON.parse(start >= 0 ? t.slice(start, end + 1) : t);
}

async function oaJSON(model: string, system: string, prompt: string, schema: z.ZodType, fast: boolean): Promise<unknown> {
  const messages: OAMessage[] = [
    { role: "system", content: `${system}\n\nResponde solo con un objeto JSON válido que cumpla este JSON Schema, sin texto alrededor:\n${JSON.stringify(jsonSchema(schema))}` },
    { role: "user", content: prompt },
  ];
  const { message, finish } = await oaChat({ model, messages, response_format: { type: "json_object" }, max_tokens: maxOut(fast), ...thinking(fast) });
  // Cortada a la mitad no sirve, y reintentar costaría lo mismo otra vez.
  if (finish === "length") throw new Error("La respuesta se cortó por longitud.");
  return extractJSON(message.content ?? "");
}

// ---------- Interfaz común ----------

export interface JSONRequest<T> {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  fast?: boolean;
  webSearch?: boolean;
  onSearch?: (q: string) => void;
}

export async function generateJSON<T>(req: JSONRequest<T>): Promise<T> {
  const p = provider();
  const model = req.fast ? p.fastModel : p.model;
  let prompt = req.prompt;
  if (p.id === "anthropic" && req.webSearch) {
    const notes = await claudeResearch(model, req.system, req.prompt, req.onSearch);
    prompt = `${req.prompt}\n\nNotas de la investigación en la web (usa estos datos y sus URLs):\n${notes}`;
  }
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const ask = lastError ? `${prompt}\n\nTu respuesta anterior no cumplió el esquema (${lastError}). Corrígela.` : prompt;
    try {
      const raw = p.id === "anthropic" ? await claudeJSON(model, req.system, ask, req.schema, req.fast ? "low" : "medium") : await oaJSON(model, req.system, ask, req.schema, !!req.fast);
      const parsed = req.schema.safeParse(raw);
      if (parsed.success) return parsed.data;
      lastError = parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    } catch (e) {
      if (e instanceof SyntaxError) lastError = "JSON inválido";
      else throw e;
    }
  }
  throw new Error(`El modelo no devolvió un JSON válido: ${lastError}`);
}

export interface Tool {
  name: string;
  description: string;
  schema: z.ZodObject;
  run: (input: never) => Promise<string>;
}

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

// Conversación con herramientas hasta que el modelo deja de pedirlas.
export async function toolLoop(system: string, history: Turn[], tools: Tool[], maxSteps = 5): Promise<string> {
  const p = provider();
  const byName = new Map(tools.map((t) => [t.name, t]));

  async function call(name: string, input: unknown): Promise<{ text: string; error: boolean }> {
    const tool = byName.get(name);
    if (!tool) return { text: `No existe la herramienta ${name}`, error: true };
    const parsed = tool.schema.safeParse(input);
    if (!parsed.success) return { text: `Parámetros inválidos: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`, error: true };
    try {
      return { text: await tool.run(parsed.data as never), error: false };
    } catch (e) {
      return { text: (e as Error).message, error: true };
    }
  }

  if (p.id === "anthropic") {
    const defs: Anthropic.Beta.BetaToolUnion[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: jsonSchema(t.schema) as Anthropic.Beta.BetaTool.InputSchema,
    }));
    const messages: Anthropic.Beta.BetaMessageParam[] = history.map((h) => ({ role: h.role, content: h.content }));
    for (let step = 0; step < maxSteps; step++) {
      const msg = await claude().beta.messages.create({
        model: p.model,
        max_tokens: 16000,
        system,
        messages,
        tools: defs,
        output_config: { effort: "low" },
        ...fallbackParams(p.model),
      });
      if (msg.stop_reason === "refusal") throw new Error("El modelo se negó a responder.");
      messages.push({ role: "assistant", content: msg.content });
      const uses = msg.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      if (msg.stop_reason !== "tool_use" || uses.length === 0) return textOf(msg.content);
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const u of uses) {
        const r = await call(u.name, u.input);
        results.push({ type: "tool_result", tool_use_id: u.id, content: r.text, is_error: r.error });
      }
      messages.push({ role: "user", content: results });
    }
    return "Hice varios cambios; revisa el tablero.";
  }

  const defs = tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: jsonSchema(t.schema) } }));
  const messages: OAMessage[] = [{ role: "system", content: system }, ...history.map((h) => ({ role: h.role, content: h.content }) as OAMessage)];
  for (let step = 0; step < maxSteps; step++) {
    const { message } = await oaChat({ model: p.model, messages, tools: defs, tool_choice: "auto", max_tokens: maxOut(false), ...thinking(false) });
    messages.push({ role: "assistant", content: message.content ?? "", tool_calls: message.tool_calls, ...(message.reasoning_content ? { reasoning_content: message.reasoning_content } : {}) });
    if (!message.tool_calls?.length) return (message.content ?? "").trim();
    for (const tc of message.tool_calls) {
      let input: unknown = {};
      try {
        input = JSON.parse(tc.function.arguments || "{}");
      } catch {
        messages.push({ role: "tool", tool_call_id: tc.id, content: "JSON inválido en los argumentos" });
        continue;
      }
      const r = await call(tc.function.name, input);
      messages.push({ role: "tool", tool_call_id: tc.id, content: r.text });
    }
  }
  return "Hice varios cambios; revisa el tablero.";
}
