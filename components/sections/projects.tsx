"use client";

import { useEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { person, projects } from "@/lib/content";
import { interTight } from "@/lib/fonts";
import type { NotebookScene } from "@/components/three/notebook-scene";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// O risco: um S longo que desce pela lista e sai pela direita no fim.
// Coordenadas num quadro 1000×1000 que cobre a trilha da lista. Sem JS (ou
// com reduced motion) o SVG estica esse quadro; com JS o caminho é
// reescalado para os pixels reais, para o tracejado e a tabela de
// comprimento usarem a mesma medida.
const RIBBON =
  "M -60 18 C 160 14, 400 40, 430 110 C 455 190, 120 230, 90 320 C 60 410, 450 440, 430 530 C 410 610, 70 640, 70 730 C 70 820, 300 880, 430 905 C 560 930, 700 935, 820 915";

function scaleRibbon(sx: number, sy: number) {
  let i = 0;
  return RIBBON.replace(/-?\d+(\.\d+)?/g, (v) => (Number(v) * (i++ % 2 === 0 ? sx : sy)).toFixed(1));
}

// Pin em alturas de tela: a lista anda, depois o notebook fecha e sobe
// enquanto o risco termina de sair pela direita.
const LIST_VH = 0.55 * (projects.length - 1);
const OUTRO_VH = 1.1;
const LIST_SHARE = LIST_VH / (LIST_VH + OUTRO_VH);

export default function Projects() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const outroRef = useRef(0);
  const notebook = useRef<NotebookScene | null>(null);
  const [three, setThree] = useState<"loading" | "ready" | "failed">("loading");

  // O three.js baixa depois da hidratação, num chunk separado; a cena só é
  // criada quando a seção está chegando, para não disputar com o hero. Sem
  // WebGL a pilha de imagens antiga volta como fallback.
  useEffect(() => {
    const section = root.current!;
    const stage = section.querySelector<HTMLElement>("[data-proj-stage]")!;
    const anchor = section.querySelector<HTMLElement>("[data-proj-fit]")!;
    const canvas = canvasRef.current!;
    if (anchor.getClientRects().length === 0) return; // preview escondido (celular com reduced motion)

    let alive = true;
    let created: NotebookScene | null = null;
    const images = projects.map((p) => getImageProps({ src: p.image, alt: "", width: 600, height: 375 }).props.src);
    const mod = import("@/components/three/notebook-scene");
    let stopWatching = () => {};
    const near = new Promise<void>((resolve) => {
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          resolve();
        },
        { rootMargin: "150% 0px" },
      );
      io.observe(section);
      stopWatching = () => io.disconnect();
    });
    Promise.all([mod, near])
      .then(([{ createNotebookScene }]) =>
        createNotebookScene({
          canvas,
          stage,
          anchor,
          images,
          initial: activeRef.current,
          fontFamily: interTight.style.fontFamily,
          monogram: person.monogram,
          reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        }),
      )
      .then((scene) => {
        if (!alive) return scene.dispose();
        created = scene;
        notebook.current = scene;
        scene.setOutro(outroRef.current);
        scene.setProject(activeRef.current);
        setThree("ready");
      })
      .catch(() => {
        if (alive) setThree("failed");
      });

    return () => {
      alive = false;
      stopWatching();
      created?.dispose();
      notebook.current = null;
    };
  }, []);

  useEffect(() => {
    notebook.current?.setProject(active);
  }, [active]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const section = root.current!;
        const stage = section.querySelector<HTMLElement>("[data-proj-stage]")!;
        const track = section.querySelector<HTMLElement>("[data-proj-track]")!;
        const anchor = section.querySelector<HTMLElement>("[data-proj-anchor]")!;
        const items = gsap.utils.toArray<HTMLElement>("[data-proj-item]", section);
        const path = section.querySelector<SVGPathElement>("[data-proj-ribbon]")!;
        const labels = section.querySelector<HTMLElement>("[data-proj-labels]")!;
        const svg = path.ownerSVGElement!;
        const n = items.length;

        let itemH = 0;
        let anchorY = 0;
        let stepX = 0;
        let fadeAbove = -Infinity; // celular: nomes somem antes de chegar no preview
        let svgTop = 0;
        let total = 0;
        // Tabela comprimento → y do risco (px), para a ponta acompanhar o item ativo.
        let table: { len: number; y: number }[] = [];

        const measure = () => {
          itemH = items[0].offsetHeight;
          anchorY = anchor.offsetTop;
          stepX = Math.min(28, window.innerWidth * 0.0145);
          const preview = section.querySelector<HTMLElement>("[data-proj-preview]");
          fadeAbove =
            window.innerWidth < 768 && preview
              ? preview.getBoundingClientRect().bottom - stage.getBoundingClientRect().top + itemH * 0.15
              : -Infinity;
          svgTop = svg.getBoundingClientRect().top - track.getBoundingClientRect().top;
          const w = svg.clientWidth;
          const h = svg.clientHeight;
          svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
          path.removeAttribute("pathLength");
          path.setAttribute("d", scaleRibbon(w / 1000, h / 1000));
          total = path.getTotalLength();
          path.style.strokeDasharray = `${total} ${total * 2}`;
          table = [];
          let maxY = -Infinity;
          for (let i = 0; i <= 400; i++) {
            const len = (i / 400) * total;
            const y = path.getPointAtLength(len).y;
            maxY = Math.max(maxY, y);
            table.push({ len, y: maxY });
          }
        };

        const lengthAtY = (yUser: number) => {
          for (const row of table) if (row.y >= yUser) return row.len;
          return total;
        };

        const render = (p: number) => {
          const listT = Math.min(1, p / LIST_SHARE);
          const pos = listT * (n - 1);
          const ty = anchorY - (pos + 0.5) * itemH;
          gsap.set(track, { y: ty });

          items.forEach((el, i) => {
            const d = i - pos;
            const ad = Math.sqrt(d * d + 0.02);
            el.style.transform = `translate3d(${(ad * stepX).toFixed(2)}px,0,0)`;
            const top = ty + i * itemH;
            const clear = Math.min(1, Math.max(0, (top - fadeAbove) / (itemH * 0.5)));
            el.style.opacity = String((1 - Math.min(1, Math.abs(d)) * 0.7) * clear);
          });

          // Ponta do risco um pouco abaixo do item ativo.
          const tipTrackY = (pos + 0.5) * itemH + itemH * 0.75;
          let len = lengthAtY(tipTrackY - svgTop);
          const outroT = p > LIST_SHARE ? (p - LIST_SHARE) / (1 - LIST_SHARE) : 0;
          len += (total - len) * outroT;
          path.style.strokeDashoffset = String(total - len);

          // Fim da lista: o notebook fecha e sobe; as labels somem antes.
          outroRef.current = outroT;
          notebook.current?.setOutro(outroT);
          labels.style.opacity = String(1 - Math.min(1, outroT / 0.3));

          const idx = Math.round(pos);
          if (idx !== activeRef.current) {
            activeRef.current = idx;
            setActive(idx);
          }
        };

        measure();
        render(0);

        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * (LIST_VH + OUTRO_VH)}`,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            measure();
            render(self.progress);
          },
          onUpdate: (self) => render(self.progress),
        });

        // O notebook inclina acompanhando o mouse.
        const onMove = (e: PointerEvent) => {
          const r = stage.getBoundingClientRect();
          notebook.current?.setPointer(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
        };
        stage.addEventListener("pointermove", onMove);

        return () => {
          stage.removeEventListener("pointermove", onMove);
          labels.style.opacity = "";
          items.forEach((el) => {
            el.style.transform = "";
            el.style.opacity = "";
          });
          path.style.strokeDashoffset = "";
          path.style.strokeDasharray = "";
          path.setAttribute("d", RIBBON);
          path.setAttribute("pathLength", "1");
          svg.setAttribute("viewBox", "0 0 1000 1000");
        };
      });
    },
    { scope: root },
  );

  // Sem movimento não há scroll dirigindo a lista: o preview segue o hover/foco.
  const pickWithoutMotion = (i: number) => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    activeRef.current = i;
    setActive(i);
  };

  const current = projects[active] ?? projects[0];

  return (
    <section id="projetos" ref={root} data-rail="Projetos" aria-labelledby="projects-title" className="relative bg-bg">
      <div data-proj-stage className="relative h-svh overflow-clip motion-reduce:h-auto motion-reduce:py-[16svh]">
        <h2 id="projects-title" className="sr-only">
          Projetos
        </h2>

        {/* Onde o item ativo fica: centro da tela no desktop, mais abaixo no celular */}
        <span data-proj-anchor aria-hidden="true" className="absolute left-0 top-1/2 max-md:top-[66%]" />

        <div className="absolute inset-0 motion-reduce:relative">
          <div data-proj-track className="absolute inset-x-0 top-0 will-change-transform motion-reduce:relative">
            <svg
              aria-hidden="true"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              className="pointer-events-none absolute left-0 top-[-60svh] h-[calc(100%+120svh)] w-full overflow-visible"
            >
              <path
                data-proj-ribbon
                d={RIBBON}
                pathLength={1}
                fill="none"
                stroke="var(--accent)"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="[stroke-dasharray:1_2] [stroke-dashoffset:1] stroke-[clamp(44px,6.4vw,118px)] motion-reduce:[stroke-dashoffset:0]"
              />
            </svg>
  
            <ol className="relative pl-[12vw] max-md:pl-[8vw]">
              {projects.map((p, i) => (
                <li key={p.title} data-proj-item className="will-change-transform">
                  <a
                    href={p.href}
                    aria-current={i === active ? "true" : undefined}
                    onPointerEnter={() => pickWithoutMotion(i)}
                    onFocus={() => pickWithoutMotion(i)}
                    className="flex h-[17svh] max-h-40 min-h-21 max-w-[min(36vw,620px)] items-center border-b border-line text-[clamp(34px,3.35vw,64px)] font-medium leading-none tracking-[-0.03em] text-ink max-md:h-[12svh] max-md:max-w-[84vw]"
                  >
                    {p.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Preview do projeto ativo: a caixa diz onde o notebook 3D fica */}
        <div data-proj-preview className="pointer-events-none absolute right-[max(7vw,96px)] top-1/2 w-[min(36vw,680px)] -translate-y-1/2 max-md:left-1/2 max-md:right-auto max-md:top-[10svh] max-md:w-[min(86vw,440px)] max-md:-translate-x-1/2 max-md:translate-y-0 motion-reduce:top-[16svh] motion-reduce:translate-y-0 max-md:motion-reduce:hidden">
          <div data-proj-labels className="mb-2 flex justify-between text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            <span aria-live="polite">{current.date}</span>
            <span>Preview</span>
          </div>
          <div data-proj-fit role="img" aria-label={`Preview de ${current.title}`} className="relative aspect-6/5">
            {three === "failed" && (
              <div className="absolute inset-[6%] overflow-clip bg-bg-raised">
                {projects.map((p, i) => (
                  <Image
                    key={p.title}
                    src={p.image}
                    alt=""
                    fill
                    loading="eager"
                    sizes="(max-width: 768px) 76vw, 32vw"
                    className="object-cover transition-[clip-path,transform] duration-900 ease-[cubic-bezier(0.76,0,0.24,1)]"
                    style={{
                      clipPath: i === active ? "inset(0% 0% 0% 0%)" : i < active ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)",
                      transform: i === active ? "scale(1)" : "scale(1.12)",
                      zIndex: i === active ? 2 : 1,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`pointer-events-none absolute right-0 top-0 h-[47svh] w-full transition-opacity duration-700 md:h-full md:w-[calc(max(7vw,96px)+min(36vw,680px)+2vw)] ${three === "ready" ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    </section>
  );
}
