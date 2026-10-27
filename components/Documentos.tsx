"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { fecha } from "@/lib/view";
import { Icon } from "./ui";

export default function Documentos({ p }: { p: Project }) {
  const [sel, setSel] = useState(p.docs[0]?.id);
  const [copiado, setCopiado] = useState(false);
  const doc = p.docs.find((d) => d.id === sel) ?? p.docs[0];

  async function copy() {
    if (!doc) return;
    try {
      await navigator.clipboard.writeText(doc.cuerpo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {}
  }

  return (
    <div className="col">
      <h1 className="greeting">Documentos</h1>
      <p className="lede">Lo que escribieron los agentes y el coordinador, listo para copiar, imprimir o enviar.</p>
      <div className="grid after-head" style={{ alignItems: "start" }}>
        <section className="panel s4 doc-list" aria-labelledby="lista-h">
          <div className="panel-head">
            <h2 id="lista-h">Todos</h2>
            <span className="chip num">{p.docs.length + (p.campana ? 1 : 0)}</span>
          </div>
          <ul className="rows">
            {p.docs.map((d) => (
              <li key={d.id}>
                <button className={`rowcard${doc?.id === d.id ? " selected" : ""}`} onClick={() => setSel(d.id)}>
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
            {p.campana && (
              <li>
                <a className="rowcard" href={`/c/${p.publicoId}`} target="_blank" rel="noreferrer">
                  <Icon name="globe" />
                  <div className="main">
                    <div className="t">Página de firmas</div>
                    <div className="sub num">
                      {p.campana.firmas.length} de {p.campana.metaFirmas} firmas
                    </div>
                  </div>
                </a>
              </li>
            )}
          </ul>
        </section>
        {doc && (
          <article className="panel white s8 doc" aria-labelledby="doc-h" key={doc.id}>
            <div className="panel-head">
              <h2 id="doc-h">{doc.titulo}</h2>
              <span className="end">
                <button className="link" onClick={copy}>
                  {copiado ? "Copiado" : "Copiar"}
                </button>
                <button className="link" onClick={() => window.print()}>
                  Imprimir
                </button>
              </span>
            </div>
            <div className="doc-body rise">{doc.cuerpo}</div>
          </article>
        )}
      </div>
    </div>
  );
}
