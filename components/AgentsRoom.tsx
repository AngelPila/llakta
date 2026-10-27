"use client";

import { useEffect, useState } from "react";
import { FASES } from "@/lib/agents";
import type { AgentRun, AgentState, Project } from "@/lib/types";
import { duracion, elegidaDe } from "@/lib/view";
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

// `actual` fija la fase en curso cuando el equipo espera a la persona (por ejemplo, para elegir la salida).
export function Fases({ agentes, actual = faseActual(agentes), children }: { agentes: AgentRun[]; actual?: number; children: (a: AgentRun) => React.ReactNode }) {
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
        <span className="fill" style={{ width: `${(v / 5) * 100}%`, background: accent ? "var(--accent)" : "var(--score-off, #8cc4bb)" }} />
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
  const eligiendo = p.status === "eligiendo";
  // Hasta que la persona toque otra, queda marcada la recomendada.
  const [tocada, setSel] = useState<string>();
  const sel = tocada ?? p.critica?.elegida_id;
  const [enviando, setEnviando] = useState(false);
  const elegida = eligiendo ? sel : elegidaDe(p)?.id;

  async function elegir() {
    setEnviando(true);
    const res = await fetch(`/api/projects/${p.id}/eleccion`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ solucionId: sel }) });
    if (!res.ok) setEnviando(false);
  }

  async function retry() {
    await fetch(`/api/projects/${p.id}/retry`, { method: "POST" });
  }

  const actualFase = eligiendo ? FASES.findIndex((f) => f.agentes.includes("critico")) : undefined;

  return (
    <section className="rotulo sala" aria-labelledby="sala-h">
      <div className="rotulo-in">
        <div className="rotulo-main">
          <h1 id="sala-h" className="rotulo-title sm">{p.tituloCorto || "Tu problema"}</h1>
          <p className="sala-estado">
            <b className="num pop" key={listos}>
              {listos} de {p.agentes.length}
            </b>{" "}
            agentes listos · <span className="num">{duracion(total)}</span> · {p.proveedor}
            {webSearch ? " con búsqueda web" : ""}
          </p>
          {(p.status === "listo" || eligiendo || p.status === "error") && (
            <div className="sala-actions">
              {p.status === "listo" && (
                <button className="btn primary ready" onClick={onOpen}>
                  Abrir el tablero <Icon name="arrow" />
                </button>
              )}
              {eligiendo && (
                <a className="btn primary ready" href="#salidas">
                  Elige la salida <Icon name="arrow" />
                </a>
              )}
              {p.status === "error" && (
                <>
                  <p className="sala-error">Se detuvo: {p.error}</p>
                  <button className="btn primary" onClick={retry}>
                    Reintentar
                  </button>
                </>
              )}
            </div>
          )}

          <div className="sala-out" aria-labelledby="out-h">
            <h2 id="out-h" className="sr">
              Lo que va saliendo
            </h2>
            {!p.ficha && (
              <div className="hoja">
                <h2 className="hoja-title">Lo que va saliendo</h2>
                <p className="hoja-empty">Los resultados aparecen aquí a medida que cada agente termina.</p>
              </div>
            )}

            {p.ficha && (
              <article className="hoja rise">
                <h2 className="hoja-title">Ficha del problema</h2>
                <p className="statement">{p.ficha.enunciado}</p>
              </article>
            )}

            {p.investigacion && (
              <article className="hoja rise">
                <h2 className="hoja-title">Por qué pasa</h2>
                <ol className="causas">
                  {p.investigacion.causas.map((c, i) => (
                    <li key={i} className="rise" style={{ ["--i" as string]: i }}>
                      <span className="q-n num" aria-hidden="true">{i + 1}</span>
                      {c.causa}
                    </li>
                  ))}
                </ol>
              </article>
            )}

            {p.soluciones && (
              <article className="hoja rise" id="salidas">
                <h2 className="hoja-title">
                  Seis salidas {eligiendo && <span className="hoja-chip">Elige una</span>}
                </h2>
                <table className={`ideas${p.critica && !eligiendo ? " decided" : ""}${eligiendo ? " choosing" : ""}`} key={p.critica ? (eligiendo ? "eligiendo" : "decidida") : "abierta"}>
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
                      const win = s.id === elegida;
                      const recomendada = s.id === p.critica?.elegida_id;
                      return (
                        <tr key={s.id} className={`rise${win ? " win" : ""}`} style={{ ["--i" as string]: i }} onClick={eligiendo ? () => setSel(s.id) : undefined}>
                          <td>
                            <label className="t">
                              {eligiendo && <input type="radio" name="salida" checked={win} onChange={() => setSel(s.id)} />}
                              <span>{s.nombre}</span> {eligiendo ? recomendada && <span className="pill acc">Recomendada</span> : win && <span className="pill acc">Elegida</span>}
                            </label>
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
                {eligiendo && (
                  <div className="hoja-foot">
                    <button className={`btn primary${enviando ? " busy" : ""}`} disabled={!sel || enviando} onClick={elegir}>
                      {enviando ? "Enviando" : "Seguir con esta"} <Icon name="arrow" />
                    </button>
                  </div>
                )}
              </article>
            )}

            {p.plan && (
              <article className="hoja rise">
                <h2 className="hoja-title">El plan</h2>
                <p className="statement">{p.plan.objetivo}</p>
                <dl className="cifras">
                  <div>
                    <dt>Duración</dt>
                    <dd className="num">{p.plan.semanas} semanas</dd>
                  </div>
                  <div>
                    <dt>Tareas</dt>
                    <dd className="num">{p.plan.tareas.length}</dd>
                  </div>
                  <div>
                    <dt>Presupuesto</dt>
                    <dd className="num">${p.plan.presupuesto.reduce((s, x) => s + x.usd, 0).toLocaleString("es")}</dd>
                  </div>
                </dl>
              </article>
            )}

            {(p.docs.length > 0 || p.campana) && (
              <article className="hoja rise">
                <h2 className="hoja-title">Listo para arrancar</h2>
                <ul className="listos">
                  {p.docs.map((d) => (
                    <li key={d.id}>
                      <Icon name="doc" />
                      <span>{{ oficio: "Oficio a la autoridad", convocatoria: "Mensaje para vecinos", otro: d.titulo }[d.tipo]}</span>
                    </li>
                  ))}
                  {p.campana && (
                    <li>
                      <Icon name="globe" />
                      <span>Página de firmas</span>
                      <a href={`/c/${p.publicoId}`} target="_blank" rel="noreferrer">
                        Abrir
                      </a>
                    </li>
                  )}
                </ul>
              </article>
            )}
          </div>
        </div>

        <aside className="rotulo-side" aria-labelledby="ag-h">
          <h2 id="ag-h">El equipo</h2>
          <Fases agentes={p.agentes} actual={actualFase}>
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
        </aside>
      </div>
    </section>
  );
}
