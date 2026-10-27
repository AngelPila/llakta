"use client";

import type { Project } from "@/lib/types";
import { elegidaDe, porQueDe } from "@/lib/view";
import { Score } from "./AgentsRoom";

const ESCALA = { rapida: "Rápida", media: "Media", ambiciosa: "Ambiciosa" } as const;

export default function Investigacion({ p }: { p: Project }) {
  const inv = p.investigacion;
  return (
    <div className="col">
      <h1 className="greeting">Investigación</h1>
      <p className="lede">{p.ficha?.enunciado}</p>
      <div className="grid after-head" style={{ alignItems: "start" }}>
        {p.ficha && (
          <section className="panel s12" aria-labelledby="ficha-h">
            <div className="panel-head">
              <h2 id="ficha-h">Ficha del problema</h2>
            </div>
            <dl className="kv">
              <dt>A quién afecta</dt>
              <dd>{p.ficha.afectados}</dd>
              <dt>Dónde</dt>
              <dd className={p.ficha.lugar ? undefined : "muted"}>{p.ficha.lugar || "Sin dato"}</dd>
              <dt>Desde cuándo</dt>
              <dd>{p.ficha.desde}</dd>
              <dt>Qué se intentó</dt>
              <dd>{p.ficha.intentos}</dd>
              <dt>Lo que suponemos</dt>
              <dd>{p.ficha.supuestos.join(" · ")}</dd>
            </dl>
          </section>
        )}
        {inv && (
          <>
            <section className="panel s6" aria-labelledby="causas-h">
              <div className="panel-head">
                <h2 id="causas-h">Causas de raíz</h2>
                <span className="chip num">{inv.causas.length}</span>
              </div>
              <ul className="rows">
                {inv.causas.map((c, i) => (
                  <li key={i} className="rowcard" style={{ alignItems: "flex-start" }}>
                    <div className="main">
                      <div className="t" style={{ whiteSpace: "normal" }}>{c.causa}</div>
                      <div className="sub" style={{ whiteSpace: "normal" }}>{c.evidencia}</div>
                    </div>
                  </li>
                ))}
              </ul>
              {inv.datos.length > 0 && (
                <dl className="kv" style={{ gridTemplateColumns: "1fr" }}>
                  {inv.datos.map((d, i) => (
                    <dd key={i}>
                      {d.dato} <span className="muted">({d.fuente})</span>
                    </dd>
                  ))}
                </dl>
              )}
            </section>
            <section className="panel s6" aria-labelledby="resp-h">
              <div className="panel-head">
                <h2 id="resp-h">Responsables y precedentes</h2>
              </div>
              <ul className="rows">
                {inv.responsables.map((r, i) => (
                  <li key={i} className="rowcard" style={{ alignItems: "flex-start" }}>
                    <div className="main">
                      <div className="t" style={{ whiteSpace: "normal" }}>{r.entidad}</div>
                      <div className="sub" style={{ whiteSpace: "normal" }}>{r.que_le_toca}</div>
                    </div>
                  </li>
                ))}
                {inv.precedentes.map((c, i) => (
                  <li key={`p${i}`} className="rowcard" style={{ alignItems: "flex-start" }}>
                    <div className="main">
                      <div className="t" style={{ whiteSpace: "normal" }}>{c.lugar}</div>
                      <div className="sub" style={{ whiteSpace: "normal" }}>
                        {c.que_hicieron}. {c.resultado}.
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
        {p.soluciones && (
          <section className="panel s12" aria-labelledby="sol-h">
            <div className="panel-head">
              <h2 id="sol-h">Las seis salidas y su crítica</h2>
            </div>
            <table className="ideas">
              <thead>
                <tr>
                  <th>Solución</th>
                  <th>Escala</th>
                  <th className="num">Costo</th>
                  <th className="num">Semanas</th>
                  <th className="num">Impacto</th>
                  <th className="num">Barata</th>
                  <th className="num">Factible</th>
                </tr>
              </thead>
              <tbody>
                {p.soluciones.map((s) => {
                  const ev = p.critica?.evaluaciones.find((e) => e.id === s.id);
                  const win = s.id === elegidaDe(p)?.id;
                  return (
                    <tr key={s.id} className={win ? "win" : ""}>
                      <td>
                        <div className="t">
                          {s.nombre} {win && <span className="pill acc">Elegida</span>}
                        </div>
                        <div className="sub">{s.descripcion}</div>
                        {ev && (
                          <div className="sub">
                            Riesgo: {ev.riesgo} Se opondría: {ev.quien_se_opone}.
                          </div>
                        )}
                      </td>
                      <td>{ESCALA[s.escala]}</td>
                      <td className="num">${s.costo_usd.toLocaleString("es")}</td>
                      <td className="num">{s.semanas}</td>
                      <td className="num">{ev ? <Score n={ev.impacto} accent={win} /> : "—"}</td>
                      <td className="num">{ev ? <Score n={ev.costo} accent={win} /> : "—"}</td>
                      <td className="num">{ev ? <Score n={ev.factibilidad} accent={win} /> : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {porQueDe(p) && <p className="note-line">{porQueDe(p)}</p>}
          </section>
        )}
        {inv && inv.fuentes.length > 0 && (
          <section className="panel s12" aria-labelledby="fuentes-h">
            <div className="panel-head">
              <h2 id="fuentes-h">Fuentes</h2>
              <span className="chip num">{inv.fuentes.length}</span>
            </div>
            <ul className="rows">
              {inv.fuentes.map((f, i) => (
                <li key={i}>
                  <a className="rowcard" href={f.url} target="_blank" rel="noreferrer">
                    <div className="main">
                      <div className="t">{f.titulo}</div>
                      <div className="sub">{f.url}</div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
