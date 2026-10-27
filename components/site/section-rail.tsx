"use client";

import { useEffect, useState } from "react";

// Trilho vertical fixo à direita: um segmento por seção. O segmento da seção
// na tela fica aceso, com o rótulo ao lado. Os ids batem com as seções da página.
const RAIL = [
  { id: "sobre", label: "Sobre" },
  { id: "projetos", label: "Projetos" },
  { id: "galeria", label: "Galeria" },
  { id: "skills", label: "Skills" },
  { id: "contato", label: "Contato" },
];

export default function SectionRail() {
  const [active, setActive] = useState(-1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      let idx = -1;
      RAIL.forEach((s, i) => {
        const r = document.getElementById(s.id)?.getBoundingClientRect();
        if (r && r.top <= mid && r.bottom > mid) idx = i;
      });
      setActive(idx);
      setVisible(window.scrollY > window.innerHeight * 0.6);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <nav
      aria-label="Progresso das seções"
      className="pointer-events-none fixed right-[clamp(10px,1.2vw,22px)] top-[10vh] z-40 flex h-[76vh] flex-col gap-1.5 transition-opacity duration-500 max-md:hidden"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {RAIL.map((s, i) => {
        const on = i === active;
        return (
          <div key={s.id} className="relative flex-1">
            <span
              className="absolute inset-y-0 right-0 w-[2px] rounded-full transition-[background-color,transform] duration-500"
              style={{
                backgroundColor: on ? "var(--ink)" : "var(--faint)",
                transform: on ? "scaleX(1)" : "scaleX(0.5)",
              }}
            />
            {on && visible && (
              <span className="absolute bottom-0 right-3 animate-[rail-in_0.5s_ease-out] whitespace-nowrap text-[13px] font-medium text-ink">
                {s.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
