"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import MenuOverlay from "@/components/site/menu-overlay";
import { person } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Header() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-header-item]", {
          y: -24,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.2,
        });
      });

      // Some ao rolar para baixo, volta ao rolar para cima.
      const hide = gsap.to(root.current, {
        yPercent: -130,
        duration: 0.45,
        ease: "power2.inOut",
        paused: true,
      });
      ScrollTrigger.create({
        start: "top -120",
        end: "max",
        onUpdate: (self) => (self.direction === 1 ? hide.play() : hide.reverse()),
        onLeaveBack: () => hide.reverse(),
      });
    },
    { scope: root },
  );

  return (
    <>
      <header
        ref={root}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between px-gutter pt-[clamp(14px,1.6vw,24px)]"
      >
        <a
          href="#top"
          data-header-item
          data-intro
          className="pointer-events-auto block leading-[0.82] text-ink"
          aria-label={`${person.firstName} ${person.lastName}, voltar ao início`}
        >
          <span className="block font-serif text-[clamp(26px,2.6vw,44px)] uppercase tracking-[-0.03em]">
            {person.firstName}
          </span>
          <span className="block text-[clamp(26px,2.6vw,44px)] font-extrabold uppercase tracking-[-0.04em]">
            {person.lastName}
          </span>
        </a>

        <a
          href="#top"
          data-header-item
          data-intro
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-auto absolute left-1/2 top-[clamp(18px,2vw,30px)] -translate-x-1/2 text-[clamp(22px,2vw,30px)] font-black italic tracking-[-0.08em] text-ink max-md:hidden"
        >
          {person.monogram}
        </a>

        <div className="pointer-events-auto flex items-center gap-3">
          <a
            href="#contato"
            data-header-item
            data-intro
            className="group hidden h-[clamp(44px,3.6vw,62px)] items-center gap-2.5 rounded-[10px] bg-accent px-[clamp(16px,1.6vw,26px)] text-[clamp(15px,1.15vw,19px)] font-bold uppercase tracking-[-0.01em] text-accent-ink transition-[translate] duration-300 hover:-translate-y-0.5 active:translate-y-0 sm:flex"
          >
            <svg viewBox="0 0 20 20" className="size-[1.05em] transition-transform duration-300 group-hover:rotate-45" aria-hidden="true">
              <path d="M10 2v16M2 10h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            Contato
          </a>
          <button
            type="button"
            data-header-item
            data-intro
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open}
            className="group flex size-[clamp(44px,3.6vw,62px)] items-center justify-center rounded-[10px] border-2 border-ink/90 text-ink transition-colors duration-300 hover:bg-ink hover:text-bg"
          >
            <svg viewBox="0 0 28 14" className="w-[46%]" aria-hidden="true">
              <path d="M10 2h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="transition-transform duration-300 group-hover:-translate-x-1" />
              <path d="M2 12h12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="transition-transform duration-300 group-hover:translate-x-1" />
            </svg>
          </button>
        </div>
      </header>
      <MenuOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
