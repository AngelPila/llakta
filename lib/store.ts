import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Project } from "./types";

// Almacén en un archivo JSON: suficiente para una hackatón, sin servidor de base
// de datos. Cada guardado avisa por el bus y los clientes conectados por SSE
// reciben el proyecto completo.

const FILE = path.join(process.cwd(), "data", "db.json");

interface Db {
  projects: Record<string, Project>;
}

interface Globals {
  db?: Db;
  bus?: EventEmitter;
  writeTimer?: NodeJS.Timeout;
}

const g = globalThis as unknown as { __llakta?: Globals };
const state: Globals = (g.__llakta ??= {});

function db(): Db {
  if (!state.db) {
    try {
      state.db = JSON.parse(fs.readFileSync(FILE, "utf8")) as Db;
    } catch {
      state.db = { projects: {} };
    }
  }
  return state.db;
}

export function bus(): EventEmitter {
  if (!state.bus) {
    state.bus = new EventEmitter();
    state.bus.setMaxListeners(200);
  }
  return state.bus;
}

function persist() {
  clearTimeout(state.writeTimer);
  state.writeTimer = setTimeout(() => {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db(), null, 1));
  }, 150);
}

export function newId(len = 10): string {
  return crypto.randomBytes(16).toString("base64url").slice(0, len);
}

export function listProjects(): Project[] {
  return Object.values(db().projects).sort((a, b) => b.creadoEn - a.creadoEn);
}

export function getProject(id: string): Project | undefined {
  return db().projects[id];
}

export function findByToken(token: string): { project: Project; memberId: string } | undefined {
  for (const p of Object.values(db().projects)) {
    const m = p.members.find((x) => x.token === token);
    if (m) return { project: p, memberId: m.id };
  }
  return undefined;
}

export function saveProject(p: Project): Project {
  db().projects[p.id] = p;
  persist();
  bus().emit(`project:${p.id}`, p);
  return p;
}

// Muta el proyecto dentro de `fn` y lo guarda. Todo cambio pasa por aquí.
export function updateProject(id: string, fn: (p: Project) => void): Project {
  const p = getProject(id);
  if (!p) throw new Error(`Proyecto ${id} no existe`);
  fn(p);
  return saveProject(p);
}

export function logEvent(p: Project, autor: string, texto: string) {
  p.log.push({ en: Date.now(), autor, texto });
  if (p.log.length > 300) p.log.splice(0, p.log.length - 300);
}
