"use client";

import { useEffect, useId, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { chat, person, type ChatConversation, type ChatMessage } from "@/lib/content";

export type ChatView = "list" | "thread";

type ChatWindowProps = {
  /** Cópia estática para as fatias do Efeito Gênio: sem animação de entrada. */
  ghost?: boolean;
  titleId?: string;
  /** Lado a lado (desktop) ou empilhado, lista e conversa (celular). */
  wide: boolean;
  view: ChatView;
  activeId: string;
  /** Quantas mensagens de cada conversa já apareceram. */
  shown: Record<string, number>;
  typing: boolean;
  /** Ampliada pelo botão verde. */
  zoomed?: boolean;
  onSelect?: (id: string) => void;
  onBack?: () => void;
  onClose?: () => void;
  onContact?: () => void;
  onZoom?: () => void;
  /** Com estes, a barra de título arrasta a janela (só no desktop). */
  onTitlePointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onTitleDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

const PHOTO = "/images/retrato-roxo.png";
const SLIDE = "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none";

export default function ChatWindow({
  ghost = false,
  titleId,
  wide,
  view,
  activeId,
  shown,
  typing,
  zoomed = false,
  onSelect,
  onBack,
  onClose,
  onContact,
  onZoom,
  onTitlePointerDown,
  onTitleDoubleClick,
}: ChatWindowProps) {
  const uid = useId();
  const active = chat.conversations.find((c) => c.id === activeId) ?? chat.conversations[0];
  const panelId = `${uid}-panel`;
  const tabId = (id: string) => `${uid}-tab-${id}`;

  // Setas navegam pela lista. No desktop a conversa troca junto; no celular
  // só o foco anda, e Enter abre.
  const onTabKey = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = chat.conversations.length - 1;
    const next =
      e.key === "ArrowDown" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowUp" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    const tabs = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[next]?.focus();
    if (wide) onSelect?.(chat.conversations[next].id);
  };

  return (
    <div
      data-ui
      className={`flex size-full flex-col overflow-clip border border-ink/10 bg-bg-raised text-ink ${wide ? "rounded-[14px]" : "rounded-[22px]"}`}
    >
      <div
        onPointerDown={onTitlePointerDown}
        onDoubleClick={onTitleDoubleClick}
        className={`relative flex h-11 shrink-0 items-center px-3 ${
          onTitlePointerDown ? "cursor-grab touch-none select-none active:cursor-grabbing" : ""
        }`}
      >
        <div className="group/lights relative z-1 flex">
          <Light label="Fechar" color="bg-[#ff5f57]" glyph="M3 3l4 4M7 3L3 7" onClick={onClose} wide={wide} />
          <Light label="Minimizar" color="bg-[#febc2e]" glyph="M2.5 5h5" onClick={onClose} wide={wide} />
          <Light
            label={zoomed ? "Restaurar tamanho" : "Ampliar"}
            color="bg-[#28c840]"
            glyph={zoomed ? "M3 3l4 4M3 3h2.5M3 3v2.5M7 7H4.5M7 7V4.5" : "M5 2.5v5M2.5 5h5"}
            onClick={onZoom}
            wide={wide}
          />
        </div>
        <h2 id={titleId} className="pointer-events-none absolute inset-x-0 text-center text-[13px] font-semibold text-ink/75">
          {chat.title}
        </h2>
      </div>

      <div className={`relative min-h-0 flex-1 overflow-clip ${wide ? "flex" : ""}`}>
        <div
          inert={!wide && view === "thread"}
          className={
            wide
              ? "flex w-[268px] shrink-0 flex-col"
              : `absolute inset-0 flex flex-col ${SLIDE} ${view === "thread" ? "-translate-x-1/4" : ""}`
          }
        >
          <h3 className="px-5 pb-3 pt-5 text-[22px] font-semibold tracking-[-0.02em]">{chat.listTitle}</h3>
          <div role="tablist" aria-orientation="vertical" aria-label={chat.listTitle} className="flex flex-col gap-0.5 px-2.5">
            {chat.conversations.map((c, i) => (
              <ConversationTab
                key={c.id}
                conversation={c}
                count={shown[c.id] ?? 0}
                selected={c.id === active.id}
                highlight={wide && c.id === active.id}
                id={tabId(c.id)}
                panelId={panelId}
                onClick={() => onSelect?.(c.id)}
                onKeyDown={(e) => onTabKey(e, i)}
              />
            ))}
          </div>
          <div className="mt-auto flex items-center gap-3 px-5 py-4">
            <Image src={PHOTO} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">
                {person.firstName} {person.lastName}
              </p>
              <p className="flex items-center gap-1.5 text-[12px] text-ink/60">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#28c840]" />
                {person.status}
              </p>
            </div>
          </div>
        </div>

        <div
          role="tabpanel"
          id={panelId}
          aria-labelledby={tabId(active.id)}
          inert={!wide && view === "list"}
          className={
            wide
              ? "flex min-w-0 flex-1 flex-col bg-bg"
              : `absolute inset-0 flex flex-col bg-bg ${SLIDE} ${view === "list" ? "translate-x-full" : ""}`
          }
        >
          <div className="flex h-[60px] shrink-0 items-center gap-3 bg-bg-raised px-4">
            {!wide && (
              <button
                type="button"
                data-chat-back
                onClick={onBack}
                className="-ml-1 flex cursor-pointer items-center gap-0.5 pr-2 text-[15px] text-ink/85 transition-colors hover:text-ink"
              >
                <svg viewBox="0 0 12 20" className="h-4 w-2.5" aria-hidden="true">
                  <path d="M10 2L2 10l8 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {chat.listTitle}
              </button>
            )}
            <Avatar initials={active.initials} className="size-8 text-[12px]" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight">{active.title}</p>
              <p className="text-[12px] text-ink/60">{typing ? "digitando…" : `Conversa com ${person.firstName}`}</p>
            </div>
          </div>

          <Messages
            key={active.id}
            messages={active.messages}
            count={shown[active.id] ?? 0}
            typing={typing}
            ghost={ghost}
          />

          <div className="flex shrink-0 items-center justify-between gap-4 bg-bg-raised px-4 py-3">
            <p className="text-[14px] text-ink/70">{chat.contactPrompt}</p>
            <button
              type="button"
              onClick={onContact}
              className="cursor-pointer rounded-full bg-accent px-4 py-2 text-[14px] font-semibold text-accent-ink transition-[translate] duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              {chat.contactLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Light({
  label,
  color,
  glyph,
  onClick,
  wide,
}: {
  label: string;
  color: string;
  glyph: string;
  onClick?: () => void;
  wide: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={!onClick}
      className={`grid cursor-pointer place-items-center disabled:cursor-default ${wide ? "size-5" : "size-7"}`}
    >
      <span className={`grid place-items-center rounded-full ${color} ${wide ? "size-3" : "size-3.5"}`}>
        <svg viewBox="0 0 10 10" className="size-[70%] opacity-0 transition-opacity group-hover/lights:opacity-100 group-has-[:focus-visible]/lights:opacity-100" aria-hidden="true">
          <path d={glyph} stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
    </button>
  );
}

function Avatar({ initials, className = "", inverted = false }: { initials: string; className?: string; inverted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-semibold tracking-[-0.02em] ${inverted ? "bg-accent-ink/20" : "bg-ink/10"} ${className}`}
    >
      {initials}
    </span>
  );
}

function ConversationTab({
  conversation,
  count,
  selected,
  highlight,
  id,
  panelId,
  onClick,
  onKeyDown,
}: {
  conversation: ChatConversation;
  count: number;
  selected: boolean;
  highlight: boolean;
  id: string;
  panelId: string;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const unread = count === 0;
  // Ainda não lida: a prévia é a primeira pergunta. Depois, a última mensagem que apareceu.
  const preview = conversation.messages[Math.max(0, count - 1)].text;

  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] py-2.5 pl-1.5 pr-3 text-left transition-colors ${
        highlight ? "bg-accent text-accent-ink" : "hover:bg-ink/5"
      }`}
    >
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${unread && !highlight ? "bg-accent" : ""}`} />
      <Avatar initials={conversation.initials} inverted={highlight} className="size-10 text-[14px]" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[15px] font-semibold">{conversation.title}</span>
          <span className="shrink-0 text-[12px] opacity-60">{conversation.time}</span>
        </span>
        <span className="mt-0.5 line-clamp-2 text-[13px] leading-[1.35] opacity-70">{preview}</span>
      </span>
      {unread && <span className="sr-only">, não lida</span>}
    </button>
  );
}

function Messages({
  messages,
  count,
  typing,
  ghost,
}: {
  messages: ChatMessage[];
  count: number;
  typing: boolean;
  ghost: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settled = useRef(false);
  const items = messages.slice(0, count);

  // Desce até a última mensagem: de uma vez ao abrir a conversa, suave depois.
  useEffect(() => {
    const el = ref.current;
    if (!el || ghost) return;
    el.scrollTo({ top: el.scrollHeight, behavior: settled.current ? "smooth" : "auto" });
    settled.current = true;
  }, [count, typing, ghost]);

  const bubbles = items.map((m, i) => (
    <Bubble key={i} from={m.from} spaced={m.from === "them" && i > 0} ghost={ghost}>
      {m.text}
    </Bubble>
  ));

  return (
    <div
      ref={ref}
      data-chat-thread
      data-lenis-prevent
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5"
    >
      <p className="mb-4 text-center text-[12px] text-ink/50">Hoje</p>
      <div aria-live={ghost ? undefined : "polite"} className="flex flex-col gap-2">
        {ghost ? (
          <>
            {bubbles}
            {typing && <Typing ghost />}
          </>
        ) : (
          <AnimatePresence initial={false}>
            {bubbles}
            {typing && <Typing key="typing" ghost={false} />}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

const ORIGIN_ME = { transformOrigin: "100% 100%" };
const ORIGIN_THEM = { transformOrigin: "0% 100%" };
const BUBBLE_IN = { opacity: 0, y: 14, scale: 0.94 };
const BUBBLE_REST = { opacity: 1, y: 0, scale: 1 };
const BUBBLE_SPRING = { type: "spring", stiffness: 420, damping: 32 } as const;

function Bubble({
  from,
  spaced,
  ghost,
  children,
}: {
  from: ChatMessage["from"];
  spaced: boolean;
  ghost: boolean;
  children: React.ReactNode;
}) {
  const me = from === "me";
  const className = `max-w-[min(80%,30rem)] rounded-[18px] px-3.5 py-2 text-[15px] leading-[1.4] ${
    me ? "self-end rounded-br-[6px] bg-accent text-accent-ink" : "self-start rounded-bl-[6px] bg-ink/12"
  } ${spaced ? "mt-3" : ""}`;

  if (ghost) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={me ? ORIGIN_ME : ORIGIN_THEM}
      initial={BUBBLE_IN}
      animate={BUBBLE_REST}
      transition={BUBBLE_SPRING}
    >
      {children}
    </motion.div>
  );
}

function Typing({ ghost }: { ghost: boolean }) {
  const className = "flex items-center gap-1 self-end rounded-[18px] rounded-br-[6px] bg-accent px-4 py-3.5";
  const dots = [0, 1, 2].map((i) =>
    ghost ? (
      <span key={i} className="size-1.5 rounded-full bg-accent-ink/80" />
    ) : (
      <motion.span
        key={i}
        className="size-1.5 rounded-full bg-accent-ink/80"
        animate={{ y: [0, -3, 0], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
      />
    ),
  );

  if (ghost) return <div className={className}>{dots}</div>;
  return (
    <motion.div className={className} style={ORIGIN_ME} initial={BUBBLE_IN} animate={BUBBLE_REST} transition={BUBBLE_SPRING}>
      {dots}
      <span className="sr-only">{person.firstName} está digitando</span>
    </motion.div>
  );
}
