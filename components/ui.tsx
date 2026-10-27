import type { Member } from "@/lib/types";

// La marca: una chakana (la cruz escalonada andina) dibujada en el acento.
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M7 1h6v3h3v3h3v6h-3v3h-3v3H7v-3H4v-3H1V7h3V4h3z" style={{ fill: "var(--mark, #1b6e66)" }} />
      <rect x="8" y="8" width="4" height="4" style={{ fill: "var(--mark-hole, #fff)" }} />
    </svg>
  );
}

const paths: Record<string, string> = {
  home: "M2.5 7.5 8 3l5.5 4.5V13a.5.5 0 0 1-.5.5H10v-4H6v4H3a.5.5 0 0 1-.5-.5z",
  board: "M2.5 3h11v10h-11zM6.5 3v10M10 3v10",
  team: "M5.5 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM1.5 13c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5M11 7a1.7 1.7 0 1 0 0-3.4M11.5 9.6c1.7.2 3 1.3 3 3.4",
  doc: "M4 1.5h5.5L12.5 4.5V14.5h-8.5zM9.5 1.5v3h3M6 8h4.5M6 10.5h4.5",
  search: "M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM10.6 10.6 14 14",
  agents: "M8 2v2M8 12v2M2 8h2M12 8h2M3.8 3.8l1.4 1.4M10.8 10.8l1.4 1.4M3.8 12.2l1.4-1.4M10.8 5.2l1.4-1.4M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  plus: "M8 3v10M3 8h10",
  check: "M3 8.5 6.5 12 13 4.5",
  arrow: "M3 8h10M9 4l4 4-4 4",
  menu: "M2.5 4.5h11M2.5 8h11M2.5 11.5h11",
  close: "M4 4l8 8M12 4l-8 8",
  copy: "M5.5 5.5h7v7h-7zM3.5 10.5V3.5h7",
  link: "M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1",
  globe: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM1.5 8h13M8 1.5c1.8 2 2.5 4.2 2.5 6.5S9.8 12.5 8 14.5C6.2 12.5 5.5 10.3 5.5 8S6.2 3.5 8 1.5z",
  send: "M2 8h10M8 4l4 4-4 4",
  spark: "M8 2v3M8 11v3M2 8h3M11 8h3",
  camera: "M2 5.5h2.5l1.2-2h4.6l1.2 2H14v8H2zM8 11.5a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z",
};

export function Icon({ name, size = 16, stroke = 1.5 }: { name: keyof typeof paths | string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? ""} />
    </svg>
  );
}

export function initials(name: string | null): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ m, lg }: { m: Member | undefined; lg?: boolean }) {
  if (!m) return <span className={`avatar open${lg ? " lg" : ""}`}>?</span>;
  if (!m.nombre)
    return (
      <span className={`avatar open${lg ? " lg" : ""}`} style={{ ["--h" as string]: m.hue }} title={`${m.rol}: falta persona`}>
        {m.rol.charAt(0).toUpperCase()}
      </span>
    );
  return (
    <span className={`avatar${lg ? " lg" : ""}${m.disponible ? "" : " away"}`} style={{ ["--h" as string]: m.hue }} title={m.nombre}>
      {initials(m.nombre)}
    </span>
  );
}
