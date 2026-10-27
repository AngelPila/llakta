"use client";

import type { Project } from "@/lib/types";
import { elegidaDe, porQueDe } from "@/lib/view";
import { Score } from "./AgentsRoom";

// Una fila que muestra solo el titular; el detalle se abre al tocarla.
function Pliegue({ t, children }: { t: React.ReactNode; children: React.ReactNode }) {
  return (
    <li>
      <details className="rowcard fold">
        <summary>
          <span className="t">{t}</span>
          <svg className="chev" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </summary>
        <div className="sub">{children}</div>
      </details>
    </li>
  );
}

const dominio = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export default function Investigacion({ p }: { p: Project }) {
  const inv = p.investigacion;
  return (
    <div className="col">
      <h1 className="greeting">Investigación</h1>
      <div className="grid after-head" style={{ alignItems: "start" }}>
        {p.ficha && (
          <section className="panel s12" aria-labelledby="ficha-h">
            <div className="panel-head">
              <h2 id="ficha-h">El problema</h2>
            </div>
            <p className="statement">{p.ficha.enunciado}</p>
            <ul className="rows" style={{ marginTop: 16 }}>
              <Pliegue t="A quién afecta">{p.ficha.afectados}</Pliegue>
              <Pliegue t="Qué se intentó">{p.ficha.intentos}</Pliegue>
              {p.ficha.supuestos.length > 0 && <Pliegue t="Lo que suponemos">{p.ficha.supuestos.join(" · ")}</Pliegue>}
            </ul>
          </section>
        )}
        {inv && (
          <>
            <section className="panel s6" aria-labelledby="causas-h">
              <div className="panel-head">
                <h2 id="causas-h">Por qué pasa</h2>
              </div>
              <ul className="rows">
                {inv.causas.map((c, i) => (
                  <Pliegue key={i} t={c.causa}>
                    {c.evidencia}
                  </Pliegue>
                ))}
                {inv.datos.length > 0 && (
                  <Pliegue t="Datos">
                    {inv.datos.map((d, i) => (
                      <span key={i} style={{ display: "block" }}>
                        {d.dato} ({d.fuente})
                      </span>
                    ))}
                  </Pliegue>
                )}
              </ul>
            </section>
            <section className="panel s6" aria-labelledby="resp-h">
              <div className="panel-head">
                <h2 id="resp-h">A quién pedirle</h2>
              </div>
              <ul className="rows">
                {inv.responsables.map((r, i) => (
                  <Pliegue key={i} t={r.entidad}>
                    {r.que_le_toca}
                  </Pliegue>
                ))}
              </ul>
              {inv.precedentes.length > 0 && (
                <>
                  <div className="panel-head" style={{ marginTop: 20 }}>
                    <h2>Dónde ya funcionó</h2>
                  </div>
                  <ul className="rows">
                    {inv.precedentes.map((c, i) => (
                      <Pliegue key={i} t={c.lugar}>
                        {c.que_hicieron}. {c.resultado}.
                      </Pliegue>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </>
        )}
        {p.soluciones && (
          <section className="panel s12" aria-labelledby="sol-h">
            <div className="panel-head">
              <h2 id="sol-h">Seis salidas</h2>
            </div>
            <table className="ideas">
              <thead>
                <tr>
                  <th>Solución</th>
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
                        <details className="fold">
                          <summary className="t">
                            <span>{s.nombre}</span> {win && <span className="pill acc">Elegida</span>}
                          </summary>
                          <div className="sub">{s.descripcion}</div>
                          {ev && <div className="sub">Riesgo: {ev.riesgo}</div>}
                        </details>
                      </td>
                      <td className="num">
                        <span>${s.costo_usd.toLocaleString("es")}</span>
                      </td>
                      <td className="num">
                        <span>{s.semanas}</span>
                      </td>
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
            </div>
            <ul className="rows">
              {inv.fuentes.map((f, i) => (
                <li key={i}>
                  <a className="rowcard" href={f.url} target="_blank" rel="noreferrer" style={{ minHeight: 0 }}>
                    <div className="main">
                      <div className="t">{f.titulo}</div>
                    </div>
                    <span className="end muted" style={{ fontSize: 12 }}>
                      {dominio(f.url)}
                    </span>
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
