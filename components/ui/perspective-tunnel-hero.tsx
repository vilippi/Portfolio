"use client";

// Adaptado de "perspective-tunnel-hero" (21st.dev). Mudanças em relação ao original:
// - o progresso vem do scroll da página (seção alta + palco sticky) em vez de
//   capturar o `wheel` com preventDefault, que prendia o visitante no túnel
//   para sempre e brigava com o smooth scroll (Lenis);
// - os cards vêm por props (os projetos do portfólio) e são links;
// - só tema escuro, com o índigo trocado pela cor de destaque do site;
// - import de "motion/react" (o pacote framer-motion agora se chama motion);
// - com prefers-reduced-motion, mostra uma grade estática no lugar do voo.

import {
  motion,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useScroll,
  useSpring,
  type MotionValue,
} from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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

function useCameraParallax(enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, rawX, rawY]);

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
      style={{ width: cardWidth, transform, opacity, zIndex: card.index + 1 }}
      className="pointer-events-auto absolute left-1/2 top-1/2 aspect-4/5 cursor-pointer select-none will-change-transform"
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

type TunnelProps = {
  items: TunnelItem[];
  kicker: string;
  title: [string, string];
  hint: string;
  prompt: string;
  id?: string;
  rail?: string;
};

export default function PerspectiveTunnelHero({ items, kicker, title, hint, prompt, id, rail }: TunnelProps) {
  const reduce = useReducedMotion();
  if (reduce) return <StaticGallery items={items} kicker={kicker} title={title} id={id} rail={rail} />;
  return <Tunnel items={items} kicker={kicker} title={title} hint={hint} prompt={prompt} id={id} rail={rail} />;
}

function Tunnel({ items, kicker, title, hint, prompt, id, rail }: TunnelProps) {
  const sectionRef = useRef<HTMLElement>(null);
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

  // Progresso = quanto da seção alta já passou pelo palco fixo.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 30, restDelta: 0.0001 });

  const pointer = useCameraParallax(true);

  const titleScale = useTransform(smoothProgress, [0, 0.5, 1], [0.7, 1, 1.35]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.12, 0.9, 1], [0.25, 1, 1, 0]);
  const promptOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);

  return (
    <section ref={sectionRef} id={id} data-rail={rail} aria-labelledby="tunnel-title" className="relative h-[300svh] bg-bg">
      <div
        className="sticky top-0 flex h-svh w-full select-none items-center justify-center overflow-hidden bg-bg text-white"
        style={{ perspective: stage.isMobile ? "900px" : "1200px", transformStyle: "preserve-3d" }}
      >
        {/* Grade de pontos e brilho */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(98,21,180,0.42)_1px,transparent_1px)] [background-size:28px_28px] opacity-60 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(98,21,180,0.22)_0%,transparent_72%)]" />

        {/* Anéis de profundidade */}
        <div className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-accent/25" />
        <div className="pointer-events-none absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-white/10" />

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
      </div>
    </section>
  );
}

function StaticGallery({ items, kicker, title, id, rail }: Omit<TunnelProps, "hint" | "prompt">) {
  return (
    <section id={id} data-rail={rail} aria-labelledby="tunnel-title" className="bg-bg px-gutter py-[clamp(80px,10vw,160px)]">
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-[#a77ce8]">{kicker}</p>
      <h2 id="tunnel-title" className="text-5xl font-bold uppercase leading-[0.9] tracking-tighter text-ink sm:text-7xl">
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
