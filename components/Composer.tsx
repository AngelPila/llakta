"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { Icon, Mark } from "./ui";

export default function Composer({ p, yo }: { p: Project; yo: string }) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const thread = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);

  const otro = p.members.find((m) => m.nombre && !m.esDueno && m.disponible);
  const sugerencias = [
    "¿Cómo vamos?",
    otro ? `${otro.nombre!.split(" ")[0]} no puede esta semana` : "Necesito a alguien para difusión",
    "Redacta un mensaje de seguimiento para el grupo",
  ];

  useEffect(() => {
    thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: "smooth" });
  }, [p.chat.length, open, busy]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function send(msg: string) {
    const t = msg.trim();
    if (!t || busy) return;
    setTexto("");
    setFallo(null);
    setOpen(true);
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${p.id}/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texto: t, autor: yo }) });
      if (!res.ok) throw new Error();
    } catch {
      // Lo escrito no se pierde: vuelve al cuadro y se ofrece reintentar.
      setTexto(t);
      setFallo(t);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={root} className={`composer${open ? " open" : ""}`} role="region" aria-label="Coordinador del proyecto">
      <div className="thread" ref={thread}>
        <div className="thread-inner">
          {p.chat.slice(-20).map((m) => (
            <div key={m.id} className={`msg ${m.de}`}>
              <div className="from">{m.de === "coordinador" ? "Coordinador" : m.autor}</div>
              <div className="body">{m.texto}</div>
              {m.acciones.length > 0 && (
                <div className="acts">
                  {m.acciones.map((a, i) => (
                    <div key={i} style={{ ["--i" as string]: i }}>
                      <Icon name="check" size={13} stroke={2} /> {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="msg">
              <div className="from">Coordinador</div>
              <span className="typing" aria-label="Pensando">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </div>
      </div>
      {fallo && (
        <p className="composer-error" role="alert">
          No se pudo enviar. Revisa la conexión.{" "}
          <button className="link" onClick={() => send(fallo)}>
            Reintentar
          </button>
        </p>
      )}
      {open && !busy && !fallo && (
        <div className="suggest">
          {sugerencias.map((s) => (
            <button key={s} onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(texto);
        }}
      >
        <Mark size={18} />
        <input value={texto} onChange={(e) => setTexto(e.target.value)} onFocus={() => setOpen(true)} placeholder="Dile al coordinador qué cambió" aria-label="Mensaje para el coordinador" />
        <span className="who">como {yo}</span>
        <button className="btn primary sm" disabled={busy || !texto.trim()} aria-label="Enviar">
          <Icon name="send" />
        </button>
      </form>
    </div>
  );
}
