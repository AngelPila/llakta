import { notFound } from "next/navigation";
import { findByToken } from "@/lib/store";
import JoinForm from "@/components/JoinForm";
import Barra from "@/components/Barra";
import { Avatar } from "@/components/ui";

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
    <div className="home">
      <Barra />
      <section className="rotulo" aria-labelledby="inv-h">
        <div className="rotulo-in invite-in">
          <div className="rotulo-main">
            <h1 id="inv-h" className="rotulo-title sm">{p.tituloCorto}</h1>
            <p className="rotulo-lede">
              {p.duenoNombre} te invita a sumarte como <b>{m.rol}</b>: {m.paraQue.charAt(0).toLowerCase() + m.paraQue.slice(1)}.
            </p>
            <div className="hoja">
              <h2 className="hoja-title">Lo que te tocaría</h2>
              <ul className="listos">
                {tareas.map((t) => (
                  <li key={t.id}>
                    <span className="q-n num" aria-hidden="true">{t.semana}</span>
                    <span>
                      {t.titulo}
                      <small className="invite-sem">Semana {t.semana}</small>
                    </span>
                  </li>
                ))}
                {tareas.length === 0 && <li className="hoja-empty">Todavía sin tareas: el coordinador te asigna apenas entres.</li>}
              </ul>
              {equipo.length > 0 && (
                <div className="invite-equipo" aria-label="Quiénes ya están">
                  {equipo.map((x) => (
                    <Avatar key={x.id} m={x} />
                  ))}
                  <span>{equipo.map((x) => x.nombre).join(", ")} ya están</span>
                </div>
              )}
              <JoinForm token={token} taken={m.nombre} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
