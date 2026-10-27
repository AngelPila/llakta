"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import type { Project } from "@/lib/types";
import AgentsRoom from "./AgentsRoom";
import Composer from "./Composer";
import Documentos from "./Documentos";
import Equipo from "./Equipo";
import Interview from "./Interview";
import Investigacion from "./Investigacion";
import Resumen from "./Resumen";
import Tareas from "./Tareas";
import { Avatar, Icon, Mark } from "./ui";

export type View = "resumen" | "tareas" | "equipo" | "documentos" | "investigacion" | "agentes";
const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: "resumen", label: "Resumen", icon: "home" },
  { id: "tareas", label: "Tareas", icon: "board" },
  { id: "equipo", label: "Vecinos", icon: "team" },
  { id: "documentos", label: "Documentos", icon: "doc" },
  { id: "investigacion", label: "Investigación", icon: "search" },
  { id: "agentes", label: "Sala de agentes", icon: "agents" },
];

// El proyecto llega completo por SSE en cada cambio; no hay estado que reconciliar.
function useProject(initial: Project): Project {
  const [p, setP] = useState(initial);
  useEffect(() => {
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout>;
    const open = () => {
      es = new EventSource(`/api/projects/${initial.id}/events`);
      es.onmessage = (e) => setP(JSON.parse(e.data));
      es.onerror = () => {
        es?.close();
        retry = setTimeout(open, 1500);
      };
    };
    open();
    return () => {
      clearTimeout(retry);
      es?.close();
    };
  }, [initial.id]);
  return p;
}

function useHashView(): [View, (v: View) => void] {
  const [view, setView] = useState<View>("resumen");
  useEffect(() => {
    // Cambiar de vista es un cambio de contexto: la vista vieja sale rápido y la nueva entra
    // desacelerando, mientras el resaltado del menú viaja al botón nuevo (View Transitions).
    const read = () => {
      const h = window.location.hash.slice(1) as View;
      const next = VIEWS.some((v) => v.id === h) ? h : "resumen";
      const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
      if (!doc.startViewTransition || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) setView(next);
      else {
        // Si el navegador salta la transición (pestaña oculta, otra en curso) la vista cambia igual.
        const vt = doc.startViewTransition(() => flushSync(() => setView(next)));
        vt.ready.catch(() => {});
        vt.finished.catch(() => {});
      }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const go = (v: View) => {
    window.location.hash = v;
    window.scrollTo({ top: 0 });
  };
  return [view, go];
}

export default function ProjectApp({ initial, webSearch }: { initial: Project; webSearch: boolean }) {
  const p = useProject(initial);
  const [view, go] = useHashView();
  const [menu, setMenu] = useState(false);
  const [yo, setYo] = useState(initial.duenoNombre);
  // Fechas, "hoy" y lo recién cambiado dependen del reloj del navegador: se pinta tras montar.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`llakta:yo:${initial.id}`);
      if (stored) setYo(stored);
    } catch {}
  }, [initial.id]);

  useEffect(() => setMenu(false), [view]);

  // Quien mira a los agentes trabajar se queda en la sala al terminar: el tablero se abre con el botón.
  useEffect(() => {
    if (p.status === "trabajando" && !window.location.hash) {
      history.replaceState(null, "", "#agentes");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  }, [p.status]);

  const listo = p.status === "listo";
  const yoMember = p.members.find((m) => m.nombre === yo);
  const abiertos = p.members.filter((m) => !m.nombre).length;
  // Un contador solo donde hay algo por hacer, y con su sustantivo: "2 sin persona", no "12".
  const sinPersona = p.tasks.filter((t) => {
    const m = p.members.find((x) => x.id === t.responsableId);
    return t.estado !== "hecha" && (!m?.nombre || !m.disponible);
  }).length;
  const counts: Partial<Record<View, string>> = { tareas: sinPersona ? `${sinPersona} sin persona` : undefined, equipo: abiertos ? `${abiertos} por sumar` : undefined };
  const [copiado, setCopiado] = useState(false);
  const publicar = (publico: boolean) => fetch(`/api/projects/${p.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ publico }) });

  let body: React.ReactNode;
  if (p.status === "preguntando" || p.status === "entrevista") body = <Interview p={p} />;
  else if (!listo || view === "agentes") body = <AgentsRoom p={p} webSearch={webSearch} onOpen={() => go("resumen")} />;
  else if (view === "tareas") body = <Tareas p={p} yo={yo} />;
  else if (view === "equipo") body = <Equipo p={p} />;
  else if (view === "documentos") body = <Documentos p={p} />;
  else if (view === "investigacion") body = <Investigacion p={p} />;
  else body = <Resumen p={p} go={go} yo={yo} />;

  const titulo = p.tituloCorto || "Proyecto nuevo";
  if (!mounted) return <div className="app" />;

  return (
    <div className="app">
      <aside className={`sidebar${menu ? " sheet" : ""}`}>
        <Link href="/" className="brand">
          <Mark /> Llakta
        </Link>
        <div className="scope">
          <b title={titulo}>{titulo}</b>
          <span>
            {p.duenoNombre} · desde {new Date(p.creadoEn).toLocaleDateString("es", { day: "numeric", month: "short" })}
          </span>
        </div>
        <p className="nav-label">Proyecto</p>
        <nav className="nav">
          {VIEWS.map((v) => {
            const disabled = !listo && v.id !== "agentes";
            const current = listo ? view === v.id : v.id === "agentes";
            return (
              <button key={v.id} aria-current={current ? "page" : undefined} disabled={disabled} title={disabled ? "Disponible cuando el equipo termine" : undefined} style={disabled ? { opacity: 0.45, cursor: "default" } : undefined} onClick={() => !disabled && go(v.id)}>
                {current && <span className="nav-ind" aria-hidden="true" />}
                <Icon name={v.icon} /> {v.label}
                {listo && counts[v.id] ? <span className="count">{counts[v.id]}</span> : null}
              </button>
            );
          })}
        </nav>
        {!listo && <p className="nav-hint">Se habilita cuando el equipo de agentes termine.</p>}
        <p className="nav-label">Otros</p>
        <nav className="nav">
          <Link href="/">
            <Icon name="plus" /> Nuevo problema
          </Link>
        </nav>
        {p.campana && (
          <div className="camp-card">
            <a href={`/c/${p.publicoId}`} target="_blank" rel="noreferrer">
              Página de firmas
            </a>
            <p>Compártela en los grupos del barrio.</p>
            <button
              className="link"
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/c/${p.publicoId}`).then(() => {
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 1800);
                });
              }}
            >
              <Icon name={copiado ? "check" : "link"} size={14} /> {copiado ? "Enlace copiado" : "Copiar enlace"}
            </button>
            {listo && yo === p.duenoNombre &&
              (p.publico ? (
                <span className="link">
                  <Icon name="check" size={14} />
                  <a href={`/comunidad/${p.publicoId}`} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                    En Comunidad
                  </a>
                  · <button className="link" style={{ marginTop: 0, fontWeight: 400 }} onClick={() => publicar(false)}>quitar</button>
                </span>
              ) : (
                <button className="link" onClick={() => publicar(true)}>
                  <Icon name="globe" size={14} /> Publicar en Comunidad
                </button>
              ))}
          </div>
        )}
        <div className="sidebar-foot">
          {yoMember ? <Avatar m={yoMember} /> : <span className="avatar" style={{ ["--h" as string]: 195 }}>{yo.slice(0, 1).toUpperCase()}</span>}
          <div style={{ minWidth: 0 }}>
            <div>{yo}</div>
            <div className="meta">{yoMember?.rol ?? (yo === p.duenoNombre ? "Coordinación" : "Invitado")}</div>
          </div>
        </div>
      </aside>
      <header className="topbar">
        <Mark />
        <span className="name">{titulo}</span>
        <button aria-label={menu ? "Cerrar menú" : "Abrir menú"} onClick={() => setMenu(!menu)}>
          <Icon name={menu ? "close" : "menu"} size={18} />
        </button>
      </header>
      <main className="canvas">{body}</main>
      {listo && view !== "agentes" && <Composer p={p} yo={yo} />}
    </div>
  );
}
