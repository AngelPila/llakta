"use client";

import { useEffect, useState } from "react";
import { FASES } from "@/lib/agents";
import type { AgentRun, AgentState, Project } from "@/lib/types";
import { duracion } from "@/lib/view";
import { Icon } from "./ui";

export function AgentGlyph({ estado }: { estado: AgentState }) {
  return (
    <span className={`glyph ${estado}`} aria-label={{ espera: "En espera", trabajando: "Trabajando", listo: "Listo", error: "Error" }[estado]}>
      {estado === "listo" && (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8.5 6.5 12 13 4.5" />
        </svg>
      )}
      {estado === "error" && "!"}
    </span>
  );
}

function faseActual(agentes: AgentRun[]) {
  const i = FASES.findIndex((f) => f.agentes.some((k) => agentes.find((a) => a.key === k)?.estado !== "listo"));
  return i === -1 ? FASES.length : i;
}

export function Fases({ agentes, children }: { agentes: AgentRun[]; children: (a: AgentRun) => React.ReactNode }) {
  const actual = faseActual(agentes);
  return (
    <ol className="fases">
      {FASES.map((f, i) => {
        const estado = i < actual ? "hecha" : i === actual ? "ahora" : "despues";
        return (
          <li key={f.nombre} className={`fase ${estado}`} aria-current={estado === "ahora" ? "step" : undefined}>
            <span className="fase-n num" aria-hidden="true">
              {i + 1}
            </span>
            <div className="fase-body">
              <div className="fase-head">
                <b>{f.nombre}</b>
                {estado === "ahora" && <span className="fase-st">Ahora</span>}
              </div>
              {estado === "ahora" ? (
                <ol className="rows">{f.agentes.map((k) => agentes.find((a) => a.key === k)).filter((a): a is AgentRun => !!a).map(children)}</ol>
              ) : (
                <p className="fase-agentes">{f.agentes.map((k) => agentes.find((a) => a.key === k)?.nombre).join(" · ")}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export function Score({ n, accent, w = 0 }: { n: number; accent?: boolean; w?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(n)));
  return (
    <span className="score" aria-label={`${v} de 5`} style={{ ["--w" as string]: w }}>
      <span className="track">
        <span className="fill" style={{ width: `${(v / 5) * 100}%`, background: accent ? "var(--accent)" : "#8cc4bb" }} />
      </span>
      <span className="num">{v}</span>
    </span>
  );
}

export default function AgentsRoom({ p, webSearch, onOpen }: { p: Project; webSearch: boolean; onOpen: () => void }) {
  const trabajando = p.status === "trabajando";
  const now = useNow(trabajando);
  const listos = p.agentes.filter((a) => a.estado === "listo").length;
  const inicio = Math.min(...p.agentes.map((a) => a.inicio ?? Infinity));
  const fin = Math.max(...p.agentes.map((a) => a.fin ?? 0));
  const total = Number.isFinite(inicio) ? (trabajando ? now : fin) - inicio : 0;

  async function retry() {
    await fetch(`/api/projects/${p.id}/retry`, { method: "POST" });
  }

  return (
    <div className="col">
      <div className="head-row">
        <div>
          <h1 className="greeting">{p.tituloCorto || "Tu problema"}</h1>
          <p className="lede">
            <b className="num pop" key={listos}>
              {listos} de {p.agentes.length}
            </b>{" "}
            agentes listos · <span className="num">{duracion(total)}</span> · {p.proveedor}
            {webSearch ? " con búsqueda web" : ""}
          </p>
        </div>
        <div className="actions">
          {p.status === "listo" && (
            <button className="btn primary ready" onClick={onOpen}>
              Abrir el tablero <Icon name="arrow" />
            </button>
          )}
          {p.status === "error" && (
            <button className="btn primary" onClick={retry}>
              Reintentar
            </button>
          )}
        </div>
      </div>
      {p.status === "error" && (
        <p className="error-line" style={{ marginTop: 16 }}>
          Se detuvo: {p.error}
        </p>
      )}

      <div className="grid after-head" style={{ alignItems: "start" }}>
        <div className="s5 room-side">
          <section className="panel" aria-labelledby="ag-h">
            <div className="panel-head">
              <h2 id="ag-h">El equipo</h2>
            </div>
            <Fases agentes={p.agentes}>
              {(a) => (
                  <li key={a.key} className={`rowcard agent ${a.estado}`}>
                    <AgentGlyph estado={a.estado} />
                    <div className="main">
                      <div className="t">{a.nombre}</div>
                      <div className="sub" key={a.notas.length}>
                        <span className="note">{a.notas[a.notas.length - 1] ?? a.rol}</span>
                      </div>
                    </div>
                    {a.estado === "trabajando" && <span className="sweep" aria-hidden="true" />}
                  </li>
              )}
            </Fases>
          </section>
        </div>

        <section className="s7 out" aria-labelledby="out-h">
          <h2 id="out-h" className="sr">
            Lo que va saliendo
          </h2>
          {!p.ficha && (
            <div className="panel">
              <div className="panel-head">
                <h2>Lo que va saliendo</h2>
              </div>
              <p className="empty">Los resultados aparecen aquí a medida que cada agente termina.</p>
            </div>
          )}

          {p.ficha && (
            <article className="panel rise">
              <div className="panel-head">
                <h2>Ficha del problema</h2>
              </div>
              <p className="statement">{p.ficha.enunciado}</p>
            </article>
          )}

          {p.investigacion && (
            <article className="panel rise">
              <div className="panel-head">
                <h2>Por qué pasa</h2>
              </div>
              <ol className="rows">
                {p.investigacion.causas.map((c, i) => (
                  <li key={i} className="rowcard rise" style={{ ["--i" as string]: i, minHeight: 0 }}>
                    <div className="main">
                      <div className="t" style={{ whiteSpace: "normal" }}>{c.causa}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          )}

          {p.soluciones && (
            <article className="panel rise">
              <div className="panel-head">
                <h2>Seis salidas</h2>
              </div>
              <table className={`ideas${p.critica ? " decided" : ""}`} key={p.critica ? "decidida" : "abierta"}>
                <thead>
                  <tr>
                    <th>Solución</th>
                    <th className="num">Costo</th>
                    {p.critica && (
                      <>
                        <th className="num">Impacto</th>
                        <th className="num">Barata</th>
                        <th className="num">Factible</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {p.soluciones.map((s, i) => {
                    const ev = p.critica?.evaluaciones.find((e) => e.id === s.id);
                    const win = s.id === p.critica?.elegida_id;
                    return (
                      <tr key={s.id} className={`rise${win ? " win" : ""}`} style={{ ["--i" as string]: i }}>
                        <td>
                          <div className="t">
                            {s.nombre} {win && <span className="pill acc">Elegida</span>}
                          </div>
                        </td>
                        <td className="num">
                          <span>${s.costo_usd.toLocaleString("es")}</span>
                        </td>
                        {ev && (
                          <>
                            <td className="num">
                              <Score n={ev.impacto} accent={win} w={i} />
                            </td>
                            <td className="num">
                              <Score n={ev.costo} accent={win} w={i + 1} />
                            </td>
                            <td className="num">
                              <Score n={ev.factibilidad} accent={win} w={i + 2} />
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </article>
          )}

          {p.plan && (
            <article className="panel rise">
              <div className="panel-head">
                <h2>El plan</h2>
              </div>
              <p className="statement">{p.plan.objetivo}</p>
              <div className="strip" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div>
                  <span>Duración</span>
                  <b className="num">{p.plan.semanas} semanas</b>
                </div>
                <div>
                  <span>Tareas</span>
                  <b className="num">{p.plan.tareas.length}</b>
                </div>
                <div>
                  <span>Presupuesto</span>
                  <b className="num">${p.plan.presupuesto.reduce((s, x) => s + x.usd, 0).toLocaleString("es")}</b>
                </div>
              </div>
            </article>
          )}

          {(p.docs.length > 0 || p.campana) && (
            <article className="panel rise">
              <div className="panel-head">
                <h2>Listo para arrancar</h2>
              </div>
              <ul className="rows">
                {p.docs.map((d) => (
                  <li key={d.id} className="rowcard">
                    <Icon name="doc" />
                    <div className="main">
                      <div className="t">{{ oficio: "Oficio a la autoridad", convocatoria: "Mensaje para vecinos", otro: d.titulo }[d.tipo]}</div>
                    </div>
                  </li>
                ))}
                {p.campana && (
                  <li className="rowcard">
                    <Icon name="globe" />
                    <div className="main">
                      <div className="t">Página de firmas</div>
                    </div>
                    <a className="link end" href={`/c/${p.id}`} target="_blank" rel="noreferrer">
                      Abrir
                    </a>
                  </li>
                )}
              </ul>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}
