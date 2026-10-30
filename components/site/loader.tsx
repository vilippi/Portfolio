"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { revealSite } from "@/components/site/intro";
import { setScrollLocked } from "@/components/site/smooth-scroll";
import { person } from "@/lib/content";
import { RIBBON_STROKE, scalePath } from "@/lib/ribbon";

gsap.registerPlugin(useGSAP);

// A onda que atravessa a tela, num quadro 1000×1000: entra pela esquerda e sai
// pela direita com as duas pontas fora da tela, e passa acima do nome.
const WAVE = "M -140 430 C 60 250, 220 210, 360 340 S 600 640, 760 470 S 950 230, 1140 300";

// O nome ocupa a largura toda: mede no tamanho do CSS e corrige a fonte.
function fitName(name: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(name);
  const width = range.getBoundingClientRect().width;
  const size = parseFloat(getComputedStyle(name).fontSize);
  if (width > 0) name.style.fontSize = `${(size * name.clientWidth) / width}px`;
}

// Loading da abertura, a cada carregamento da página. O nome aparece grande
// embaixo; o risco atravessa a tela da esquerda para a direita e sai; o fundo
// some, o hero começa a entrada dele e o nome voa até o cabeçalho.
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    (_, contextSafe) => {
      const el = root.current;
      if (!el) return;
      // Movimento reduzido: o CSS esconde o loading e o site abre direto.
      if (getComputedStyle(el).display === "none") {
        revealSite();
        return;
      }

      let alive = true;
      setScrollLocked(true);

      const play = contextSafe!(() => {
        const svg = el.querySelector("svg")!;
        const path = el.querySelector("path")!;
        const bg = el.querySelector<HTMLElement>("[data-loader-bg]")!;
        const name = el.querySelector<HTMLElement>("[data-loader-name]")!;
        const words = gsap.utils.toArray<HTMLElement>("[data-loader-word]", el);
        const header = document.querySelector<HTMLElement>("[data-header-name]");
        const targets = header ? Array.from(header.children) : [];
        // O nome do cabeçalho só aparece no pouso. Pela opacidade, porque a rede
        // de segurança do CSS (intro-fallback) só mexe na visibilidade.
        if (header) header.style.opacity = "0";

        // Em tela alta (celular) a onda não estica com a altura: mantém a
        // proporção e fica um pouco acima do meio.
        const w = window.innerWidth;
        const h = window.innerHeight;
        const sx = w / 1000;
        const sy = Math.min(h / 1000, sx * 0.9);
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        path.setAttribute("d", scalePath(WAVE, sx, sy));
        path.setAttribute("transform", `translate(0 ${(h - 1000 * sy) * 0.43})`);
        const total = path.getTotalLength();
        gsap.set(path, { strokeDasharray: `${total} ${total}`, strokeDashoffset: total });
        fitName(name);

        // No pouso o nome do cabeçalho aparece no mesmo lugar. Estilo direto, e
        // não gsap.set: o contexto do loading é revertido quando ele sai do DOM.
        const land = () => {
          if (header) {
            header.style.visibility = "visible";
            header.style.opacity = "1";
          }
          setScrollLocked(false);
          setDone(true);
        };

        const tl = gsap
          .timeline()
          .to(name, { autoAlpha: 1, duration: 0.4, ease: "power2.out" })
          .to(path, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" }, 0.3)
          // O risco não para: a cauda corre atrás e ele sai pela direita.
          .to(path, { strokeDashoffset: -total, duration: 0.7, ease: "power2.in" })
          .addLabel("exit", "-=0.55")
          .call(revealSite, undefined, "exit")
          .to(bg, { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, "exit");

        // Cada palavra voa até a sua linha no cabeçalho, encolhendo até o
        // tamanho de lá. As medidas são lidas na hora da saída.
        words.forEach((word, i) => {
          const target = targets[i];
          if (!target) return;
          const box = () => [word.getBoundingClientRect(), target.getBoundingClientRect()] as const;
          tl.to(
            word,
            {
              x: () => box()[1].left - box()[0].left,
              y: () => box()[1].top - box()[0].top,
              scale: () => parseFloat(getComputedStyle(target).fontSize) / parseFloat(getComputedStyle(word).fontSize),
              duration: 1.05,
              ease: "expo.inOut",
            },
            `exit+=${i * 0.06}`,
          );
        });
        tl.call(land);
      });

      // Espera as fontes, para o nome não aparecer em outra e trocar na frente da pessoa.
      document.fonts.ready.then(() => alive && play());
      return () => {
        alive = false;
        setScrollLocked(false);
      };
    },
    { scope: root },
  );

  if (done) return null;
  return (
    <div ref={root} data-loader aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80]">
      <div data-loader-bg className="pointer-events-auto absolute inset-0 bg-bg" />
      <svg className="absolute inset-0 size-full overflow-visible">
        <path fill="none" stroke="var(--accent)" strokeLinecap="round" className={RIBBON_STROKE} />
      </svg>
      <p
        data-loader-name
        className="invisible absolute inset-x-gutter bottom-gutter flex items-end gap-[0.2em] whitespace-nowrap text-[17vw] text-ink opacity-0"
      >
        <span data-loader-word className="inline-block origin-top-left font-serif uppercase leading-[0.82] tracking-[-0.03em]">
          {person.firstName}
        </span>
        <span data-loader-word className="inline-block origin-top-left font-extrabold uppercase leading-[0.82] tracking-[-0.04em]">
          {person.lastName}
        </span>
      </p>
    </div>
  );
}
