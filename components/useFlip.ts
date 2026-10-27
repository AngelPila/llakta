"use client";

import { useLayoutEffect, useRef } from "react";

// FLIP: cuando un elemento con data-flip cambia de lugar entre renders (una tarea
// reasignada a otra persona, una tarjeta que pasa de columna), viaja de su
// posición vieja a la nueva en vez de saltar. Arco con un leve levantamiento a
// mitad de camino (se "toma" la tarea y se deja en su sitio) y sombra que la sigue.
// La duración crece con la distancia: 100px = 320ms, 200px = ×1.3, 400px = ×1.6.

const EASE = "cubic-bezier(0.2, 0, 0, 1)";
// Por debajo de esta distancia es un vecino acomodándose, no una tarea que se mueve.
const SIBLING = 48;

function durationFor(dist: number): number {
  if (dist <= 100) return 320;
  if (dist <= 200) return 320 * (1 + (0.3 * (dist - 100)) / 100);
  return Math.min(560, 416 * (1 + (0.3 * (dist - 200)) / 200));
}

export function useFlip<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null);
  const last = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, DOMRect>();
    let hero = 0;
    root.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      const id = el.dataset.flip!;
      const now = el.getBoundingClientRect();
      next.set(id, now);
      const before = last.current.get(id);
      if (!before || reduce) return;
      const dx = before.left - now.left;
      const dy = before.top - now.top;
      const dist = Math.hypot(dx, dy);
      if (dist < 2) return;
      if (dist < SIBLING) {
        // Capa secundaria: el vecino que solo se acomoda. Corto, sin levantarse.
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 200, easing: "cubic-bezier(0.4, 0, 0.2, 1)", delay: 60 });
        return;
      }
      // Capa principal: lo que de verdad cambió de lugar. Viaja en arco, escalonado 70ms.
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)`, boxShadow: "0 0 0 rgba(20,20,18,0)", zIndex: 5 },
          { offset: 0.45, transform: `translate(${dx * 0.5}px, ${dy * 0.5 - Math.min(14, dist * 0.08)}px) scale(1.03)`, boxShadow: "0 10px 24px rgba(20,20,18,0.14)", zIndex: 5 },
          { transform: "none", boxShadow: "0 0 0 rgba(20,20,18,0)", zIndex: 5 },
        ],
        { duration: durationFor(dist), easing: EASE, delay: Math.min(hero++, 5) * 70, fill: "backwards" },
      );
    });
    last.current = next;
  }, [dep]);

  return ref;
}
