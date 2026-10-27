"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { AgentGlyph, Fases } from "./AgentsRoom";
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
    <section className="rotulo" aria-labelledby="entrevista-h">
      <div className="rotulo-in">
        <div className="rotulo-main">
          <h1 id="entrevista-h" className="rotulo-title sm">{p.tituloCorto || "Leyendo tu problema"}</h1>
          <blockquote className="rotulo-quote">{p.problema}</blockquote>
          <form className="hoja" onSubmit={submit} aria-labelledby="preg-h">
            <h2 id="preg-h" className="hoja-title">Tres preguntas antes de arrancar</h2>
            {listo
              ? p.preguntas.map((q, i) => (
                  <div key={q.id} className="field rise" style={{ ["--i" as string]: i }}>
                    <label htmlFor={q.id}>
                      <span className="q-n num" aria-hidden="true">{i + 1}</span>
                      {q.pregunta}
                    </label>
                    <span className="hint">{q.porque}</span>
                    <input id={q.id} className="input" value={resp[q.id] ?? ""} onChange={(e) => setResp({ ...resp, [q.id]: e.target.value })} placeholder="Si no sabes, déjalo en blanco" />
                  </div>
                ))
              : [0, 1, 2].map((i) => (
                  <div key={i} className="field sk" aria-hidden="true">
                    <span style={{ height: 20, width: `${70 - i * 12}%` }} />
                    <span style={{ height: 14, width: "40%" }} />
                    <span className="sk-input" />
                  </div>
                ))}
            {error && <p className="error-line">{error}</p>}
            {p.status === "error" && <p className="error-line">{p.error}</p>}
            <div className="hoja-foot">
              <button className={`btn primary${busy ? " busy" : ""}`} disabled={!listo || busy} aria-busy={busy}>
                {busy ? "Enviando" : "Que trabajen los agentes"} <Icon name="arrow" />
              </button>
              <span className="muted">{listo ? "Tarda uno o dos minutos." : "La entrevistadora está preparando las preguntas."}</span>
            </div>
          </form>
        </div>
        <aside className="rotulo-side" aria-labelledby="espera-h">
          <h2 id="espera-h">Cómo sigue</h2>
          <Fases agentes={p.agentes}>
            {(a) => (
              <li key={a.key} className="rowcard" style={{ minHeight: 52 }}>
                <AgentGlyph estado={a.key === "entrevistador" && !listo ? "trabajando" : a.estado} />
                <div className="main">
                  <div className="t">{a.nombre}</div>
                  <div className="sub">{a.notas[a.notas.length - 1] ?? a.rol}</div>
                </div>
              </li>
            )}
          </Fases>
        </aside>
      </div>
    </section>
  );
}
