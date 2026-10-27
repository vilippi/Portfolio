"use client";

// Adaptado de "perspective-tunnel-hero" (21st.dev). Mudanças em relação ao original:
// - não tem scroll próprio: roda dentro do pin da seção de Projetos, guiado
//   por `progress` (a fase do túnel) e `reveal` (a passagem que vem antes).
//   O original capturava o `wheel` com preventDefault, prendendo o visitante;
// - é dividido em duas camadas (fundo e frente) para o risco roxo da seção
//   de Projetos passar entre elas;
// - título e cards só começam com o túnel ocupando a tela toda;
// - os cards vêm por props (os projetos do portfólio) e são links;
// - só tema escuro, com o índigo trocado pela cor de destaque do site;
// - import de "motion/react" (o pacote framer-motion agora se chama motion);
// - com prefers-reduced-motion a página mostra `StaticGallery` no lugar (por CSS).

import { motion, useTransform, useMotionValue, useSpring, type MotionValue } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export type TunnelItem = { src: string; title: string; href?: string };

interface TunnelCardData {
  item: TunnelItem;
  angleCos: number;
  angleSin: number;
  radiusFactorX: number;
  radiusFactorY: number;
  rotationZ: number;
  index: number;
}

function buildCards(items: TunnelItem[]): TunnelCardData[] {
  return items.map((item, i) => {
    const goldenAngle = i * 137.5 * (Math.PI / 180);
    return {
      item,
      angleCos: Math.cos(goldenAngle),
      angleSin: Math.sin(goldenAngle),
      radiusFactorX: 0.28 + (i % 3) * 0.08,
      radiusFactorY: 0.26 + (i % 2) * 0.09,
      rotationZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
      index: i,
    };
  });
}

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

interface StageDimensions {
  width: number;
  height: number;
  isMobile: boolean;
}

function useCameraParallax() {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [rawX, rawY]);

  return { x, y };
}

interface TunnelCardProps {
  card: TunnelCardData;
  progress: MotionValue<number>;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  total: number;
  stage: StageDimensions;
}

function TunnelCard({ card, progress, pointer, total, stage }: TunnelCardProps) {
  const staggerSpan = 0.55;
  const start = (card.index / total) * (1 - staggerSpan);
  const end = start + staggerSpan;

  const localProgress = useTransform(progress, [start, end], [0, 1]);

  const farZ = stage.isMobile ? -1200 : -1700;
  const nearZ = stage.isMobile ? 350 : 500;
  const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);

  const opacity = useTransform(localProgress, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);
  // Card quase invisível não recebe clique (nem rouba o de quem está atrás).
  const pointerEvents = useTransform(opacity, (o) => (o > 0.35 ? "auto" : "none"));

  const cardWidth = stage.isMobile
    ? Math.max(130, Math.min(180, stage.width * 0.38))
    : Math.max(180, Math.min(270, stage.width * 0.18));

  const baseX = card.angleCos * (stage.width * card.radiusFactorX);
  const baseY = card.angleSin * (stage.height * card.radiusFactorY);
  const panStrength = stage.isMobile ? 20 : 45;

  const transform = useTransform([z, pointer.x, pointer.y], ([currZ, px, py]: number[]) => {
    const offsetX = baseX - px * panStrength;
    const offsetY = baseY - py * panStrength;
    return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) rotateZ(${card.rotationZ}deg)`;
  });

  return (
    <motion.a
      href={card.item.href ?? "#"}
      style={{ width: cardWidth, transform, opacity, pointerEvents, zIndex: card.index + 1 }}
      className="absolute left-1/2 top-1/2 aspect-4/5 cursor-pointer select-none will-change-transform"
    >
      <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl shadow-black/90 ring-1 ring-white/15 transition-all duration-500 hover:shadow-accent/30 hover:ring-accent">
        <Image
          src={card.item.src}
          alt={card.item.title}
          fill
          sizes="270px"
          draggable={false}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4 sm:p-5">
          <span className="font-mono text-xs uppercase tracking-widest text-white/95 drop-shadow-md sm:text-sm">
            {card.item.title}
          </span>
        </div>
      </div>
    </motion.a>
  );
}

type TunnelStageProps = {
  items: TunnelItem[];
  kicker: string;
  title: [string, string];
  hint: string;
  prompt: string;
  /** 0–1 da fase do túnel: título e cards. */
  progress: MotionValue<number>;
  /** 0–1 da passagem antes do túnel: só o fundo aparece. */
  reveal: MotionValue<number>;
  className?: string;
};

/**
 * As duas camadas do túnel, para posicionar dentro de um palco fixo
 * (`relative`/`isolate`): o fundo em z-0 e a frente em z-20. O que ficar em
 * z-10 no palco passa entre elas.
 */
export function TunnelStage({ items, kicker, title, hint, prompt, progress, reveal, className = "" }: TunnelStageProps) {
  const [cards] = useState(() => buildCards(items));

  const [stage, setStage] = useState<StageDimensions>({ width: 1440, height: 900, isMobile: false });

  useEffect(() => {
    const updateDimensions = () => {
      setStage({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
      });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const smoothProgress = useSpring(progress, { stiffness: 80, damping: 30, restDelta: 0.0001 });

  const pointer = useCameraParallax();

  const titleScale = useTransform(smoothProgress, [0, 0.5, 1], [0.7, 1, 1.35]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.1, 0.88, 1], [0, 1, 1, 0]);
  const promptOpacity = useTransform(smoothProgress, [0.02, 0.08, 0.16, 0.22], [0, 1, 1, 0]);
  // Escondidas por inteiro fora da fase delas: cards com opacidade 0 não
  // podem ficar por cima da lista de projetos pegando cliques. A frente olha
  // também o progresso cru: voltando rápido para a lista, a mola ainda estaria
  // "desenrolando" o túnel por cima dela.
  const backVisibility = useTransform(reveal, (v) => (v > 0.001 ? "visible" : "hidden"));
  const frontVisibility = useTransform([progress, smoothProgress], ([raw, smooth]: number[]) =>
    raw > 0.001 && smooth > 0.001 ? "visible" : "hidden",
  );

  return (
    <>
      <motion.div
        aria-hidden="true"
        style={{ opacity: reveal, visibility: backVisibility }}
        className={`pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden ${className}`}
      >
        {/* Grade de pontos e brilho */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(98,21,180,0.42)_1px,transparent_1px)] [background-size:28px_28px] opacity-60 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(98,21,180,0.22)_0%,transparent_72%)]" />

        {/* Anéis de profundidade */}
        <div className="absolute h-[48vmin] w-[48vmin] rounded-full border border-accent/25" />
        <div className="absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-white/10" />
      </motion.div>

      <motion.div
        style={{
          visibility: frontVisibility,
          perspective: stage.isMobile ? "900px" : "1200px",
          transformStyle: "preserve-3d",
        }}
        className={`pointer-events-none absolute inset-0 z-20 flex select-none items-center justify-center overflow-hidden text-white ${className}`}
      >
        {/* Título central */}
        <motion.div
          style={{ scale: titleScale, opacity: titleOpacity }}
          className="pointer-events-none z-0 flex max-w-xl flex-col items-center px-6 text-center"
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-[#a77ce8]">{kicker}</p>
          <h2
            id="tunnel-title"
            className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-5xl font-bold uppercase leading-[0.9] tracking-tighter text-transparent sm:text-7xl md:text-8xl"
          >
            {title[0]}
            <br />
            {title[1]}
          </h2>
          <p className="mt-4 max-w-[36ch] text-sm font-light text-neutral-400 sm:text-base">{hint}</p>
        </motion.div>

        {/* Indicação de scroll */}
        <motion.div
          style={{ opacity: promptOpacity }}
          className="pointer-events-none absolute bottom-8 z-20 flex flex-col items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-neutral-400"
        >
          <span>{prompt}</span>
          <div className="h-6 w-px bg-gradient-to-b from-accent to-transparent" />
        </motion.div>

        {/* Plano 3D */}
        <div className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {cards.map((card) => (
            <TunnelCard
              key={card.index}
              card={card}
              progress={smoothProgress}
              pointer={pointer}
              total={cards.length}
              stage={stage}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
}

type StaticGalleryProps = {
  items: TunnelItem[];
  kicker: string;
  title: [string, string];
  className?: string;
};

/** Versão sem movimento (prefers-reduced-motion): grade simples com os projetos. */
export function StaticGallery({ items, kicker, title, className = "" }: StaticGalleryProps) {
  return (
    <section aria-labelledby="gallery-title" className={`bg-bg px-gutter py-[clamp(80px,10vw,160px)] ${className}`}>
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-[#a77ce8]">{kicker}</p>
      <h2 id="gallery-title" className="text-5xl font-bold uppercase leading-[0.9] tracking-tighter text-ink sm:text-7xl">
        {title[0]} {title[1]}
      </h2>
      <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.title}>
            <a href={item.href ?? "#"} className="group block">
              <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-neutral-900">
                <Image src={item.src} alt={item.title} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
              </div>
              <span className="mt-2 block font-mono text-xs uppercase tracking-widest text-ink/90">{item.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
