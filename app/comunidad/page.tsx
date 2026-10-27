import Link from "next/link";
import { listProjects } from "@/lib/store";
import { Mark } from "@/components/ui";
import { portada } from "@/lib/fotos";
import { plural, rolesAbiertos } from "@/lib/view";

export const dynamic = "force-dynamic";

// Lo que la comunidad está moviendo: solo los proyectos que su organizador publicó.
export default function Comunidad() {
  const projects = listProjects().filter((p) => p.publico && p.status === "listo");
  return (
    <main className="campaign">
      <header className="campaign-bar">
        <Link href="/" className="brand" style={{ padding: 0, height: "auto", fontSize: 14 }}>
          <Mark size={16} /> Llakta
        </Link>
        <Link href="/" className="link">
          Proponer un problema
        </Link>
      </header>
      <div className="col comunidad">
        <h1 className="greeting">Lo que se está moviendo en la comunidad</h1>
        {projects.length === 0 ? (
          <p className="lede">Todavía no hay proyectos publicados.</p>
        ) : (
          <ul className="grid after-head cards">
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
    </main>
  );
}
