import * as THREE from "three";
import { gsap } from "gsap";
import { createNotebookModel } from "./notebook-model";

// Palco 3D do preview de projetos: o notebook flutua no lugar da caixa
// [data-proj-preview], gira 360° a cada troca de projeto (a imagem troca
// quando a tela fica de costas) e, no fim, fecha e sobe para fora da tela.
// O canvas cobre a área do notebook desde o topo do palco (coluna da
// direita no desktop, faixa de cima no celular), para ele sair por cima
// sem corte e sem ficar por cima da lista.

const YAW = THREE.MathUtils.degToRad(30); // pose da referência: frente virada para a direita
const ELEVATION = THREE.MathUtils.degToRad(24); // câmera acima
const FOV = 22;
const DIST = 16;
const TAU = Math.PI * 2;
const FIT = 4.65; // largura aparente do notebook aberto na pose base (unidades do modelo)
const CENTER_Y = -1.05; // desce o modelo para o centro visual ficar na origem

export type NotebookScene = {
  setProject(index: number): void;
  /** 0 = aberto no lugar; 1 = fechado e fora da tela. */
  setOutro(t: number): void;
  /** Ponteiro relativo ao palco, −1 a 1. */
  setPointer(x: number, y: number): void;
  dispose(): void;
};

type Options = {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  anchor: HTMLElement;
  images: string[];
  initial: number;
  fontFamily: string;
  monogram: string;
  reduced: boolean;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Devolve a thread principal entre etapas pesadas, para nenhuma virar um
// travamento longo no scroll.
const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));
const easeInOut = gsap.parseEase("power2.inOut");
const easeIn = gsap.parseEase("power2.in");

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(98,21,180,0.55)");
  g.addColorStop(0.45, "rgba(98,21,180,0.18)");
  g.addColorStop(1, "rgba(98,21,180,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Ajusta a imagem à tela 16:10 como object-fit: cover. */
function cover(t: THREE.Texture) {
  const img = t.image as { width: number; height: number };
  const ia = img.width / img.height;
  const sa = 1.6;
  if (ia > sa) {
    t.repeat.set(sa / ia, 1);
    t.offset.set((1 - sa / ia) / 2, 0);
  } else {
    t.repeat.set(1, ia / sa);
    t.offset.set(0, (1 - ia / sa) / 2);
  }
}

export async function createNotebookScene(o: Options): Promise<NotebookScene> {
  // ── Texturas: pedidas antes de tudo, porque não dependem do renderer ──
  let disposed = false;
  let dirty = true;
  const textures: (THREE.Texture | undefined)[] = [];
  let onTexture: ((i: number) => void) | null = null; // liga quando o modelo existir
  const loader = new THREE.TextureLoader();
  const load = (i: number) =>
    loader.loadAsync(o.images[i]).then(
      (t) => {
        if (disposed) return t.dispose();
        t.colorSpace = THREE.SRGBColorSpace;
        cover(t);
        textures[i] = t;
        onTexture?.(i);
      },
      () => undefined,
    );
  // O projeto inicial primeiro, depois os outros em paralelo.
  void load(o.initial).finally(() => {
    o.images.forEach((_, i) => {
      if (i !== o.initial && !disposed) void load(i);
    });
  });

  // O monograma do verso é desenhado em canvas: precisa da fonte carregada.
  await document.fonts.load(`800 100px ${o.fontFamily}`).catch(() => undefined);

  // Lança se não houver WebGL; quem chama cai no fallback de imagens.
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: o.canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (err) {
    disposed = true;
    textures.forEach((t) => t?.dispose());
    throw err;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  // Sem luzes nem environment map: os materiais do modelo são matcaps com
  // o estúdio já assado (ver notebook-model.ts).
  const scene = new THREE.Scene();
  await yieldToMain();

  const camera = new THREE.PerspectiveCamera(FOV, 1, DIST * 0.4, DIST * 3);
  camera.position.set(0, 0, DIST);

  // rig (encaixe, subida) → float (flutuação, ponteiro) → spin (giro) → modelo
  const rig = new THREE.Group();
  const float = new THREE.Group();
  const spinner = new THREE.Group();
  const model = createNotebookModel({ monogram: o.monogram, fontFamily: o.fontFamily });
  model.root.position.y = CENTER_Y;
  rig.rotation.x = ELEVATION;
  spinner.add(model.root);
  float.add(spinner);
  rig.add(float);
  scene.add(rig);
  await yieldToMain();

  // Brilho roxo embaixo: no fundo escuro uma sombra sumiria; a luz da
  // tela "vazando" no chão marca que ele está flutuando.
  const ground = new THREE.Group();
  ground.rotation.x = ELEVATION;
  const glowTex = glowTexture();
  const glowMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glowGeo = new THREE.PlaneGeometry(5.4, 3.8);
  glowGeo.rotateX(-Math.PI / 2);
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = CENTER_Y - 0.45;
  ground.add(glow);
  scene.add(ground);

  // ── Encaixe no retângulo do [data-proj-preview] ──────────────────────
  let viewH = 1;
  let baseY = 0;
  let scale = 1;
  const fit = () => {
    const w = o.canvas.clientWidth || 1;
    const h = o.canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    viewH = 2 * DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const k = viewH / h;
    const st = o.canvas.getBoundingClientRect();
    const a = o.anchor.getBoundingClientRect();
    const cx = a.left - st.left + a.width / 2;
    const cy = a.top - st.top + a.height / 2;
    scale = (a.width * k) / FIT;
    baseY = -(cy - h / 2) * k;
    rig.position.set((cx - w / 2) * k, baseY, 0);
    rig.scale.setScalar(scale);
    ground.position.copy(rig.position);
    ground.scale.setScalar(scale);
    dirty = true;
  };

  // ── Tela ─────────────────────────────────────────────────────────────
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  let shown = o.initial;
  let wanted = o.initial;

  const show = (i: number) => {
    shown = i;
    model.setScreen(textures[i] ?? null);
    dirty = true;
  };

  textures.forEach((t) => t && (t.anisotropy = maxAniso));
  onTexture = (i) => {
    textures[i]!.anisotropy = maxAniso;
    if (i === shown) show(i);
  };

  // ── Giro ─────────────────────────────────────────────────────────────
  const spin = { v: 0 };
  let turnFrom = 0;
  let tween: gsap.core.Tween | null = null;
  const turn = () => {
    if (tween) return; // o giro em curso pega o `wanted` mais recente; se já passou da troca, emenda outro no fim
    turnFrom = spin.v;
    tween = gsap.to(spin, {
      v: turnFrom + TAU,
      duration: 1.15,
      ease: "power2.inOut",
      onComplete: () => {
        tween = null;
        if (wanted !== shown) turn();
      },
    });
  };

  // ── Estado contínuo ──────────────────────────────────────────────────
  let outro = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let visible = true;
  let last = performance.now();

  const tick = () => {
    if (!visible) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    if (!o.reduced) {
      const t = now / 1000;
      const ease = 1 - Math.exp(-dt * 4);
      pointer.x += (pointer.tx - pointer.x) * ease;
      pointer.y += (pointer.ty - pointer.y) * ease;

      const turnT = tween ? clamp01((spin.v - turnFrom) / TAU) : 0;
      float.position.y = Math.sin(t * 1.2) * 0.07 + Math.sin(turnT * Math.PI) * 0.28;
      float.rotation.set(Math.sin(t * 0.95 + 1) * 0.015 + pointer.y * 0.08, pointer.x * 0.16, Math.sin(t * 0.8) * 0.02);
      spinner.rotation.y = YAW + spin.v;

      // Troca a imagem só com a tela de costas para a câmera.
      if (wanted !== shown && Math.cos(YAW + spin.v + pointer.x * 0.16) < -0.2) show(wanted);

      const close = easeInOut(clamp01(outro / 0.55));
      const rise = easeIn(clamp01((outro - 0.4) / 0.6));
      model.setLidOpen(1 - close);
      model.setScreenPower(1 - clamp01((outro - 0.05) / 0.4));
      rig.position.y = baseY + rise * (viewH / 2 - baseY + 3.4 * scale);
      rig.rotation.x = ELEVATION + rise * 0.3;
      const bob = (float.position.y + 0.1) / 0.45;
      glow.scale.setScalar(1 + bob * 0.12);
      glowMat.opacity = (0.95 - bob * 0.25) * (1 - clamp01(outro / 0.5));
      dirty = true;
    }

    if (dirty) {
      renderer.render(scene, camera);
      dirty = false;
    }
  };

  fit();
  show(o.initial);
  spinner.rotation.y = YAW;
  // Compila os shaders fora da thread principal quando o navegador deixa
  // (KHR_parallel_shader_compile): o primeiro frame não trava o scroll.
  await renderer.compileAsync(scene, camera).catch(() => undefined);
  gsap.ticker.add(tick);

  const ro = new ResizeObserver(fit);
  ro.observe(o.canvas);
  ro.observe(o.anchor);
  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      last = performance.now();
      dirty = true;
    },
    { rootMargin: "15% 0px" },
  );
  io.observe(o.stage);

  return {
    setProject(i) {
      wanted = i;
      if (i === shown) return;
      if (o.reduced) show(i);
      else turn();
    },
    setOutro(t) {
      outro = clamp01(t);
    },
    setPointer(x, y) {
      pointer.tx = x;
      pointer.ty = y;
    },
    dispose() {
      disposed = true;
      gsap.ticker.remove(tick);
      tween?.kill();
      ro.disconnect();
      io.disconnect();
      model.dispose();
      textures.forEach((t) => t?.dispose());
      glowTex.dispose();
      glowMat.dispose();
      glowGeo.dispose();
      renderer.dispose();
    },
  };
}
