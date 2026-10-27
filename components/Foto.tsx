"use client";

import { useRef, useState } from "react";
import { portada } from "@/lib/fotos";
import type { Project } from "@/lib/types";
import { Icon } from "./ui";

// Reduce la foto a 1600px en el navegador: del teléfono salen fotos de 4-8 MB.
async function reducir(file: File): Promise<{ blob: Blob; w: number; h: number }> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const k = Math.min(1, 1600 / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error("No se pudo leer la foto");
  return { blob, w: c.width, h: c.height };
}

export function SubirFoto({ p, yo, label = "Subir foto del lugar", className = "btn sm ghost" }: { p: Project; yo: string; label?: string; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<"" | "subiendo" | "error">("");

  async function subir(file: File) {
    setEstado("subiendo");
    try {
      const { blob, w, h } = await reducir(file);
      const fd = new FormData();
      fd.append("foto", blob, "foto.jpg");
      fd.append("autor", yo);
      fd.append("w", String(w));
      fd.append("h", String(h));
      const res = await fetch(`/api/projects/${p.id}/fotos`, { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      setEstado("");
    } catch {
      setEstado("error");
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) subir(f);
        }}
      />
      <button type="button" className={`${className}${estado === "subiendo" ? " busy" : ""}`} disabled={estado === "subiendo"} aria-busy={estado === "subiendo"} onClick={() => input.current?.click()}>
        {estado === "subiendo" ? (
          <>
            Subiendo
            <span className="typing" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </>
        ) : (
          <>
            <Icon name="camera" /> {estado === "error" ? "No se subió. Reintentar" : label}
          </>
        )}
      </button>
    </>
  );
}

// La portada del proyecto: sólo la foto que subió el equipo. La pantalla del proyecto la abre
// el plan, no una imagen de archivo de otro barrio, así que sin foto propia no hay portada.
// Cada foto nueva vuelve a montar la imagen y repite la entrada.
export function Portada({ p, yo }: { p: Project; yo: string }) {
  const f = portada(p);
  if (!f?.propia) return null;
  const ultima = p.fotos?.at(-1);
  return (
    <figure className="cover">
      <div className="frame">
        <img key={f.src} src={f.src} alt={f.pie} width={f.w || undefined} height={f.h || undefined} />
      </div>
      <figcaption>
        <span className="who">
          {f.pie}
          {ultima ? ` · ${new Date(ultima.en).toLocaleDateString("es", { day: "numeric", month: "short" })}` : ""}
          {p.fotos!.length > 1 ? ` · ${p.fotos!.length} fotos del lugar` : ""}
        </span>
        <SubirFoto p={p} yo={yo} label="Subir otra" />
      </figcaption>
    </figure>
  );
}

export const tieneFotoPropia = (p: Project) => (p.fotos?.length ?? 0) > 0;
