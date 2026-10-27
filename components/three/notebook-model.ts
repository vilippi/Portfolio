import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Notebook procedural no molde de inspiracoes/notebook.png (MacBook Pro
// unibody 15"). Só geometria e material: renderer, luz e animação ficam em
// notebook-scene.ts. Unidades: 1 = 10 cm. A origem fica no centro da base,
// no chão dela, para o giro acontecer no próprio eixo. Frente = +z,
// lateral das portas = −x. A foto só mostra um ângulo: fundo e verso da
// tampa são inferidos.

const W = 3.57; // largura
const D = 2.43; // profundidade
const BH = 0.12; // altura da base
const LT = 0.055; // espessura da tampa
const HINGE = 0.035; // recuo da dobradiça a partir da traseira
const LD = D - HINGE; // comprimento da tampa
const OPEN = THREE.MathUtils.degToRad(108);

// Tela 16:10 com bordas finas em cima e nas laterais e a base mais larga.
const SW = W * 0.9;
const SH = SW / 1.6;
const SCREEN_TOP = 0.15;
const SCREEN_BOTTOM = LD - SH - SCREEN_TOP;

export type NotebookModel = {
  root: THREE.Group;
  /** Recebe a imagem do projeto; null apaga a tela. */
  setScreen(texture: THREE.Texture | null): void;
  /** Brilho da tela e do monograma no verso, 0–1. */
  setScreenPower(power: number): void;
  /** 1 = aberto (108°), 0 = fechado. */
  setLidOpen(t: number): void;
  dispose(): void;
};

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Placa plana deitada (virada para +y) no centro (x, y, z). */
function flatPlate(w: number, d: number, r: number, x: number, y: number, z: number) {
  const g = new THREE.ShapeGeometry(roundedRect(w, d, r), 4);
  g.rotateX(-Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

function mesh(name: string, geometry: THREE.BufferGeometry, material: THREE.Material) {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  return m;
}

// Teclado no layout do MacBook: larguras em "u" (1 u = uma tecla comum),
// 15 u por fileira. A fileira de função é baixa; a última tem o espaço
// largo e as setas em T invertido (↑ e ↓ dividem a mesma casa).
const ROWS: { h: number; keys: number[] }[] = [
  { h: 0.55, keys: [1.5, ...Array(12).fill(1), 1.5] },
  { h: 1, keys: [...Array(13).fill(1), 2] },
  { h: 1, keys: [1.5, ...Array(12).fill(1), 1.5] },
  { h: 1, keys: [1.75, ...Array(11).fill(1), 2.25] },
  { h: 1, keys: [2.25, ...Array(10).fill(1), 2.75] },
];
const BOTTOM_ROW = [1, 1, 1, 1.25, 5.5, 1.25, 1];

function buildKeyboard() {
  const u = (W * 0.78) / 15;
  const gap = u * 0.18;
  const keyH = 0.014;
  const keyY = BH + 0.003;
  const wellPad = 0.007;
  const keys: THREE.BufferGeometry[] = [];
  const wells: THREE.BufferGeometry[] = [];

  const add = (x0: number, z0: number, wu: number, hu: number) => {
    const w = wu * u - gap;
    const d = hu * u - gap;
    const cx = x0 + (wu * u) / 2;
    const cz = z0 + (hu * u) / 2;
    const k = new RoundedBoxGeometry(w, keyH, d, 2, 0.006);
    k.translate(cx, keyY, cz);
    keys.push(k);
    wells.push(flatPlate(w + wellPad * 2, d + wellPad * 2, 0.012, cx, BH + 0.0008, cz));
  };

  const left = (-15 * u) / 2;
  let z = -D / 2 + 0.17;
  for (const row of ROWS) {
    let x = left;
    for (const wu of row.keys) {
      add(x, z, wu, row.h);
      x += wu * u;
    }
    z += row.h * u;
  }
  let x = left;
  for (const wu of BOTTOM_ROW) {
    add(x, z, wu, 1);
    x += wu * u;
  }
  add(x, z, 1, 1); // ←
  add(x + u, z, 1, 0.5); // ↑
  add(x + u, z + u / 2, 1, 0.5); // ↓
  add(x + 2 * u, z, 1, 1); // →

  const keyboardBottom = z + u;
  const keysGeo = mergeGeometries(keys);
  const wellsGeo = mergeGeometries(wells);
  keys.forEach((g) => g.dispose());
  wells.forEach((g) => g.dispose());
  return { keysGeo, wellsGeo, keyboardBottom };
}

// ── Matcaps ────────────────────────────────────────────────────────────
// Em vez de environment map (o PMREM custava ~2,6 s de thread principal
// numa GPU Intel), cada material lê um matcap assado aqui: um estúdio com
// céu claro, softbox em cima à esquerda, faixa de luz à direita e o
// recorte roxo do site vindo da direita. Cálculo linear, saída sRGB.

type Finish =
  | { kind: "metal"; tint: [number, number, number]; rough: number; rim: number }
  | { kind: "dielectric"; base: number; spec: number; rough: number; rim: number };

const norm = (x: number, y: number, z: number) => {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l] as const;
};
const KEY = norm(-0.55, 0.7, 0.45);
const STRIP = norm(0.85, 0.15, 0.35);
const RIM: [number, number, number] = [0.12, 0.008, 0.46]; // #6215B4 em linear
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function bakeMatcap(f: Finish, size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const w = 0.012 + f.rough * f.rough * 0.45;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let x = ((px + 0.5) / size) * 2 - 1;
      let y = 1 - ((py + 0.5) / size) * 2;
      const r2 = x * x + y * y;
      if (r2 > 1) {
        const k = 1 / Math.sqrt(r2);
        x *= k;
        y *= k;
      }
      const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
      // Reflexo da direção de visão (0, 0, 1) na normal.
      const rx = 2 * z * x;
      const ry = 2 * z * y;
      const rz = 2 * z * z - 1;
      const key = Math.exp((rx * KEY[0] + ry * KEY[1] + rz * KEY[2] - 1) / w);
      const strip = Math.exp((rx * STRIP[0] + ry * STRIP[1] + rz * STRIP[2] - 1) / (w * 1.6));
      const fres = Math.pow(1 - z, 2.5) * smooth(-0.5, 0.9, x * 0.85 - y * 0.15);
      let r: number;
      let g: number;
      let b: number;
      if (f.kind === "metal") {
        const env = 0.45 + 0.55 * smooth(-0.35, 0.95, ry) + 1.1 * key + 0.5 * strip;
        r = f.tint[0] * env;
        g = f.tint[1] * env;
        b = f.tint[2] * env;
      } else {
        const diffuse = f.base * (0.35 + 0.65 * Math.max(0, x * KEY[0] + y * KEY[1] + z * KEY[2]));
        const spec = f.spec * (key + 0.45 * strip + 0.05 * smooth(-0.2, 1, ry));
        r = g = b = diffuse + spec;
      }
      r += RIM[0] * f.rim * fres;
      g += RIM[1] * f.rim * fres;
      b += RIM[2] * f.rim * fres;
      const i = (py * size + px) * 4;
      img.data[i] = 255 * Math.pow(Math.min(1, r), 1 / 2.2);
      img.data[i + 1] = 255 * Math.pow(Math.min(1, g), 1 / 2.2);
      img.data[i + 2] = 255 * Math.pow(Math.min(1, b), 1 / 2.2);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function monogramTexture(text: string, fontFamily: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 290px ${fontFamily}`;
  ctx.letterSpacing = "-14px";
  ctx.fillText(text, 256, 272);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function createNotebookModel({
  monogram = "VL",
  fontFamily = "sans-serif",
}: { monogram?: string; fontFamily?: string } = {}): NotebookModel {
  const caps: THREE.Texture[] = [];
  const matcap = (name: string, f: Finish, size = 128) => {
    const t = bakeMatcap(f, size);
    caps.push(t);
    return new THREE.MeshMatcapMaterial({ name, matcap: t });
  };
  // Alumínio jateado: metal acetinado, reflexo largo.
  const aluminum = matcap("aluminum", { kind: "metal", tint: [0.6, 0.615, 0.64], rough: 0.5, rim: 0.9 }, 256);
  const trackpadMat = matcap("trackpad", { kind: "metal", tint: [0.66, 0.675, 0.7], rough: 0.75, rim: 0.4 });
  const grooveMat = matcap("groove", { kind: "metal", tint: [0.22, 0.23, 0.25], rough: 0.6, rim: 0.3 });
  const keyMat = matcap("key", { kind: "dielectric", base: 0.012, spec: 0.12, rough: 0.6, rim: 0.25 });
  const wellMat = matcap("key-well", { kind: "dielectric", base: 0.004, spec: 0.01, rough: 0.9, rim: 0 });
  const darkMat = matcap("dark-plastic", { kind: "dielectric", base: 0.02, spec: 0.22, rough: 0.45, rim: 0.3 });
  const rubberMat = matcap("rubber", { kind: "dielectric", base: 0.03, spec: 0.03, rough: 0.9, rim: 0 });
  // Vidro preto: quase só reflexos estreitos.
  const glassMat = matcap("bezel-glass", { kind: "dielectric", base: 0.002, spec: 0.1, rough: 0.09, rim: 0.3 }, 256);
  const glareMat = new THREE.MeshMatcapMaterial({
    name: "screen-glare",
    matcap: glassMat.matcap,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  // A tela acende sozinha (sem luz); o reflexo do vidro vem por cima, em
  // modo aditivo. Sem imagem, um pixel escuro no lugar.
  const offTex = new THREE.DataTexture(new Uint8Array([12, 12, 14, 255]), 1, 1);
  offTex.colorSpace = THREE.SRGBColorSpace;
  offTex.needsUpdate = true;
  const screenMat = new THREE.MeshBasicMaterial({ name: "screen", map: offTex, toneMapped: false });
  const logoTex = monogramTexture(monogram, fontFamily);
  const logoMat = new THREE.MeshBasicMaterial({
    name: "lid-logo",
    map: logoTex,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const materials = [aluminum, trackpadMat, grooveMat, keyMat, wellMat, darkMat, rubberMat, glassMat, glareMat, screenMat, logoMat];

  const root = new THREE.Group();
  root.name = "notebook";

  // ── Base ─────────────────────────────────────────────────────────────
  const base = new THREE.Group();
  base.name = "base";
  root.add(base);

  const shellGeo = new RoundedBoxGeometry(W, BH, D, 5, 0.03);
  shellGeo.translate(0, BH / 2, 0);
  base.add(mesh("base-shell", shellGeo, aluminum));

  const { keysGeo, wellsGeo, keyboardBottom } = buildKeyboard();
  base.add(mesh("keys", keysGeo, keyMat));
  base.add(mesh("key-wells", wellsGeo, wellMat));

  const TW = 1.05;
  const TD = 0.76;
  const tz = keyboardBottom + 0.14 + TD / 2;
  base.add(mesh("trackpad-groove", flatPlate(TW + 0.014, TD + 0.014, 0.05, 0, BH + 0.0008, tz), grooveMat));
  base.add(mesh("trackpad", flatPlate(TW, TD, 0.045, 0, BH + 0.0016, tz), trackpadMat));

  const notchGeo = new THREE.BoxGeometry(0.36, 0.014, 0.004);
  notchGeo.translate(0, BH * 0.62, D / 2 - 0.001);
  base.add(mesh("front-notch", notchGeo, grooveMat));

  const sleepGeo = new THREE.BoxGeometry(0.07, 0.006, 0.004);
  sleepGeo.translate(W / 2 - 0.3, BH * 0.55, D / 2 - 0.001);
  base.add(mesh("sleep-light", sleepGeo, darkMat));

  // Portas na lateral esquerda, de trás para a frente: MagSafe, Ethernet,
  // FireWire, mini DisplayPort, 2× USB e as duas de áudio (redondas).
  const ports = new THREE.Group();
  ports.name = "ports";
  base.add(ports);
  const portY = BH * 0.5;
  const rectPorts: [string, number, number, number][] = [
    ["port-magsafe", 0.22, 0.1, 0.02],
    ["port-ethernet", 0.42, 0.14, 0.042],
    ["port-firewire", 0.62, 0.1, 0.034],
    ["port-minidp", 0.78, 0.08, 0.03],
    ["port-usb-1", 0.95, 0.13, 0.022],
    ["port-usb-2", 1.12, 0.13, 0.022],
  ];
  for (const [name, z, w, h] of rectPorts) {
    const g = new THREE.BoxGeometry(0.006, h, w);
    g.translate(-W / 2 + 0.002, portY, -D / 2 + z);
    ports.add(mesh(name, g, darkMat));
  }
  for (const [name, z] of [
    ["port-audio-in", 1.3],
    ["port-audio-out", 1.4],
  ] as const) {
    const g = new THREE.CylinderGeometry(0.017, 0.017, 0.006, 20);
    g.rotateZ(Math.PI / 2);
    g.translate(-W / 2 + 0.002, portY, -D / 2 + z);
    ports.add(mesh(name, g, darkMat));
  }

  const feet = new THREE.Group();
  feet.name = "feet";
  base.add(feet);
  for (const [i, [fx, fz]] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].entries()) {
    const g = new THREE.CylinderGeometry(0.07, 0.07, 0.012, 24);
    g.translate(fx * (W / 2 - 0.25), -0.004, fz * (D / 2 - 0.22));
    feet.add(mesh(`foot-${i + 1}`, g, rubberMat));
  }

  const hingeGeo = new THREE.CylinderGeometry(0.042, 0.042, W * 0.84, 24);
  hingeGeo.rotateZ(Math.PI / 2);
  hingeGeo.translate(0, BH + 0.004, -D / 2 + HINGE);
  base.add(mesh("hinge-barrel", hingeGeo, darkMat));

  // ── Tampa ────────────────────────────────────────────────────────────
  // No espaço do pivô a tampa fica deitada (fechada) sobre a base: z vai
  // da dobradiça até a frente, a face da tela olha para −y. Abrir é girar
  // o pivô em x negativo.
  const lidPivot = new THREE.Group();
  lidPivot.name = "lid-pivot";
  lidPivot.position.set(0, BH + 0.012, -D / 2 + HINGE);
  root.add(lidPivot);

  const lidGeo = new RoundedBoxGeometry(W, LT, LD, 4, 0.024);
  lidGeo.translate(0, LT / 2, LD / 2);
  lidPivot.add(mesh("lid-shell", lidGeo, aluminum));

  const bezelGeo = new THREE.PlaneGeometry(W - 0.035, LD - 0.035);
  bezelGeo.rotateX(Math.PI / 2);
  bezelGeo.translate(0, -0.0012, LD / 2);
  lidPivot.add(mesh("bezel", bezelGeo, glassMat));

  const screenGeo = new THREE.PlaneGeometry(SW, SH);
  screenGeo.rotateX(Math.PI / 2);
  screenGeo.translate(0, -0.0024, SCREEN_BOTTOM + SH / 2);
  lidPivot.add(mesh("screen", screenGeo, screenMat));
  const glareGeo = screenGeo.clone();
  glareGeo.translate(0, -0.0012, 0);
  lidPivot.add(mesh("screen-glare", glareGeo, glareMat));

  const camGeo = new THREE.CircleGeometry(0.014, 20);
  camGeo.rotateX(Math.PI / 2);
  camGeo.translate(0, -0.0024, LD - SCREEN_TOP / 2);
  lidPivot.add(mesh("webcam", camGeo, darkMat));

  // Monograma no verso, legível para quem olha por trás com a tampa aberta.
  const logoGeo = new THREE.PlaneGeometry(0.62, 0.62);
  logoGeo.rotateX(-Math.PI / 2);
  logoGeo.rotateY(Math.PI);
  logoGeo.translate(0, LT + 0.0015, LD * 0.52);
  lidPivot.add(mesh("lid-logo", logoGeo, logoMat));

  let power = 1;
  let hasImage = false;
  const applyPower = () => {
    screenMat.color.setScalar(hasImage ? power : 1);
    logoMat.opacity = 0.12 + 0.6 * power;
  };

  const setLidOpen = (t: number) => {
    lidPivot.rotation.x = -OPEN * t;
  };
  setLidOpen(1);
  applyPower();

  return {
    root,
    setScreen(texture) {
      hasImage = !!texture;
      screenMat.map = texture ?? offTex;
      applyPower();
    },
    setScreenPower(p) {
      power = Math.min(1, Math.max(0, p));
      applyPower();
    },
    setLidOpen,
    dispose() {
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      materials.forEach((m) => m.dispose());
      logoTex.dispose();
      offTex.dispose();
      caps.forEach((t) => t.dispose());
    },
  };
}
