"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./ui";

export default function JoinForm({ token, taken }: { token: string; taken: string | null }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (taken)
    return (
      <p className="hoja-empty">
        Este lugar ya lo tomó {taken}. Pídele a quien te invitó otro enlace.
      </p>
    );

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/join/${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nombre }) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setBusy(false);
      return;
    }
    // El id del tablero solo llega al unirse: antes, la invitación no lo muestra.
    try {
      localStorage.setItem(`llakta:yo:${data.projectId}`, nombre.trim());
    } catch {}
    router.push(`/p/${data.projectId}#tareas`);
  }

  return (
    <form onSubmit={join} className="field join">
      <label htmlFor="n">Tu nombre</label>
      <div className="join-row">
        <input id="n" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Como te conocen en el barrio" autoComplete="given-name" required />
        <button className="btn primary" disabled={busy}>
          Me sumo <Icon name="arrow" />
        </button>
      </div>
      {error && <p className="error-line">{error}</p>}
    </form>
  );
}
