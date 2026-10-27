"use client";

import { useEffect, useState } from "react";
import { Icon } from "./ui";

interface Firma {
  nombre: string;
  barrio: string;
}

export default function SignForm({ id, pedido, meta, inicial, ultimas }: { id: string; pedido: string; meta: number; inicial: number; ultimas: Firma[] }) {
  const [firmas, setFirmas] = useState(inicial);
  const [lista, setLista] = useState(ultimas);
  const [nombre, setNombre] = useState("");
  const [barrio, setBarrio] = useState("");
  const [hecho, setHecho] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const t = setInterval(async () => {
      const r = await fetch(`/api/c/${id}`).then((x) => (x.ok ? x.json() : null)).catch(() => null);
      if (r) {
        setFirmas(r.firmas);
        setLista(r.ultimas);
      }
    }, 3000);
    return () => clearInterval(t);
  }, [id]);

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/c/${id}/sign`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nombre, barrio }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "No se pudo registrar tu firma.");
      setFirmas(d.firmas);
      setLista([{ nombre, barrio }, ...lista].slice(0, 5));
      setHecho(true);
    } catch (err) {
      setIntento((n) => n + 1);
      setError(err instanceof TypeError ? "No se pudo registrar tu firma. Revisa la conexión y vuelve a intentarlo." : (err as Error).message);
    }
    setBusy(false);
  }

  const pct = Math.min(100, (firmas / Math.max(1, meta)) * 100);
  return (
    <aside className={`sign${hecho ? " celebrate" : ""}`}>
      <p className="sign-count num">
        <span className="pop" key={firmas} style={{ fontSize: "inherit", color: "inherit" }}>{firmas.toLocaleString("es")}</span> <span>de {meta.toLocaleString("es")} firmas</span>
      </p>
      <div className="sign-track" role="progressbar" aria-valuemin={0} aria-valuemax={meta} aria-valuenow={firmas}>
        <span style={{ width: `${pct}%` }} />
      </div>
      {hecho ? (
        <p className="sign-done rise">
          <Icon name="check" size={16} stroke={2} /> Gracias, {nombre.split(" ")[0]}. Tu firma ya cuenta. Compártelo con tu vecino.
        </p>
      ) : (
        <form onSubmit={sign} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
          <div className="field">
            <label htmlFor="fn">Nombre y apellido</label>
            <input id="fn" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="fb">Barrio o calle</label>
            <input id="fb" className="input" value={barrio} onChange={(e) => setBarrio(e.target.value)} autoComplete="address-level3" />
          </div>
          {error && (
            <p className="error-line" role="alert" key={intento}>
              {error}
            </p>
          )}
          <button className="btn primary" style={{ height: 48, fontSize: 15 }} disabled={busy}>
            {busy ? "Firmando…" : error ? "Reintentar" : pedido}
          </button>
        </form>
      )}
      {lista.length > 0 && (
        <ul className="sign-list">
          {lista.map((f, i) => (
            <li key={`${f.nombre}${i}`}>
              <b>{f.nombre}</b> {f.barrio && <span>· {f.barrio}</span>}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
