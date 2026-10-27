"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./ui";

const EJEMPLOS = [
  { label: "Puente caído", texto: "El puente peatonal del barrio La Floresta se cayó hace seis meses y los niños cruzan por la quebrada para ir a la escuela." },
  { label: "Baños sin agua", texto: "En el colegio Juan Montalvo la mitad de los baños no tiene agua y nadie responde los reclamos." },
  { label: "Cancha abandonada", texto: "La cancha del barrio San Roque está abandonada, sin luz, y de noche se volvió peligrosa." },
];

export default function NewProblem() {
  const router = useRouter();
  const [problema, setProblema] = useState("");
  const [nombre, setNombre] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Cada ejemplo elegido vuelve a montar el campo para que el destello se repita.
  const [flash, setFlash] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ problema, nombre }) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear el proyecto.");
      setBusy(false);
      return;
    }
    try {
      localStorage.setItem(`llakta:yo:${data.id}`, nombre);
    } catch {}
    router.push(`/p/${data.id}`);
  }

  return (
    <form className="panel new-problem" onSubmit={submit}>
      <div className="field grow">
        <label htmlFor="problema">El problema</label>
        <textarea id="problema" key={flash} className={`textarea${flash ? " filled" : ""}`} rows={5} value={problema} onChange={(e) => setProblema(e.target.value)} placeholder="Qué pasa, dónde, a quién le afecta" required />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span className="hint" style={{ alignSelf: "center" }}>Ejemplos:</span>
          {EJEMPLOS.map((ej) => (
            <button key={ej.label} type="button" className="btn sm ghost" onClick={() => {
                setProblema(ej.texto);
                setFlash((n) => n + 1);
              }} title={ej.texto}>
              {ej.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="nombre">Tu nombre</label>
        <input id="nombre" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Así te verá tu equipo" autoComplete="given-name" required />
      </div>
      {error && <p className="error-line">{error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className={`btn primary${busy ? " busy" : ""}`} disabled={busy} aria-busy={busy}>
          {busy ? "Despertando al equipo" : "Armar el plan"}
          {busy ? (
            <span className="typing" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          ) : (
            <Icon name="arrow" />
          )}
        </button>
        <span className="muted" style={{ fontSize: 13 }}>Te hará tres preguntas antes de arrancar.</span>
      </div>
    </form>
  );
}
