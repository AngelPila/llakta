import Link from "next/link";
import { notFound } from "next/navigation";
import { listProjects } from "@/lib/store";
import { Icon, Mark } from "@/components/ui";
import { portada } from "@/lib/fotos";
import { rolesAbiertos, semanaActual } from "@/lib/view";

export const dynamic = "force-dynamic";

// La vista de quien no organiza: mira el proyecto, firma o toma un lugar libre.
// Sin nombres de personas: solo el barrio, el plan y el avance.
export default async function ProyectoPublico({ params }: { params: Promise<{ id: string }> }) {
  const key = (await params).id;
  const p = listProjects().find((x) => x.publicoId === key);
  if (!p?.publico || p.status !== "listo") notFound();
  const f = portada(p);
  const hechas = p.tasks.filter((t) => t.estado === "hecha").length;
  const semana = semanaActual(p);
  const abiertos = rolesAbiertos(p);
  // Hasta 60 casillas; con metas grandes, cada una vale varias firmas.
  const casillas = Math.min(p.campana?.metaFirmas ?? 0, 60);
  const llenas = p.campana ? Math.round((p.campana.firmas.length / p.campana.metaFirmas) * casillas) : 0;
  return (
    <main className="campaign">
      <header className="campaign-bar">
        <Link href="/comunidad" className="link" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
            <Icon name="arrow" size={14} />
          </span>{" "}
          Comunidad
        </Link>
        <span className="brand" style={{ padding: 0, height: "auto", fontSize: 13 }}>
          <Mark size={16} /> Llakta
        </span>
      </header>
      <div className="col comunidad">
        <h1 className="greeting">{p.tituloCorto}</h1>
        {p.ficha?.lugar && <p className="lede">{p.ficha.lugar}</p>}
        <div className="grid after-head" style={{ alignItems: "start" }}>
          <div className="s7" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {f && (
              <figure className="home-photo">
                <div className="frame">
                  <img src={f.src} alt={f.propia ? f.pie : `Referencia: ${f.pie}`} />
                </div>
                {!f.propia && <figcaption className="photo-credit">Imagen de referencia, no del lugar. {f.credito}.</figcaption>}
              </figure>
            )}
            <section className="panel">
              <p className="statement">{p.ficha?.enunciado ?? p.problema}</p>
            </section>
            {p.plan && (
              <section className="panel" aria-labelledby="plan-h">
                <div className="panel-head">
                  <h2 id="plan-h">El plan</h2>
                </div>
                <p className="statement">{p.plan.objetivo}</p>
                <div className="strip" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                  <div>
                    <span>Semana</span>
                    <b className="num">{semana} de {p.plan.semanas}</b>
                  </div>
                  <div>
                    <span>Tareas hechas</span>
                    <b className="num">{hechas} de {p.tasks.length}</b>
                  </div>
                </div>
                <ol className="rows" style={{ marginTop: 16 }}>
                  {p.plan.hitos.map((h) => (
                    <li key={h.semana + h.hito} className="rowcard" style={{ minHeight: 0 }}>
                      <span className="num muted" style={{ fontSize: 12, width: 56, flex: "none" }}>Semana {h.semana}</span>
                      <div className="main">
                        <div className="t" style={{ whiteSpace: "normal" }}>{h.hito}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
          <div className="s5 room-side">
            {p.campana && (
              <section className="panel" aria-labelledby="firma-h">
                <div className="panel-head">
                  <h2 id="firma-h">Firma</h2>
                  <span className="chip num">{p.campana.firmas.length} de {p.campana.metaFirmas}</span>
                </div>
                <div className="casillas" aria-hidden="true">
                  {Array.from({ length: casillas }, (_, i) => (
                    <i key={i} className={i < llenas ? "on" : undefined} />
                  ))}
                </div>
                <a className="btn primary" href={`/c/${p.publicoId}`} style={{ marginTop: 16, width: "100%" }}>
                  Firmar <Icon name="arrow" />
                </a>
              </section>
            )}
            {abiertos.length > 0 && (
              <section className="panel" aria-labelledby="sumate-h">
                <div className="panel-head">
                  <h2 id="sumate-h">Lugares libres</h2>
                </div>
                <ul className="rows">
                  {abiertos.map((m) => (
                    <li key={m.id}>
                      <Link href={`/i/${m.token}`} className="rowcard">
                        <div className="main">
                          <div className="t">{m.rol}</div>
                          <div className="sub">{m.paraQue}</div>
                        </div>
                        <span className="end link">Sumarme</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
