"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { avanceSemana, elegidaDe, fecha, inicioSemana, memberById, nombreDe, plural, porQueDe, proximaTarea, recien, semanaActual } from "@/lib/view";
import { Score } from "./AgentsRoom";
import type { View } from "./ProjectApp";
import { Avatar, Icon } from "./ui";
import { Portada, SubirFoto, tieneFotoPropia } from "./Foto";
import { useFlip } from "./useFlip";

const ESTADO_LABEL = { pendiente: "Pendiente", en_curso: "En curso", hecha: "Hecha" } as const;

// El camino: personas por rol a la izquierda, semanas a lo ancho, cada tarea
// en su semana. La línea de hoy en el acento.
// Cuántas semanas caben a lo ancho: todas en escritorio, 3 en tablet, 2 en el teléfono.
function useVisibleWeeks(total: number): number {
  const [n, setN] = useState(total);
  useEffect(() => {
    const read = () => setN(window.innerWidth < 600 ? Math.min(2, total) : window.innerWidth < 1100 ? Math.min(3, total) : total);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, [total]);
  return n;
}

export function Camino({ p, compact }: { p: Project; compact?: boolean }) {
  const total = p.plan?.semanas ?? Math.max(1, ...p.tasks.map((t) => t.semana));
  const actual = semanaActual(p);
  const visibles = useVisibleWeeks(total);
  const [desde, setDesde] = useState(() => Math.max(1, Math.min(actual, total - visibles + 1)));
  const primera = Math.max(1, Math.min(desde, total - visibles + 1));
  const semanasVisibles = Array.from({ length: visibles }, (_, i) => primera + i);
  const semanas = visibles;
  const posHoy = actual - primera + avanceSemana(p);
  const hoyPct = posHoy >= 0 && posHoy <= visibles ? (posHoy / visibles) * 100 : null;
  const cols = `repeat(${semanas}, minmax(0, 1fr))`;
  const flip = useFlip<HTMLDivElement>(p.tasks.map((t) => `${t.id}:${t.responsableId}:${t.semana}:${t.estado}`).join("|"));
  return (
    <div className="camino" style={{ ["--weeks" as string]: semanas }}>
      <div className="camino-head">
        <span />
        <div className="weeks" style={{ gridTemplateColumns: cols }}>
          {semanasVisibles.map((n) => (
            <div key={n} className={n === actual ? "now" : ""}>
              <b>Semana {n}</b>
              <span>{fecha(inicioSemana(p, n))}</span>
              {p.plan?.hitos.find((h) => h.semana === n) && <i className="hito">{p.plan!.hitos.find((h) => h.semana === n)!.hito}</i>}
            </div>
          ))}
        </div>
      </div>
      <div className="camino-body" ref={flip}>
        {hoyPct !== null && <div className="today" style={{ left: `calc(var(--lane) + (100% - var(--lane)) * ${hoyPct / 100})` }} aria-hidden="true" />}
        {p.members.map((m) => {
          const tareas = p.tasks.filter((t) => t.responsableId === m.id);
          return (
            <div key={m.id} className={`lane${m.nombre ? "" : " libre"}`} style={{ ["--h" as string]: m.hue }}>
              <div className="who">
                <Avatar m={m} />
                <div style={{ minWidth: 0 }}>
                  <div className="n">{m.nombre ?? "Por sumar"}</div>
                  <div className="r">{m.disponible ? m.rol : `${m.rol} · no puede`}</div>
                </div>
              </div>
              <div className="cells" style={{ gridTemplateColumns: cols }}>
                {tareas.length === 0 && (
                  <p className="lane-empty" style={{ gridColumn: "1 / -1" }}>
                    {m.nombre ? "Sin tareas asignadas" : "El lugar está libre: nadie se ha sumado todavía"}
                  </p>
                )}
                {tareas.length > 0 && semanasVisibles.map((n) => (
                  <div key={n} className="cell">
                    {tareas
                      .filter((t) => t.semana === n)
                      .slice(0, compact ? 2 : 6)
                      .map((t) => (
                        <span key={t.id + (recien(t) ? t.cambio : "")} data-flip={t.id} className={`bar ${t.estado}${recien(t) ? " changed" : ""}`} title={`${t.titulo} · ${ESTADO_LABEL[t.estado]}`}>
                          {t.estado === "hecha" && <Icon name="check" size={11} stroke={2} />}
                          <span>{t.titulo}</span>
                        </span>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="camino-key">
        {visibles < total && (
          <span className="camino-nav">
            <button className="btn sm ghost" aria-label="Semanas anteriores" disabled={primera <= 1} onClick={() => setDesde(primera - 1)}>
              ‹
            </button>
            <button className="btn sm ghost" aria-label="Semanas siguientes" disabled={primera + visibles > total} onClick={() => setDesde(primera + 1)}>
              ›
            </button>
          </span>
        )}
        <span>
          <i className="bar pendiente" /> Pendiente
        </span>
        <span>
          <i className="bar en_curso" /> En curso
        </span>
        <span>
          <i className="bar hecha" /> Hecha
        </span>
        <span>
          <i className="key-today" /> Hoy
        </span>
      </div>
    </div>
  );
}

// Una casilla por firma de la meta; con metas grandes cada casilla vale varias firmas.
function Casillas({ firmas, meta }: { firmas: number; meta: number }) {
  const por = Math.max(1, Math.ceil(meta / 300));
  const total = Math.ceil(meta / por);
  const llenas = Math.min(total, Math.floor(firmas / por));
  return (
    <div className="casillas" role="img" aria-label={`${firmas} de ${meta} firmas`}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < llenas ? "on" : ""} style={i < llenas ? { ["--i" as string]: i } : undefined} />
      ))}
    </div>
  );
}

export default function Resumen({ p, go, yo }: { p: Project; go: (v: View) => void; yo: string }) {
  const actual = semanaActual(p);
  const conPersona = p.members.filter((m) => m.nombre).length;
  const abiertos = p.members.length - conPersona;
  const firmas = p.campana?.firmas.length ?? 0;
  const meta = p.campana?.metaFirmas ?? 0;
  const ultima = firmas ? p.campana!.firmas[firmas - 1] : undefined;
  const estaSemana = p.tasks
    .filter((t) => t.semana === actual || (t.semana < actual && t.estado !== "hecha"))
    .sort((a, b) => Number(a.estado === "hecha") - Number(b.estado === "hecha"));
  const hechasSemana = estaSemana.filter((t) => t.estado === "hecha").length;
  const sinQuien = (t: Project["tasks"][number]) => {
    const m = memberById(p, t.responsableId);
    return t.estado !== "hecha" && (!m?.nombre || !m.disponible);
  };
  const huerfanas = estaSemana.filter(sinQuien).length;
  const hitoFirmas = p.plan?.hitos.find((h) => /oficio|entreg/i.test(h.hito));
  const elegida = elegidaDe(p);
  const ev = p.critica?.evaluaciones.find((e) => e.id === elegida?.id);

  // El hallazgo de la semana: lo que más necesita atención, dicho bajo el título.
  const hallazgo = huerfanas
    ? `${plural(huerfanas, "tarea", "tareas")} de esta semana ${huerfanas === 1 ? "todavía no tiene" : "todavía no tienen"} quién la${huerfanas === 1 ? "" : "s"} haga`
    : abiertos
      ? `Faltan ${plural(abiertos, "persona", "personas")} por sumarse`
      : "El equipo está completo";

  return (
    <div className="col">
      <Portada p={p} yo={yo} />
      <div className="title-row">
        <div style={{ minWidth: 0 }}>
          <h1 className="greeting">{p.tituloCorto}</h1>
          <p className="lede">
            Semana <span className="num">{actual}</span> de {p.plan?.semanas} <span aria-hidden="true">·</span>{" "}
            <b className={huerfanas ? "finding" : ""}>{hallazgo}</b>
          </p>
        </div>
        <div className="actions">
          {!tieneFotoPropia(p) && <SubirFoto p={p} yo={yo} label="Subir foto" className="btn ghost" />}
          <button className="btn primary" onClick={() => go("equipo")}>
            <Icon name="team" /> Invitar vecinos
          </button>
        </div>
      </div>

      <div className="lead-row">
        <section className="panel semana" aria-labelledby="semana-h">
          <div className="panel-head">
            <h2 id="semana-h">Esta semana</h2>
            <span className="chip">
              {fecha(inicioSemana(p, actual))} – {fecha(new Date(inicioSemana(p, actual).getTime() + 6 * 864e5))}
            </span>
            <span className="end num">
              {hechasSemana} de {estaSemana.length} hechas
            </span>
          </div>
          <ul className="week-list">
            {estaSemana.slice(0, 6).map((t) => {
              const m = memberById(p, t.responsableId);
              const libre = sinQuien(t);
              const hecha = t.estado === "hecha";
              const atrasada = !hecha && t.semana < actual;
              return (
                <li key={t.id + (recien(t) ? t.cambio : "")} className={`week-row${libre ? " libre" : ""}${hecha ? " hecha" : ""}${recien(t) ? " changed" : ""}`} style={{ ["--h" as string]: m?.hue ?? 170 }}>
                  {libre ? (
                    <span className="avatar open lg" aria-hidden="true">
                      {t.rol.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <Avatar m={m} lg />
                  )}
                  <div className="main">
                    <div className="t">{t.titulo}</div>
                    <div className="sub">
                      <span className="role">{t.rol}</span>
                      <span>{libre ? (m?.nombre ? `${m.nombre} no puede` : "Nadie todavía") : nombreDe(m)}</span>
                      {atrasada && <span className="late">atrasada desde la semana {t.semana}</span>}
                    </div>
                  </div>
                  {libre ? (
                    <button className="btn sm primary" onClick={() => go("equipo")}>
                      <Icon name="team" size={14} /> Buscar a alguien
                    </button>
                  ) : (
                    <span className={`pill${hecha ? " pos" : t.estado === "en_curso" ? " acc" : " quiet"}`}>
                      {hecha && <Icon name="check" size={12} stroke={2} />}
                      {ESTADO_LABEL[t.estado]}
                    </span>
                  )}
                </li>
              );
            })}
            {estaSemana.length === 0 && <li className="empty">No hay tareas para esta semana.</li>}
          </ul>
        </section>

        {p.campana && (
          <section className="firmas" aria-labelledby="firmas-h">
            <h2 id="firmas-h">Firmas del barrio</h2>
            <p className="firmas-count num">
              <span className="pop" key={firmas}>{firmas}</span> <small>de {meta}</small>
            </p>
            <Casillas firmas={firmas} meta={meta} />
            <p className="firmas-cap">
              Una casilla por vecino.{hitoFirmas ? ` Con ${meta} firmas: ${hitoFirmas.hito.charAt(0).toLowerCase() + hitoFirmas.hito.slice(1)} en la semana ${hitoFirmas.semana}.` : ""}
            </p>
            <div className="firmas-foot">
              {ultima ? (
                <span>
                  Última: <b>{ultima.nombre}</b>
                  {ultima.barrio ? `, ${ultima.barrio}` : ""}
                </span>
              ) : (
                <span>Todavía nadie firmó</span>
              )}
              <a href={`/c/${p.publicoId}`} target="_blank" rel="noreferrer">
                Abrir página
              </a>
            </div>
          </section>
        )}
      </div>

      <section className="panel camino-panel" aria-labelledby="camino-h">
        <div className="panel-head">
          <h2 id="camino-h">El camino</h2>
          <span className="chip">
            {p.plan?.semanas} semanas · {p.tasks.length} tareas · {plural(p.tasks.filter((t) => t.estado === "hecha").length, "hecha", "hechas")}
          </span>
          <span className="end">
            <button className="link" onClick={() => go("tareas")}>
              Ver tareas
            </button>
          </span>
        </div>
        <Camino p={p} compact />
      </section>

      <div className="pair-row">
        {elegida && (
          <section className="panel" aria-labelledby="sol-h">
            <div className="panel-head">
              <h2 id="sol-h">La solución elegida</h2>
              <span className="end">
                <button className="link" onClick={() => go("investigacion")}>
                  Ver las seis
                </button>
              </span>
            </div>
            <p className="statement">{elegida.nombre}</p>
            {porQueDe(p) && (
              <p className="note-line" style={{ marginTop: 6 }}>
                {porQueDe(p)}
              </p>
            )}
            {ev && (
              <div className="scores">
                <span>
                  Impacto <Score n={ev.impacto} accent />
                </span>
                <span>
                  Barata <Score n={ev.costo} accent />
                </span>
                <span>
                  Factible <Score n={ev.factibilidad} accent />
                </span>
              </div>
            )}
          </section>
        )}
        <section className="panel" aria-labelledby="docs-h">
          <div className="panel-head">
            <h2 id="docs-h">Documentos</h2>
            <span className="chip num">{p.docs.length}</span>
            <span className="end">
              <button className="link" onClick={() => go("documentos")}>
                Ver todos
              </button>
            </span>
          </div>
          <ul className="rows">
            {p.docs.slice(-3).map((d) => (
              <li key={d.id}>
                <button className="rowcard" onClick={() => go("documentos")}>
                  <Icon name="doc" />
                  <div className="main">
                    <div className="t">{d.titulo}</div>
                    <div className="sub">
                      {d.autor} · {fecha(d.creadoEn)}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
