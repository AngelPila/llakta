"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { AgentGlyph } from "./AgentsRoom";
import { Icon } from "./ui";

export default function Interview({ p }: { p: Project }) {
  const [resp, setResp] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const listo = p.status === "entrevista";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/projects/${p.id}/answers`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ respuestas: resp }) });
    if (!res.ok) {
      setError((await res.json()).error ?? "No se pudo enviar.");
      setBusy(false);
    }
  }

  return (
    <div className="col">
      <h1 className="greeting">{p.tituloCorto || "Leyendo tu problema"}</h1>
      <p className="lede">«{p.problema}»</p>
      <div className="grid after-head" style={{ alignItems: "start" }}>
        <form className="panel s7" onSubmit={submit} aria-labelledby="preg-h">
          <div className="panel-head">
            <h2 id="preg-h">Tres preguntas antes de arrancar</h2>
            <span className="end">La entrevista</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {listo
              ? p.preguntas.map((q, i) => (
                  <div key={q.id} className="field rise" style={{ ["--i" as string]: i }}>
                    <label htmlFor={q.id}>{q.pregunta}</label>
                    <span className="hint">{q.porque}</span>
                    <input id={q.id} className="input" value={resp[q.id] ?? ""} onChange={(e) => setResp({ ...resp, [q.id]: e.target.value })} placeholder="Si no sabes, déjalo en blanco" />
                  </div>
                ))
              : [0, 1, 2].map((i) => (
                  <div key={i} className="field" aria-hidden="true">
                    <span style={{ height: 20, width: `${70 - i * 12}%`, background: "#ececea", borderRadius: 6 }} />
                    <span style={{ height: 16, width: "40%", background: "#f0f0ee", borderRadius: 6 }} />
                    <span style={{ height: 44, background: "#fff", border: "1px solid var(--border)", borderRadius: 14 }} />
                  </div>
                ))}
            {error && <p className="error-line">{error}</p>}
            {p.status === "error" && <p className="error-line">{p.error}</p>}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button className="btn primary" disabled={!listo || busy}>
                {busy ? "Enviando…" : "Que trabajen los agentes"} <Icon name="arrow" />
              </button>
              <span className="muted" style={{ fontSize: 13 }}>{listo ? "Tarda uno o dos minutos." : "Preparando las preguntas…"}</span>
            </div>
          </div>
        </form>
        <section className="panel s5" aria-labelledby="espera-h">
          <div className="panel-head">
            <h2 id="espera-h">Quién trabaja después</h2>
          </div>
          <ol className="rows">
            {p.agentes.map((a) => (
              <li key={a.key} className="rowcard" style={{ minHeight: 52 }}>
                <AgentGlyph estado={a.key === "entrevistador" && !listo ? "trabajando" : a.estado} />
                <div className="main">
                  <div className="t">{a.nombre}</div>
                  <div className="sub">{a.notas[a.notas.length - 1] ?? a.rol}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
