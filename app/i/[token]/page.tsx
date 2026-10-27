import { notFound } from "next/navigation";
import { findByToken } from "@/lib/store";
import JoinForm from "@/components/JoinForm";
import { Avatar, Mark } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = findByToken(token);
  if (!found) notFound();
  const { project: p, memberId } = found;
  const m = p.members.find((x) => x.id === memberId)!;
  const tareas = p.tasks.filter((t) => t.responsableId === m.id);
  const equipo = p.members.filter((x) => x.nombre);
  return (
    <main className="invite">
      <div className="brand" style={{ padding: 0 }}>
        <Mark /> Llakta
      </div>
      <h1 className="greeting" style={{ marginTop: 40 }}>{p.tituloCorto}</h1>
      <p className="lede">
        {p.duenoNombre} te invita a sumarte como <b>{m.rol}</b>: {m.paraQue.charAt(0).toLowerCase() + m.paraQue.slice(1)}.
      </p>
      <section className="panel" style={{ marginTop: 32 }} aria-labelledby="t-h">
        <div className="panel-head">
          <h2 id="t-h">Lo que te tocaría</h2>
          <span className="chip num">{tareas.length}</span>
        </div>
        <ul className="rows">
          {tareas.map((t) => (
            <li key={t.id} className="rowcard">
              <div className="main">
                <div className="t" style={{ whiteSpace: "normal" }}>{t.titulo}</div>
                <div className="sub">Semana {t.semana}</div>
              </div>
            </li>
          ))}
          {tareas.length === 0 && <li className="empty">Todavía sin tareas: el coordinador te asigna apenas entres.</li>}
        </ul>
      </section>
      <section style={{ marginTop: 24 }} aria-label="Quiénes ya están">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {equipo.map((x) => (
            <Avatar key={x.id} m={x} />
          ))}
          <span className="muted" style={{ fontSize: 13, marginLeft: 6 }}>
            {equipo.map((x) => x.nombre).join(", ")} ya están
          </span>
        </div>
      </section>
      <JoinForm token={token} taken={m.nombre} projectId={p.id} />
    </main>
  );
}
