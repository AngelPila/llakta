import Link from "next/link";
import { listProjects } from "@/lib/store";
import Barra from "@/components/Barra";
import { Icon } from "@/components/ui";
import { portada } from "@/lib/fotos";
import { plural, rolesAbiertos } from "@/lib/view";

export const dynamic = "force-dynamic";

// Lo que la comunidad está moviendo: solo los proyectos que su organizador publicó.
export default function Comunidad() {
  const projects = listProjects().filter((p) => p.publico && p.status === "listo");
  return (
    <div className="home">
      <Barra />
      <section className="rotulo rotulo-corto" aria-labelledby="com-h">
        <div className="rotulo-in">
          <div className="rotulo-main">
            <h1 id="com-h" className="rotulo-title sm">Lo que se está moviendo en la comunidad</h1>
            <p className="rotulo-lede">Proyectos que sus vecinos decidieron mostrar. Entra, firma o toma un lugar libre.</p>
            <Link href="/" className="btn primary rotulo-cta">
              Proponer un problema <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>
      <div className="comunidad">
        {projects.length === 0 ? (
          <p className="lede">Todavía no hay proyectos publicados.</p>
        ) : (
          <ul className="grid cards">
            {projects.map((p) => {
              const f = portada(p);
              const firmas = p.campana?.firmas.length ?? 0;
              const abiertos = rolesAbiertos(p).length;
              return (
                <li key={p.publicoId} className="s4">
                  <Link href={`/comunidad/${p.publicoId}`} className="card">
                    {f && (
                      <span className="frame">
                        <img src={f.src} alt="" loading="lazy" />
                      </span>
                    )}
                    <span className="card-body">
                      <b>{p.tituloCorto || p.problema.slice(0, 60)}</b>
                      {p.ficha?.lugar && <span className="muted">{p.ficha.lugar}</span>}
                      <span className="card-meta">
                        {p.campana && <span className="pill num">{firmas} de {p.campana.metaFirmas} firmas</span>}
                        {abiertos > 0 && <span className="pill acc num">{plural(abiertos, "lugar libre", "lugares libres")}</span>}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
