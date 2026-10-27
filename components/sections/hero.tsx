"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import TopoLines from "@/components/site/topo-lines";
import LiquidTrail from "@/components/site/liquid-trail";
import { person } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PORTRAIT = "/images/retrato.png";

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const portraitBox = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        // As linhas partem de stroke-dashoffset: 1 (CSS, ver [data-draw]).
        tl.to("[data-topo-line]", { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut", stagger: 0.035 }, 0)
          .from("[data-hero-portrait]", { yPercent: 9, scale: 1.06, autoAlpha: 0, duration: 1.6 }, 0.15)
          .from("[data-hero-rise]", { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.3)
          .to("[data-hero-card-line]", { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, 0.7);

        // Parallax do mouse em camadas: retrato pouco, linhas no sentido oposto.
        const px = gsap.quickTo("[data-hero-parallax]", "x", { duration: 1.1, ease: "power3.out" });
        const py = gsap.quickTo("[data-hero-parallax]", "y", { duration: 1.1, ease: "power3.out" });
        const lx = gsap.quickTo("[data-hero-topo]", "x", { duration: 1.6, ease: "power3.out" });
        const ly = gsap.quickTo("[data-hero-topo]", "y", { duration: 1.6, ease: "power3.out" });
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          px(nx * 18);
          py(ny * 10);
          lx(nx * -36);
          ly(ny * -24);
        };
        window.addEventListener("pointermove", onMove);

        // Saída: o retrato cresce um pouco e escurece enquanto a página sobe.
        gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        })
          .to("[data-hero-scroll]", { scale: 1.08, yPercent: 6, ease: "none" }, 0)
          .to("[data-hero-shade]", { opacity: 0.75, ease: "none" }, 0)
          .to("[data-hero-topo]", { yPercent: -10, ease: "none" }, 0);

        return () => window.removeEventListener("pointermove", onMove);
      });
    },
    { scope: root },
  );

  return (
    <section
      id="top"
      ref={root}
      className="relative h-svh min-h-140 overflow-clip bg-bg"
      aria-labelledby="hero-title"
    >
      <div data-hero-topo className="absolute inset-[-4%]">
        <TopoLines className="size-full" />
      </div>

      <LiquidTrail
        areaRef={root}
        targetRef={portraitBox}
        src={PORTRAIT}
        ghostClassName="z-1"
        revealClassName="z-3"
      />

      <div data-hero-parallax className="pointer-events-none absolute inset-x-0 bottom-0 z-2 flex justify-center">
        <div data-hero-scroll className="origin-bottom">
          <div
            ref={portraitBox}
            data-hero-portrait
            data-intro
            className="relative aspect-3/2 h-[clamp(420px,92svh,1100px)]"
          >
            <Image
              src={PORTRAIT}
              alt={`Retrato de ${person.firstName} ${person.lastName}`}
              fill
              priority
              sizes="(max-width: 768px) 260vw, 140vh"
              className="object-contain object-bottom select-none"
              draggable={false}
            />
          </div>
        </div>
      </div>

      <div data-hero-shade className="pointer-events-none absolute inset-0 z-4 bg-bg opacity-0" />

      {/* Card de status, no lugar do "Next race" da referência */}
      <aside
        data-hero-rise
        data-intro
        className="absolute bottom-[clamp(16px,2vw,28px)] left-gutter z-5 w-[clamp(104px,7.6vw,132px)] max-sm:hidden"
        aria-label="Status"
      >
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.02em] text-ink/80">Agora</p>
        <div
          className="relative flex flex-col items-center gap-3 border border-ink/40 px-2 pb-3 pt-5 text-center"
          style={{ clipPath: "polygon(0 0, 52% 0, 66% 10px, 100% 10px, 100% 100%, 0 100%)" }}
        >
          <svg viewBox="0 0 80 40" className="w-[72%] text-ink/80" aria-hidden="true">
            <path
              data-hero-card-line
              data-draw
              pathLength={1}
              d="M4 30 C 14 30, 14 12, 26 12 S 38 26, 48 22 S 58 6, 68 10 L 76 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-[10px] font-semibold uppercase leading-tight text-ink">{person.status}</p>
          <span className="h-px w-full bg-ink/30" />
          <p className="text-[10px] font-semibold uppercase leading-tight text-ink/80">{person.location}</p>
        </div>
      </aside>

      <div className="absolute bottom-[clamp(20px,2.4vw,36px)] right-gutter z-5 text-right max-sm:left-gutter max-sm:text-left">
        <h1 id="hero-title" data-hero-rise data-intro className="text-[clamp(30px,3.4vw,58px)] font-semibold leading-[0.95] tracking-[-0.035em] text-ink">
          <span className="sr-only">
            {person.firstName} {person.lastName},{" "}
          </span>
          Desenvolvedor
          <br />
          Front-end
        </h1>
      </div>
    </section>
  );
}
