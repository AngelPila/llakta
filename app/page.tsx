import Link from "next/link";
import { AGENTS } from "@/lib/agents";
import { provider } from "@/lib/llm";
import { listProjects } from "@/lib/store";
import { Icon, Mark } from "@/components/ui";
import NewProblem from "@/components/NewProblem";
import { fotoRef, portada } from "@/lib/fotos";

export const dynamic = "force-dynamic";

const ESTADO: Record<string, string> = { preguntando: "Preparando preguntas", entrevista: "Esperando respuestas", trabajando: "Agentes trabajando", listo: "En marcha", error: "Se detuvo" };

export default function Home() {
  // Publicada (LLAKTA_DESTACADOS con ids separados por coma), el inicio muestra solo esos:
  // cada visitante llega a su propio proyecto por su enlace, no ve los de los demás.
  const destacados = (process.env.LLAKTA_DESTACADOS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const projects = destacados.length ? listProjects().filter((p) => destacados.includes(p.id)) : listProjects();
  const prov = provider();
  const hero = fotoRef("home");
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Mark /> Llakta
        </div>
        <p className="nav-label">Proyectos</p>
        <nav className="nav">
          <Link href="/" aria-current="page">
            <Icon name="plus" /> Nuevo problema
          </Link>
          {projects.slice(0, 8).map((p) => (
            <Link key={p.id} href={`/p/${p.id}`}>
              <Icon name="home" /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.tituloCorto || "Sin título"}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div>
            <div>{prov.label}</div>
            <div className="meta">{prov.id === "demo" ? "Agentes con guion, sin API" : prov.model}</div>
          </div>
        </div>
      </aside>
      <header className="topbar">
        <Mark /> <span className="name">Llakta</span>
      </header>
      <main className="canvas">
        <div className="col">
          <h1 className="greeting">¿Qué problema de tu comunidad quieres resolver?</h1>
          <p className="lede">Cuéntalo como se lo contarías a un amigo. Un equipo de nueve agentes lo investiga, lo cuestiona y te devuelve un plan, un tablero, tu equipo invitado y los documentos para arrancar.</p>
          <div className="grid after-head home-row">
            <section className="s7 home-form">
              <NewProblem />
            </section>
            <div className="s5" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {hero && (
                <figure className="home-photo">
                  <div className="frame">
                    <img src={hero.src} alt={hero.titulo} width={hero.w} height={hero.h} />
                  </div>
                  <figcaption className="photo-credit">
                    {hero.credito}.{" "}
                    <a href={hero.fuente} target="_blank" rel="noreferrer">
                      Fuente
                    </a>
                  </figcaption>
                </figure>
              )}
              {projects.length > 0 && (
                <section className="panel" aria-labelledby="proy-h">
                  <div className="panel-head">
                    <h2 id="proy-h">Tus proyectos</h2>
                    <span className="chip num">{projects.length}</span>
                  </div>
                  <div className="rows">
                    {projects.slice(0, 4).map((p) => {
                      const hechas = p.tasks.filter((t) => t.estado === "hecha").length;
                      const f = portada(p);
                      return (
                        <Link key={p.id} href={`/p/${p.id}`} className="rowcard">
                          {f && (
                            <span className="thumb">
                              <img src={f.src} alt="" />
                            </span>
                          )}
                          <div className="main">
                            <div className="t">{p.tituloCorto || p.problema.slice(0, 60)}</div>
                            <div className="sub">
                              {p.status === "listo" ? `${hechas} de ${p.tasks.length} tareas` : ESTADO[p.status]} · {new Date(p.creadoEn).toLocaleDateString("es", { day: "numeric", month: "short" })}
                            </div>
                          </div>
                          {p.status !== "listo" && <span className={`pill${p.status === "error" ? " neg" : ""}`}>{ESTADO[p.status]}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
            <section className="panel s12" aria-labelledby="agentes-h">
              <div className="panel-head">
                <h2 id="agentes-h">Quién va a trabajar</h2>
                <span className="chip">{AGENTS.length} agentes, en este orden</span>
              </div>
              <ol className="agent-list cols">
                {AGENTS.map((a, i) => (
                  <li key={a.key} className="rise" style={{ ["--i" as string]: i }}>
                    <b>{a.nombre}</b> <span>{a.rol.charAt(0).toLowerCase() + a.rol.slice(1)}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
