"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { about, person } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const PHOTO = "/images/retrato-roxo.png";

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        SplitText.create("[data-about-statement]", {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 105,
              duration: 1.1,
              ease: "power4.out",
              stagger: 0.09,
              scrollTrigger: { trigger: "[data-about-statement]", start: "top 80%", once: true },
            }),
        });

        gsap.from("[data-about-rise]", {
          y: 28,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: "[data-about-copy]", start: "top 85%", once: true },
        });

        // A foto se abre a partir da direita e depois segue o scroll com parallax.
        gsap.fromTo(
          "[data-about-clip]",
          { clipPath: "inset(0% 0% 0% 100%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.4,
            ease: "power4.inOut",
            scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
          },
        );
        gsap.fromTo(
          "[data-about-photo]",
          { scale: 1.22, yPercent: -4 },
          {
            scale: 1,
            yPercent: 4,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
          },
        );

        // O "rastro" da foto (como na referência) acende com a velocidade do scroll.
        const ghost = gsap.quickTo("[data-about-ghost]", "opacity", { duration: 0.5, ease: "power2.out" });
        const ghostX = gsap.quickTo("[data-about-ghost]", "x", { duration: 0.6, ease: "power2.out" });
        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const v = Math.min(1, Math.abs(self.getVelocity()) / 2200);
            ghost(0.25 + v * 0.6);
            ghostX(-30 - v * 70);
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      id="sobre"
      ref={root}
      data-rail="Sobre"
      aria-labelledby="about-title"
      className="relative overflow-clip bg-bg px-gutter pb-[clamp(64px,8vw,140px)] pt-[clamp(28px,3vw,48px)] md:min-h-svh md:pl-[max(var(--gutter),3vw)]"
    >
      <h2 id="about-title" className="sr-only">
        Sobre mim
      </h2>

      {/* Foto: sangra até a borda direita, com os cantos esquerdos bem arredondados */}
      <div className="relative mb-10 aspect-4/5 overflow-clip rounded-[clamp(60px,10vw,190px)_0_0_clamp(50px,8.6vw,160px)] max-md:-mr-gutter md:absolute md:inset-y-0 md:bottom-[4%] md:left-[59%] md:right-0 md:mb-0 md:aspect-auto">
        <div data-about-clip className="absolute inset-0">
          <div data-about-photo className="absolute inset-0">
            <Image
              src={PHOTO}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
              data-about-ghost
              className="scale-105 object-cover opacity-25 blur-[14px]"
            />
            <Image
              src={PHOTO}
              alt={`${person.firstName} de óculos, olhando para cima, sob luz roxa`}
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      <p
        data-about-statement
        className="relative z-1 max-w-[18ch] text-[clamp(34px,3.1vw,56px)] font-medium leading-[1.12] tracking-[-0.025em] text-ink md:max-w-[64%]"
      >
        {about.statement.map((part, i) =>
          part.serif ? (
            <em key={i} className="font-serif text-[1.08em] font-normal tracking-[-0.01em]">
              {part.text}
            </em>
          ) : (
            <span key={i}>{part.text}</span>
          ),
        )}
      </p>

      <div data-about-copy className="relative z-1 mt-[clamp(40px,7vw,120px)] max-w-[30ch] md:ml-[19%] md:max-w-[min(29%,460px)]">
        <p data-about-rise className="text-[clamp(18px,1.35vw,23px)] leading-[1.45] tracking-[-0.01em] text-ink">
          {about.paragraph}
        </p>
        <a
          data-about-rise
          href="#skills"
          className="group mt-10 inline-flex items-center gap-2 text-[15px] font-semibold uppercase text-ink/85 transition-colors hover:text-ink"
        >
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
            {about.linkLabel}
          </span>
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </a>
      </div>
    </section>
  );
}
