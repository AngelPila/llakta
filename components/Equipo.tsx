"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { plural } from "@/lib/view";
import { Avatar, Icon } from "./ui";

export default function Equipo({ p }: { p: Project }) {
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);

  const abiertos = p.members.filter((m) => !m.nombre);
  const qrMember = p.members.find((m) => m.id === qr) ?? abiertos[0];
  const link = (token: string) => `${origin}/i/${token}`;
  const convocatoria = p.docs.find((d) => d.tipo === "convocatoria");

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiado(key);
      setTimeout(() => setCopiado(null), 1600);
    } catch {}
  }

  return (
    <div className="col">
      <h1 className="greeting">Vecinos</h1>
      <p className="lede">
        {abiertos.length ? (
          <>
            Hay <b>{plural(abiertos.length, "lugar", "lugares")}</b> esperando gente. Cada enlace lleva a la persona directo a su rol y sus tareas.
          </>
        ) : (
          "Todos los roles tienen persona."
        )}
      </p>
      <div className="grid after-head" style={{ alignItems: "start" }}>
        <section className="panel s8" aria-labelledby="roles-h">
          <div className="panel-head">
            <h2 id="roles-h">Roles</h2>
            <span className="chip num">{p.members.length}</span>
          </div>
          <ul className="rows">
            {p.members.map((m) => {
              const n = p.tasks.filter((t) => t.responsableId === m.id && t.estado !== "hecha").length;
              return (
                <li key={m.id + (m.nombre ?? "")} className={`rowcard member${m.unidoEn && Date.now() - m.unidoEn < 5000 ? " changed" : ""}`}>
                  <Avatar m={m} lg />
                  <div className="main">
                    <div className="t">
                      {m.nombre ?? "Falta una persona"} <span className="muted" style={{ fontWeight: 400 }}>· {m.rol}</span>
                    </div>
                    <div className="sub">
                      {m.disponible ? m.paraQue : `No disponible${m.motivo ? `: ${m.motivo}` : ""}`} · {plural(n, "tarea pendiente", "tareas pendientes")}
                    </div>
                  </div>
                  <div className="end">
                    {m.esDueno && <span className="pill">Tú</span>}
                    {!m.disponible && <span className="pill warn">No disponible</span>}
                    {!m.nombre && (
                      <>
                        <button className="btn sm ghost" onClick={() => copy(link(m.token), m.id)}>
                          <Icon name={copiado === m.id ? "check" : "link"} /> {copiado === m.id ? "Copiado" : "Copiar enlace"}
                        </button>
                        <button className="btn sm" aria-pressed={qrMember?.id === m.id} onClick={() => setQr(m.id)}>
                          QR
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="s4" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {qrMember && origin && (
            <section className="panel white qr-card" aria-labelledby="qr-h" key={qrMember.id}>
              <div className="panel-head">
                <h2 id="qr-h">Súmate como {qrMember.rol}</h2>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/qr?u=${encodeURIComponent(link(qrMember.token))}`} alt={`Código QR para sumarse como ${qrMember.rol}`} width={240} height={240} className="rise" />
              <p className="note-line">Escanéalo con la cámara del celular. Entra sin cuenta: solo escribe tu nombre.</p>
            </section>
          )}
          {convocatoria && (
            <section className="panel" aria-labelledby="conv-h">
              <div className="panel-head">
                <h2 id="conv-h">Mensaje para el grupo del barrio</h2>
                <span className="end">
                  <button className="link" onClick={() => copy(convocatoria.cuerpo, "conv")}>
                    {copiado === "conv" ? "Copiado" : "Copiar"}
                  </button>
                </span>
              </div>
              <p style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: "21px" }}>{convocatoria.cuerpo}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
