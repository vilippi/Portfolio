"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let locked = false;

// Trava o scroll da página (loading, diálogos). Com Lenis, ele para; sem ele
// (movimento reduzido, ou o loading travando antes de o Lenis existir), trava
// pelo overflow do <html>. O estado fica guardado: o Lenis já nasce parado.
function applyLock() {
  const html = document.documentElement;
  if (lenis) {
    html.style.overflow = "";
    if (locked) lenis.stop();
    else lenis.start();
  } else {
    html.style.overflow = locked ? "hidden" : "";
  }
}

export function setScrollLocked(next: boolean) {
  locked = next;
  applyLock();
}

// Lenis dirige o scroll nativo (então position: sticky continua funcionando)
// e o ticker do GSAP dirige o Lenis, para o ScrollTrigger ler o mesmo quadro.
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1 });
    lenis = instance;
    applyLock();
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
      applyLock();
    };
  }, []);

  return <>{children}</>;
}
