// Moldura da janela do Lippi Chat no desktop: arrastar pela barra de título,
// redimensionar pelas bordas e cantos, ampliar. Tudo em coordenadas da tela.

import type { Rect } from "@/components/chat/genie";

/** Borda ou canto pelo qual a janela é redimensionada. */
export type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export const MIN_W = 600; // a lista (268px) e a conversa ainda cabem lado a lado
export const MIN_H = 420;
const TITLE_H = 44;
const GRIP = 140; // quanto da barra de título fica sempre na tela
const MARGIN = 12;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const viewport = () => ({ vw: window.innerWidth, vh: window.innerHeight });

// A janela pode sair em parte da tela, mas a barra de título continua ao alcance.
export function moveRect(start: Rect, dx: number, dy: number): Rect {
  const { vw, vh } = viewport();
  return {
    ...start,
    x: clamp(start.x + dx, GRIP - start.w, vw - GRIP),
    y: clamp(start.y + dy, 0, vh - TITLE_H),
  };
}

export function resizeRect(start: Rect, edge: Edge, dx: number, dy: number): Rect {
  const { vw, vh } = viewport();
  const right = start.x + start.w;
  const bottom = start.y + start.h;
  let { x, y, w, h } = start;
  if (edge.includes("e")) w = clamp(start.w + dx, MIN_W, Math.max(vw - start.x, start.w));
  if (edge.includes("s")) h = clamp(start.h + dy, MIN_H, Math.max(vh - start.y, start.h));
  if (edge.includes("w")) {
    x = clamp(start.x + dx, Math.min(0, start.x), right - MIN_W);
    w = right - x;
  }
  if (edge.includes("n")) {
    y = clamp(start.y + dy, 0, bottom - MIN_H);
    h = bottom - y;
  }
  return { x, y, w, h };
}

export function maxRect(): Rect {
  const { vw, vh } = viewport();
  return { x: MARGIN, y: MARGIN, w: vw - MARGIN * 2, h: vh - MARGIN * 2 };
}

// Depois que a tela muda de tamanho: cabe nela e com a barra de título visível.
export function fitRect(r: Rect): Rect {
  const { vw, vh } = viewport();
  const w = clamp(r.w, Math.min(MIN_W, vw - MARGIN * 2), vw - MARGIN * 2);
  const h = clamp(r.h, Math.min(MIN_H, vh - MARGIN * 2), vh - MARGIN * 2);
  return { w, h, x: clamp(r.x, 0, vw - w), y: clamp(r.y, 0, vh - h) };
}
