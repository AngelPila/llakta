"use client";

import { useState } from "react";
import type { Project, Task, TaskState } from "@/lib/types";
import { fecha, inicioSemana, memberById, nombreDe, plural, recien, semanaActual } from "@/lib/view";
import { Camino } from "./Resumen";
import { Avatar, Icon } from "./ui";
import { SubirFoto } from "./Foto";
import { useFlip } from "./useFlip";

const NEXT: Record<TaskState, { estado: TaskState; action: string }> = {
  pendiente: { estado: "en_curso", action: "Empezar" },
  en_curso: { estado: "hecha", action: "Terminar" },
  hecha: { estado: "pendiente", action: "Reabrir" },
};

export default function Tareas({ p, yo }: { p: Project; yo: string }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const actual = semanaActual(p);
  const flip = useFlip<HTMLDivElement>(p.tasks.map((t) => `${t.id}:${t.estado}:${t.responsableId}`).join("|") + abierta);

  async function patch(t: Task, body: Record<string, string>) {
    await fetch(`/api/projects/${p.id}/tasks/${t.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, autor: yo }) });
  }

  const sinQuien = (t: Task) => {
    const m = memberById(p, t.responsableId);
    return t.estado !== "hecha" && (!m?.nombre || !m.disponible);
  };
  const porSemana = (a: Task, b: Task) => a.semana - b.semana;
  // Lo de ahora es lo que ya empezó o lo que toca (o se atrasó); el resto espera su semana.
  const ahora = p.tasks.filter((t) => t.estado !== "hecha" && (t.estado === "en_curso" || t.semana <= actual)).sort(porSemana);
  const luego = p.tasks.filter((t) => t.estado === "pendiente" && t.semana > actual).sort(porSemana);
  const hechas = p.tasks.filter((t) => t.estado === "hecha").sort(porSemana);
  const semanas = [...new Set(luego.map((t) => t.semana))];
  const huerfanas = p.tasks.filter(sinQuien).length;

  const fila = (t: Task, quieta = false) => {
    const m = memberById(p, t.responsableId);
    const libre = sinQuien(t);
    const open = abierta === t.id;
    const hecha = t.estado === "hecha";
    const atrasada = !hecha && t.semana < actual;
    const sig = NEXT[t.estado];
    return (
      <li key={t.id + (recien(t) ? t.cambio : "")} data-flip={t.id} className={`week-row task-row2${libre ? " libre" : ""}${hecha ? " hecha" : ""}${open ? " open" : ""}${recien(t) ? " changed" : ""}`} style={{ ["--h" as string]: m?.hue ?? 170 }}>
        <button className="task-main" onClick={() => setAbierta(open ? null : t.id)} aria-expanded={open}>
          {libre ? (
            <span className="avatar open lg" aria-hidden="true">
              {t.rol.charAt(0).toUpperCase()}
            </span>
          ) : (
            <Avatar m={m} lg />
          )}
          <span className="main">
            <span className="t">{t.titulo}</span>
            <span className="sub">
              <span className="role">{t.rol}</span>
              <span>{libre ? (m?.nombre ? `${m.nombre} no puede` : "Nadie todavía") : nombreDe(m)}</span>
              {t.estado === "en_curso" && <span className="pill acc">En curso</span>}
              {atrasada && <span className="late">atrasada desde la semana {t.semana}</span>}
            </span>
          </span>
        </button>
        {libre && !quieta ? (
          <a className="btn sm primary" href="#equipo">
            <Icon name="team" size={14} /> Buscar a alguien
          </a>
        ) : (
          <button className={`btn sm ${quieta || hecha ? "ghost" : t.estado === "en_curso" ? "primary" : ""}`} onClick={() => patch(t, { estado: sig.estado })} title={`${sig.action}: ${t.titulo}`}>
            {sig.action}
          </button>
        )}
        {open && (
          <div className="task-more">
            <p>{t.detalle}</p>
            <div className="task-ctl">
              <select className="select" value={t.responsableId ?? ""} onChange={(e) => patch(t, { responsableId: e.target.value })} aria-label="Responsable">
                {p.members.map((x) => (
                  <option key={x.id} value={x.id}>
                    {nombreDe(x)}
                  </option>
                ))}
              </select>
              {/foto/i.test(t.titulo) && <SubirFoto p={p} yo={yo} label="Subir foto" />}
            </div>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="col">
      <div className="title-row">
        <div>
          <h1 className="greeting">Tareas</h1>
          <p className="lede">
            <b className="num">{hechas.length}</b> de {p.tasks.length} hechas · semana {actual} de {p.plan?.semanas}
            {huerfanas ? (
              <>
                {" · "}
                <span className="finding">{plural(huerfanas, "tarea sin persona", "tareas sin persona")}</span>
              </>
            ) : null}
          </p>
        </div>
        <ol className="task-strip" aria-label={`${hechas.length} de ${p.tasks.length} tareas hechas`}>
          {[...p.tasks].sort(porSemana).map((t) => (
            <li key={t.id} className={t.estado} title={`${t.titulo} · semana ${t.semana}`} />
          ))}
        </ol>
      </div>
      <div className="grid after-head" ref={flip}>
        <section className="panel white s12" aria-labelledby="t-ahora">
          <div className="panel-head">
            <h2 id="t-ahora">Ahora</h2>
            <span className="meta">
              Semana {actual} · desde el {fecha(inicioSemana(p, actual))}
            </span>
          </div>
          <ul className="week-list">
            {ahora.map((t) => fila(t))}
            {ahora.length === 0 && <li className="empty">Nada pendiente esta semana. Lo siguiente empieza la semana {actual + 1}.</li>}
          </ul>
        </section>

        {semanas.length > 0 && (
          <section className="panel white s12" aria-labelledby="t-luego">
            <div className="panel-head">
              <h2 id="t-luego">Lo que viene</h2>
              <span className="meta">{plural(luego.length, "tarea", "tareas")}</span>
            </div>
            <div className="weeks-ahead">
              {semanas.map((n) => {
                const hito = p.plan?.hitos.find((h) => h.semana === n);
                return (
                  <div key={n} className="week-block">
                    <h3>
                      Semana {n} <span>{fecha(inicioSemana(p, n))}</span>
                      {hito && <i className="hito">{hito.hito}</i>}
                    </h3>
                    <ul className="week-list">{luego.filter((t) => t.semana === n).map((t) => fila(t, true))}</ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {hechas.length > 0 && (
          <details className="panel white s12 done-fold">
            <summary>
              <h2>Hechas</h2>
              <span className="chip num">{hechas.length}</span>
              <Icon name="arrow" size={16} />
            </summary>
            <ul className="week-list">{hechas.map((t) => fila(t, true))}</ul>
          </details>
        )}

        <section className="panel white s12" aria-labelledby="camino-full">
          <div className="panel-head">
            <h2 id="camino-full">El camino completo</h2>
          </div>
          <Camino p={p} />
        </section>
      </div>
    </div>
  );
}
