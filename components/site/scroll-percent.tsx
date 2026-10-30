"use client";

import { useEffect, useRef } from "react";

// O "(24)" fixo à esquerda: quanto da página já foi rolado. Fica escondido no hero.
// A cor é clara nos dois temas: com o mix-blend-difference, ela inverte o fundo.
export default function ScrollPercent() {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
      const shown = window.scrollY > window.innerHeight * 0.6;
      el.textContent = shown ? `(${pct})` : "";
      el.style.opacity = shown ? "1" : "0";
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <p
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-[clamp(12px,1.4vw,24px)] top-1/2 z-40 -translate-y-1/2 text-[13px] font-medium tabular-nums text-[#f2f0eb] opacity-0 mix-blend-difference transition-opacity duration-500 max-md:hidden"
    >
    </p>
  );
}
