"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./ui";

export default function JoinForm({ token, taken, projectId }: { token: string; taken: string | null; projectId: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (taken)
    return (
      <p className="lede" style={{ marginTop: 32 }}>
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
    try {
      localStorage.setItem(`llakta:yo:${projectId}`, nombre.trim());
    } catch {}
    router.push(`/p/${projectId}#tareas`);
  }

  return (
    <form onSubmit={join} className="field" style={{ marginTop: 32 }}>
      <label htmlFor="n">Tu nombre</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input id="n" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Como te conocen en el barrio" autoComplete="given-name" required />
        <button className="btn primary" style={{ height: 44 }} disabled={busy}>
          Me sumo <Icon name="arrow" />
        </button>
      </div>
      {error && <p className="error-line">{error}</p>}
    </form>
  );
}
