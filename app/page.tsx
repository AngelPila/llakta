import Link from "next/link";
import { provider } from "@/lib/llm";
import { listProjects } from "@/lib/store";
import { Icon } from "@/components/ui";
import Barra from "@/components/Barra";
import NewProblem from "@/components/NewProblem";
import { fotoRef, portada } from "@/lib/fotos";

export const dynamic = "force-dynamic";

const ESTADO: Record<string, string> = { preguntando: "Preparando preguntas", entrevista: "Esperando respuestas", trabajando: "Agentes trabajando", eligiendo: "Esperando tu elección", listo: "En marcha", error: "Se detuvo" };

export default function Home() {
  // Publicada (LLAKTA_DESTACADOS con ids separados por coma), el inicio muestra solo esos:
  // cada visitante llega a su propio proyecto por su enlace, no ve los de los demás.
  const destacados = (process.env.LLAKTA_DESTACADOS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const projects = destacados.length ? listProjects().filter((p) => destacados.includes(p.id)) : listProjects();
  const prov = provider();
  const hero = fotoRef("home");
  return (
    <div className="home">
      <Barra proyectos={projects.length > 0} />

      {/* El rótulo: la pregunta pintada sobre el verde del páramo, el formulario debajo. */}
      <section className="rotulo" aria-labelledby="home-h">
        <div className="rotulo-in">
          <div className="rotulo-main">
            <h1 id="home-h" className="rotulo-title">¿Qué problema de tu comunidad quieres resolver?</h1>
            <p className="rotulo-lede">Cuéntalo como se lo contarías a un amigo. Nueve agentes lo investigan, lo cuestionan y te devuelven un plan, tu equipo invitado y los documentos para arrancar.</p>
            <NewProblem />
          </div>
          {hero && (
            <figure className="rotulo-photo">
              <div className="frame">
                <img src={hero.src} alt={hero.titulo} width={hero.w} height={hero.h} />
              </div>
              <figcaption>
                {hero.credito}.{" "}
                <a href={hero.fuente} target="_blank" rel="noreferrer">
                  Fuente
                </a>
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      {projects.length > 0 && (
        <section id="proyectos" className="home-projects" aria-labelledby="proy-h">
          <h2 id="proy-h">Tus proyectos</h2>
          <ul className="home-list">
            {projects.slice(0, 8).map((p) => {
              const hechas = p.tasks.filter((t) => t.estado === "hecha").length;
              const f = portada(p);
              return (
                <li key={p.id}>
                  <Link href={`/p/${p.id}`} className="home-item">
                    {f && (
                      <span className="thumb">
                        <img src={f.src} alt="" />
                      </span>
                    )}
                    <span className="main">
                      <span className="t">{p.tituloCorto || p.problema.slice(0, 60)}</span>
                      <span className="sub">
                        {p.status === "listo" ? `${hechas} de ${p.tasks.length} tareas` : ESTADO[p.status]} · {new Date(p.creadoEn).toLocaleDateString("es", { day: "numeric", month: "short" })}
                      </span>
                    </span>
                    {p.status !== "listo" && <span className={`pill${p.status === "error" ? " neg" : ""}`}>{ESTADO[p.status]}</span>}
                    <Icon name="arrow" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="home-foot">
        {prov.label} · {prov.id === "demo" ? "agentes con guion, sin API" : prov.model}
      </footer>
    </div>
  );
}
