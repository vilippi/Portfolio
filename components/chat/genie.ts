// Efeito Gênio do macOS, feito com faixas. A janela é desenhada várias vezes,
// cada cópia vista por uma faixa perpendicular ao funil. A cada quadro, cada
// faixa vira um trapézio (matrix3d) cujas bordas encostam nas das vizinhas,
// e o conjunto forma as laterais curvas do gênio escorrendo para a origem
// (o "Dock", aqui o botão Info).

export type Rect = { x: number; y: number; w: number; h: number };

/** Lado da janela em que a origem está. */
export type Side = "left" | "right" | "top" | "bottom";

/** Caixa de uma faixa, relativa ao canto da janela. */
export type GenieBand = Rect;

export type Genie = {
  bands: GenieBand[];
  /** Um `transform` por faixa. 0 = janela aberta no lugar; 1 = tudo dentro da origem. */
  frame(p: number): string[];
};

const NECK = 44; // largura mínima do gargalo, para o conteúdo ainda aparecer ao passar por ele
const PINCH_END = 0.5; // a pinça vai de 0 a 0.5 do progresso
const SLIDE_START = 0.3; // e o deslize vai de 0.3 a 1, encavalado nela, como no Mac
const SEAM = 1; // cada faixa avança 1px sobre a vizinha, para a borda suavizada não virar costura

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

export const toRect = (r: DOMRectReadOnly): Rect => ({ x: r.left, y: r.top, w: r.width, h: r.height });

// Null quando a origem fica por trás da janela e o gênio não tem por onde escorrer.
export function originSide(win: Rect, origin: Rect): Side | null {
  if (origin.x + origin.w <= win.x) return "left";
  if (origin.x >= win.x + win.w) return "right";
  if (origin.y + origin.h <= win.y) return "top";
  if (origin.y >= win.y + win.h) return "bottom";
  return null;
}

// Uma faixa a cada ~28px, entre 18 e 36 cópias da janela.
export function sliceCount(win: Rect, side: Side) {
  const length = side === "left" || side === "right" ? win.w : win.h;
  return Math.round(Math.min(36, Math.max(18, length / 28)));
}

type Point = [number, number];

// Leva a caixa w×h da faixa até o quadrilátero p0 p1 p2 p3 (cantos em sentido
// horário a partir do superior esquerdo). Quadrado → quadrilátero de Heckbert.
function quad(w: number, h: number, [x0, y0]: Point, [x1, y1]: Point, [x2, y2]: Point, [x3, y3]: Point) {
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = det ? (dx3 * dy2 - dx2 * dy3) / det : 0;
  const k = det ? (dx1 * dy3 - dx3 * dy1) / det : 0;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3;
  const d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`;
}

export function createGenie(win: Rect, origin: Rect, side: Side, count: number): Genie {
  // A conta é feita num eixo só: "along" corre ao longo do funil e "cross"
  // atravessa ele. A distância é medida a partir da borda oposta à origem.
  const horizontal = side === "left" || side === "right";
  const dir = side === "right" || side === "bottom" ? 1 : -1;
  const length = horizontal ? win.w : win.h;
  const crossStart = horizontal ? win.y : win.x;
  const crossLength = horizontal ? win.h : win.w;
  const far = horizontal ? (dir > 0 ? win.x : win.x + win.w) : dir > 0 ? win.y : win.y + win.h;
  const target = horizontal ? origin.x + origin.w / 2 : origin.y + origin.h / 2;
  const reach = Math.abs(target - far);
  const neckCenter = horizontal ? origin.y + origin.h / 2 : origin.x + origin.w / 2;
  const neck = Math.max(horizontal ? origin.h : origin.w, NECK);
  const neckStart = neckCenter - neck / 2 - crossStart;
  const neckEnd = neckCenter + neck / 2 - crossStart;
  const step = length / count;

  // Início e tamanho de cada faixa ao longo do funil, dentro da janela.
  const spans = Array.from({ length: count }, (_, i) => ({ start: i * step - SEAM, size: step + SEAM * 2 }));
  const bands = spans.map(({ start, size }) =>
    horizontal ? { x: start, y: 0, w: size, h: crossLength } : { x: 0, y: start, w: crossLength, h: size },
  );

  // Para onde vai o ponto da janela que estava em `at` ao longo do funil: ele
  // anda em direção à origem e é engolido ao chegar nela; quanto mais perto
  // da origem, mais a janela se estreita até o gargalo.
  function place(at: number, slide: number, pinch: number) {
    const e = Math.min((dir > 0 ? at : length - at) + slide, reach);
    const t = smooth(clamp01(e / reach)) * pinch;
    return {
      along: dir > 0 ? e : length - e,
      c0: neckStart * t,
      c1: crossLength + (neckEnd - crossLength) * t,
    };
  }

  function frame(p: number): string[] {
    const pinch = smooth(clamp01(p / PINCH_END));
    const slide = clamp01((p - SLIDE_START) / (1 - SLIDE_START)) ** 2 * reach;

    return spans.map(({ start, size }) => {
      const s0 = place(start, slide, pinch);
      const s1 = place(start + size, slide, pinch);
      if (Math.abs(s1.along - s0.along) < 0.05) return "scale(0)"; // taste-skill-ignore: faixa já engolida pela origem
      const a0 = s0.along - start;
      const a1 = s1.along - start;
      return horizontal
        ? quad(size, crossLength, [a0, s0.c0], [a1, s1.c0], [a1, s1.c1], [a0, s0.c1])
        : quad(crossLength, size, [s0.c0, a0], [s0.c1, a0], [s1.c1, a1], [s1.c0, a1]);
    });
  }

  return { bands, frame };
}
