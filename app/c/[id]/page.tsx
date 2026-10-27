import { notFound } from "next/navigation";
import { getProject } from "@/lib/store";
import SignForm from "@/components/SignForm";
import { Mark } from "@/components/ui";
import { portada } from "@/lib/fotos";

export const dynamic = "force-dynamic";

export default async function Campaign({ params }: { params: Promise<{ id: string }> }) {
  const p = getProject((await params).id);
  if (!p?.campana) notFound();
  const c = p.campana;
  const foto = portada(p);
  const delBarrio = (p.fotos ?? []).slice(0, -1).reverse();
  return (
    <main className="campaign">
      <header className="campaign-bar">
        <span>{p.ficha?.lugar || "Campaña vecinal"}</span>
        <span className="brand" style={{ padding: 0, height: "auto", fontSize: 13 }}>
          <Mark size={16} /> Hecha con Llakta
        </span>
      </header>
      <div className="campaign-grid">
        <div>
          <h1 className="campaign-title">{c.titular}</h1>
          <p className="campaign-lede">{c.bajada}</p>
          {foto && (
            <figure className="campaign-photo">
              <div className="frame">
                <img src={foto.src} alt={foto.propia ? foto.pie : `Referencia: ${foto.pie}`} />
              </div>
              <figcaption className="photo-credit">
                {foto.propia ? foto.pie : <>Imagen de archivo de otro barrio, no de {p.ficha?.lugar || "este"}: {foto.credito}. {foto.fuente && <a href={foto.fuente} target="_blank" rel="noreferrer">Fuente</a>}</>}
              </figcaption>
            </figure>
          )}
          <div className="campaign-body">
            {c.cuerpo.split(/\n\s*\n/).map((par, i) => (
              <p key={i}>{par}</p>
            ))}
          </div>
          {delBarrio.length > 0 && (
            <section className="campaign-gallery" aria-labelledby="fotos-h">
              <h2 id="fotos-h">Lo que vemos en el barrio</h2>
              <ul>
                {delBarrio.map((f) => (
                  <li key={f.id}>
                    <img src={`/api/projects/${p.id}/fotos/${f.id}`} alt={f.pie || `Foto de ${f.autor}`} loading="lazy" />
                    <span>{f.pie || `Foto de ${f.autor}`}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="campaign-sign">
            Firma {p.duenoNombre}, en nombre de la coordinación vecinal.
          </p>
        </div>
        <SignForm id={p.id} pedido={c.pedido} meta={c.metaFirmas} inicial={c.firmas.length} ultimas={c.firmas.slice(-5).reverse().map((f) => ({ nombre: f.nombre, barrio: f.barrio }))} />
      </div>
    </main>
  );
}
