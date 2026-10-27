// Linhas topográficas do fundo do hero: anéis irregulares em volta de alguns
// "picos", gerados com uma semente fixa para o servidor e o cliente desenharem
// exatamente os mesmos caminhos.

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 1600;
const H = 900;

function buildPaths() {
  const rand = mulberry32(7);
  const peaks = [
    { x: 260, y: 180, rings: 6, step: 46 },
    { x: 1380, y: 260, rings: 7, step: 52 },
    { x: 1180, y: 820, rings: 5, step: 58 },
    { x: 180, y: 760, rings: 5, step: 50 },
    { x: 820, y: 420, rings: 3, step: 140 },
  ];
  const paths: string[] = [];
  for (const p of peaks) {
    const harmonics = Array.from({ length: 4 }, (_, k) => ({
      amp: (0.08 + rand() * 0.14) / (k + 1),
      freq: k + 2,
      phase: rand() * Math.PI * 2,
    }));
    const stretch = 0.7 + rand() * 0.6;
    for (let r = 1; r <= p.rings; r++) {
      const base = r * p.step;
      const pts: string[] = [];
      const n = 72;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        let k = 1;
        for (const h of harmonics) k += h.amp * Math.sin(a * h.freq + h.phase + r * 0.35);
        const x = p.x + Math.cos(a) * base * k * stretch;
        const y = p.y + Math.sin(a) * base * k;
        pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      paths.push(`M${pts.join("L")}Z`);
    }
  }
  return paths;
}

const PATHS = buildPaths();

export default function TopoLines({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <g fill="none" stroke="var(--ink)" strokeOpacity="0.07" strokeWidth="1.1">
        {PATHS.map((d, i) => (
          <path key={i} d={d} pathLength={1} vectorEffect="non-scaling-stroke" data-topo-line data-draw />
        ))}
      </g>
    </svg>
  );
}
