// A abertura do site: o loading avisa quando começa a sair, e o cabeçalho e o
// hero tocam as entradas deles a partir daí. Sem loading, tocam na hora.

let revealed = false;
const waiting = new Set<() => void>();

export function revealSite() {
  if (revealed) return;
  revealed = true;
  waiting.forEach((fn) => fn());
  waiting.clear();
}

export function afterIntro(fn: () => void) {
  if (revealed) {
    fn();
    return () => {};
  }
  waiting.add(fn);
  return () => void waiting.delete(fn);
}
