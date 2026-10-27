import { notFound } from "next/navigation";
import { getPublico } from "@/lib/store";
import SignForm from "@/components/SignForm";
import Barra from "@/components/Barra";
import { portada } from "@/lib/fotos";

export const dynamic = "force-dynamic";

export default async function Campaign({ params }: { params: Promise<{ id: string }> }) {
  const p = getPublico((await params).id);
  if (!p?.campana) notFound();
  const c = p.campana;
  const foto = portada(p);
  const delBarrio = (p.fotos ?? []).slice(0, -1).reverse();
  return (
    <div className="home campaign">
      <Barra />
      {/* El titular pintado en el rótulo y la firma al lado: en el teléfono, firmar queda justo debajo del titular. */}
      <section className="rotulo" aria-labelledby="camp-h">
        <div className="rotulo-in">
          <div className="rotulo-main">
            <h1 id="camp-h" className="rotulo-title">{c.titular}</h1>
            <p className="rotulo-lede">
              {p.ficha?.lugar && <b className="rotulo-lugar">{p.ficha.lugar}. </b>}
              {c.bajada}
            </p>
          </div>
          <SignForm id={p.publicoId} pedido={c.pedido} meta={c.metaFirmas} inicial={c.firmas.length} ultimas={c.firmas.slice(-5).reverse().map((f) => ({ nombre: f.nombre, barrio: f.barrio }))} />
        </div>
      </section>
      <div className="campaign-cuerpo">
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
                  <img src={`/api/projects/${p.publicoId}/fotos/${f.id}`} alt={f.pie || `Foto de ${f.autor}`} loading="lazy" />
                  <span>{f.pie || `Foto de ${f.autor}`}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="campaign-sign">Firma {p.duenoNombre}, en nombre de la coordinación vecinal.</p>
      </div>
    </div>
  );
}
