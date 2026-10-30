"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "motion/react";
import ChatWindow, { type ChatView } from "@/components/chat/chat-window";
import { createGenie, originSide, sliceCount, toRect, type Rect } from "@/components/chat/genie";
import { fitRect, maxRect, moveRect, resizeRect, type Edge } from "@/components/chat/window-frame";
import { openContact } from "@/components/site/contact-dialog";
import { setScrollLocked } from "@/components/site/smooth-scroll";
import { chat } from "@/lib/content";

gsap.registerPlugin(useGSAP);

type Phase = "opening" | "open" | "closing";

type LippiChatProps = {
  /** Retângulo do botão Info no clique; null = fechado. */
  origin: DOMRect | null;
  originRef: React.RefObject<HTMLElement | null>;
  onClosed: () => void;
};

// Guarda o que já foi lido entre uma abertura e outra; o diálogo só existe aberto.
export default function LippiChat({ origin, originRef, onClosed }: LippiChatProps) {
  const [activeId, setActiveId] = useState(chat.conversations[0].id);
  const [revealed, setRevealed] = useState<Record<string, number>>({});

  const reveal = useCallback((id: string, count: number) => {
    setRevealed((r) => ((r[id] ?? 0) >= count ? r : { ...r, [id]: count }));
  }, []);

  if (!origin) return null;
  return (
    <ChatDialog
      clickedAt={origin}
      originRef={originRef}
      onClosed={onClosed}
      activeId={activeId}
      onActivate={setActiveId}
      revealed={revealed}
      onReveal={reveal}
    />
  );
}

const WIDE = "(min-width: 1024px)";
const subscribeWide = (onChange: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const getWide = () => window.matchMedia(WIDE).matches;
const getWideOnServer = () => false;

// No desktop a janela fica à direita do Info, para o gênio ter por onde
// escorrer (como o Dock na lateral do Mac). Sem espaço, ela vai para o centro.
function windowRect(origin: Rect, wide: boolean): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gutter = Math.min(40, Math.max(16, vw * 0.024));
  if (wide) {
    const left = origin.x + origin.w + 56;
    const room = vw - gutter - left;
    if (room >= 600) {
      const w = Math.min(980, room);
      const h = Math.min(640, vh - gutter * 2);
      return { x: left + (room - w) / 2, y: (vh - h) / 2, w, h };
    }
  }
  const w = Math.min(vw - 24, wide ? 980 : 720);
  const h = Math.min(vh - 24, wide ? 640 : 860);
  return { x: (vw - w) / 2, y: (vh - h) / 2, w, h };
}

const typingTime = (text: string) => Math.min(1300, Math.max(600, text.length * 11));

const WINDOW_SHADOW = "shadow-[0_40px_120px_-24px_var(--shadow)]"; // taste-skill-ignore: é um diálogo, flutua sobre a página

// Alças invisíveis nas bordas e cantos, metade dentro e metade fora da janela.
const HANDLES: { edge: Edge; className: string }[] = [
  { edge: "n", className: "inset-x-3 -top-1 h-2 cursor-ns-resize" },
  { edge: "s", className: "inset-x-3 -bottom-1 h-2 cursor-ns-resize" },
  { edge: "e", className: "inset-y-3 -right-1 w-2 cursor-ew-resize" },
  { edge: "w", className: "inset-y-3 -left-1 w-2 cursor-ew-resize" },
  { edge: "ne", className: "-right-1 -top-1 size-4 cursor-nesw-resize" },
  { edge: "nw", className: "-left-1 -top-1 size-4 cursor-nwse-resize" },
  { edge: "se", className: "-bottom-1 -right-1 size-4 cursor-nwse-resize" },
  { edge: "sw", className: "-bottom-1 -left-1 size-4 cursor-nesw-resize" },
];

const onControl = (target: EventTarget) => target instanceof Element && target.closest("button") !== null;

type Frame = {
  rect: Rect;
  /** Tamanho de antes de ampliar; null quando não está ampliada. */
  restore: Rect | null;
  /** A pessoa já mexeu na janela: a tela mudar de tamanho só ajusta, não reposiciona. */
  moved: boolean;
};

function ChatDialog({
  clickedAt,
  originRef,
  onClosed,
  activeId,
  onActivate,
  revealed,
  onReveal,
}: {
  clickedAt: DOMRect;
  originRef: React.RefObject<HTMLElement | null>;
  onClosed: () => void;
  activeId: string;
  onActivate: (id: string) => void;
  revealed: Record<string, number>;
  onReveal: (id: string, count: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const afterClose = useRef<(() => void) | undefined>(undefined);
  const zoomTween = useRef<gsap.core.Tween | null>(null);
  const titleId = useId();
  const reduced = useReducedMotion() ?? false;
  const wide = useSyncExternalStore(subscribeWide, getWide, getWideOnServer);

  const [phase, setPhase] = useState<Phase>("opening");
  const [origin, setOrigin] = useState(() => toRect(clickedAt));
  const [frame, setFrame] = useState<Frame>(() => ({
    rect: windowRect(toRect(clickedAt), getWide()),
    restore: null,
    moved: false,
  }));
  const rect = frame.rect;
  const [view, setView] = useState<ChatView>("list");
  const [typingAt, setTypingAt] = useState<string | null>(null);

  // Gênio no desktop; no celular (ou com o Info por trás da janela), o zoom do iPhone.
  const side = wide && !reduced ? originSide(rect, origin) : null;
  const genie = useMemo(() => (side ? createGenie(rect, origin, side, sliceCount(rect, side)) : null), [rect, origin, side]);
  const ghosts = genie !== null && phase !== "open";

  const conversation = chat.conversations.find((c) => c.id === activeId) ?? chat.conversations[0];
  const total = conversation.messages.length;
  const count = reduced ? total : (revealed[activeId] ?? 0);
  const running = phase === "open" && (wide || view === "thread") && !reduced && count < total;
  const typing = running && typingAt === `${activeId}:${count}`;
  const shown = Object.fromEntries(
    chat.conversations.map((c) => [c.id, reduced ? c.messages.length : (revealed[c.id] ?? 0)]),
  );

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    setScrollLocked(true);
    return () => {
      if (dialog.open) dialog.close();
      setScrollLocked(false);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      const el = originRef.current;
      if (!el) return;
      const wideNow = getWide();
      const fresh = windowRect(toRect(el.getBoundingClientRect()), wideNow);
      setFrame((f) =>
        !wideNow || !f.moved
          ? { rect: fresh, restore: null, moved: false }
          : f.restore
            ? { ...f, rect: maxRect(), restore: fitRect(f.restore) }
            : { ...f, rect: fitRect(f.rect) },
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [originRef]);

  // Aberta a janela, o foco vai para a conversa ativa. No celular, ao entrar
  // numa conversa, vai para o "voltar" (a lista fica inerte por trás).
  useEffect(() => {
    if (phase !== "open") return;
    const target = !wide && view === "thread" ? "[data-chat-back]" : '[role="tab"][aria-selected="true"]';
    winRef.current?.querySelector<HTMLElement>(target)?.focus({ preventScroll: true });
  }, [phase, view, wide]);

  // Uma mensagem por vez: a pergunta chega, o "digitando…" aparece e depois a resposta.
  useEffect(() => {
    if (!running) return;
    const next = conversation.messages[count];
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    if (next.from === "them") {
      later(() => onReveal(activeId, count + 1), count === 0 ? 450 : 650);
    } else {
      later(() => setTypingAt(`${activeId}:${count}`), 350);
      later(() => onReveal(activeId, count + 1), 350 + typingTime(next.text));
    }
    return () => timers.forEach(clearTimeout);
  }, [running, activeId, count, conversation, onReveal]);

  const finish = () => {
    finished.current = true;
    dialogRef.current?.close();
    setScrollLocked(false);
    onClosed();
    afterClose.current?.();
  };

  useEffect(() => () => void zoomTween.current?.kill(), []);

  useGSAP(
    () => {
      if (phase === "open") return;
      const opening = phase === "opening";
      const done = opening ? () => setPhase("open") : finish;
      const win = winRef.current;
      if (!win) return;

      gsap.to(backdropRef.current, {
        autoAlpha: opening ? 1 : 0,
        duration: opening ? 0.5 : 0.55,
        ease: opening ? "power2.out" : "power2.in",
      });

      if (reduced) {
        gsap.fromTo(win, { autoAlpha: opening ? 0 : 1 }, { autoAlpha: opening ? 1 : 0, duration: 0.25, onComplete: done });
        return;
      }

      if (genie) {
        const slices = gsap.utils.toArray<HTMLElement>("[data-genie-slice]", dialogRef.current);
        if (!opening) {
          // As cópias mostram a conversa no mesmo ponto de rolagem da janela real.
          const top = win.querySelector("[data-chat-thread]")?.scrollTop ?? 0;
          slices.forEach((s) => {
            const thread = s.querySelector("[data-chat-thread]");
            if (thread) thread.scrollTop = top;
          });
        }
        const state = { p: opening ? 1 : 0 };
        const draw = () =>
          genie.frame(state.p).forEach((transform, i) => {
            slices[i].style.transform = transform;
          });
        draw();
        gsap.to(state, { p: opening ? 0 : 1, duration: opening ? 0.62 : 0.55, ease: "none", onUpdate: draw, onComplete: done });
        return;
      }

      // Zoom do iPhone: a janela cresce a partir do Info e volta para ele. Ela
      // fica opaca logo no começo, para a página não aparecer através dela.
      const atOrigin = {
        x: origin.x + origin.w / 2 - (rect.x + rect.w / 2),
        y: origin.y + origin.h / 2 - (rect.y + rect.h / 2),
        scale: Math.max(origin.w / rect.w, origin.h / rect.h),
      };
      if (opening) {
        gsap.fromTo(win, atOrigin, { x: 0, y: 0, scale: 1, duration: 0.6, ease: "expo.out", onComplete: done });
        gsap.fromTo(win, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14, ease: "none" });
      } else {
        gsap.to(win, { ...atOrigin, duration: 0.42, ease: "power3.in", onComplete: done });
        gsap.to(win, { autoAlpha: 0, duration: 0.14, delay: 0.28, ease: "none" });
      }
    },
    { dependencies: [phase], scope: dialogRef },
  );

  const requestClose = (after?: () => void) => {
    if (phase !== "open") return;
    zoomTween.current?.kill();
    const el = originRef.current;
    if (el) setOrigin(toRect(el.getBoundingClientRect()));
    afterClose.current = after;
    setPhase("closing");
  };

  const select = (id: string) => {
    if (id !== activeId) {
      // Trocar no meio da sequência dá a conversa anterior por lida.
      if ((revealed[activeId] ?? 0) > 0) onReveal(activeId, total);
      onActivate(id);
    }
    if (!wide) setView("thread");
  };

  // Arrastar pela barra ou redimensionar por uma alça: cada movimento do
  // ponteiro recalcula a janela a partir de onde ela estava no clique.
  const gesture = (e: React.PointerEvent<HTMLElement>, apply: (start: Rect, dx: number, dy: number) => Rect) => {
    if (phase !== "open" || !wide || e.button !== 0 || onControl(e.target)) return;
    e.preventDefault();
    zoomTween.current?.kill();
    const el = e.currentTarget;
    const start = rect;
    const x0 = e.clientX;
    const y0 = e.clientY;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) =>
      setFrame({ rect: apply(start, ev.clientX - x0, ev.clientY - y0), restore: null, moved: true });
    const end = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  };

  // Botão verde e duplo clique na barra: amplia até quase a tela toda, ou volta ao tamanho de antes.
  const toggleZoom = () => {
    if (phase !== "open" || !wide) return;
    zoomTween.current?.kill();
    const restore = frame.restore ? null : rect;
    const live = { ...rect };
    zoomTween.current = gsap.to(live, {
      ...(frame.restore ?? maxRect()),
      duration: 0.45,
      ease: "power3.inOut",
      onUpdate: () => setFrame({ rect: { ...live }, restore, moved: true }),
    });
  };

  const windowProps = { wide, view, activeId, shown, typing, zoomed: frame.restore !== null };
  const box = { left: rect.x, top: rect.y, width: rect.w, height: rect.h };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        requestClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClose={() => {
        // Fechado pelo navegador sem passar pela animação.
        if (finished.current || dialogRef.current?.open) return;
        setScrollLocked(false);
        onClosed();
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0 text-ink backdrop:bg-transparent"
    >
      <div ref={backdropRef} onClick={() => requestClose()} className="invisible absolute inset-0 bg-bg/75 opacity-0" />

      {ghosts &&
        genie.bands.map((b, i) => (
          <div
            key={i}
            data-genie-slice
            inert
            aria-hidden="true"
            className="absolute origin-top-left overflow-clip will-change-transform"
            style={{ left: rect.x + b.x, top: rect.y + b.y, width: b.w, height: b.h }}
          >
            <div className="absolute" style={{ left: -b.x, top: -b.y, width: rect.w, height: rect.h }}>
              <ChatWindow ghost {...windowProps} />
            </div>
          </div>
        ))}

      <div
        ref={winRef}
        className={`absolute transition-shadow duration-500 ${wide ? "rounded-[14px]" : "rounded-[22px]"} ${
          phase === "open" ? WINDOW_SHADOW : ""
        }`}
        style={{ ...box, visibility: ghosts ? "hidden" : undefined }}
      >
        <ChatWindow
          titleId={titleId}
          {...windowProps}
          onSelect={select}
          onBack={() => setView("list")}
          onClose={() => requestClose()}
          onContact={() => requestClose(openContact)}
          onZoom={wide ? toggleZoom : undefined}
          onTitlePointerDown={wide ? (e) => gesture(e, moveRect) : undefined}
          onTitleDoubleClick={wide ? (e) => !onControl(e.target) && toggleZoom() : undefined}
        />
        {wide &&
          phase === "open" &&
          HANDLES.map(({ edge, className }) => (
            <div
              key={edge}
              aria-hidden="true"
              className={`absolute z-2 touch-none ${className}`}
              onPointerDown={(e) => gesture(e, (start, dx, dy) => resizeRect(start, edge, dx, dy))}
            />
          ))}
      </div>
    </dialog>
  );
}
