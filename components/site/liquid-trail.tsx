"use client";

import { useEffect, useRef, type RefObject } from "react";

// Rastro líquido do cursor no hero, como no vídeo de referência: o ponteiro
// deixa uma mancha orgânica que encolhe e some em pouco mais de um segundo.
// A mesma máscara é desenhada duas vezes:
//   - atrás do retrato, como uma sombra discreta no fundo ("ghost");
//   - na frente do retrato, revelando outra camada da foto ("reveal").
// Sem `revealSrc`, a camada revelada é o próprio retrato em duotone na cor de
// destaque. Para trocar o efeito, passe uma imagem com o mesmo enquadramento.

type Props = {
  /** Elemento que recebe o ponteiro (o hero inteiro). */
  areaRef: RefObject<HTMLElement | null>;
  /** Caixa do retrato: onde a camada revelada é desenhada. */
  targetRef: RefObject<HTMLElement | null>;
  /** Retrato original, usado para gerar o duotone. */
  src: string;
  /** Camada alternativa pronta, com o mesmo enquadramento do retrato. */
  revealSrc?: string;
  ghostClassName?: string;
  revealClassName?: string;
};

const SCALE = 0.2; // resolução da máscara em relação à tela
const LIFE = 1.3; // segundos até um ponto do rastro sumir
const NOISE = 64;

const DUO_DARK = [12, 4, 22];
const DUO_MID = [98, 21, 180]; // #6215B4
const DUO_LIGHT = [236, 224, 255];
const GHOST = [24, 20, 30];

function duotone(img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return img;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const p = data.data;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] === 0) continue;
    const l = (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]) / 255;
    const t = l * l * (3 - 2 * l);
    const [a, b, k] = t < 0.5 ? [DUO_DARK, DUO_MID, t * 2] : [DUO_MID, DUO_LIGHT, (t - 0.5) * 2];
    p[i] = a[0] + (b[0] - a[0]) * k;
    p[i + 1] = a[1] + (b[1] - a[1]) * k;
    p[i + 2] = a[2] + (b[2] - a[2]) * k;
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

export default function LiquidTrail({
  areaRef,
  targetRef,
  src,
  revealSrc,
  ghostClassName = "",
  revealClassName = "",
}: Props) {
  const ghostRef = useRef<HTMLCanvasElement>(null);
  const revealRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const ghost = ghostRef.current;
    const reveal = revealRef.current;
    if (!area || !ghost || !reveal) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    const gctx = ghost.getContext("2d");
    const rctx = reveal.getContext("2d");
    const small = document.createElement("canvas");
    const sctx = small.getContext("2d");
    if (!gctx || !rctx || !sctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let sw = 0;
    let sh = 0;
    let field = new Float32Array(0);
    let img = sctx.createImageData(1, 1);
    let layer: CanvasImageSource | null = null;
    let raf = 0;
    let prev = 0;
    let last: { x: number; y: number } | null = null;
    const pts: { x: number; y: number; r: number; life: number; seed: number }[] = [];

    const noise = new Float32Array(NOISE * NOISE);
    for (let i = 0; i < noise.length; i++) noise[i] = Math.random();
    const sampleNoise = (x: number, y: number) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const fx = x - xi;
      const fy = y - yi;
      const at = (a: number, b: number) =>
        noise[(((b % NOISE) + NOISE) % NOISE) * NOISE + (((a % NOISE) + NOISE) % NOISE)];
      const top = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * fx;
      const bot = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * fx;
      return top + (bot - top) * fy;
    };

    const resize = () => {
      const r = area.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      reveal.width = Math.round(w * dpr);
      reveal.height = Math.round(h * dpr);
      ghost.width = w;
      ghost.height = h;
      sw = Math.ceil(w * SCALE);
      sh = Math.ceil(h * SCALE);
      small.width = sw;
      small.height = sh;
      field = new Float32Array(sw * sh);
      img = sctx.createImageData(sw, sh);
    };

    const push = (x: number, y: number, base: number) => {
      pts.push({ x, y, r: base * (0.7 + Math.random() * 0.6), life: 1, seed: Math.random() * 6.283 });
      if (pts.length > 160) pts.shift();
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 0.016;
      prev = now;

      for (let i = pts.length - 1; i >= 0; i--) {
        pts[i].life -= dt / LIFE;
        if (pts[i].life <= 0) pts.splice(i, 1);
      }

      field.fill(0);
      const t = now * 0.001;
      for (const p of pts) {
        const k = 1 - Math.pow(1 - p.life, 3);
        const R = p.r * k * (1 + 0.14 * Math.sin(t * 2.2 + p.seed)) * SCALE;
        if (R < 0.4) continue;
        // Kernel de suporte compacto (Wyvill): superfície em ~0.54 do alcance.
        const reach = R / 0.54;
        const reach2 = reach * reach;
        const cx = p.x * SCALE;
        const cy = p.y * SCALE;
        const x0 = Math.max(0, Math.floor(cx - reach));
        const x1 = Math.min(sw - 1, Math.ceil(cx + reach));
        const y0 = Math.max(0, Math.floor(cy - reach));
        const y1 = Math.min(sh - 1, Math.ceil(cy + reach));
        for (let y = y0; y <= y1; y++) {
          const dy = y + 0.5 - cy;
          for (let x = x0; x <= x1; x++) {
            const dx = x + 0.5 - cx;
            const q = 1 - (dx * dx + dy * dy) / reach2;
            if (q > 0) field[y * sw + x] += q * q;
          }
        }
      }

      const d = img.data;
      for (let i = 0, j = 0; i < field.length; i++, j += 4) {
        let f = field[i];
        if (f > 0.04) f += (sampleNoise((i % sw) * 0.22 + t * 0.6, Math.floor(i / sw) * 0.22 - t * 0.4) - 0.5) * 0.42;
        const a = f <= 0.4 ? 0 : f >= 0.6 ? 1 : (f - 0.4) / 0.2;
        d[j] = GHOST[0];
        d[j + 1] = GHOST[1];
        d[j + 2] = GHOST[2];
        d[j + 3] = a * a * (3 - 2 * a) * 255;
      }
      sctx.putImageData(img, 0, 0);

      gctx.clearRect(0, 0, w, h);
      gctx.imageSmoothingEnabled = true;
      gctx.imageSmoothingQuality = "high";
      gctx.drawImage(small, 0, 0, w, h);

      rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rctx.clearRect(0, 0, w, h);
      const target = targetRef.current;
      if (layer && target && pts.length) {
        const a = area.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        rctx.imageSmoothingEnabled = true;
        rctx.imageSmoothingQuality = "high";
        rctx.drawImage(small, 0, 0, w, h);
        rctx.globalCompositeOperation = "source-in";
        rctx.drawImage(layer, b.left - a.left, b.top - a.top, b.width, b.height);
        rctx.globalCompositeOperation = "source-over";
      }

      if (pts.length) raf = requestAnimationFrame(frame);
      else prev = 0;
    };

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const r = area.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const base = Math.max(44, h * 0.08);
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const n = Math.min(24, Math.floor(Math.hypot(dx, dy) / (base * 0.32)));
        for (let i = 1; i <= n; i++) push(last.x + (dx * i) / n, last.y + (dy * i) / n, base);
        if (n === 0 && Math.random() < 0.25) push(x, y, base * 0.8);
        if (n > 0) last = { x, y };
      } else {
        push(x, y, base);
        last = { x, y };
      }
      wake();
    };
    const onLeave = () => {
      last = null;
    };

    // A camada revelada carrega depois da entrada do hero, para não competir com ela.
    let cancelled = false;
    const loadTimer = window.setTimeout(() => {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        if (!cancelled) layer = revealSrc ? im : duotone(im);
      };
      im.src = revealSrc ?? src;
    }, 1200);

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(area);
    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerleave", onLeave);

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
    };
  }, [areaRef, targetRef, src, revealSrc]);

  return (
    <>
      <canvas ref={ghostRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 size-full ${ghostClassName}`} />
      <canvas ref={revealRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 size-full ${revealClassName}`} />
    </>
  );
}
