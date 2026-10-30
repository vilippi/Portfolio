// O risco roxo do site (Projetos e loading). Os caminhos são desenhados num
// quadro 1000×1000 e reescalados para os pixels reais, para o tracejado e as
// medidas de comprimento usarem a mesma unidade da tela.

export const RIBBON_STROKE = "stroke-[clamp(44px,6.4vw,118px)]"

export function scalePath(d: string, sx: number, sy: number) {
  let i = 0
  return d.replace(/-?\d+(\.\d+)?/g, (v) => (Number(v) * (i++ % 2 === 0 ? sx : sy)).toFixed(1))
}
