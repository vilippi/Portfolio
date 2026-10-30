// A mancha d'água da troca de tema: quadros de um clip-path que nasce num
// ponto e cresce até cobrir a tela. A borda ondula com três ondas girando em
// velocidades diferentes, e elas se acalmam conforme a mancha cresce.

const POINTS = 160;
const FRAMES = 44;
// [cristas na volta inteira, peso, voltas durante a animação]
const WAVES: [number, number, number][] = [
  [5, 0.55, 0.3],
  [9, 0.3, -0.5],
  [16, 0.15, 0.8],
];

export function waterFrames(x: number, y: number, w: number, h: number) {
  // Até o canto mais distante, com folga para a borda ondulada.
  const reach = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) * 1.04 + 8;
  const frames: string[] = [];
  for (let f = 0; f <= FRAMES; f++) {
    const p = f / FRAMES;
    // Rápido no começo e devagar no fim, como água se espalhando numa mesa.
    const r = reach * (1 - (1 - p) ** 2.4);
    const amp = Math.min(r * 0.14, 64) * (1 - p) ** 1.4;
    const points: string[] = [];
    for (let i = 0; i < POINTS; i++) {
      const a = (i / POINTS) * Math.PI * 2;
      let wave = 0;
      for (const [crests, weight, turns] of WAVES) wave += weight * Math.sin(crests * a + turns * p * Math.PI * 2);
      const d = Math.max(0, r + amp * wave);
      points.push(`${(x + Math.cos(a) * d).toFixed(1)}px ${(y + Math.sin(a) * d).toFixed(1)}px`);
    }
    frames.push(`polygon(${points.join(",")})`);
  }
  return frames;
}
