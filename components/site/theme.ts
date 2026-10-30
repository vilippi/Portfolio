import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { waterFrames } from "@/lib/water";

export type Theme = "dark" | "light";

// O tema mora no <html> (data-theme), posto pelo script do <head> antes da
// primeira pintura. Sem atributo, é o escuro. Aqui ele é lido e trocado, e
// quem desenha com JS (o canvas do rodapé, o Switch) é avisado.
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
export const getTheme = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
const getThemeOnServer = (): Theme => "dark";

export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme, getThemeOnServer);
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Sem armazenamento (aba privada, bloqueio): vale só para esta visita.
  }
  listeners.forEach((fn) => fn());
}

const WATER_MS = 1200;

// Troca o tema. Com movimento, a tela nova se espalha a partir de `from` (o
// centro do Switch) como uma mancha d'água, por cima de uma foto da antiga.
export function toggleTheme(from: { x: number; y: number }) {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("startViewTransition" in document)) {
    apply(next);
    return;
  }
  // flushSync: o React já desenha o tema novo antes de a tela nova ser capturada.
  const transition = document.startViewTransition(() => flushSync(() => apply(next)));
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: waterFrames(from.x, from.y, window.innerWidth, window.innerHeight) },
        { duration: WATER_MS, easing: "linear", pseudoElement: "::view-transition-new(root)" },
      );
    })
    // Outra troca antes do fim pula esta: a nova assume.
    .catch(() => {});
}
